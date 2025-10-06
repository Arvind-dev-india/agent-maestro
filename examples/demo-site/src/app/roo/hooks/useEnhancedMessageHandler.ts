import { useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";

import { useTaskState } from "../contexts/TaskStateContext";
import type { Message, TokenUsage, ToolFailure } from "../types/chat";
import { ClineAskType, ClineMessage, ClineSayType } from "../types/cline";
import type { TaskStatus } from "../types/task";
import { RooCodeEventName, STATUS_MESSAGES } from "../utils/constants";
import { ClineMessageParser } from "../utils/messageParser";

interface UseEnhancedMessageHandlerProps {
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  getMessageById?: (messageId: string) => Message | undefined; // Optional for message merging
  setCurrentTaskId: (taskId: string | null) => void;
  setIsWaitingForResponse: (waiting: boolean) => void;
  showStatusMessage: (message: string) => void;
  focusTextarea: () => void;
  updateTokenUsage: (usage: TokenUsage) => void;
  addToolFailure: (failure: ToolFailure) => void;
}

export const useEnhancedMessageHandler = ({
  addMessage,
  updateMessage,
  getMessageById,
  setCurrentTaskId,
  setIsWaitingForResponse,
  showStatusMessage,
  focusTextarea,
  updateTokenUsage,
  addToolFailure,
}: UseEnhancedMessageHandlerProps) => {
  const { updateTask, updateTaskStatus } = useTaskState();
  const currentAgentMessageId = useRef<string | null>(null);
  const accumulatedText = useRef<string>("");
  const currentClineMessage = useRef<ClineMessage | null>(null);

  const resetMessageState = useCallback(() => {
    currentAgentMessageId.current = null;
    accumulatedText.current = "";
    currentClineMessage.current = null;
  }, []);

  // Event handlers for all event types
  const handleTaskCreated = useCallback(
    (data: any) => {
      if (data.taskId) {
        setCurrentTaskId(data.taskId);
        updateTaskStatus(data.taskId, "created");
        showStatusMessage(STATUS_MESSAGES.TASK_CREATED);
      }
    },
    [setCurrentTaskId, showStatusMessage, updateTaskStatus],
  );

  const handleTaskCompleted = useCallback(
    (data: any) => {
      showStatusMessage(STATUS_MESSAGES.FINALIZING);

      if (data.taskId) {
        updateTask({
          id: data.taskId,
          status: "completed",
          tokenUsage: data.tokenUsage,
          toolUsage: data.toolUsage,
        });

        if (data.tokenUsage) {
          updateTokenUsage(data.tokenUsage);
        }
      }
    },
    [showStatusMessage, updateTokenUsage, updateTask],
  );

  const handleTaskTokenUsageUpdated = useCallback(
    (data: any) => {
      if (data.tokenUsage && data.taskId) {
        updateTokenUsage(data.tokenUsage);
        updateTask({
          id: data.taskId,
          tokenUsage: data.tokenUsage,
        });
      }
    },
    [updateTokenUsage, updateTask],
  );

  const handleTaskToolFailed = useCallback(
    (data: any) => {
      if (data.taskId && data.tool && data.error) {
        const toolFailure: ToolFailure = {
          taskId: data.taskId,
          toolName: data.tool,
          error: data.error,
          timestamp: Date.now(),
        };
        addToolFailure(toolFailure);

        // Update task state with tool failure
        updateTask({
          id: data.taskId,
          error: {
            message: data.error,
            toolName: data.tool,
            recoverable: true, // Tool failures are generally recoverable
          },
        });

        showStatusMessage(`Tool failed: ${data.tool}`);
      }
    },
    [addToolFailure, showStatusMessage, updateTask],
  );

  // Enhanced message handler using ClineMessage parser
  const handleEnhancedMessage = useCallback(
    (data: any) => {
      const clineMessage = ClineMessageParser.parseMessage(data);
      if (!clineMessage) {
        console.warn(
          `⚠️ [Enhanced Handler] Failed to parse ClineMessage from data:`,
          data,
        );
        return;
      }

      const rawData = data; // Store reference to raw data for action checking

      console.log(`🔍 [Enhanced Handler] Processing message:`, {
        action: rawData.action,
        type: clineMessage.type,
        sayType: clineMessage.say?.type,
        askType: clineMessage.ask?.type,
        hasText: !!clineMessage.text,
        textLength: clineMessage.text?.length,
      });

      console.log(`✅ [Enhanced Handler] Parsed ClineMessage:`, {
        type: clineMessage.type,
        hasAsk: !!clineMessage.ask,
        hasAskType: clineMessage.ask?.type,
        hasSay: !!clineMessage.say,
        hasSayType: clineMessage.say?.type,
        hasText: !!clineMessage.text,
        textLength: clineMessage.text?.length,
        partial: clineMessage.partial,
      });

      // Handle partial messages - preserve streaming behavior like original
      if (clineMessage.partial) {
        if (!currentAgentMessageId.current) {
          const newAgentMessageId = uuidv4();
          currentAgentMessageId.current = newAgentMessageId;

          // Initialize accumulated text with current text
          accumulatedText.current = clineMessage.text || "";

          const message = ClineMessageParser.toInternalMessage(clineMessage);
          message.id = newAgentMessageId;
          // Use accumulated text for content
          message.content =
            accumulatedText.current + (accumulatedText.current ? "" : "...");

          console.log(`📝 [Enhanced Handler] Creating new partial message:`, {
            content: message.content?.substring(0, 100) + "...",
            hasAsk: !!clineMessage.ask,
            hasSay: !!clineMessage.say,
          });

          // Always add partial messages to start streaming
          addMessage(message);
          currentClineMessage.current = clineMessage;
        } else {
          // Accumulate text properly - this is key for collecting all message data
          accumulatedText.current =
            clineMessage.text || accumulatedText.current;

          const message = ClineMessageParser.toInternalMessage(clineMessage);

          console.log(`📝 [Enhanced Handler] Updating partial message:`, {
            messageId: currentAgentMessageId.current,
            accumulatedLength: accumulatedText.current.length,
            hasAsk: !!clineMessage.ask,
            hasSay: !!clineMessage.say,
          });

          updateMessage(currentAgentMessageId.current, {
            content: accumulatedText.current, // Use accumulated text
            reasoning: message.reasoning,
            images: message.images,
            clineMessage: clineMessage, // Include the ClineMessage for enhanced rendering
          });
          currentClineMessage.current = clineMessage;
        }
        return;
      }

      // Handle complete messages
      const message = ClineMessageParser.toInternalMessage(clineMessage);

      console.log(`🏁 [Enhanced Handler] Processing complete message:`, {
        hasExistingMessage: !!currentAgentMessageId.current,
        finalContentLength: message.content?.length,
        hasAsk: !!clineMessage.ask,
        askType: clineMessage.ask?.type,
        hasSay: !!clineMessage.say,
        sayType: clineMessage.say?.type,
        messageContent: message.content?.substring(0, 100) + "...",
      });

      // Skip duplicate "created" actions - only process "updated" actions for messages
      // This prevents duplicate messages in the UI
      if (rawData.action === "created" && !clineMessage.ask) {
        console.log(
          `🚫 [Enhanced Handler] Skipping "created" action for non-ask message`,
        );
        return;
      }

      if (currentAgentMessageId.current) {
        // Update existing partial message with final content
        // Use accumulated text if available, otherwise use message content
        const finalContent = accumulatedText.current || message.content;

        // Get existing message to merge clineMessage properly
        let mergedClineMessage = clineMessage;
        if (getMessageById && currentAgentMessageId.current) {
          const existingMessage = getMessageById(currentAgentMessageId.current);
          if (existingMessage?.clineMessage) {
            // Merge existing clineMessage with new one, preserving both say and ask
            mergedClineMessage = {
              ...existingMessage.clineMessage,
              ...clineMessage,
              // Preserve both say and ask if they exist in either message
              say: clineMessage.say || existingMessage.clineMessage.say,
              ask: clineMessage.ask || existingMessage.clineMessage.ask,
              text: clineMessage.text || existingMessage.clineMessage.text,
            };

            console.log(`🔄 [Enhanced Handler] Merging clineMessage:`, {
              existingSay: !!existingMessage.clineMessage.say,
              existingAsk: !!existingMessage.clineMessage.ask,
              newSay: !!clineMessage.say,
              newAsk: !!clineMessage.ask,
              mergedSay: !!mergedClineMessage.say,
              mergedAsk: !!mergedClineMessage.ask,
            });
          }
        }

        updateMessage(currentAgentMessageId.current, {
          content: finalContent,
          suggestions: message.suggestions,
          isCompletionResult: message.isCompletionResult,
          reasoning: message.reasoning,
          images: message.images,
          clineMessage: mergedClineMessage, // Use merged ClineMessage for enhanced rendering
        });
      } else {
        // Create new message only if it has content or is an ask/say message with substance
        const hasContent = !!(
          message.content?.trim() || clineMessage.text?.trim()
        );
        const hasStructure = !!(
          clineMessage.ask ||
          (clineMessage.say && clineMessage.say.type !== "text")
        );

        if (hasContent || hasStructure) {
          message.id = uuidv4();
          addMessage(message);
        } else {
          console.log(
            `🚫 [Enhanced Handler] Skipping empty message with no content or structure`,
          );
          return;
        }
      }

      // Handle specific ask/say types
      if (clineMessage.ask) {
        console.log(
          `🤔 [Enhanced Handler] Handling ask message: ${clineMessage.ask.type}`,
        );
        handleAskMessage(clineMessage.ask, clineMessage);
      } else if (clineMessage.say) {
        console.log(
          `💬 [Enhanced Handler] Handling say message: ${clineMessage.say.type}`,
        );
        handleSayMessage(clineMessage.say, clineMessage);
      }

      // Reset state and focus
      resetMessageState();
      setIsWaitingForResponse(false);
      focusTextarea();
    },
    [
      addMessage,
      updateMessage,
      setIsWaitingForResponse,
      focusTextarea,
      resetMessageState,
    ],
  );

  // Handle specific ask message types
  const handleAskMessage = useCallback(
    (ask: any) => {
      switch (ask.type as ClineAskType) {
        case "command":
          showStatusMessage("⚠️ Command execution requires approval");
          break;

        case "tool":
          showStatusMessage("⚠️ Tool usage requires approval");
          break;

        case "use_mcp_server":
          showStatusMessage("⚠️ MCP server access requires approval");
          break;

        case "api_req_failed":
          showStatusMessage(
            "❌ API request failed - retry confirmation needed",
          );
          break;

        case "browser_action_launch":
          showStatusMessage("🌐 Browser action requires approval");
          break;

        case "completion_result":
          showStatusMessage("✅ Task completion confirmation needed");
          break;

        case "mistake_limit_reached":
          showStatusMessage("⚠️ Error limit reached - guidance needed");
          break;

        case "auto_approval_max_req_reached":
          showStatusMessage(
            "⚠️ Auto-approval limit reached - manual confirmation needed",
          );
          break;

        default:
          break;
      }
    },
    [showStatusMessage],
  );

  // Handle specific say message types
  const handleSayMessage = useCallback(
    (say: any) => {
      switch (say.type as ClineSayType) {
        case "error":
          showStatusMessage("❌ Error occurred");
          break;

        case "api_req_started":
          showStatusMessage("🔄 API request started");
          break;

        case "api_req_finished":
          showStatusMessage("✅ API request completed");
          break;

        case "api_req_retried":
          showStatusMessage("🔄 API request retried");
          break;

        case "command_output":
          showStatusMessage("💻 Command executed");
          break;

        case "browser_action_result":
          showStatusMessage("🌐 Browser action completed");
          break;

        case "mcp_server_response":
          showStatusMessage("🔧 MCP server responded");
          break;

        case "codebase_search_result":
          showStatusMessage("🔍 Codebase search completed");
          break;

        case "checkpoint_saved":
          showStatusMessage("💾 Checkpoint saved");
          break;

        case "condense_context":
          showStatusMessage("🗜️ Context condensation started");
          break;

        case "condense_context_error":
          showStatusMessage("❌ Context condensation failed");
          break;

        case "subtask_result":
          showStatusMessage("✅ Subtask completed");
          break;

        case "shell_integration_warning":
          showStatusMessage("⚠️ Shell integration warning");
          break;

        case "rooignore_error":
          showStatusMessage("⚠️ .rooignore processing error");
          break;

        case "diff_error":
          showStatusMessage("❌ Diff application error");
          break;

        default:
          break;
      }
    },
    [showStatusMessage],
  );

  // Handle task aborted event
  const handleTaskAborted = useCallback(
    (data: any) => {
      showStatusMessage(STATUS_MESSAGES.TASK_ERROR);
      setIsWaitingForResponse(false);

      // As per docs, task aborted event provides taskId
      const abortedTaskId = data.taskId;

      if (!abortedTaskId) {
        console.warn("[Enhanced Handler] Task aborted without taskId");
        return;
      }

      // Update task state to aborted
      updateTaskStatus(abortedTaskId, "aborted", {
        message: "Task was cancelled or aborted",
        recoverable: true, // Allow restart
      });

      // Add message to inform user and provide restart option
      const message: Message = {
        id: uuidv4(),
        isUser: false,
        content: "Task was cancelled or aborted. Would you like to restart it?",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        suggestions: ["Restart task", "Create new task"],
        clineMessage: {
          ts: Date.now(),
          type: "ask",
          ask: {
            type: "followup",
            question: "Would you like to restart the task?",
            suggest: [
              { answer: "Yes, restart the task" },
              { answer: "No, create a new task" },
            ],
          },
        },
      };

      addMessage(message);
      setCurrentTaskId(null); // Clear task ID as the stream will close
      focusTextarea();
    },
    [
      setIsWaitingForResponse,
      addMessage,
      focusTextarea,
      showStatusMessage,
      setCurrentTaskId,
      updateTaskStatus,
    ],
  );

  // Handle message stream end
  const handleMessageStreamEnd = useCallback(() => {
    setIsWaitingForResponse(false);
    focusTextarea();
    showStatusMessage(STATUS_MESSAGES.TASK_COMPLETED);

    // Don't clear currentTaskId here - let the task remain active for follow-up suggestions
    // Only clear it on explicit completion events or errors
  }, [setIsWaitingForResponse, focusTextarea, showStatusMessage]);

  // Main event handler dispatcher
  const handleEvent = useCallback(
    (eventType: string, data: any) => {
      // Only log essential info, not full data dumps
      console.log(`🔥 [Enhanced Handler] Event: ${eventType}`, {
        hasData: !!data,
        hasMessage: !!data?.message,
        messageType: data?.message?.type,
        sayType: data?.message?.say,
        askType: data?.message?.ask,
      });

      switch (eventType) {
        case RooCodeEventName.TaskCreated:
          handleTaskCreated(data);
          break;
        case RooCodeEventName.TaskCompleted:
          handleTaskCompleted(data);
          break;
        case RooCodeEventName.TaskTokenUsageUpdated:
          handleTaskTokenUsageUpdated(data);
          break;
        case RooCodeEventName.TaskToolFailed:
          handleTaskToolFailed(data);
          break;
        case RooCodeEventName.Message:
          handleEnhancedMessage(data);
          break;
        case RooCodeEventName.TaskAborted:
          handleTaskAborted(data);
          break;
        default:
          console.log(`[Enhanced Handler] Unhandled event type: ${eventType}`);
      }
    },
    [
      handleTaskCreated,
      handleTaskCompleted,
      handleTaskTokenUsageUpdated,
      handleTaskToolFailed,
      handleEnhancedMessage,
      handleTaskAborted,
    ],
  );

  return {
    handleEvent,
    resetMessageState,
    handleMessageStreamEnd,
  };
};
