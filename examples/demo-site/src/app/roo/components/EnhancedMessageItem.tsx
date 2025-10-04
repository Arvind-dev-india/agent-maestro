import React from "react";
import { AskMessageRenderer } from "./AskMessageRenderer";
import { SayMessageRenderer } from "./SayMessageRenderer";
import { MarkdownContent } from "./MarkdownContent";
import { MessageSuggestions } from "./MessageSuggestions";
import type { Message } from "../types/chat";

interface EnhancedMessageItemProps {
  message: Message;
  onSuggestionClick?: (suggestion: string) => void;
  onApprove?: () => void;
  onReject?: () => void;
}

export const EnhancedMessageItem: React.FC<EnhancedMessageItemProps> = ({
  message,
  onSuggestionClick,
  onApprove,
  onReject,
}) => {
  const isUser = message.isUser;
  const clineMessage = message.clineMessage;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2 sm:mb-4`}>
      <div className={`w-full max-w-[95%] sm:max-w-[90%] md:max-w-[85%] lg:max-w-[80%] xl:max-w-[75%] ${isUser ? "order-2" : "order-1"}`}>
        {/* User avatar */}
        {isUser && (
          <div className="flex justify-end mb-1 sm:mb-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-semibold">
              U
            </div>
          </div>
        )}

        {/* Agent avatar */}
        {!isUser && (
          <div className="flex justify-start mb-1 sm:mb-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-semibold">
              R
            </div>
          </div>
        )}

        {/* Message content */}
        <div
          className={`rounded-lg p-2 sm:p-3 text-sm sm:text-base ${
            isUser
              ? "bg-blue-500 text-white ml-1 sm:ml-2 md:ml-4"
              : "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 mr-1 sm:mr-2 md:mr-4"
          }`}
        >
          {/* Enhanced rendering for ClineMessage */}
          {clineMessage ? (
            <div className="space-y-3">
              {/* Render say message */}
              {clineMessage.say && (
                <SayMessageRenderer 
                  say={clineMessage.say} 
                  text={clineMessage.text || message.content} 
                />
              )}

              {/* Render ask message */}
              {clineMessage.ask && (
                <AskMessageRenderer
                  ask={clineMessage.ask}
                  onApprove={onApprove}
                  onReject={onReject}
                  onSuggestionClick={onSuggestionClick}
                />
              )}

              {/* Show main message content when no ask/say, or as fallback content */}
              {(!clineMessage.ask && !clineMessage.say) && (message.content || clineMessage.text) && (
                <MarkdownContent
                  content={message.content || clineMessage.text || ""}
                  className="leading-relaxed"
                />
              )}

              {/* Show suggestions for enhanced messages */}
              {message.suggestions && message.suggestions.length > 0 && onSuggestionClick && (
                <MessageSuggestions
                  suggestions={message.suggestions}
                  onSuggestionClick={onSuggestionClick}
                />
              )}

              {/* Render reasoning if available */}
              {clineMessage.reasoning && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200">
                    🧠 Reasoning
                  </summary>
                  <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded text-sm">
                    {clineMessage.reasoning}
                  </div>
                </details>
              )}

              {/* Render images if available */}
              {clineMessage.images && clineMessage.images.length > 0 && (
                <div className="mt-3 space-y-2">
                  {clineMessage.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Message image ${index + 1}`}
                      className="max-w-full h-auto rounded border"
                    />
                  ))}
                </div>
              )}

              {/* Render progress status if available */}
              {clineMessage.progressStatus && (
                <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded">
                  <div className="text-sm">
                    <div className="flex items-center space-x-2">
                      <span>🔧</span>
                      <span className="font-medium">{clineMessage.progressStatus.toolName}</span>
                      <span className="text-blue-600 dark:text-blue-400">
                        {clineMessage.progressStatus.status}
                      </span>
                    </div>
                    {clineMessage.progressStatus.progress !== undefined && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${clineMessage.progressStatus.progress}%` }}
                          />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {clineMessage.progressStatus.progress}%
                        </div>
                      </div>
                    )}
                    {clineMessage.progressStatus.message && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {clineMessage.progressStatus.message}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Render context condensation if available */}
              {clineMessage.contextCondense && (
                <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded">
                  <div className="text-sm">
                    <div className="flex items-center space-x-2">
                      <span>🗜️</span>
                      <span className="font-medium">Context Condensation</span>
                      <span className="text-yellow-600 dark:text-yellow-400">
                        {clineMessage.contextCondense.status}
                      </span>
                    </div>
                    {clineMessage.contextCondense.originalTokens && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {clineMessage.contextCondense.originalTokens} → {clineMessage.contextCondense.condensedTokens} tokens
                      </div>
                    )}
                    {clineMessage.contextCondense.message && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {clineMessage.contextCondense.message}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Fallback to original message rendering */
            <div className="space-y-3">
              {/* Message content */}
              <MarkdownContent
                content={message.content}
                className="leading-relaxed"
              />

              {/* Completion result indicator */}
              {message.isCompletionResult && (
                <div className="text-sm text-green-300 bg-green-600/20 px-2 py-1 rounded">
                  ✅ Task completed
                </div>
              )}

              {/* Reasoning */}
              {message.reasoning && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm opacity-70 hover:opacity-100">
                    🧠 Reasoning
                  </summary>
                  <div className="mt-2 p-3 bg-black/20 rounded text-sm opacity-80">
                    {message.reasoning}
                  </div>
                </details>
              )}

              {/* Images */}
              {message.images && message.images.length > 0 && (
                <div className="mt-3 space-y-2">
                  {message.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`Message image ${index + 1}`}
                      className="max-w-full h-auto rounded border"
                    />
                  ))}
                </div>
              )}

              {/* Suggestions */}
              {onSuggestionClick && (
                <MessageSuggestions
                  suggestions={message.suggestions || []}
                  onSuggestionClick={onSuggestionClick}
                />
              )}
            </div>
          )}

          {/* Timestamp */}
          <div className={`text-xs mt-2 ${isUser ? "text-blue-100" : "text-gray-500"} text-right sm:text-left`}>
            {message.timestamp}
          </div>
        </div>

        {/* Tool failures */}
        {message.toolFailures && message.toolFailures.length > 0 && (
          <div className="mt-2 mr-2 sm:mr-4">
            {message.toolFailures.map((failure, index) => (
              <div key={index} className="bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded p-2 text-sm">
                <div className="font-semibold text-red-800 dark:text-red-200 text-xs sm:text-sm">
                  Tool Failed: {failure.toolName}
                </div>
                <div className="text-red-600 dark:text-red-400 mt-1 text-xs sm:text-sm">
                  {failure.error}
                </div>
                <div className="text-xs text-red-500 dark:text-red-400 mt-1">
                  {new Date(failure.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};