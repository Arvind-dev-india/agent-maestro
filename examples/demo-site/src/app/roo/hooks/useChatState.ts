import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { DEFAULT_MODE } from "../utils/constants";
import type { Message, ChatState, TokenUsage, ToolFailure, ToolUsageStats } from "../types/chat";

export const useChatState = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState(DEFAULT_MODE);
  const [selectedExtension, setSelectedExtension] = useState(
    "rooveterinaryinc.roo-cline",
  );
  const [currentImages, setCurrentImages] = useState<string[]>([]);
  const [sessionTokenUsage, setSessionTokenUsage] = useState<TokenUsage>({
    totalTokensIn: 0,
    totalTokensOut: 0,
    totalCost: 0,
    contextTokens: 0,
  });
  const [currentTokenUsage, setCurrentTokenUsage] = useState<TokenUsage>({
    totalTokensIn: 0,
    totalTokensOut: 0,
    totalCost: 0,
    contextTokens: 0,
  });
  const [toolFailures, setToolFailures] = useState<ToolFailure[]>([]);
  const [toolUsageStats, setToolUsageStats] = useState<ToolUsageStats>({});

  const addMessage = useCallback((message: Message) => {
    const messageWithId = { ...message, id: message.id || uuidv4() };
    setMessages((prev) => [...prev, messageWithId]);
    
    // Track tool usage from message content
    trackToolUsageFromMessage(messageWithId);
  }, []);

  const trackToolUsageFromMessage = useCallback((message: Message) => {
    if (message.isUser) return; // Only track AI tool usage
    
    try {
      const data = JSON.parse(message.content);
      if (data.tool) {
        const toolName = mapToolNameFromMessage(data.tool);
        if (toolName) {
          setToolUsageStats(prev => {
            const current = prev[toolName] || { attempts: 0, failures: 0, lastUsed: 0 };
            return {
              ...prev,
              [toolName]: {
                ...current,
                attempts: current.attempts + 1,
                lastUsed: Date.now(),
              }
            };
          });
        }
      }
    } catch {
      // Not JSON or no tool info, ignore
    }
  }, []);

  // Map message tool names to official tool names
  const mapToolNameFromMessage = (toolName: string): string | null => {
    const toolMap: Record<string, string> = {
      "readFile": "read_file",
      "editedExistingFile": "write_to_file", 
      "newFileCreated": "write_to_file",
      "appliedDiff": "apply_diff",
      "listFilesTopLevel": "list_files",
      "listFilesRecursive": "list_files",
      "searchFiles": "search_files",
      "listCodeDefinitionNames": "list_code_definition_names",
      "searchAndReplace": "search_and_replace",
      "insertContent": "insert_content",
      "fetchInstructions": "fetch_instructions",
      "switchMode": "switch_mode",
      "newTask": "new_task",
      "codebaseSearch": "codebase_search",
    };
    return toolMap[toolName] || null;
  };

  const updateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, ...updates } : msg))
    );
  }, []);

  const updateTokenUsage = useCallback((usage: TokenUsage) => {
    setCurrentTokenUsage(usage);
    setSessionTokenUsage((prev) => ({
      totalTokensIn: prev.totalTokensIn + usage.totalTokensIn,
      totalTokensOut: prev.totalTokensOut + usage.totalTokensOut,
      totalCacheWrites: (prev.totalCacheWrites || 0) + (usage.totalCacheWrites || 0),
      totalCacheReads: (prev.totalCacheReads || 0) + (usage.totalCacheReads || 0),
      totalCost: prev.totalCost + usage.totalCost,
      contextTokens: usage.contextTokens, // Use current, not cumulative
    }));
  }, []);

  const addToolFailure = useCallback((failure: ToolFailure) => {
    setToolFailures((prev) => [failure, ...prev.slice(0, 9)]); // Keep last 10
    
    // Update tool usage stats to track failure
    setToolUsageStats(prev => {
      const current = prev[failure.toolName] || { attempts: 0, failures: 0, lastUsed: 0 };
      return {
        ...prev,
        [failure.toolName]: {
          ...current,
          failures: current.failures + 1,
          lastUsed: Date.now(),
        }
      };
    });
  }, []);

  const dismissToolFailure = useCallback((index: number) => {
    setToolFailures((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const setWaitingState = useCallback((waiting: boolean) => {
    setIsWaitingForResponse(waiting);
    setShowTyping(waiting);
  }, []);

  const resetChatState = useCallback(() => {
    setMessages([]);
    setInputValue("");
    setIsWaitingForResponse(false);
    setShowTyping(false);
    setCurrentTaskId(null);
    setCurrentImages([]);
    setCurrentTokenUsage({
      totalTokensIn: 0,
      totalTokensOut: 0,
      totalCost: 0,
      contextTokens: 0,
    });
    setToolFailures([]);
  }, []);

  const resetSessionStats = useCallback(() => {
    setSessionTokenUsage({
      totalTokensIn: 0,
      totalTokensOut: 0,
      totalCost: 0,
      contextTokens: 0,
    });
    setToolFailures([]);
    setToolUsageStats({});
  }, []);

  return {
    // State
    messages,
    inputValue,
    isWaitingForResponse,
    currentTaskId,
    showTyping,
    selectedMode,
    selectedExtension,
    currentImages,
    sessionTokenUsage,
    currentTokenUsage,
    toolFailures,
    toolUsageStats,

    // Setters
    setInputValue,
    setIsWaitingForResponse,
    setCurrentTaskId,
    setShowTyping,
    setSelectedMode,
    setSelectedExtension,
    setCurrentImages,

    // Actions
    addMessage,
    updateMessage,
    updateTokenUsage,
    addToolFailure,
    dismissToolFailure,
    clearMessages,
    resetChatState,
    setWaitingState,
    resetSessionStats,
  };
};
