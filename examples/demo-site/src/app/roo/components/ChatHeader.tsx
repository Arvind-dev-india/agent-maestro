import React from "react";
import Link from "next/link";

interface ChatHeaderProps {
  onNewChat: () => void;
  hasMessages: boolean;
  onToggleSidebar?: () => void;
  showSidebarButton?: boolean;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onNewChat,
  hasMessages,
  onToggleSidebar,
  showSidebarButton = false,
}) => {
  return (
    <div className="bg-white/95 backdrop-blur-md px-5 py-4 flex justify-between items-center shadow-lg">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-blue-500 hover:text-blue-600">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <span className="text-xl">🤖</span>
        <h1 className="text-xl font-normal text-gray-800">
          RooCode Chat{" "}
          <span className="text-sm text-gray-500">
            powered by{" "}
            <a
              href="https://github.com/Joouis/agent-maestro"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xl font-bold italic text-blue-500 hover:text-blue-500 hover:underline"
            >
              Agent Maestro
            </a>
          </span>
        </h1>
      </div>
      <div className="flex items-center space-x-2">
        {showSidebarButton && onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            title="Toggle sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <button
          onClick={onNewChat}
          disabled={!hasMessages}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
            !hasMessages
              ? "opacity-50 pointer-events-none bg-blue-500 text-white"
              : "bg-blue-500 text-white hover:bg-blue-600 hover:-translate-y-0.5"
          }`}
        >
          ✨ New Chat
        </button>
      </div>
    </div>
  );
};
