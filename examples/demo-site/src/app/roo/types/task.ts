export type TaskStatus =
  | "created"
  | "resumed"
  | "running"
  | "completed"
  | "aborted"
  | "error";

export interface TaskState {
  id: string;
  status: TaskStatus;
  parentId?: string;
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  toolUsage?: {
    [toolName: string]: number;
  };
  error?: {
    message: string;
    toolName?: string;
    recoverable?: boolean;
  };
  lastUpdated: number;
}

export interface TaskUpdate {
  id: string;
  status?: TaskStatus;
  parentId?: string;
  tokenUsage?: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  toolUsage?: {
    [toolName: string]: number;
  };
  error?: {
    message: string;
    toolName?: string;
    recoverable?: boolean;
  };
}
