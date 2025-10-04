import React from "react";
import { ClineSay, ClineSayType } from "../types/cline";

interface SayMessageRendererProps {
  say: ClineSay;
  text?: string; // Additional text content that might be in the main message
}

export const SayMessageRenderer: React.FC<SayMessageRendererProps> = ({ say, text }) => {
  const renderSayContent = () => {
    switch (say.type) {
      case "text":
        return (
          <div className="text-gray-700 dark:text-gray-300">
            <div className="whitespace-pre-wrap break-words">
              {say.text || text || ""}
            </div>
          </div>
        );

      case "error":
        return (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <span className="text-red-500 text-lg">❌</span>
              <div className="flex-1">
                <h4 className="font-semibold text-red-700 dark:text-red-300">Error</h4>
                {say.error && (
                  <div className="mt-2 space-y-1">
                    <p className="text-red-800 dark:text-red-200">{say.error.message}</p>
                    {say.error.code && (
                      <div className="text-sm text-red-600 dark:text-red-400">
                        Code: {say.error.code}
                      </div>
                    )}
                    {say.error.recoverable && (
                      <div className="text-sm text-orange-600 dark:text-orange-400 mt-2">
                        ⚠️ This error may be recoverable
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "api_req_started":
        return (
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <span className="text-blue-500 text-lg">🔄</span>
              <div>
                <h4 className="font-semibold text-blue-700 dark:text-blue-300">API Request Started</h4>
                {say.apiRequest?.endpoint && (
                  <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    {say.apiRequest.method} {say.apiRequest.endpoint}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "api_req_finished":
        return (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <span className="text-green-500 text-lg">✅</span>
              <div>
                <h4 className="font-semibold text-green-700 dark:text-green-300">API Request Completed</h4>
                {say.apiRequest?.status && (
                  <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                    Status: {say.apiRequest.status}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "api_req_retried":
        return (
          <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-500 text-lg">🔄</span>
              <div>
                <h4 className="font-semibold text-yellow-700 dark:text-yellow-300">API Request Retried</h4>
                {say.apiRequest?.retryCount && (
                  <div className="text-sm text-yellow-600 dark:text-yellow-400 mt-1">
                    Retry attempt: {say.apiRequest.retryCount}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "command_output":
        return (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <span className="text-gray-500 text-lg">💻</span>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-700 dark:text-gray-300">Command Output</h4>
                <pre className="mt-2 text-sm bg-black text-green-400 p-3 rounded overflow-x-auto">
                  {say.text || "No output"}
                </pre>
              </div>
            </div>
          </div>
        );

      case "browser_action_result":
        return (
          <div className={`border rounded-lg p-3 ${
            say.browserResult?.success 
              ? "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-700"
              : "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700"
          }`}>
            <div className="flex items-start space-x-2">
              <span className="text-lg">
                {say.browserResult?.success ? "🌐✅" : "🌐❌"}
              </span>
              <div className="flex-1">
                <h4 className={`font-semibold ${
                  say.browserResult?.success 
                    ? "text-green-700 dark:text-green-300"
                    : "text-red-700 dark:text-red-300"
                }`}>
                  Browser Action Result
                </h4>
                {say.browserResult && (
                  <div className="mt-2 space-y-2">
                    <div className="text-sm">
                      <div><span className="font-medium">Action:</span> {say.browserResult.action}</div>
                      <div>
                        <span className="font-medium">Status:</span> 
                        {say.browserResult.success ? " Success" : " Failed"}
                      </div>
                    </div>
                    {say.browserResult.error && (
                      <div className="text-sm text-red-600 dark:text-red-400">
                        Error: {say.browserResult.error}
                      </div>
                    )}
                    {say.browserResult.screenshot && (
                      <div className="mt-3">
                        <img 
                          src={say.browserResult.screenshot} 
                          alt="Browser screenshot"
                          className="max-w-full h-auto rounded border"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "mcp_server_response":
        return (
          <div className={`border rounded-lg p-3 ${
            say.mcpResult?.success 
              ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-700"
              : "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-700"
          }`}>
            <div className="flex items-start space-x-2">
              <span className="text-lg">
                {say.mcpResult?.success ? "🔧✅" : "🔧❌"}
              </span>
              <div className="flex-1">
                <h4 className={`font-semibold ${
                  say.mcpResult?.success 
                    ? "text-indigo-700 dark:text-indigo-300"
                    : "text-red-700 dark:text-red-300"
                }`}>
                  MCP Server Response
                </h4>
                {say.mcpResult && (
                  <div className="mt-2 space-y-2">
                    <div className="text-sm">
                      <div><span className="font-medium">Server:</span> {say.mcpResult.serverName}</div>
                      <div><span className="font-medium">Tool:</span> {say.mcpResult.toolName}</div>
                      <div>
                        <span className="font-medium">Status:</span> 
                        {say.mcpResult.success ? " Success" : " Failed"}
                      </div>
                    </div>
                    {say.mcpResult.error && (
                      <div className="text-sm text-red-600 dark:text-red-400">
                        Error: {say.mcpResult.error}
                      </div>
                    )}
                    {say.mcpResult.result && (
                      <div className="mt-2">
                        <div className="text-sm font-medium">Result:</div>
                        <pre className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded mt-1 overflow-x-auto">
                          {typeof say.mcpResult.result === 'string' 
                            ? say.mcpResult.result 
                            : JSON.stringify(say.mcpResult.result, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "codebase_search_result":
        return (
          <div className="bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <span className="text-purple-500 text-lg">🔍</span>
              <div className="flex-1">
                <h4 className="font-semibold text-purple-700 dark:text-purple-300">Codebase Search Results</h4>
                {say.searchResult && (
                  <div className="mt-2 space-y-3">
                    <div className="text-sm">
                      <div><span className="font-medium">Query:</span> "{say.searchResult.query}"</div>
                      <div>
                        <span className="font-medium">Results:</span> {say.searchResult.totalCount}
                        {say.searchResult.searchTime && (
                          <span className="text-gray-500"> ({say.searchResult.searchTime}ms)</span>
                        )}
                      </div>
                    </div>
                    {say.searchResult.results && say.searchResult.results.length > 0 && (
                      <div className="space-y-2">
                        {say.searchResult.results.slice(0, 5).map((result, index) => (
                          <div key={index} className="bg-white dark:bg-gray-800 p-2 rounded border">
                            <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                              📄 {result.file}:{result.line}
                            </div>
                            <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                              {result.match}
                            </div>
                            {result.context && (
                              <div className="text-xs text-gray-500 mt-1 font-mono">
                                {result.context}
                              </div>
                            )}
                          </div>
                        ))}
                        {say.searchResult.results.length > 5 && (
                          <div className="text-sm text-gray-500 italic">
                            ... and {say.searchResult.results.length - 5} more results
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "checkpoint_saved":
        return (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <span className="text-green-500 text-lg">💾</span>
              <div>
                <h4 className="font-semibold text-green-700 dark:text-green-300">Checkpoint Saved</h4>
                {say.checkpoint && (
                  <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                    ID: {say.checkpoint.id}
                    {say.checkpoint.description && (
                      <div>Description: {say.checkpoint.description}</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "condense_context":
        return (
          <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <span className="text-blue-500 text-lg">🗜️</span>
              <div>
                <h4 className="font-semibold text-blue-700 dark:text-blue-300">Context Condensation</h4>
                {say.contextCondense && (
                  <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    {say.contextCondense.originalTokens} → {say.contextCondense.condensedTokens} tokens
                    ({(say.contextCondense.compressionRatio * 100).toFixed(1)}% compression)
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case "condense_context_error":
        return (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <span className="text-red-500 text-lg">❌</span>
              <div>
                <h4 className="font-semibold text-red-700 dark:text-red-300">Context Condensation Failed</h4>
                <div className="text-sm text-red-600 dark:text-red-400 mt-1">
                  {say.text || "Failed to condense context"}
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-gray-700 dark:text-gray-300">
            <div className="whitespace-pre-wrap break-words">
              {say.text || "No message content"}
            </div>
          </div>
        );
    }
  };

  return renderSayContent();
};