import {
  ClineMessage,
  ClineAsk,
  ClineSay,
  ClineAskType,
  ClineSayType,
  ToolUsageRequest,
  CommandRequest,
  CompletionRequest,
  McpServerRequest,
  CodebaseSearchResult,
} from "../types/cline";
import type { Message } from "../types/chat";

/**
 * Enhanced message parser that handles all ClineMessage types
 * Based on roo-api-tools.md documentation
 */
export class ClineMessageParser {
  /**
   * Parse raw message data into a structured ClineMessage
   */
  static parseMessage(data: any): ClineMessage | null {
    if (!data?.message) {
      console.warn(`[MessageParser] No message found in data:`, data);
      return null;
    }

    const message = data.message;
    console.log(`[MessageParser] Parsing message:`, {
      type: message.type,
      hasAsk: !!message.ask,
      hasSay: !!message.say,
      hasText: !!message.text,
      partial: message.partial,
    });
    
    const clineMessage: ClineMessage = {
      ts: message.ts || Date.now(),
      type: message.type || "say",
      partial: message.partial || false,
    };

    // Parse text content - can contain complex JSON structures
    if (message.text) {
      clineMessage.text = message.text;
    }

    // Parse images
    if (message.images && Array.isArray(message.images)) {
      clineMessage.images = message.images;
    }

    // Parse reasoning
    if (message.reasoning) {
      clineMessage.reasoning = message.reasoning;
    }

    // Parse additional fields
    if (message.conversationHistoryIndex !== undefined) {
      clineMessage.conversationHistoryIndex = message.conversationHistoryIndex;
    }

    if (message.checkpoint) {
      clineMessage.checkpoint = message.checkpoint;
    }

    if (message.progressStatus) {
      clineMessage.progressStatus = message.progressStatus;
    }

    if (message.contextCondense) {
      clineMessage.contextCondense = message.contextCondense;
    }

    if (message.isProtected !== undefined) {
      clineMessage.isProtected = message.isProtected;
    }

    // Parse ask/say specific content
    if (message.type === "ask" && message.ask) {
      console.log(`[MessageParser] Parsing ask type: ${message.ask}`);
      clineMessage.ask = this.parseAsk(message.ask, message.text);
    } else if (message.type === "say" && message.say) {
      console.log(`[MessageParser] Parsing say type: ${message.say}`);
      clineMessage.say = this.parseSay(message.say, message.text);
    }

    console.log(`[MessageParser] Final parsed message:`, {
      type: clineMessage.type,
      hasAsk: !!clineMessage.ask,
      askType: clineMessage.ask?.type,
      hasSay: !!clineMessage.say,
      sayType: clineMessage.say?.type,
    });

    return clineMessage;
  }

  /**
   * Parse ClineAsk content based on ask type
   */
  private static parseAsk(askType: string, text?: string): ClineAsk {
    const ask: ClineAsk = {
      type: askType as ClineAskType,
    };

    if (!text) return ask;

    // Handle followup differently - it's often plain text, not JSON
    if (askType === "followup") {
      // Try to parse as JSON first, if it fails treat as plain text
      try {
        const parsedText = JSON.parse(text);
        ask.question = parsedText.question || text;
        if (parsedText.suggest && Array.isArray(parsedText.suggest)) {
          ask.suggest = parsedText.suggest.map((s: any) => ({
            answer: typeof s === "string" ? s : s.answer || s,
            description: s.description,
            mode: s.mode,
          }));
        }
      } catch {
        // If JSON parsing fails, treat as plain text
        ask.question = text;
      }
      return ask;
    }

    try {
      const parsedText = JSON.parse(text);

      switch (askType) {
        case "tool":
          // Handle different formats for tool arguments
          let toolName = parsedText.name || parsedText.tool || parsedText.toolName || "unknown";
          let toolArgs = parsedText.arguments || parsedText.args || parsedText.parameters || {};
          
          // Sometimes arguments are in a nested structure
          if (typeof toolArgs === 'string') {
            try {
              toolArgs = JSON.parse(toolArgs);
            } catch {
              // Keep as string if can't parse
            }
          }
          
          // Check if the entire text is the arguments
          if (!toolArgs || Object.keys(toolArgs).length === 0) {
            // Try to extract from the root level
            const excludeKeys = ['name', 'tool', 'toolName', 'description', 'type'];
            toolArgs = Object.keys(parsedText)
              .filter(key => !excludeKeys.includes(key))
              .reduce((obj: any, key) => {
                obj[key] = parsedText[key];
                return obj;
              }, {});
          }
          
          ask.tool = {
            name: toolName,
            arguments: toolArgs,
            description: parsedText.description || parsedText.text,
          };
          console.log(`[MessageParser] Parsed tool:`, ask.tool);
          break;

        case "command":
          ask.command = {
            command: parsedText.command || text,
            workingDirectory: parsedText.workingDirectory || parsedText.cwd,
            requiresApproval: parsedText.requiresApproval !== false,
          };
          break;

        case "command_output":
          ask.question = parsedText.question || "Do you want to see the command output?";
          break;

        case "completion_result":
          ask.completion = {
            result: parsedText.result || text,
            tokensUsed: parsedText.tokensUsed,
            requiresApproval: parsedText.requiresApproval !== false,
          };
          break;

        case "use_mcp_server":
          ask.mcpServer = {
            serverName: parsedText.serverName || "Unknown Server",
            toolName: parsedText.toolName || "Unknown Tool",
            arguments: parsedText.arguments || {},
          };
          break;

        case "api_req_failed":
          ask.apiFailure = {
            error: parsedText.error || text,
            retryCount: parsedText.retryCount || 0,
            maxRetries: parsedText.maxRetries || 3,
          };
          break;

        case "browser_action_launch":
          ask.browserAction = {
            action: parsedText.action || "launch",
            target: parsedText.target,
            description: parsedText.description || text,
          };
          break;

        default:
          ask.question = parsedText.question || text;
          break;
      }
    } catch (e) {
      // If JSON parsing fails, treat as plain text
      console.warn(`[MessageParser] Failed to parse JSON for ${askType}:`, e, text);
      ask.question = text;
    }

    return ask;
  }

  /**
   * Parse ClineSay content based on say type
   */
  private static parseSay(sayType: string, text?: string): ClineSay {
    const say: ClineSay = {
      type: sayType as ClineSayType,
    };

    if (!text) return say;

    // Handle plain text messages without JSON parsing
    if (sayType === "text") {
      say.text = text;
      return say;
    }

    try {
      const parsedText = JSON.parse(text);

      switch (sayType) {
        case "error":
          say.error = {
            message: parsedText.message || text,
            code: parsedText.code,
            stack: parsedText.stack,
            recoverable: parsedText.recoverable,
          };
          break;

        case "api_req_started":
        case "api_req_finished":
        case "api_req_retried":
        case "api_req_deleted":
          say.apiRequest = {
            requestId: parsedText.requestId,
            method: parsedText.method,
            endpoint: parsedText.endpoint,
            status: parsedText.status,
            retryCount: parsedText.retryCount,
          };
          break;

        case "command_output":
          say.text = parsedText.output || text;
          break;

        case "browser_action_result":
          say.browserResult = {
            action: parsedText.action || "unknown",
            success: parsedText.success !== false,
            screenshot: parsedText.screenshot,
            error: parsedText.error,
          };
          break;

        case "mcp_server_response":
          say.mcpResult = {
            serverName: parsedText.serverName || "Unknown Server",
            toolName: parsedText.toolName || "Unknown Tool",
            success: parsedText.success !== false,
            result: parsedText.result,
            error: parsedText.error,
          };
          break;

        case "codebase_search_result":
          say.searchResult = {
            query: parsedText.query || "",
            results: parsedText.results || [],
            totalCount: parsedText.totalCount || 0,
            searchTime: parsedText.searchTime,
          };
          break;

        case "checkpoint_saved":
          say.checkpoint = {
            id: parsedText.id || Date.now().toString(),
            timestamp: parsedText.timestamp || Date.now(),
            description: parsedText.description,
          };
          break;

        case "condense_context":
        case "condense_context_error":
          say.contextCondense = {
            originalTokens: parsedText.originalTokens || 0,
            condensedTokens: parsedText.condensedTokens || 0,
            compressionRatio: parsedText.compressionRatio || 0,
            status: sayType === "condense_context_error" ? "failed" : "completed",
          };
          break;

        default:
          say.text = text;
          break;
      }
    } catch (e) {
      // If JSON parsing fails, treat as plain text
      say.text = text;
    }

    return say;
  }

  /**
   * Convert ClineMessage to our internal Message format
   */
  static toInternalMessage(clineMessage: ClineMessage): Message {
    const message: Message = {
      id: "", // Will be set by caller
      content: this.formatMessageContent(clineMessage),
      isUser: false,
      timestamp: new Date(clineMessage.ts).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      clineMessage: clineMessage, // Include full ClineMessage for enhanced rendering
    };

    // Add suggestions for ask messages
    if (clineMessage.ask?.suggest) {
      message.suggestions = clineMessage.ask.suggest.map(s => s.answer);
    }

    // Add completion result flag
    if (clineMessage.ask?.type === "completion_result" || 
        clineMessage.say?.type === "completion_result") {
      message.isCompletionResult = true;
    }

    // Add reasoning
    if (clineMessage.reasoning) {
      message.reasoning = clineMessage.reasoning;
    }

    // Add images
    if (clineMessage.images) {
      message.images = clineMessage.images;
    }

    console.log(`[MessageParser] toInternalMessage result:`, {
      hasContent: !!message.content,
      contentLength: message.content?.length,
      contentPreview: message.content?.substring(0, 50) + "...",
      hasAsk: !!clineMessage.ask,
      hasSay: !!clineMessage.say,
      sayType: clineMessage.say?.type
    });

    return message;
  }

  /**
   * Format message content based on type and content
   */
  private static formatMessageContent(clineMessage: ClineMessage): string {
    // For say messages with text type, return the text directly (no JSON parsing)
    if (clineMessage.say?.type === "text" && clineMessage.text) {
      return clineMessage.text;
    }

    // Handle ask messages (these might contain JSON)
    if (clineMessage.ask) {
      return this.formatAskContent(clineMessage.ask, clineMessage.text);
    }

    // Handle other say messages (these might contain JSON)
    if (clineMessage.say) {
      return this.formatSayContent(clineMessage.say, clineMessage.text);
    }

    // Fallback to text content
    return clineMessage.text || "";
  }

  /**
   * Format ask message content
   */
  private static formatAskContent(ask: ClineAsk, text?: string): string {
    switch (ask.type) {
      case "followup":
        return ask.question || text || "I have a follow-up question.";

      case "tool":
        if (ask.tool) {
          return `🔧 Tool Request: ${ask.tool.name}\n\n${ask.tool.description || "Do you want to execute this tool?"}`;
        }
        return text || "Tool execution request";

      case "command":
        if (ask.command) {
          return `💻 **Command Execution Request**\n\nCommand: \`${ask.command.command}\`${ask.command.workingDirectory ? `\nWorking Directory: \`${ask.command.workingDirectory}\`` : ""}\n\nDo you want to execute this command?`;
        }
        return text || "Command execution request";

      case "use_mcp_server":
        if (ask.mcpServer) {
          return `🔧 **MCP Server Tool Request**\n\nServer: ${ask.mcpServer.serverName}\nTool: ${ask.mcpServer.toolName}\n\nArguments:\n\`\`\`json\n${JSON.stringify(ask.mcpServer.arguments, null, 2)}\n\`\`\`\n\nDo you want to approve this MCP tool usage?`;
        }
        return text || "MCP server tool request";

      case "completion_result":
        if (ask.completion) {
          return `✅ **Task Completion**\n\n${ask.completion.result}${ask.completion.tokensUsed ? `\n\n*Tokens used: ${ask.completion.tokensUsed}*` : ""}`;
        }
        return text || "Task completion request";

      case "api_req_failed":
        if (ask.apiFailure) {
          return `❌ **API Request Failed**\n\nError: ${ask.apiFailure.error}\nRetry ${ask.apiFailure.retryCount}/${ask.apiFailure.maxRetries}\n\nDo you want to retry?`;
        }
        return text || "API request failed";

      case "browser_action_launch":
        if (ask.browserAction) {
          return `🌐 **Browser Action Request**\n\nAction: ${ask.browserAction.action}${ask.browserAction.target ? `\nTarget: ${ask.browserAction.target}` : ""}\n\n${ask.browserAction.description || "Do you want to proceed with this browser action?"}`;
        }
        return text || "Browser action request";

      default:
        return ask.question || text || "Request for approval";
    }
  }

  /**
   * Format say message content
   */
  private static formatSayContent(say: ClineSay, text?: string): string {
    switch (say.type) {
      case "error":
        if (say.error) {
          return `❌ **Error**\n\n${say.error.message}${say.error.code ? `\nCode: ${say.error.code}` : ""}${say.error.recoverable ? "\n\n*This error may be recoverable*" : ""}`;
        }
        return text || "An error occurred";

      case "api_req_started":
        return `🔄 **API Request Started**${say.apiRequest?.endpoint ? `\n\nEndpoint: ${say.apiRequest.endpoint}` : ""}`;

      case "api_req_finished":
        return `✅ **API Request Completed**${say.apiRequest?.status ? `\n\nStatus: ${say.apiRequest.status}` : ""}`;

      case "api_req_retried":
        return `🔄 **API Request Retried**${say.apiRequest?.retryCount ? `\n\nRetry: ${say.apiRequest.retryCount}` : ""}`;

      case "browser_action_result":
        if (say.browserResult) {
          return `🌐 **Browser Action Result**\n\nAction: ${say.browserResult.action}\nStatus: ${say.browserResult.success ? "✅ Success" : "❌ Failed"}${say.browserResult.error ? `\nError: ${say.browserResult.error}` : ""}`;
        }
        return text || "Browser action completed";

      case "mcp_server_response":
        if (say.mcpResult) {
          return `🔧 **MCP Server Response**\n\nServer: ${say.mcpResult.serverName}\nTool: ${say.mcpResult.toolName}\nStatus: ${say.mcpResult.success ? "✅ Success" : "❌ Failed"}${say.mcpResult.error ? `\nError: ${say.mcpResult.error}` : ""}`;
        }
        return text || "MCP server response";

      case "codebase_search_result":
        if (say.searchResult) {
          const resultsText = say.searchResult.results.length > 0 
            ? say.searchResult.results.slice(0, 5).map(r => `📄 ${r.file}:${r.line} - ${r.match}`).join("\n")
            : "No results found";
          
          return `🔍 **Codebase Search Results**\n\nQuery: "${say.searchResult.query}"\nResults: ${say.searchResult.totalCount}${say.searchResult.searchTime ? ` (${say.searchResult.searchTime}ms)` : ""}\n\n${resultsText}${say.searchResult.results.length > 5 ? "\n..." : ""}`;
        }
        return text || "Codebase search completed";

      case "checkpoint_saved":
        if (say.checkpoint) {
          return `💾 **Checkpoint Saved**\n\nID: ${say.checkpoint.id}${say.checkpoint.description ? `\nDescription: ${say.checkpoint.description}` : ""}`;
        }
        return text || "Checkpoint saved";

      case "condense_context":
        if (say.contextCondense) {
          return `🗜️ **Context Condensation**\n\nOriginal: ${say.contextCondense.originalTokens} tokens\nCondensed: ${say.contextCondense.condensedTokens} tokens\nCompression: ${(say.contextCondense.compressionRatio * 100).toFixed(1)}%`;
        }
        return text || "Context condensation started";

      case "condense_context_error":
        return `❌ **Context Condensation Failed**\n\n${text || "Failed to condense context"}`;

      case "text":
        // For text messages, return the actual text content directly
        return say.text || text || "";

      default:
        // For other messages, return structured content or fallback to text
        return say.text || text || "";
    }
  }
}