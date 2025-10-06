import { useCallback, useRef } from "react";

import {
  createMessage,
  focusTextarea,
  isApprovalAction,
  resetTextarea,
} from "../utils/chatHelpers";
import { STATUS_MESSAGES, SUGGESTION_ACTIONS } from "../utils/constants";
import { useApiClient } from "./useApiClient";
import { useChatState } from "./useChatState";
import { useEnhancedMessageHandler } from "./useEnhancedMessageHandler";
import { useStatusManager } from "./useStatusManager";
import { useTaskRestart } from "./useTaskRestart";

export const useChat = () => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const chatState = useChatState();
  const statusManager = useStatusManager();
  const apiClient = useApiClient();
  const { restartTask } = useTaskRestart({
    setCurrentTaskId: chatState.setCurrentTaskId,
    setIsWaitingForResponse: chatState.setIsWaitingForResponse,
  });

  const focusTextareaHelper = useCallback(() => {
    focusTextarea(textareaRef.current);
  }, []);

  const messageHandler = useEnhancedMessageHandler({
    addMessage: chatState.addMessage,
    updateMessage: chatState.updateMessage,
    getMessageById: chatState.getMessageById,
    setCurrentTaskId: chatState.setCurrentTaskId,
    setIsWaitingForResponse: chatState.setIsWaitingForResponse,
    showStatusMessage: statusManager.showStatusMessage,
    focusTextarea: focusTextareaHelper,
    updateTokenUsage: chatState.updateTokenUsage,
    addToolFailure: chatState.addToolFailure,
  });

  const handleNewChat = useCallback(() => {
    chatState.resetChatState();
    resetTextarea(textareaRef.current);
    focusTextarea(textareaRef.current);
  }, [chatState]);

  const handleSuggestionClick = useCallback(
    async (suggestion: string) => {
      if (chatState.isWaitingForResponse) return;

      // Handle Approve/Reject actions for MCP server requests
      // Handle task restart suggestion
      if (suggestion === "Restart task" && chatState.currentTaskId) {
        chatState.setIsWaitingForResponse(true);
        statusManager.showStatusMessage("Restarting task...");
        try {
          await restartTask(chatState.currentTaskId);
          statusManager.showStatusMessage("Task restarted");
        } catch (error) {
          console.error("Error restarting task:", error);
          statusManager.showStatusMessage("Failed to restart task");
        }
        return;
      }

      if (isApprovalAction(suggestion)) {
        if (!chatState.currentTaskId) {
          console.error("No current task ID for approve/reject action");
          return;
        }

        chatState.setIsWaitingForResponse(true);
        statusManager.showStatusMessage(
          suggestion === SUGGESTION_ACTIONS.APPROVE
            ? STATUS_MESSAGES.APPROVING
            : STATUS_MESSAGES.REJECTING,
        );

        try {
          const success = await apiClient.sendTaskAction(
            chatState.currentTaskId,
            suggestion,
          );

          if (success) {
            statusManager.showStatusMessage(
              suggestion === SUGGESTION_ACTIONS.APPROVE
                ? STATUS_MESSAGES.APPROVED
                : STATUS_MESSAGES.REJECTED,
            );

            // Add a user message to show the action taken
            const userMessage = createMessage(suggestion, true);
            chatState.addMessage(userMessage);
          } else {
            throw new Error("Failed to process action");
          }
        } catch (error) {
          console.error("Error handling approve/reject:", error);
          statusManager.showStatusMessage(STATUS_MESSAGES.ERROR_PROCESSING);
        } finally {
          chatState.setIsWaitingForResponse(false);
          focusTextarea(textareaRef.current);
        }
        return;
      }

      // Handle regular suggestions - use existing task if available
      const userMessage = createMessage(suggestion, true);
      chatState.addMessage(userMessage);

      // Use existing task ID if available, otherwise start new task
      const taskId = chatState.currentTaskId;

      try {
        statusManager.showStatusMessage(STATUS_MESSAGES.CONNECTING);
        chatState.setIsWaitingForResponse(true);
        messageHandler.resetMessageState();

        const response = await apiClient.sendMessage(
          suggestion,
          chatState.selectedMode,
          chatState.selectedExtension,
          taskId || undefined, // Convert null to undefined
          undefined, // No images for suggestions
        );

        // Clear images after sending
        chatState.setCurrentImages([]);

        chatState.setShowTyping(false);
        statusManager.showStatusMessage(STATUS_MESSAGES.RECEIVING);

        const sseReader = apiClient.createSSEReader(response);

        while (true) {
          const { done, events } = await sseReader.read();
          if (done) break;

          for (const { event, data } of events) {
            messageHandler.handleEvent(event, data);
          }
        }
        messageHandler.handleMessageStreamEnd();
      } catch (error: any) {
        console.error("Error sending suggestion:", error);
        chatState.setIsWaitingForResponse(false);
        statusManager.showStatusMessage("Error sending message");
      }
    },
    [chatState, statusManager, apiClient],
  );

  // SSE connection management with exponential backoff and health monitoring
  const MAX_RETRIES = 5;
  const BASE_DELAY = 1000; // 1 second
  const MAX_DELAY = 32000; // 32 seconds
  const HEARTBEAT_INTERVAL = 15000; // 15 seconds
  const CONNECTION_TIMEOUT = 30000; // 30 seconds

  // Connection health monitoring
  const connectionHealth = useRef({
    lastHeartbeat: 0,
    isHealthy: true,
    heartbeatInterval: null as NodeJS.Timeout | null,
    timeoutCheck: null as NodeJS.Timeout | null,
  });

  const startHealthMonitoring = useCallback(() => {
    // Clear any existing intervals
    if (connectionHealth.current.heartbeatInterval) {
      clearInterval(connectionHealth.current.heartbeatInterval);
    }
    if (connectionHealth.current.timeoutCheck) {
      clearTimeout(connectionHealth.current.timeoutCheck);
    }

    // Initialize health status
    connectionHealth.current.lastHeartbeat = Date.now();
    connectionHealth.current.isHealthy = true;

    // Set up heartbeat checking interval
    connectionHealth.current.heartbeatInterval = setInterval(() => {
      const timeSinceLastHeartbeat =
        Date.now() - connectionHealth.current.lastHeartbeat;
      if (timeSinceLastHeartbeat > CONNECTION_TIMEOUT) {
        connectionHealth.current.isHealthy = false;
        statusManager.showStatusMessage("Connection health check failed");
      }
    }, HEARTBEAT_INTERVAL);

    // Set up connection timeout check
    connectionHealth.current.timeoutCheck = setTimeout(() => {
      if (!connectionHealth.current.isHealthy) {
        // Trigger reconnection logic
        console.warn(
          "Connection health check failed, initiating reconnection...",
        );
        throw new Error("Connection health check failed");
      }
    }, CONNECTION_TIMEOUT);
  }, [statusManager]);

  const stopHealthMonitoring = useCallback(() => {
    if (connectionHealth.current.heartbeatInterval) {
      clearInterval(connectionHealth.current.heartbeatInterval);
    }
    if (connectionHealth.current.timeoutCheck) {
      clearTimeout(connectionHealth.current.timeoutCheck);
    }
  }, []);

  const updateHeartbeat = useCallback(() => {
    connectionHealth.current.lastHeartbeat = Date.now();
    connectionHealth.current.isHealthy = true;
  }, []);

  const connectWithRetry = useCallback(
    async (message: string, retryCount = 0, lastEventId?: string) => {
      const delay = Math.min(BASE_DELAY * Math.pow(2, retryCount), MAX_DELAY);

      try {
        const response = await apiClient.sendMessage(
          message,
          chatState.selectedMode,
          chatState.selectedExtension,
          chatState.currentTaskId || undefined,
          chatState.currentImages.length > 0
            ? chatState.currentImages
            : undefined,
          lastEventId, // Pass last event ID for resuming
        );

        // Start monitoring connection health
        startHealthMonitoring();
        return response;
      } catch (error: any) {
        // Stop health monitoring on connection failure
        stopHealthMonitoring();

        if (retryCount >= MAX_RETRIES) {
          throw new Error("Maximum retries exceeded");
        }

        console.warn(
          `Connection attempt ${retryCount + 1} failed, retrying in ${delay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));

        return connectWithRetry(message, retryCount + 1, lastEventId);
      }
    },
    [apiClient, chatState, startHealthMonitoring, stopHealthMonitoring],
  );

  const sendMessage = useCallback(
    async (messageText?: string) => {
      const message = messageText || chatState.inputValue.trim();
      const hasContent = message || chatState.currentImages.length > 0;

      if (!hasContent || chatState.isWaitingForResponse) return;

      // Add user message
      const userMessage = createMessage(message, true, {
        images:
          chatState.currentImages.length > 0
            ? chatState.currentImages
            : undefined,
      });
      chatState.addMessage(userMessage);
      chatState.setInputValue("");
      resetTextarea(textareaRef.current);

      // Update UI state
      chatState.setWaitingState(true);
      messageHandler.resetMessageState();

      try {
        statusManager.showStatusMessage(STATUS_MESSAGES.CONNECTING);

        // Initialize connection with retry mechanism
        const response = await connectWithRetry(message);

        // Clear images after sending
        chatState.setCurrentImages([]);

        chatState.setShowTyping(false);
        statusManager.showStatusMessage(STATUS_MESSAGES.RECEIVING);

        let lastEventId: string | undefined;
        const sseReader = apiClient.createSSEReader(response);

        while (true) {
          try {
            const { done, events } = await sseReader.read();

            // Update connection health on successful read
            updateHeartbeat();

            if (done) {
              stopHealthMonitoring();
              break;
            }

            for (const { event, data, id } of events) {
              lastEventId = id; // Track last event ID for potential reconnection
              messageHandler.handleEvent(event, data);

              // Update heartbeat on each event
              updateHeartbeat();
            }
          } catch (readError: any) {
            // Check if error is due to connection health
            if (!connectionHealth.current.isHealthy) {
              statusManager.showStatusMessage(
                "Connection lost - attempting to reconnect...",
              );
            }

            if (lastEventId) {
              // Stop current health monitoring before retry
              stopHealthMonitoring();

              // Attempt to resume from last received event
              try {
                const newResponse = await connectWithRetry(
                  message,
                  0,
                  lastEventId,
                );
                sseReader.updateResponse(newResponse);

                // Update status on successful reconnection
                statusManager.showStatusMessage(STATUS_MESSAGES.RECEIVING);
                continue;
              } catch (reconnectError) {
                console.error("Failed to reconnect:", reconnectError);
                throw reconnectError;
              }
            }
            throw readError;
          }
        }
        messageHandler.handleMessageStreamEnd();

        // Ensure health monitoring is stopped
        stopHealthMonitoring();
      } catch (error: any) {
        console.error("Chat error:", error.message);

        // Stop health monitoring on error
        stopHealthMonitoring();

        chatState.setShowTyping(false);
        chatState.setIsWaitingForResponse(false);

        // Attempt to preserve partial message state
        const partialMessage = messageHandler.getCurrentMessageState();
        if (partialMessage) {
          chatState.updateMessage(partialMessage.id, {
            ...partialMessage,
            content:
              partialMessage.content +
              "\n\n[Message interrupted due to connection error]",
          });
        }

        // Create user-friendly error message based on error category
        let displayMessage = "Sorry, I encountered an error. Please try again.";
        let statusMessage = "Connection error";
        let suggestions: string[] = [];
        let canResume = false;

        switch (error.category) {
          case "connection_failed":
          case "network_error":
            displayMessage =
              "Connection failed. The system will automatically attempt to reconnect.";
            statusMessage = "Connection failed - Attempting reconnection";
            suggestions = [
              "Wait for Reconnection",
              "Check Network Connection",
              "Start New Chat",
            ];
            canResume = true;
            break;
          case "server_error":
            displayMessage =
              "Server error occurred. The system will try to restore your session.";
            statusMessage = "Server error - Attempting recovery";
            suggestions = [
              "Wait for Recovery",
              "Restart Chat",
              "Check Server Status",
            ];
            canResume = error.isTransient || false;
            break;
          case "rate_limited":
            displayMessage =
              "Too many requests. The system will automatically retry after a brief pause.";
            statusMessage = "Rate limited - Automatic retry scheduled";
            suggestions = [
              "Wait for Automatic Retry",
              "Resume Later",
              "Start New Chat",
            ];
            canResume = true;
            break;
          case "sse_error":
          case "sse_read_error":
            displayMessage =
              "Connection interrupted. The system will attempt to resume from where it left off.";
            statusMessage = "Connection interrupted - Attempting to resume";
            suggestions = [
              "Wait for Resume",
              "Retry from Last Message",
              "Start New Chat",
            ];
            canResume = !!messageHandler.getLastEventId();
            break;
          case "parse_error":
            displayMessage =
              "Data processing error. Your previous state will be preserved while we attempt recovery.";
            statusMessage = "Processing error - Attempting recovery";
            suggestions = [
              "Retry Processing",
              "Download Response Data",
              "Start New Chat",
            ];
            canResume = !!messageHandler.getCurrentMessageState();
            break;
          default:
            // Use the error's user message if available
            displayMessage =
              error.userMessage ||
              error.responseData?.message ||
              displayMessage;
            statusMessage = `Error: ${error.message || "Unknown error"}`;
            suggestions = [
              "Retry Last Action",
              "Check System Status",
              "Start New Chat",
            ];
            canResume = false;
        }

        // Add technical details for development and state recovery information
        if (process.env.NODE_ENV === "development") {
          const lastEventId = messageHandler.getLastEventId();
          const partialState = messageHandler.getCurrentMessageState();

          displayMessage += `\n\n🔧 Development Details:
- Category: ${error.category || "unknown"}
- Operation: ${error.operation || "unknown"}
- Status: ${error.status || "unknown"}
- Last Event ID: ${lastEventId || "none"}
- Partial Message: ${partialState ? "available" : "none"}
- Can Resume: ${canResume}
- Timestamp: ${new Date().toISOString()}`;
        }

        statusManager.showStatusMessage(statusMessage);

        // Format retry attempt message if applicable
        if (retryCount !== undefined) {
          statusManager.showStatusMessage(
            STATUS_MESSAGES.RETRY_ATTEMPT.replace(
              "{attempt}",
              String(retryCount + 1),
            ).replace("{max}", String(MAX_RETRIES)),
          );
        }

        // Format rate limit message if applicable
        if (error.category === "rate_limited" && error.retryAfter) {
          statusManager.showStatusMessage(
            STATUS_MESSAGES.RATE_LIMITED.replace(
              "{seconds}",
              String(Math.ceil(error.retryAfter / 1000)),
            ),
          );
        }

        // Create error message with enhanced recovery information
        const errorMessage = createMessage(displayMessage, false, {
          suggestions,
          metadata: {
            canResume,
            lastEventId: messageHandler.getLastEventId(),
            partialMessageId: partialMessage?.id,
            errorCategory: error.category,
            errorTimestamp: Date.now(),
            retryCount,
            retryDelay: delay,
            connectionHealthStatus: connectionHealth.current.isHealthy,
            lastHeartbeat: connectionHealth.current.lastHeartbeat,
          },
        });

        chatState.addMessage(errorMessage);

        // Show appropriate status based on error state
        if (canResume) {
          if (partialMessage) {
            statusManager.showStatusMessage(STATUS_MESSAGES.PARTIAL_SAVE);
          } else {
            statusManager.showStatusMessage(STATUS_MESSAGES.STATE_PRESERVED);
          }
        }

        // Track error in tool failures for analytics
        if (error.category && error.operation) {
          chatState.addToolFailure({
            taskId: error.taskId || chatState.currentTaskId || "unknown",
            toolName: error.operation,
            error: `${error.category}: ${error.message}`,
            timestamp: Date.now(),
          });
        }

        focusTextarea(textareaRef.current);
      }
    },
    [chatState, statusManager, apiClient, messageHandler],
  );

  const handleApprove = useCallback(
    async (messageId: string) => {
      if (chatState.isWaitingForResponse || !chatState.currentTaskId) return;

      try {
        statusManager.showStatusMessage(STATUS_MESSAGES.APPROVING);

        const success = await apiClient.sendTaskAction(
          chatState.currentTaskId,
          SUGGESTION_ACTIONS.APPROVE,
        );

        if (success) {
          statusManager.showStatusMessage(STATUS_MESSAGES.APPROVED);
          focusTextarea(textareaRef.current);
        } else {
          throw new Error("Failed to send approve action");
        }
      } catch (error) {
        console.error("Error sending approve action:", error);
        statusManager.showStatusMessage(STATUS_MESSAGES.ERROR_PROCESSING);
      }
    },
    [
      chatState.isWaitingForResponse,
      chatState.currentTaskId,
      statusManager,
      apiClient,
    ],
  );

  const handleReject = useCallback(
    async (messageId: string) => {
      if (chatState.isWaitingForResponse || !chatState.currentTaskId) return;

      try {
        statusManager.showStatusMessage(STATUS_MESSAGES.REJECTING);

        const success = await apiClient.sendTaskAction(
          chatState.currentTaskId,
          SUGGESTION_ACTIONS.REJECT,
        );

        if (success) {
          statusManager.showStatusMessage(STATUS_MESSAGES.REJECTED);
          focusTextarea(textareaRef.current);
        } else {
          throw new Error("Failed to send reject action");
        }
      } catch (error) {
        console.error("Error sending reject action:", error);
        statusManager.showStatusMessage(STATUS_MESSAGES.ERROR_PROCESSING);
      }
    },
    [
      chatState.isWaitingForResponse,
      chatState.currentTaskId,
      statusManager,
      apiClient,
    ],
  );

  const retryFailedTool = useCallback(
    async (taskId: string) => {
      if (chatState.isWaitingForResponse) return;

      statusManager.showStatusMessage("Retrying failed operation...");

      try {
        // Send a retry message
        await sendMessage("Please retry the failed operation.");
      } catch (error) {
        console.error("Error retrying tool:", error);
        statusManager.showStatusMessage("Failed to retry operation");
      }
    },
    [chatState.isWaitingForResponse, statusManager, sendMessage],
  );

  return {
    // State
    messages: chatState.messages,
    inputValue: chatState.inputValue,
    isWaitingForResponse: chatState.isWaitingForResponse,
    showTyping: chatState.showTyping,
    statusMessage: statusManager.statusMessage,
    showStatus: statusManager.showStatus,
    selectedMode: chatState.selectedMode,
    selectedExtension: chatState.selectedExtension,
    currentImages: chatState.currentImages,
    sessionTokenUsage: chatState.sessionTokenUsage,
    currentTokenUsage: chatState.currentTokenUsage,
    toolFailures: chatState.toolFailures,
    toolUsageStats: chatState.toolUsageStats,

    // Refs
    textareaRef,

    // Actions
    handleNewChat,
    handleSuggestionClick,
    sendMessage,
    retryFailedTool,
    handleApprove,
    handleReject,
    setInputValue: chatState.setInputValue,
    setSelectedMode: chatState.setSelectedMode,
    setSelectedExtension: chatState.setSelectedExtension,
    setCurrentImages: chatState.setCurrentImages,
    dismissToolFailure: chatState.dismissToolFailure,
    resetSessionStats: chatState.resetSessionStats,
  };
};
