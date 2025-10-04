export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: string;
  suggestions?: string[];
  isCompletionResult?: boolean;
  images?: string[];
  reasoning?: string;
  toolFailures?: ToolFailure[];
}

export interface ChatState {
  messages: Message[];
  isWaitingForResponse: boolean;
  currentTaskId: string | null;
  showTyping: boolean;
  statusMessage: string;
  showStatus: boolean;
  currentImages: string[];
  sessionTokenUsage: TokenUsage;
  currentTokenUsage: TokenUsage;
  toolFailures: ToolFailure[];
  toolUsageStats: ToolUsageStats;
}

export interface ApiResponse {
  taskId?: string;
  message?: {
    ts?: number;
    type: string;
    text: string;
    partial: boolean;
    say?: string;
    ask?: string;
  };
}

export interface McpServerData {
  serverName?: string;
  toolName?: string;
  arguments?: any;
}

export interface Suggestion {
  answer: string;
}

export interface FollowupData {
  question?: string;
  suggest?: Suggestion[];
}

export type MessageEventType =
  | "task_created"
  | "task_resumed"
  | "message"
  | "task_completed"
  | "task_aborted"
  | "error";

export type MessageType = "say" | "ask";
export type AskType = "followup" | "use_mcp_server";
export type ActionType = "pressPrimaryButton" | "pressSecondaryButton";

export interface TokenUsage {
  totalTokensIn: number;
  totalTokensOut: number;
  totalCacheWrites?: number;
  totalCacheReads?: number;
  totalCost: number;
  contextTokens: number;
}

export interface ToolFailure {
  taskId: string;
  toolName: string;
  error: string;
  timestamp: number;
}

export interface ToolUsageStats {
  [toolName: string]: {
    attempts: number;
    failures: number;
    lastUsed: number;
    totalTime?: number;
  };
}
