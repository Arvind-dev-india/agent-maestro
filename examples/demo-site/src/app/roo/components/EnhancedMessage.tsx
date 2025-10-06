import React, { useState } from "react";

import type { Message as MessageType } from "../types/chat";
import { MarkdownContent } from "./MarkdownContent";
import { MessageSuggestions } from "./MessageSuggestions";
import ToolOperationDisplay from "./ToolOperationDisplay";

interface EnhancedMessageProps {
  message: MessageType;
  onSuggestionClick: (suggestion: string) => void;
}

export const EnhancedMessage: React.FC<EnhancedMessageProps> = ({
  message,
  onSuggestionClick,
}) => {
  const [showRawContent, setShowRawContent] = useState(false);
  const [imageError, setImageError] = useState<Record<number, boolean>>({});

  // Try to parse JSON content for structured display
  const parseMessageContent = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      return { isParsed: true, data: parsed, raw: content };
    } catch {
      return { isParsed: false, data: null, raw: content };
    }
  };

  const { isParsed, data, raw } = parseMessageContent(message.content);

  const renderStructuredContent = (data: any) => {
    // Handle tool operations - This is the main improvement!
    if (data.tool) {
      return <ToolOperationDisplay toolData={data} className="mb-2" />;
    }

    // Handle command execution
    if (data.executionId && data.status) {
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-700">
              ⚡ Command Execution
            </span>
            <span
              className={`px-2 py-1 text-xs rounded ${
                data.status === "completed"
                  ? "bg-green-100 text-green-700"
                  : data.status === "error"
                    ? "bg-red-100 text-red-700"
                    : "bg-blue-100 text-blue-700"
              }`}
            >
              {data.status}
            </span>
          </div>

          {data.command && (
            <div className="font-mono text-sm bg-black text-green-400 p-2 rounded mb-2">
              $ {data.command}
            </div>
          )}

          {data.output && (
            <div className="bg-black text-gray-300 font-mono text-sm p-2 rounded max-h-40 overflow-y-auto">
              <pre className="whitespace-pre-wrap">{data.output}</pre>
            </div>
          )}

          {data.exitCode !== undefined && (
            <div className="text-sm text-gray-600 mt-2">
              Exit code: {data.exitCode}
            </div>
          )}
        </div>
      );
    }

    // Handle browser actions
    if (data.action) {
      return (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-2">
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-medium text-purple-700">
              🌐 Browser Action
            </span>
            <span className="text-sm text-purple-600">{data.action}</span>
          </div>

          {data.coordinate && (
            <div className="text-sm text-gray-700">
              <strong>Coordinate:</strong> {data.coordinate}
            </div>
          )}

          {data.text && (
            <div className="text-sm text-gray-700">
              <strong>Text:</strong> {data.text}
            </div>
          )}

          {data.screenshot && (
            <div className="mt-2">
              <img
                src={data.screenshot}
                alt="Browser screenshot"
                className="max-w-full h-auto rounded border"
                onError={() => setImageError((prev) => ({ ...prev, 0: true }))}
              />
            </div>
          )}

          {data.logs && (
            <details className="mt-2">
              <summary className="text-sm text-gray-600 cursor-pointer">
                Browser Logs
              </summary>
              <pre className="text-xs mt-1 p-2 bg-white border rounded overflow-x-auto">
                {data.logs}
              </pre>
            </details>
          )}
        </div>
      );
    }

    // Handle MCP server requests
    if (data.serverName && data.type) {
      return (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-2">
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-medium text-yellow-700">🔧 MCP Server</span>
            <span className="text-sm text-yellow-600">{data.serverName}</span>
          </div>

          <div className="text-sm space-y-1">
            <div>
              <strong>Type:</strong> {data.type}
            </div>
            {data.toolName && (
              <div>
                <strong>Tool:</strong> {data.toolName}
              </div>
            )}
            {data.uri && (
              <div>
                <strong>URI:</strong> {data.uri}
              </div>
            )}
          </div>

          {data.arguments && (
            <details className="mt-2">
              <summary className="text-sm text-gray-600 cursor-pointer">
                Arguments
              </summary>
              <pre className="text-xs mt-1 p-2 bg-white border rounded overflow-x-auto">
                {typeof data.arguments === "string"
                  ? data.arguments
                  : JSON.stringify(data.arguments, null, 2)}
              </pre>
            </details>
          )}
        </div>
      );
    }

    // Handle API requests
    if (data.request !== undefined || data.tokensIn !== undefined) {
      return (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-2">
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-medium text-indigo-700">📡 API Request</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-2 text-xs sm:text-sm">
            {data.tokensIn !== undefined && (
              <div>
                <span className="text-gray-600">Tokens In:</span>
                <span className="font-mono ml-1">
                  {data.tokensIn.toLocaleString()}
                </span>
              </div>
            )}
            {data.tokensOut !== undefined && (
              <div>
                <span className="text-gray-600">Tokens Out:</span>
                <span className="font-mono ml-1">
                  {data.tokensOut.toLocaleString()}
                </span>
              </div>
            )}
            {data.cacheWrites !== undefined && (
              <div>
                <span className="text-gray-600">Cache Writes:</span>
                <span className="font-mono ml-1">{data.cacheWrites}</span>
              </div>
            )}
            {data.cacheReads !== undefined && (
              <div>
                <span className="text-gray-600">Cache Reads:</span>
                <span className="font-mono ml-1">{data.cacheReads}</span>
              </div>
            )}
            {data.cost !== undefined && (
              <div className="col-span-2">
                <span className="text-gray-600">Cost:</span>
                <span className="font-mono ml-1 text-green-600">
                  ${data.cost.toFixed(6)}
                </span>
              </div>
            )}
          </div>

          {data.request && (
            <div className="mt-2 text-sm">
              <strong>Request:</strong> {data.request}
            </div>
          )}
        </div>
      );
    }

    // Handle followup questions
    if (data.question && data.suggest) {
      return (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-2">
          <div className="font-medium text-green-700 mb-2">
            ❓ Follow-up Question
          </div>
          <p className="text-gray-800 mb-3">{data.question}</p>
          <div className="space-y-1">
            {data.suggest.map((suggestion: any, index: number) => (
              <button
                key={index}
                onClick={() => onSuggestionClick(suggestion.answer)}
                className="block w-full text-left p-2 text-sm bg-white border border-green-200 rounded hover:border-green-300 hover:bg-green-50 transition-colors"
              >
                {suggestion.answer}
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Default structured display
    return (
      <details className="bg-gray-50 border border-gray-200 rounded-lg p-3">
        <summary className="font-medium text-gray-700 cursor-pointer">
          📋 Structured Data
        </summary>
        <pre className="text-xs mt-2 overflow-x-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    );
  };

  const renderImages = () => {
    if (!message.images || message.images.length === 0) return null;

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
        {message.images.map((image, index) => (
          <div key={index} className="relative">
            {!imageError[index] ? (
              <img
                src={image}
                alt={`Attachment ${index + 1}`}
                className="max-w-full h-auto rounded border"
                onError={() =>
                  setImageError((prev) => ({ ...prev, [index]: true }))
                }
              />
            ) : (
              <div className="bg-gray-100 border border-gray-200 rounded p-4 text-center text-gray-500">
                <span className="text-2xl">🖼️</span>
                <p className="text-sm mt-1">Failed to load image</p>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div
      className={`flex max-w-4xl w-full sm:w-auto ${
        message.isUser ? "self-end flex-row-reverse" : "self-start"
      }`}
    >
      <div
        className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl relative max-w-full break-words ${
          message.isUser
            ? "bg-blue-500 text-white rounded-br-md"
            : message.isCompletionResult
              ? "bg-green-100 text-green-800 rounded-bl-md border-l-4 border-green-500"
              : "bg-gray-100 text-gray-800 rounded-bl-md"
        }`}
      >
        {/* Enhanced content rendering */}
        {isParsed && data && !showRawContent ? (
          <div>
            {renderStructuredContent(data)}
            {!message.isUser && (
              <button
                onClick={() => setShowRawContent(true)}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Show raw content
              </button>
            )}
          </div>
        ) : (
          <div>
            <MarkdownContent content={raw} className="leading-relaxed" />
            {isParsed && data && (
              <button
                onClick={() => setShowRawContent(false)}
                className="text-xs text-gray-500 hover:text-gray-700 underline mt-2"
              >
                Show structured view
              </button>
            )}
          </div>
        )}

        {/* Image attachments */}
        {renderImages()}

        {/* Suggestions */}
        <MessageSuggestions
          suggestions={message.suggestions || []}
          onSuggestionClick={onSuggestionClick}
        />

        {/* Message metadata */}
        {message.reasoning && (
          <details className="mt-2 text-xs">
            <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
              🧠 AI Reasoning
            </summary>
            <div className="mt-1 p-2 bg-white bg-opacity-50 rounded text-gray-700">
              <MarkdownContent content={message.reasoning} />
            </div>
          </details>
        )}
      </div>

      <div className="text-xs text-white/60 mx-3 self-end whitespace-nowrap">
        {message.timestamp}
      </div>
    </div>
  );
};
