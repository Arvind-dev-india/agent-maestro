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
  } = useChat();

  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"profiles" | "history">("profiles");

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
    <div className="h-screen flex bg-gradient-to-br from-indigo-500 to-purple-600">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        <ChatHeader 
          onNewChat={handleNewChat} 
          hasMessages={messages.length > 0}
          onToggleSidebar={() => setShowSidebar(!showSidebar)}
          showSidebarButton={true}
        />

        {/* Connection Status - only show when there are no messages to keep UI clean */}
        {messages.length === 0 && (
          <div className="px-4 pt-2">
            <ConnectionStatus />
          </div>
        )}

        {/* Token Usage Display */}
        {messages.length > 0 && (
          <div className="px-4 py-2">
            <div className="flex items-center justify-between">
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
          </div>
        )}

        {/* Error Display */}
        {toolFailures.length > 0 && (
          <div className="px-4 pb-2">
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

      {/* Sidebar */}
      <div className={`${showSidebar ? 'w-96' : 'w-0'} transition-all duration-300 overflow-hidden bg-white/10 backdrop-blur-sm border-l border-white/20`}>
        {showSidebar && (
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="flex items-center border-b border-white/20 p-4">
              <div className="flex space-x-2">
                <button
                  onClick={() => setSidebarTab("profiles")}
                  className={`px-3 py-2 text-sm rounded transition-colors ${
                    sidebarTab === "profiles"
                      ? "bg-white/20 text-white"
                      : "text-white/60 hover:text-white/80"
                  }`}
                >
                  Profiles
                </button>
                <button
                  onClick={() => setSidebarTab("history")}
                  className={`px-3 py-2 text-sm rounded transition-colors ${
                    sidebarTab === "history"
                      ? "bg-white/20 text-white"
                      : "text-white/60 hover:text-white/80"
                  }`}
                >
                  History
                </button>
              </div>
              <button
                onClick={() => setShowSidebar(false)}
                className="ml-auto text-white/60 hover:text-white/80"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto">
              {sidebarTab === "profiles" && (
                <div className="p-4">
                  <ProfileManager
                    onProfileChange={handleProfileChange}
                    extensionId={selectedExtension}
                    className="text-white"
                  />
                </div>
              )}
              {sidebarTab === "history" && (
                <div className="p-4">
                  <TaskHistory
                    onTaskResume={handleTaskResume}
                    onTaskView={handleTaskView}
                    extensionId={selectedExtension}
                    className="text-white"
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
