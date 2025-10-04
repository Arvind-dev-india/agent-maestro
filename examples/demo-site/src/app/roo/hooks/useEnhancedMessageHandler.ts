import { useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { ClineMessageParser } from "../utils/messageParser";
import { ClineMessage, ClineAskType, ClineSayType } from "../types/cline";
import type { Message, TokenUsage, ToolFailure } from "../types/chat";
import { RooCodeEventName, STATUS_MESSAGES } from "../utils/constants";

interface UseEnhancedMessageHandlerProps {
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
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
  setCurrentTaskId,
  setIsWaitingForResponse,
  showStatusMessage,
  focusTextarea,
  updateTokenUsage,
  addToolFailure,
}: UseEnhancedMessageHandlerProps) => {
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
        showStatusMessage(STATUS_MESSAGES.TASK_CREATED);
      }
    },
    [setCurrentTaskId, showStatusMessage],
  );

  const handleTaskResumed = useCallback(
    (data: any) => {
      if (data.taskId) {
        showStatusMessage(STATUS_MESSAGES.TASK_RESUMED);
      }
    },
    [showStatusMessage],
  );

  const handleTaskCompleted = useCallback((data: any) => {
    showStatusMessage(STATUS_MESSAGES.FINALIZING);
    
    if (data.tokenUsage) {
      updateTokenUsage(data.tokenUsage);
    }
  }, [showStatusMessage, updateTokenUsage]);

  const handleTaskTokenUsageUpdated = useCallback((data: any) => {
    if (data.tokenUsage) {
      updateTokenUsage(data.tokenUsage);
    }
  }, [updateTokenUsage]);

  const handleTaskToolFailed = useCallback((data: any) => {
    if (data.taskId && data.tool && data.error) {
      const toolFailure: ToolFailure = {
        taskId: data.taskId,
        toolName: data.tool,
        error: data.error,
        timestamp: Date.now(),
      };
      addToolFailure(toolFailure);
      
      showStatusMessage(`Tool failed: ${data.tool}`);
    }
  }, [addToolFailure, showStatusMessage]);

  // Enhanced message handler using ClineMessage parser
  const handleEnhancedMessage = useCallback(
    (data: any) => {
      console.log(`🔍 [Enhanced Handler] Raw message data:`, JSON.stringify(data, null, 2));
      
      const clineMessage = ClineMessageParser.parseMessage(data);
      if (!clineMessage) {
        console.warn(`⚠️ [Enhanced Handler] Failed to parse ClineMessage from data:`, data);
        return;
      }

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
          
          const message = ClineMessageParser.toInternalMessage(clineMessage);
          message.id = newAgentMessageId;
          
          console.log(`📝 [Enhanced Handler] Creating new partial message:`, {
            content: message.content.substring(0, 100) + "...",
            hasAsk: !!clineMessage.ask,
            hasSay: !!clineMessage.say,
          });
          
          addMessage(message);
          currentClineMessage.current = clineMessage;
        } else {
          // Update existing message with new content - preserve streaming text
          const message = ClineMessageParser.toInternalMessage(clineMessage);
          
          console.log(`📝 [Enhanced Handler] Updating partial message:`, {
            messageId: currentAgentMessageId.current,
            newContentLength: message.content?.length,
            hasAsk: !!clineMessage.ask,
            hasSay: !!clineMessage.say,
          });
          
          updateMessage(currentAgentMessageId.current, {
            content: message.content,
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
      });
      
      if (currentAgentMessageId.current) {
        // Update existing partial message with final content
        updateMessage(currentAgentMessageId.current, {
          content: message.content,
          suggestions: message.suggestions,
          isCompletionResult: message.isCompletionResult,
          reasoning: message.reasoning,
          images: message.images,
          clineMessage: clineMessage, // Include the ClineMessage for enhanced rendering
        });
      } else {
        // Create new message
        message.id = uuidv4();
        addMessage(message);
      }

      // Handle specific ask/say types
      if (clineMessage.ask) {
        console.log(`🤔 [Enhanced Handler] Handling ask message: ${clineMessage.ask.type}`);
        handleAskMessage(clineMessage.ask, clineMessage);
      } else if (clineMessage.say) {
        console.log(`💬 [Enhanced Handler] Handling say message: ${clineMessage.say.type}`);
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
  const handleAskMessage = useCallback((ask: any, clineMessage: ClineMessage) => {
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
        showStatusMessage("❌ API request failed - retry confirmation needed");
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
        showStatusMessage("⚠️ Auto-approval limit reached - manual confirmation needed");
        break;
      
      default:
        break;
    }
  }, [showStatusMessage]);

  // Handle specific say message types
  const handleSayMessage = useCallback((say: any, clineMessage: ClineMessage) => {
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
  }, [showStatusMessage]);

  // Main event handler dispatcher
  const handleEvent = useCallback(
    (eventType: string, data: any) => {
      console.log(`🔥 [Enhanced Handler] Event: ${eventType}`, {
        eventType,
        hasData: !!data,
        hasMessage: !!data?.message,
        messageType: data?.message?.type,
        messageAsk: data?.message?.ask,
        messageSay: data?.message?.say,
        messageText: data?.message?.text ? `"${data?.message?.text.substring(0, 50)}..."` : null,
        messagePartial: data?.message?.partial,
        taskId: data?.taskId,
        fullData: JSON.stringify(data, null, 2),
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
          handleTaskError();
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
    ],
  );

  // Handle task errors
  const handleTaskError = useCallback(() => {
    showStatusMessage(STATUS_MESSAGES.TASK_ERROR);
    setIsWaitingForResponse(false);

    if (!currentAgentMessageId.current) {
      const errorMessage = {
        id: uuidv4(),
        content: "Sorry, there was an error processing your request.",
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      addMessage(errorMessage);
    }
    focusTextarea();
  }, [setIsWaitingForResponse, addMessage, focusTextarea, showStatusMessage]);

  // Handle message stream end
  const handleMessageStreamEnd = useCallback(() => {
    setIsWaitingForResponse(false);
    focusTextarea();
    showStatusMessage(STATUS_MESSAGES.TASK_COMPLETED);
  }, [setIsWaitingForResponse, focusTextarea, showStatusMessage]);

  return {
    handleEvent,
    resetMessageState,
    handleMessageStreamEnd,
  };
};