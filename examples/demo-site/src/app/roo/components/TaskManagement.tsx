import React, { useState, useCallback } from "react";

interface Task {
  id: string;
  status: "created" | "running" | "paused" | "completed" | "aborted";
  mode: string;
  startTime: number;
  endTime?: number;
  progress?: number;
  lastMessage?: string;
}

interface TaskManagementProps {
  currentTask?: Task;
  onCancelTask: () => void;
  onSwitchMode: (mode: string) => void;
  onPauseTask: () => void;
  onResumeTask: () => void;
  availableModes: Array<{ slug: string; name: string }>;
  className?: string;
}

export const TaskManagement: React.FC<TaskManagementProps> = ({
  currentTask,
  onCancelTask,
  onSwitchMode,
  onPauseTask,
  onResumeTask,
  availableModes,
  className = "",
}) => {
  const [showModeSwitch, setShowModeSwitch] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "running":
        return "text-green-600 bg-green-100";
      case "paused":
        return "text-yellow-600 bg-yellow-100";
      case "completed":
        return "text-blue-600 bg-blue-100";
      case "aborted":
        return "text-red-600 bg-red-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "running":
        return "▶️";
      case "paused":
        return "⏸️";
      case "completed":
        return "✅";
      case "aborted":
        return "❌";
      default:
        return "⏳";
    }
  };

  const formatDuration = (startTime: number, endTime?: number) => {
    const duration = (endTime || Date.now()) - startTime;
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleModeSwitch = useCallback((mode: string) => {
    onSwitchMode(mode);
    setShowModeSwitch(false);
  }, [onSwitchMode]);

  const handleCancel = useCallback(() => {
    if (confirmCancel) {
      onCancelTask();
      setConfirmCancel(false);
    } else {
      setConfirmCancel(true);
      setTimeout(() => setConfirmCancel(false), 3000);
    }
  }, [confirmCancel, onCancelTask]);

  if (!currentTask) {
    return (
      <div className={`p-4 text-center text-gray-500 ${className}`}>
        <p className="text-sm">No active task</p>
      </div>
    );
  }

  return (
    <div className={`border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getStatusIcon(currentTask.status)}</span>
          <div>
            <h4 className="font-medium text-gray-900">Current Task</h4>
            <p className="text-xs text-gray-500">
              {formatDuration(currentTask.startTime, currentTask.endTime)} • Mode: {currentTask.mode}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(currentTask.status)}`}>
            {currentTask.status}
          </span>
        </div>
      </div>

      {currentTask.lastMessage && (
        <div className="mb-3 p-2 bg-gray-50 rounded text-sm text-gray-700">
          <p className="truncate">{currentTask.lastMessage}</p>
        </div>
      )}

      {currentTask.progress !== undefined && (
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Progress</span>
            <span>{Math.round(currentTask.progress * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${currentTask.progress * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {currentTask.status === "running" && (
          <>
            <button
              onClick={onPauseTask}
              className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 hover:bg-yellow-200 rounded transition-colors"
            >
              Pause
            </button>
            <button
              onClick={() => setShowModeSwitch(!showModeSwitch)}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 rounded transition-colors"
            >
              Switch Mode
            </button>
          </>
        )}

        {currentTask.status === "paused" && (
          <button
            onClick={onResumeTask}
            className="px-3 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded transition-colors"
          >
            Resume
          </button>
        )}

        {["running", "paused", "created"].includes(currentTask.status) && (
          <button
            onClick={handleCancel}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              confirmCancel 
                ? "bg-red-600 text-white" 
                : "bg-red-100 text-red-700 hover:bg-red-200"
            }`}
          >
            {confirmCancel ? "Confirm Cancel" : "Cancel"}
          </button>
        )}
      </div>

      {showModeSwitch && (
        <div className="mt-3 p-3 border border-gray-200 rounded-md bg-gray-50">
          <p className="text-sm font-medium text-gray-700 mb-2">Switch to mode:</p>
          <div className="flex flex-wrap gap-2">
            {availableModes.map((mode) => (
              <button
                key={mode.slug}
                onClick={() => handleModeSwitch(mode.slug)}
                disabled={mode.slug === currentTask.mode}
                className="px-2 py-1 text-xs bg-white border border-gray-200 hover:border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {mode.name}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowModeSwitch(false)}
            className="mt-2 text-xs text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

interface SubtaskDisplayProps {
  parentTaskId: string;
  subtasks: Array<{
    id: string;
    parentId: string;
    mode: string;
    status: string;
    description: string;
    startTime: number;
  }>;
  onSelectSubtask: (taskId: string) => void;
  className?: string;
}

export const SubtaskDisplay: React.FC<SubtaskDisplayProps> = ({
  parentTaskId,
  subtasks,
  onSelectSubtask,
  className = "",
}) => {
  if (subtasks.length === 0) return null;

  return (
    <div className={`border border-gray-200 rounded-lg p-4 ${className}`}>
      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
        <span className="mr-2">🌳</span>
        Subtasks ({subtasks.length})
      </h4>

      <div className="space-y-2">
        {subtasks.map((subtask) => (
          <div
            key={subtask.id}
            className="flex items-center justify-between p-2 border border-gray-100 rounded hover:border-gray-200 cursor-pointer transition-colors"
            onClick={() => onSelectSubtask(subtask.id)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                  {subtask.mode}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  subtask.status === "completed" 
                    ? "bg-green-100 text-green-700"
                    : subtask.status === "running"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-gray-100 text-gray-700"
                }`}>
                  {subtask.status}
                </span>
              </div>
              <p className="text-sm text-gray-900 truncate">
                {subtask.description}
              </p>
              <p className="text-xs text-gray-500">
                Started {new Date(subtask.startTime).toLocaleTimeString()}
              </p>
            </div>
            
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        ))}
      </div>
    </div>
  );
};

interface TaskProgressIndicatorProps {
  status: "created" | "running" | "paused" | "completed" | "aborted";
  progress?: number;
  message?: string;
  animated?: boolean;
  size?: "sm" | "md" | "lg";
}

export const TaskProgressIndicator: React.FC<TaskProgressIndicatorProps> = ({
  status,
  progress,
  message,
  animated = true,
  size = "md",
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8",
  };

  const getStatusComponent = () => {
    switch (status) {
      case "running":
        return (
          <div className={`${sizeClasses[size]} ${animated ? 'animate-spin' : ''}`}>
            <svg className="w-full h-full text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        );
      case "completed":
        return (
          <div className={`${sizeClasses[size]} text-green-600`}>
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        );
      case "aborted":
        return (
          <div className={`${sizeClasses[size]} text-red-600`}>
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        );
      case "paused":
        return (
          <div className={`${sizeClasses[size]} text-yellow-600`}>
            <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          </div>
        );
      default:
        return (
          <div className={`${sizeClasses[size]} text-gray-400`}>
            <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/>
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="flex items-center space-x-2">
      {getStatusComponent()}
      {message && (
        <span className="text-sm text-gray-600">{message}</span>
      )}
      {progress !== undefined && (
        <div className="flex-1 max-w-xs">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-blue-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
};