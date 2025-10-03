import React, { useRef, useEffect } from "react";
import {
  autoResizeTextarea,
  resetTextarea,
  focusTextarea,
} from "../utils/chatHelpers";
import { UI_CONFIG } from "../utils/constants";
import { ModeSelector } from "./ModeSelector";
import { ExtensionSelector } from "./ExtensionSelector";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
  placeholder?: string;
  selectedMode: string;
  onModeChange: (mode: string) => void;
  selectedExtension: string;
  onExtensionChange: (extension: string) => void;
  hasMessages: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = "Ask me anything...",
  selectedMode,
  onModeChange,
  selectedExtension,
  onExtensionChange,
  hasMessages,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      focusTextarea(textareaRef.current);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    autoResizeTextarea(e.target, UI_CONFIG.TEXTAREA_MAX_HEIGHT);
  };

  const handleSend = () => {
    onSend();
    if (textareaRef.current) {
      resetTextarea(textareaRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = value.trim() && !disabled;

  return (
    <div className="bg-white/95 backdrop-blur-md px-4 sm:pl-20 sm:pr-15 py-4 sm:py-5 border-t border-black/10">
      <div className="max-w-4xl mx-auto">
        {/* Mobile-first responsive layout */}
        <div className="space-y-3">
          
          {/* Mode and Extension Selectors - Stack on mobile, inline on desktop */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center">
            <ModeSelector
              selectedMode={selectedMode}
              onModeChange={onModeChange}
              disabled={disabled || hasMessages}
            />
            <ExtensionSelector
              selectedExtension={selectedExtension}
              onExtensionChange={onExtensionChange}
              disabled={disabled || hasMessages}
            />
          </div>

          {/* Input Area - Full width with improved mobile styling */}
          <div className="flex gap-2 sm:gap-3 items-end">
            <textarea
              ref={textareaRef}
              value={value}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder={disabled ? "Waiting for response..." : placeholder}
              rows={2} // Start with 2 rows for better mobile visibility
              className="flex-1 min-h-[60px] sm:min-h-[40px] max-h-48 sm:max-h-30 px-3 sm:px-4 py-3 sm:py-2 border-2 border-gray-200 rounded-2xl sm:rounded-3xl text-black text-base sm:text-sm resize-none outline-none transition-colors focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed scrollbar-hide font-medium leading-relaxed"
            />
            <button
              onClick={handleSend}
              disabled={!canSend}
              className="w-12 h-12 sm:size-9 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl sm:text-lg transition-all hover:bg-blue-600 hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
            >
              ➤
            </button>
          </div>
          
          {/* Helper text for mobile */}
          <div className="block sm:hidden text-xs text-gray-500 px-1">
            Press Shift+Enter for new line, Enter to send
          </div>
        </div>
      </div>
    </div>
  );
};
