import { useCallback, useRef } from "react";
import { useChatState } from "./useChatState";
import { useStatusManager } from "./useStatusManager";
import { useApiClient } from "./useApiClient";
import { useEnhancedMessageHandler } from "./useEnhancedMessageHandler";
import {
  createMessage,
  isApprovalAction,
  focusTextarea,
  resetTextarea,
} from "../utils/chatHelpers";
import { STATUS_MESSAGES, SUGGESTION_ACTIONS } from "../utils/constants";

export const useChat = () => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const chatState = useChatState();
  const statusManager = useStatusManager();
  const apiClient = useApiClient();

  const focusTextareaHelper = useCallback(() => {
    focusTextarea(textareaRef.current);
  }, []);

  const messageHandler = useEnhancedMessageHandler({
    addMessage: chatState.addMessage,
    updateMessage: chatState.updateMessage,
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
          taskId, // Use existing task ID
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

  const sendMessage = useCallback(
    async (messageText?: string) => {
      const message = messageText || chatState.inputValue.trim();
      const hasContent = message || chatState.currentImages.length > 0;
      
      if (!hasContent || chatState.isWaitingForResponse) return;

      // Add user message
      const userMessage = createMessage(message, true, {
        images: chatState.currentImages.length > 0 ? chatState.currentImages : undefined,
      });
      chatState.addMessage(userMessage);
      chatState.setInputValue("");
      resetTextarea(textareaRef.current);

      // Update UI state
      chatState.setWaitingState(true);
      messageHandler.resetMessageState();

      try {
        statusManager.showStatusMessage(STATUS_MESSAGES.CONNECTING);

        const response = await apiClient.sendMessage(
          message,
          chatState.selectedMode,
          chatState.selectedExtension,
          chatState.currentTaskId || undefined,
          chatState.currentImages.length > 0 ? chatState.currentImages : undefined,
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
        console.error('Chat error:', error.message);
        
        chatState.setShowTyping(false);
        chatState.setIsWaitingForResponse(false);
        
        // Create user-friendly error message based on error category
        let displayMessage = "Sorry, I encountered an error. Please try again.";
        let statusMessage = "Connection error";
        let suggestions: string[] = [];

        switch (error.category) {
          case 'connection_failed':
          case 'network_error':
            displayMessage = "Connection failed. Please check if the VS Code extension is running and accessible.";
            statusMessage = "Connection failed - Check VS Code extension";
            suggestions = [
              "Check VS Code Extension", 
              "Retry Request",
              "Check Network Connection"
            ];
            break;
          case 'server_error':
            displayMessage = "Server error occurred. This might be a temporary issue with the extension.";
            statusMessage = "Server error - Try again";
            suggestions = [
              "Retry Request",
              "Check Extension Status", 
              "Restart VS Code"
            ];
            break;
          case 'rate_limited':
            displayMessage = "Too many requests. Please wait a moment before trying again.";
            statusMessage = "Rate limited - Wait before retrying";
            suggestions = [
              "Wait and Retry",
              "Reduce Request Frequency"
            ];
            break;
          case 'sse_error':
          case 'sse_read_error':
            displayMessage = "Connection to the AI agent was lost. This can happen if the agent takes a long time to respond or if there's a network issue.";
            statusMessage = "Connection lost - Retry available";
            suggestions = [
              "Retry Last Message",
              "Start New Chat", 
              "Check Network Connection"
            ];
            break;
          case 'parse_error':
            displayMessage = "Received invalid data from the server. There may be a compatibility issue.";
            statusMessage = "Data parsing error";
            suggestions = [
              "Refresh Page",
              "Check Extension Version",
              "Report Issue"
            ];
            break;
          default:
            // Use the error's user message if available
            displayMessage = error.userMessage || error.responseData?.message || displayMessage;
            statusMessage = `Error: ${error.message || "Unknown error"}`;
            suggestions = [
              "Retry Request",
              "Check Input",
              "Refresh Page"
            ];
        }

        // Add technical details for development
        if (process.env.NODE_ENV === 'development') {
          displayMessage += `\n\n🔧 Development Details:\n- Category: ${error.category || 'unknown'}\n- Operation: ${error.operation || 'unknown'}\n- Status: ${error.status || 'unknown'}\n- Timestamp: ${new Date().toISOString()}`;
        }

        statusManager.showStatusMessage(statusMessage);

        const errorMessage = createMessage(
          displayMessage,
          false,
          { suggestions }
        );

        chatState.addMessage(errorMessage);
        
        // Track error in tool failures for analytics
        if (error.category && error.operation) {
          chatState.addToolFailure({
            taskId: error.taskId || chatState.currentTaskId || 'unknown',
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
    [chatState.isWaitingForResponse, chatState.currentTaskId, statusManager, apiClient],
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
    [chatState.isWaitingForResponse, chatState.currentTaskId, statusManager, apiClient],
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
