import React, { useRef, useEffect, useState } from "react";
import {
  autoResizeTextarea,
  resetTextarea,
  focusTextarea,
} from "../utils/chatHelpers";
import { UI_CONFIG } from "../utils/constants";
import { ModeSelector } from "./ModeSelector";
import { ExtensionSelector } from "./ExtensionSelector";
import { ImageUpload } from "./ImageUpload";

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
  images: string[];
  onImagesChange: (images: string[]) => void;
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
  images,
  onImagesChange,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showImageUpload, setShowImageUpload] = useState(false);

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
    setShowImageUpload(false);
    if (textareaRef.current) {
      resetTextarea(textareaRef.current);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && (value.trim() || images.length > 0)) {
        handleSend();
      }
    }
  };

  const canSend = !disabled && (value.trim() || images.length > 0);

  return (
    <div className="bg-white/95 backdrop-blur-md px-4 sm:pl-20 sm:pr-15 py-4 sm:py-5 border-t border-black/10">
      <div className="max-w-4xl mx-auto">
        {/* Mobile-first responsive layout */}
        <div className="space-y-3">
          
          {/* Mode and Extension Selectors - Stack on mobile, inline on desktop */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <ModeSelector
              selectedMode={selectedMode}
              onModeChange={onModeChange}
              disabled={disabled}
            />
            <ExtensionSelector
              selectedExtension={selectedExtension}
              onExtensionChange={onExtensionChange}
              disabled={disabled}
            />
          </div>

          {/* Image Upload */}
          {showImageUpload && (
            <div className="py-2">
              <ImageUpload
                onImagesSelected={onImagesChange}
                maxImages={5}
                disabled={disabled}
              />
            </div>
          )}

          {/* Text input area with attachments */}
          <div className="relative flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={disabled ? "Please wait..." : placeholder}
                disabled={disabled}
                rows={1}
                className="w-full px-4 py-3 pr-16 sm:pr-20 bg-white border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed text-gray-900 placeholder-gray-500"
                style={{
                  minHeight: "52px",
                  maxHeight: `${UI_CONFIG.TEXTAREA_MAX_HEIGHT}px`,
                }}
              />
              
              {/* Input controls */}
              <div className="absolute right-2 bottom-2 flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setShowImageUpload(!showImageUpload)}
                  disabled={disabled}
                  className={`p-2 rounded-lg transition-colors ${
                    showImageUpload || images.length > 0
                      ? "text-blue-600 bg-blue-100"
                      : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title="Add images"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </button>
                
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!canSend}
                  className="p-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Image preview */}
          {images.length > 0 && (
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>📎 {images.length} image{images.length !== 1 ? 's' : ''} attached</span>
              </div>
              <button
                onClick={() => onImagesChange([])}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};