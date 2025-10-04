import { useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import {
  RooCodeEventName,
  MESSAGE_TYPES,
  ASK_TYPES,
  STATUS_MESSAGES,
  UI_CONFIG,
} from "../utils/constants";
import {
  createMessage,
  parseFollowupData,
  parseMcpServerData,
} from "../utils/chatHelpers";
import type { Message, TokenUsage, ToolFailure } from "../types/chat";

interface UseMessageHandlerProps {
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  setCurrentTaskId: (taskId: string | null) => void;
  setIsWaitingForResponse: (waiting: boolean) => void;
  showStatusMessage: (message: string) => void;
  focusTextarea: () => void;
  updateTokenUsage: (usage: TokenUsage) => void;
  addToolFailure: (failure: ToolFailure) => void;
}

export const useMessageHandler = ({
  addMessage,
  updateMessage,
  setCurrentTaskId,
  setIsWaitingForResponse,
  showStatusMessage,
  focusTextarea,
  updateTokenUsage,
  addToolFailure,
}: UseMessageHandlerProps) => {
  const currentAgentMessageId = useRef<string | null>(null);
  const accumulatedText = useRef<string>("");

  const resetMessageState = useCallback(() => {
    currentAgentMessageId.current = null;
    accumulatedText.current = "";
  }, []);

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
    
    // Update token usage if provided
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

  const handleSayMessage = useCallback(
    (data: any) => {
      if (data.message?.type === MESSAGE_TYPES.SAY && data.message?.text) {
        if (!currentAgentMessageId.current) {
          const newAgentMessageId = uuidv4();
          currentAgentMessageId.current = newAgentMessageId;

          const newAgentMessage = createMessage(data.message.text, false, {
            isCompletionResult: data.message.say === "completion_result",
          });
          newAgentMessage.id = newAgentMessageId;

          // Add reasoning if available
          if (data.message.reasoning) {
            newAgentMessage.reasoning = data.message.reasoning;
          }

          addMessage(newAgentMessage);
          accumulatedText.current = data.message.text;
        } else {
          accumulatedText.current = data.message.text;
          const updates: Partial<Message> = {
            content: accumulatedText.current,
          };

          // Update reasoning if available
          if (data.message.reasoning) {
            updates.reasoning = data.message.reasoning;
          }

          updateMessage(currentAgentMessageId.current, updates);
        }

        if (!data.message.partial) {
          resetMessageState();
          setIsWaitingForResponse(false);
          focusTextarea();
        }
      }
    },
    [
      addMessage,
      updateMessage,
      setIsWaitingForResponse,
      focusTextarea,
      resetMessageState,
    ],
  );

  const handleFollowupAsk = useCallback(
    (data: any) => {
      if (
        data.message?.type === MESSAGE_TYPES.ASK &&
        data.message?.ask === ASK_TYPES.FOLLOWUP &&
        data.message?.text
      ) {
        if (data.message.partial) {
          if (!currentAgentMessageId.current) {
            const newAgentMessageId = uuidv4();
            currentAgentMessageId.current = newAgentMessageId;

            const newAgentMessage = createMessage(data.message.text, false);
            newAgentMessage.id = newAgentMessageId;
            addMessage(newAgentMessage);
          } else {
            updateMessage(currentAgentMessageId.current, {
              content: data.message.text,
            });
          }
        } else {
          const { content: finalContent, suggestions } = parseFollowupData(
            data.message.text,
          );

          if (currentAgentMessageId.current) {
            updateMessage(currentAgentMessageId.current, {
              content: finalContent,
              suggestions,
            });
          } else {
            const newAgentMessage = createMessage(finalContent, false, {
              suggestions,
            });
            addMessage(newAgentMessage);
          }

          resetMessageState();
          setIsWaitingForResponse(false);
          focusTextarea();
        }
      }
    },
    [
      addMessage,
      updateMessage,
      setIsWaitingForResponse,
      focusTextarea,
      resetMessageState,
    ],
  );

  const handleMcpServerAsk = useCallback(
    (data: any) => {
      if (
        data.message?.type === MESSAGE_TYPES.ASK &&
        data.message?.ask === ASK_TYPES.USE_MCP_SERVER &&
        data.message?.text
      ) {
        if (data.message.partial) {
          if (!currentAgentMessageId.current) {
            const newAgentMessageId = uuidv4();
            currentAgentMessageId.current = newAgentMessageId;

            const newAgentMessage = createMessage(
              "🔧 MCP Server Tool Request\n\nProcessing request...",
              false,
            );
            newAgentMessage.id = newAgentMessageId;
            addMessage(newAgentMessage);
          } else {
            updateMessage(currentAgentMessageId.current, {
              content: "🔧 MCP Server Tool Request\n\nProcessing request...",
            });
          }
        } else {
          const { content: finalContent, suggestions } = parseMcpServerData(
            data.message.text,
          );

          if (currentAgentMessageId.current) {
            updateMessage(currentAgentMessageId.current, {
              content: finalContent,
              suggestions,
            });
          } else {
            const newAgentMessage = createMessage(finalContent, false, {
              suggestions,
            });
            addMessage(newAgentMessage);
          }

          resetMessageState();
          setIsWaitingForResponse(false);
          focusTextarea();
        }
      }
    },
    [
      addMessage,
      updateMessage,
      setIsWaitingForResponse,
      focusTextarea,
      resetMessageState,
    ],
  );

  const handleTaskError = useCallback(() => {
    showStatusMessage(STATUS_MESSAGES.TASK_ERROR);
    setIsWaitingForResponse(false);

    if (!currentAgentMessageId.current) {
      const errorMessage = createMessage(
        "Sorry, there was an error processing your request.",
        false,
      );
      addMessage(errorMessage);
    }
    focusTextarea();
  }, [setIsWaitingForResponse, addMessage, focusTextarea, showStatusMessage]);

  const handleEvent = useCallback(
    (event: string, data: any) => {
      switch (event) {
        case RooCodeEventName.TaskCreated:
          handleTaskCreated(data);
          break;
        case RooCodeEventName.TaskUnpaused:
          handleTaskResumed(data);
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
          if (data.message?.partial !== undefined) {
            if (data.message.type === MESSAGE_TYPES.SAY) {
              handleSayMessage(data);
            } else if (data.message.type === MESSAGE_TYPES.ASK) {
              if (data.message.ask === ASK_TYPES.FOLLOWUP) {
                handleFollowupAsk(data);
              } else if (data.message.ask === ASK_TYPES.USE_MCP_SERVER) {
                handleMcpServerAsk(data);
              }
            }
          }
          break;
        case RooCodeEventName.TaskAborted:
          handleTaskError();
          break;
      }
    },
    [
      handleTaskCreated,
      handleTaskResumed,
      handleTaskCompleted,
      handleTaskTokenUsageUpdated,
      handleTaskToolFailed,
      handleSayMessage,
      handleFollowupAsk,
      handleMcpServerAsk,
      handleTaskError,
    ],
  );

  const handleMessageStreamEnd = useCallback(() => {
    setIsWaitingForResponse(false);
    focusTextarea();
    showStatusMessage(STATUS_MESSAGES.TASK_COMPLETED);
  }, []);

  return {
    handleEvent,
    resetMessageState,
    handleMessageStreamEnd,
  };
};
