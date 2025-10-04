import React from "react";
import { MarkdownContent } from "./MarkdownContent";
import { MessageSuggestions } from "./MessageSuggestions";
import type { Message as MessageType } from "../types/chat";

interface MessageProps {
  message: MessageType;
  onSuggestionClick: (suggestion: string) => void;
}

export const Message: React.FC<MessageProps> = ({
  message,
  onSuggestionClick,
}) => {
  return (
    <div
      className={`flex w-full max-w-full ${
        message.isUser ? "self-end flex-row-reverse" : "self-start"
      }`}
    >
      <div
        className={`p-2 sm:p-3 md:p-4 rounded-2xl relative max-w-[85%] sm:max-w-[80%] md:max-w-full break-words ${
          message.isUser
            ? "bg-blue-500 text-white rounded-br-md"
            : message.isCompletionResult
              ? "bg-green-100 text-green-800 rounded-bl-md border-l-4 border-green-500"
              : "bg-gray-100 text-gray-800 rounded-bl-md"
        }`}
      >
        <MarkdownContent
          content={message.content}
          className="leading-relaxed"
        />

        <MessageSuggestions
          suggestions={message.suggestions || []}
          onSuggestionClick={onSuggestionClick}
        />
      </div>
      <div className="text-xs text-white/60 mx-2 sm:mx-3 self-end whitespace-nowrap">
        {message.timestamp}
      </div>
    </div>
  );
};
