"use client";

import React, { useState } from "react";
import { useChat } from "./hooks/useChat";
import { ChatHeader } from "./components/ChatHeader";
import { MessageList } from "./components/MessageList";
import { ChatInput } from "./components/ChatInput";
import { StatusIndicator } from "./components/StatusIndicator";
import { ProfileManager } from "./components/ProfileManager";
import { TaskHistory } from "./components/TaskHistory";
import { ErrorList } from "./components/ErrorDisplay";
import { LiveTokenCounter } from "./components/TokenUsageDisplay";
import ToolUsageTracker from "./components/ToolUsageTracker";
import ConnectionStatus from "../../components/ConnectionStatus";

export default function RooPage() {
  const {
    // State
    messages,
    inputValue,
    isWaitingForResponse,
    showTyping,
    statusMessage,
    showStatus,
    selectedMode,
    selectedExtension,
    currentImages,
    sessionTokenUsage,
    currentTokenUsage,
    toolFailures,
    toolUsageStats,

    // Actions
    handleNewChat,
    handleSuggestionClick,
    sendMessage,
    retryFailedTool,
    setInputValue,
    setSelectedMode,
    setSelectedExtension,
    setCurrentImages,
    dismissToolFailure,
    resetSessionStats,
    handleApprove,
    handleReject,
  } = useChat();

  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"profiles" | "history" | "tools">("profiles");

  const handleTaskResume = (taskId: string) => {
    // This would typically involve calling an API endpoint to resume the task
    console.log("Resuming task:", taskId);
    // For now, we'll just add a message
    sendMessage(`Resume task ${taskId}`);
    setShowSidebar(false);
  };

  const handleTaskView = (taskId: string) => {
    console.log("Viewing task:", taskId);
    // This could open a detailed view of the task
  };

  const handleProfileChange = (profileId: string) => {
    console.log("Changing to profile:", profileId);
    // This could trigger a profile switch API call
  };

  return (
    <div className="h-screen flex bg-gradient-to-br from-indigo-500 to-purple-600 relative overflow-hidden">
      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ${showSidebar ? 'md:mr-96' : ''} min-w-0`}>
        <ChatHeader 
          onNewChat={handleNewChat} 
          hasMessages={messages.length > 0}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
          showSidebarButton={true}
        />

        {/* Connection Status - only show when there are no messages to keep UI clean */}
        {messages.length === 0 && (
          <div className="px-2 pt-2 sm:px-4">
            <ConnectionStatus />
          </div>
        )}

        {/* Token Usage & Tool Usage Display */}
        {messages.length > 0 && (
          <div className="px-2 py-2 space-y-2 sm:px-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <LiveTokenCounter
                currentUsage={currentTokenUsage}
                sessionTotal={sessionTokenUsage}
              />
              <button
                onClick={resetSessionStats}
                className="text-xs text-white/60 hover:text-white/80 underline"
              >
                Reset Session
              </button>
            </div>
            
            {/* Compact Tool Usage Display */}
            {Object.keys(toolUsageStats).length > 0 && (
              <ToolUsageTracker
                toolUsage={toolUsageStats}
                compact={true}
                className="bg-white/10 backdrop-blur-sm border-white/20 text-white"
              />
            )}
          </div>
        )}

        {/* Error Display */}
        {toolFailures.length > 0 && (
          <div className="px-2 pb-2 sm:px-4">
            <ErrorList
              errors={toolFailures}
              onRetryError={retryFailedTool}
              onDismissError={dismissToolFailure}
              maxErrors={2}
            />
          </div>
        )}

        <MessageList
          messages={messages}
          onSuggestionClick={handleSuggestionClick}
          onApprove={handleApprove}
          onReject={handleReject}
          showTyping={showTyping}
        />

        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={sendMessage}
          disabled={isWaitingForResponse}
          selectedMode={selectedMode}
          onModeChange={setSelectedMode}
          selectedExtension={selectedExtension}
          onExtensionChange={setSelectedExtension}
          hasMessages={messages.length > 0}
          images={currentImages}
          onImagesChange={setCurrentImages}
        />

        <StatusIndicator show={showStatus} message={statusMessage} />
      </div>

      {/* Responsive Sidebar */}
      <div className={`
        ${showSidebar ? 'translate-x-0' : 'translate-x-full'} 
        fixed md:absolute top-0 right-0 h-full w-full sm:w-96 md:w-96
        transition-transform duration-300 ease-in-out
        bg-white/95 md:bg-white/10 backdrop-blur-sm 
        border-l border-white/20 z-50
        flex flex-col
      `}>
        {/* Mobile Backdrop */}
        {showSidebar && (
          <div 
            className="md:hidden fixed inset-0 bg-black/50 -z-10"
            onClick={() => setShowSidebar(false)}
          />
        )}
        
        {/* Sidebar Content */}
        <div className="h-full flex flex-col">
          {/* Sidebar Header - Mobile Responsive */}
          <div className="flex items-center border-b border-gray-200 md:border-white/20 p-4 bg-white md:bg-transparent">
            <div className="flex space-x-1 sm:space-x-2 flex-1 min-w-0">
              <button
                onClick={() => setSidebarTab("profiles")}
                className={`px-2 sm:px-3 py-2 text-xs sm:text-sm rounded transition-colors flex-1 min-w-0 truncate ${
                  sidebarTab === "profiles"
                    ? "bg-blue-500 md:bg-white/20 text-white"
                    : "text-gray-700 md:text-white/60 hover:text-gray-900 md:hover:text-white/80 bg-gray-100 md:bg-transparent"
                }`}
              >
                📁 Profiles
              </button>
              <button
                onClick={() => setSidebarTab("history")}
                className={`px-2 sm:px-3 py-2 text-xs sm:text-sm rounded transition-colors flex-1 min-w-0 truncate ${
                  sidebarTab === "history"
                    ? "bg-blue-500 md:bg-white/20 text-white"
                    : "text-gray-700 md:text-white/60 hover:text-gray-900 md:hover:text-white/80 bg-gray-100 md:bg-transparent"
                }`}
              >
                📚 History
              </button>
              <button
                onClick={() => setSidebarTab("tools")}
                className={`px-2 sm:px-3 py-2 text-xs sm:text-sm rounded transition-colors flex-1 min-w-0 truncate ${
                  sidebarTab === "tools"
                    ? "bg-blue-500 md:bg-white/20 text-white"
                    : "text-gray-700 md:text-white/60 hover:text-gray-900 md:hover:text-white/80 bg-gray-100 md:bg-transparent"
                }`}
              >
                🛠️ Tools
              </button>
            </div>
            <button
              onClick={() => setShowSidebar(false)}
              className="ml-2 p-2 text-gray-600 md:text-white/60 hover:text-gray-800 md:hover:text-white/80 rounded-lg hover:bg-gray-100 md:hover:bg-white/10 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Sidebar Content - Scrollable */}
          <div className="flex-1 overflow-y-auto bg-white md:bg-transparent">
            {sidebarTab === "profiles" && (
              <div className="p-4">
                <ProfileManager
                  onProfileChange={handleProfileChange}
                  extensionId={selectedExtension}
                  className="text-gray-900 md:text-white"
                />
              </div>
            )}
            {sidebarTab === "history" && (
              <div className="p-4">
                <TaskHistory
                  onTaskResume={handleTaskResume}
                  onTaskView={handleTaskView}
                  extensionId={selectedExtension}
                  className="text-gray-900 md:text-white"
                />
              </div>
            )}
            {sidebarTab === "tools" && (
              <div className="p-4">
                <ToolUsageTracker
                  toolUsage={toolUsageStats}
                  compact={false}
                  className="bg-gray-50 md:bg-white/10 backdrop-blur-sm border-gray-200 md:border-white/20 text-gray-900 md:text-white"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
