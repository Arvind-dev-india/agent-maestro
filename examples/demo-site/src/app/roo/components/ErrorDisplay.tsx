import React from "react";

interface ToolFailure {
  taskId: string;
  toolName: string;
  error: string;
  timestamp: number;
}

interface ErrorDisplayProps {
  error: ToolFailure;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  className = "",
}) => {
  const getErrorIcon = (toolName: string) => {
    switch (toolName) {
      case "execute_command":
        return "⚡";
      case "read_file":
      case "write_to_file":
        return "📁";
      case "browser_action":
        return "🌐";
      case "use_mcp_tool":
        return "🔧";
      default:
        return "⚠️";
    }
  };

  const getErrorSeverity = (error: string): "error" | "warning" | "info" => {
    const errorLower = error.toLowerCase();
    if (errorLower.includes("permission") || errorLower.includes("access denied")) {
      return "error";
    }
    if (errorLower.includes("timeout") || errorLower.includes("network")) {
      return "warning";
    }
    return "info";
  };

  const severity = getErrorSeverity(error.error);
  
  const severityStyles = {
    error: "border-red-200 bg-red-50 text-red-800",
    warning: "border-yellow-200 bg-yellow-50 text-yellow-800", 
    info: "border-blue-200 bg-blue-50 text-blue-800",
  };

  const getSuggestion = (toolName: string, error: string) => {
    if (toolName === "execute_command" && error.includes("permission")) {
      return "Try running the command with different permissions or check if the command is available.";
    }
    if (toolName === "write_to_file" && error.includes("permission")) {
      return "Check file permissions or try writing to a different location.";
    }
    if (toolName === "browser_action") {
      return "Verify browser setup and network connectivity.";
    }
    if (error.includes("timeout")) {
      return "The operation timed out. You can retry or try a simpler approach.";
    }
    return "You can retry the operation or try a different approach.";
  };

  return (
    <div className={`border rounded-lg p-4 ${severityStyles[severity]} ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="text-lg flex-shrink-0 mt-0.5">
          {getErrorIcon(error.toolName)}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">
              Tool Failed: {error.toolName}
            </h4>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          <p className="text-sm mb-2 break-words">
            {error.error}
          </p>
          
          <p className="text-xs opacity-75 mb-3">
            {getSuggestion(error.toolName, error.error)}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-xs opacity-60">
              {new Date(error.timestamp).toLocaleTimeString()}
            </span>
            
            {onRetry && (
              <button
                onClick={onRetry}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  severity === "error"
                    ? "bg-red-100 hover:bg-red-200 text-red-700"
                    : severity === "warning"
                      ? "bg-yellow-100 hover:bg-yellow-200 text-yellow-700"
                      : "bg-blue-100 hover:bg-blue-200 text-blue-700"
                }`}
              >
                Retry
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

interface ErrorListProps {
  errors: ToolFailure[];
  onRetryError?: (taskId: string) => void;
  onDismissError?: (index: number) => void;
  maxErrors?: number;
  className?: string;
}

export const ErrorList: React.FC<ErrorListProps> = ({
  errors,
  onRetryError,
  onDismissError,
  maxErrors = 3,
  className = "",
}) => {
  const displayErrors = errors.slice(0, maxErrors);

  if (errors.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {displayErrors.map((error, index) => (
        <ErrorDisplay
          key={`${error.taskId}-${error.timestamp}`}
          error={error}
          onRetry={onRetryError ? () => onRetryError(error.taskId) : undefined}
          onDismiss={onDismissError ? () => onDismissError(index) : undefined}
        />
      ))}
      
      {errors.length > maxErrors && (
        <div className="text-center py-2">
          <span className="text-sm text-gray-500">
            and {errors.length - maxErrors} more error{errors.length - maxErrors !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
};