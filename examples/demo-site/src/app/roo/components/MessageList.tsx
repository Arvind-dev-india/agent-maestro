import React, { useRef, useEffect } from "react";
import { Message } from "./Message";
import { EnhancedMessageItem } from "./EnhancedMessageItem";
import { scrollToBottom } from "../utils/chatHelpers";
import type { Message as MessageType } from "../types/chat";

interface MessageListProps {
  messages: MessageType[];
  onSuggestionClick: (suggestion: string) => void;
  showTyping?: boolean;
  onApprove?: (messageId: string) => void;
  onReject?: (messageId: string) => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  onSuggestionClick,
  showTyping = false,
  onApprove,
  onReject,
}) => {
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom(chatMessagesRef.current);
  }, [messages, showTyping]);

  if (messages.length === 0) {
    return (
      <div
        ref={chatMessagesRef}
        className="flex-1 overflow-y-auto px-1 py-2 sm:px-2 sm:py-4 md:px-4 md:px-5 flex flex-col gap-2 sm:gap-4 scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-white/10"
      >
        <div className="flex-1 flex flex-col items-center justify-center text-center text-white/80 px-4 sm:px-6 md:px-10">
          <h2 className="text-3xl font-light mb-3">Welcome to RooCode Chat</h2>
          <p className="text-lg opacity-80 max-w-md leading-relaxed">
            Start a conversation by typing your message below. I'm here to help
            you with coding tasks and questions!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={chatMessagesRef}
      className="flex-1 overflow-y-auto px-1 py-2 sm:px-2 sm:py-4 md:px-4 md:px-5 flex flex-col gap-2 sm:gap-4 scrollbar-thin scrollbar-thumb-white/30 scrollbar-track-white/10"
    >
      {messages.map((message) => {
        // Always use enhanced renderer for better consistency
        return (
          <EnhancedMessageItem
            key={message.id}
            message={message}
            onSuggestionClick={onSuggestionClick}
            onApprove={() => onApprove?.(message.id)}
            onReject={() => onReject?.(message.id)}
          />
        );
      })}
    </div>
  );
};
