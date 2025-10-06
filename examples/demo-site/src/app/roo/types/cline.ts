// Enhanced ClineMessage types based on roo-api-tools.md documentation

export interface ClineMessage {
  ts: number;
  type: "ask" | "say";
  ask?: ClineAsk;
  say?: ClineSay;
  text?: string; // Can contain complex JSON structures
  images?: string[];
  partial?: boolean;
  reasoning?: string;
  conversationHistoryIndex?: number;
  checkpoint?: Record<string, unknown>;
  progressStatus?: ToolProgressStatus;
  contextCondense?: ContextCondense;
  isProtected?: boolean;
  taskId?: string;
  parentTaskId?: string;
}

// ClineAsk Types (12 types from documentation)
export type ClineAskType =
  | "followup"
  | "command"
  | "command_output"
  | "completion_result"
  | "tool"
  | "api_req_failed"
  | "resume_task"
  | "resume_completed_task"
  | "mistake_limit_reached"
  | "browser_action_launch"
  | "use_mcp_server"
  | "auto_approval_max_req_reached";

// ClineSay Types (24 types from documentation)
export type ClineSayType =
  | "error"
  | "api_req_started"
  | "api_req_finished"
  | "api_req_retried"
  | "api_req_retry_delayed"
  | "api_req_deleted"
  | "text"
  | "reasoning"
  | "completion_result"
  | "user_feedback"
  | "user_feedback_diff"
  | "command_output"
  | "shell_integration_warning"
  | "browser_action"
  | "browser_action_result"
  | "mcp_server_request_started"
  | "mcp_server_response"
  | "subtask_result"
  | "checkpoint_saved"
  | "rooignore_error"
  | "diff_error"
  | "condense_context"
  | "condense_context_error"
  | "codebase_search_result";

export interface ClineAsk {
  type: ClineAskType;
  question?: string;
  suggest?: ClineSuggestion[];
  tool?: ToolUsageRequest;
  command?: CommandRequest;
  completion?: CompletionRequest;
  apiFailure?: ApiFailureRequest;
  browserAction?: BrowserActionRequest;
  mcpServer?: McpServerRequest;
}

export interface ClineSay {
  type: ClineSayType;
  text?: string;
  error?: ErrorDetails;
  apiRequest?: ApiRequestDetails;
  toolResult?: ToolResult;
  browserResult?: BrowserResult;
  mcpResult?: McpResult;
  searchResult?: CodebaseSearchResult;
  checkpoint?: CheckpointDetails;
  contextCondense?: ContextCondenseDetails;
}

// Supporting interfaces
export interface ClineSuggestion {
  answer: string;
  description?: string;
}

export interface ToolUsageRequest {
  name: string;
  arguments: Record<string, unknown>;
  description?: string;
}

export interface CommandRequest {
  command: string;
  workingDirectory?: string;
  requiresApproval?: boolean;
}

export interface CompletionRequest {
  result: string;
  tokensUsed?: number;
  requiresApproval?: boolean;
}

export interface ApiFailureRequest {
  error: string;
  retryCount: number;
  maxRetries: number;
}

export interface BrowserActionRequest {
  action: string;
  target?: string;
  description?: string;
}

export interface McpServerRequest {
  serverName: string;
  toolName: string;
  arguments: Record<string, unknown>;
}

export interface ErrorDetails {
  message: string;
  code?: string;
  stack?: string;
  recoverable?: boolean;
}

export interface ApiRequestDetails {
  requestId?: string;
  method?: string;
  endpoint?: string;
  status?: number;
  retryCount?: number;
}

export interface ToolResult {
  name: string;
  success: boolean;
  output?: string;
  error?: string;
  executionTime?: number;
}

export interface BrowserResult {
  action: string;
  success: boolean;
  screenshot?: string;
  error?: string;
}

export interface McpResult {
  serverName: string;
  toolName: string;
  success: boolean;
  result?: unknown;
  error?: string;
}

export interface CodebaseSearchResult {
  query: string;
  results: SearchResultItem[];
  totalCount: number;
  searchTime?: number;
}

export interface SearchResultItem {
  file: string;
  line: number;
  column?: number;
  match: string;
  context?: string;
}

export interface CheckpointDetails {
  id: string;
  timestamp: number;
  description?: string;
}

export interface ContextCondenseDetails {
  originalTokens: number;
  condensedTokens: number;
  compressionRatio: number;
  status: "started" | "completed" | "failed";
}

export interface ToolProgressStatus {
  toolName: string;
  status: "started" | "in_progress" | "completed" | "failed";
  progress?: number;
  message?: string;
}

export interface ContextCondense {
  status: "started" | "completed" | "failed";
  originalTokens?: number;
  condensedTokens?: number;
  message?: string;
}
