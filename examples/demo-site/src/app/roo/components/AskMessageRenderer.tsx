import React from "react";
import { ClineAsk, ClineAskType } from "../types/cline";

interface AskMessageRendererProps {
  ask: ClineAsk;
  onApprove?: () => void;
  onReject?: () => void;
  onSuggestionClick?: (suggestion: string) => void;
}

export const AskMessageRenderer: React.FC<AskMessageRendererProps> = ({
  ask,
  onApprove,
  onReject,
  onSuggestionClick,
}) => {
  const renderAskContent = () => {
    switch (ask.type) {
      case "followup":
        return (
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <span className="text-blue-500 text-lg">❓</span>
              <div>
                <h4 className="font-semibold text-blue-700 dark:text-blue-300">Follow-up Question</h4>
                <p className="text-gray-700 dark:text-gray-300 mt-1">
                  {ask.question}
                </p>
              </div>
            </div>
            {ask.suggest && ask.suggest.length > 0 && (
              <div className="ml-6 space-y-2">
                {ask.suggest.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => onSuggestionClick?.(suggestion.answer)}
                    className="block w-full text-left p-2 bg-blue-50 dark:bg-blue-900/30 rounded border border-blue-200 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    {suggestion.answer}
                    {suggestion.description && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {suggestion.description}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case "tool":
        return (
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <span className="text-orange-500 text-lg">🔧</span>
              <div className="flex-1">
                <h4 className="font-semibold text-orange-700 dark:text-orange-300">Tool Execution Request</h4>
                {ask.tool && (
                  <div className="mt-2 space-y-2">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                      <div className="text-sm">
                        <div><span className="font-medium">Tool:</span> {ask.tool.name}</div>
                        {ask.tool.description && (
                          <div className="mt-1"><span className="font-medium">Description:</span> {ask.tool.description}</div>
                        )}
                        <div className="mt-2">
                          <span className="font-medium">Arguments:</span>
                          {Object.keys(ask.tool.arguments).length > 0 ? (
                            <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 overflow-x-auto whitespace-pre-wrap">
                              {JSON.stringify(ask.tool.arguments, null, 2)}
                            </pre>
                          ) : (
                            <div className="text-xs text-gray-500 mt-1 italic">No arguments</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="ml-6 flex space-x-2">
              <button
                onClick={onApprove}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={onReject}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        );

      case "command":
        return (
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <span className="text-purple-500 text-lg">💻</span>
              <div className="flex-1">
                <h4 className="font-semibold text-purple-700 dark:text-purple-300">Command Execution Request</h4>
                {ask.command && (
                  <div className="mt-2">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                      <code className="text-sm text-gray-800 dark:text-gray-200">
                        {ask.command.command}
                      </code>
                      {ask.command.workingDirectory && (
                        <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                          Working Directory: {ask.command.workingDirectory}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="ml-6 flex space-x-2">
              <button
                onClick={onApprove}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                Execute
              </button>
              <button
                onClick={onReject}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        );

      case "use_mcp_server":
        return (
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <span className="text-indigo-500 text-lg">🔧</span>
              <div className="flex-1">
                <h4 className="font-semibold text-indigo-700 dark:text-indigo-300">MCP Server Tool Request</h4>
                {ask.mcpServer && (
                  <div className="mt-2 space-y-2">
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                      <div className="text-sm">
                        <div><span className="font-medium">Server:</span> {ask.mcpServer.serverName}</div>
                        <div><span className="font-medium">Tool:</span> {ask.mcpServer.toolName}</div>
                        <div className="mt-2">
                          <span className="font-medium">Arguments:</span>
                          <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 overflow-x-auto">
                            {JSON.stringify(ask.mcpServer.arguments, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="ml-6 flex space-x-2">
              <button
                onClick={onApprove}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={onReject}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        );

      case "completion_result":
        return (
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <span className="text-green-500 text-lg">✅</span>
              <div className="flex-1">
                <h4 className="font-semibold text-green-700 dark:text-green-300">Task Completion</h4>
                {ask.completion && (
                  <div className="mt-2">
                    <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded border border-green-200 dark:border-green-700">
                      <p className="text-gray-800 dark:text-gray-200">{ask.completion.result}</p>
                      {ask.completion.tokensUsed && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          Tokens used: {ask.completion.tokensUsed}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="ml-6 flex space-x-2">
              <button
                onClick={onApprove}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                Accept
              </button>
              <button
                onClick={onReject}
                className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors"
              >
                Continue Working
              </button>
            </div>
          </div>
        );

      case "api_req_failed":
        return (
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <span className="text-red-500 text-lg">❌</span>
              <div className="flex-1">
                <h4 className="font-semibold text-red-700 dark:text-red-300">API Request Failed</h4>
                {ask.apiFailure && (
                  <div className="mt-2">
                    <div className="bg-red-50 dark:bg-red-900/30 p-3 rounded border border-red-200 dark:border-red-700">
                      <p className="text-gray-800 dark:text-gray-200">{ask.apiFailure.error}</p>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        Retry {ask.apiFailure.retryCount}/{ask.apiFailure.maxRetries}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="ml-6 flex space-x-2">
              <button
                onClick={onApprove}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              >
                Retry
              </button>
              <button
                onClick={onReject}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              >
                Skip
              </button>
            </div>
          </div>
        );

      case "browser_action_launch":
        return (
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <span className="text-blue-500 text-lg">🌐</span>
              <div className="flex-1">
                <h4 className="font-semibold text-blue-700 dark:text-blue-300">Browser Action Request</h4>
                {ask.browserAction && (
                  <div className="mt-2">
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded border border-blue-200 dark:border-blue-700">
                      <div className="text-sm">
                        <div><span className="font-medium">Action:</span> {ask.browserAction.action}</div>
                        {ask.browserAction.target && (
                          <div><span className="font-medium">Target:</span> {ask.browserAction.target}</div>
                        )}
                        {ask.browserAction.description && (
                          <p className="mt-2 text-gray-700 dark:text-gray-300">{ask.browserAction.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="ml-6 flex space-x-2">
              <button
                onClick={onApprove}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                Allow
              </button>
              <button
                onClick={onReject}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Deny
              </button>
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <span className="text-gray-500 text-lg">❓</span>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300">Request for Approval</h4>
                <p className="text-gray-700 dark:text-gray-300 mt-1">
                  {ask.question || "A request requires your approval."}
                </p>
              </div>
            </div>
            <div className="ml-6 flex space-x-2">
              <button
                onClick={onApprove}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
              >
                Approve
              </button>
              <button
                onClick={onReject}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              >
                Reject
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
      {renderAskContent()}
    </div>
  );
};