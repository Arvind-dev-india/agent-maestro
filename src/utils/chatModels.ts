import * as vscode from "vscode";

import { getClaudeConfiguredModels } from "./claude";
import { logger } from "./logger";

class ChatModelsCache {
  private static instance: ChatModelsCache;
  private _cachedModels: vscode.LanguageModelChat[] = [];
  private initializationPromise: Promise<void> | null = null;

  // Getter that filters out claude-3.7 models by default due to model_not_supported error
  private get cachedModels(): vscode.LanguageModelChat[] {
    return this._cachedModels.filter((m) => !m.id.includes("claude-3.7"));
  }

  // Setter for internal use
  private set cachedModels(models: vscode.LanguageModelChat[]) {
    this._cachedModels = models;
  }

  private constructor() {}

  static getInstance(): ChatModelsCache {
    if (!ChatModelsCache.instance) {
      ChatModelsCache.instance = new ChatModelsCache();
    }
    return ChatModelsCache.instance;
  }

  async initialize(): Promise<void> {
    if (this.cachedModels.length > 0) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = (async () => {
      try {
        logger.info("Initializing chat models cache...");
        this.cachedModels = await vscode.lm.selectChatModels({});
        logger.info(`Cached ${this.cachedModels.length} chat models`);
      } catch (error) {
        logger.error("Failed to initialize chat models cache:", error);
        this.cachedModels = [];
      } finally {
        this.initializationPromise = null;
      }
    })();

    return this.initializationPromise;
  }

  async getChatModels(): Promise<vscode.LanguageModelChat[]> {
    if (this.cachedModels.length > 0) {
      return this.cachedModels;
    }

    await this.initialize();
    return this.cachedModels;
  }

  async refresh(): Promise<void> {
    this.cachedModels = [];
    this.initializationPromise = null;
    await this.initialize();
  }

  getCachedModels(): vscode.LanguageModelChat[] {
    return this.cachedModels;
  }
}

export const chatModelsCache = ChatModelsCache.getInstance();

const chatModelToQuickPickItem = (model: vscode.LanguageModelChat) => ({
  label: model.name,
  description: `${model.vendor} - ${model.id}`,
  modelId: model.id,
});

export const getChatModelsQuickPickItems = async (recommended?: string) => {
  // Get available models from cache first, fallback to direct API call
  let allModels = await chatModelsCache.getChatModels();
  if (allModels.length === 0) {
    return [];
  }

  const claudeModels = [];
  const geminiModels = [];
  const restModels = [];
  let recommendedModel = null;

  for (const m of allModels) {
    if (recommended && m.id === recommended) {
      recommendedModel = m;
    }

    if (m.id.toLocaleLowerCase().includes("claude")) {
      claudeModels.push(m);
    } else if (m.id.toLocaleLowerCase().includes("gemini")) {
      geminiModels.push(m);
    } else {
      restModels.push(m);
    }
  }

  // Show model selection for ANTHROPIC_MODEL
  const modelOptions = [];

  // Add recommended model at the top if found
  if (recommendedModel) {
    modelOptions.push(
      {
        kind: vscode.QuickPickItemKind.Separator,
        label: "Recommended",
        modelId: "",
      },
      {
        ...chatModelToQuickPickItem(recommendedModel),
        label: `${recommendedModel.name}`,
      },
    );
  }

  // Add the rest of the models in their categories
  modelOptions.push(
    {
      kind: vscode.QuickPickItemKind.Separator,
      label: "Claude",
      modelId: "",
    },
    ...claudeModels.map(chatModelToQuickPickItem),
    {
      kind: vscode.QuickPickItemKind.Separator,
      label: "OpenAI",
      modelId: "",
    },
    ...restModels.map(chatModelToQuickPickItem),
    {
      kind: vscode.QuickPickItemKind.Separator,
      label: "Gemini",
      modelId: "",
    },
    ...geminiModels.map(chatModelToQuickPickItem),
  );

  return modelOptions;
};

/**
 * Convert Anthropic API model ID to VSCode LM API model ID
 *
 * IMPORTANT: This function now prioritizes user-configured models from Claude settings.
 *
 * Why this change matters:
 * - When new Claude models are introduced (e.g., claude-4, claude-opus-5, etc.),
 *   the extension would previously fall back to hardcoded defaults like claude-3.5-sonnet
 * - This could cause users to unknowingly use premium models, increasing costs
 * - By using the user's configured mainModel/fastModel from .claude/settings.json,
 *   we ensure the user's explicit model choice is respected
 *
 * Logic:
 * 1. Remove date suffix from model ID (e.g., claude-sonnet-4-20250514 -> claude-sonnet-4)
 * 2. If user has Claude config:
 *    - Check if requested model matches their configured fast/main model
 *    - If yes: use it (user selected this model from VS Code LM picker)
 *    - If no: default to user's configured main model (for regular requests)
 *            or fast model (for utility requests)
 * 3. If no Claude config exists: return the model as-is (no override)
 *
 * This ensures future-compatibility without requiring extension updates for new models.
 */
export const convertAnthropicModelToVSCodeModel = (
  modelId: string,
  isUtilityRequest: boolean = false,
): string => {
  // Remove date suffix (pattern: -YYYYMMDD at the end) for accurate pattern matching
  const withoutDate = modelId.replace(/-\d{8}$/, "");

  // Get user's configured models from .claude/settings.json
  const claudeConfig = getClaudeConfiguredModels();

  if (claudeConfig) {
    // Check if the requested model (after date removal) matches user's configured models
    // User might have explicitly selected these models from VS Code LM picker,
    // so we should respect their choice
    if (
      withoutDate === claudeConfig.mainModel ||
      withoutDate === claudeConfig.fastModel
    ) {
      logger.info(
        `✅ Model ${withoutDate} matches user configuration, using as-is`,
      );
      return withoutDate;
    }

    // Model doesn't match user config - use configured model as default
    // This prevents unknowingly using premium models when new models are introduced
    const overrideModel = isUtilityRequest
      ? claudeConfig.fastModel
      : claudeConfig.mainModel;
    logger.info(
      `⚡ Overriding ${modelId} with configured ${isUtilityRequest ? "fast" : "main"} model: ${overrideModel}`,
    );
    return overrideModel;
  }

  // No Claude config found - return model as-is without any conversion
  // This allows the system to work even without .claude/settings.json
  logger.debug(`No Claude config found, using requested model: ${withoutDate}`);
  return withoutDate;
};

/**
 * Get chat model client with integrated override logic
 */
const ANTHROPIC_MODEL_PREFIX = "claude";
export const getChatModelClient = async (
  modelId: string,
  isUtilityRequest: boolean = false,
) => {
  // For Claude models, apply conversion with override logic
  let effectiveModelId: string;

  if (modelId.startsWith(ANTHROPIC_MODEL_PREFIX)) {
    effectiveModelId = convertAnthropicModelToVSCodeModel(
      modelId,
      isUtilityRequest,
    );
  } else {
    // For non-Claude models, use as-is
    effectiveModelId = modelId;
  }

  const models = await chatModelsCache.getChatModels();
  const client = models.find((m) => m.id === effectiveModelId);

  if (!client) {
    logger.error(
      `No VS Code LM model available for model ID: ${modelId} (effective: ${effectiveModelId})`,
    );
    return {
      error: {
        error: {
          message: `Model '${modelId}' not found. Use /api/v1/lm/chatModels to list available models and pass a valid model ID.`,
          type: "invalid_request_error",
        },
        type: "error",
      },
    };
  }

  return { client };
};
