import React from "react";

import { useTaskState } from "../contexts/TaskStateContext";
import type { TaskStatus } from "../types/task";

interface TaskStatusDisplayProps {
  taskId: string;
}

const getStatusColor = (status: TaskStatus) => {
  switch (status) {
    case "created":
      return "bg-blue-100 text-blue-700";
    case "running":
      return "bg-blue-100 text-blue-700";
    case "completed":
      return "bg-green-100 text-green-700";
    case "aborted":
      return "bg-red-100 text-red-700";
    case "error":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getStatusIcon = (status: TaskStatus) => {
  switch (status) {
    case "created":
      return "🆕";
    case "running":
      return "⚙️";
    case "completed":
      return "✅";
    case "aborted":
      return "❌";
    case "error":
      return "⚠️";
    default:
      return "❓";
  }
};

export const TaskStatusDisplay: React.FC<TaskStatusDisplayProps> = ({
  taskId,
}) => {
  const { getTask } = useTaskState();
  const task = getTask(taskId);

  if (!task) return null;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-700">Task ID:</span>
          <span className="font-mono text-sm">{taskId}</span>
        </div>
        <div
          className={`px-2 py-1 rounded text-sm ${getStatusColor(task.status)}`}
        >
          <span className="mr-1">{getStatusIcon(task.status)}</span>
          {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
        </div>
      </div>

      {task.parentId && (
        <div className="mt-2 text-sm">
          <span className="font-medium text-gray-700">Parent Task:</span>
          <span className="font-mono ml-2">{task.parentId}</span>
        </div>
      )}

      {task.error && (
        <div className="mt-2 text-sm text-red-600">
          <div className="font-medium">Error:</div>
          <div className="bg-red-50 p-2 rounded">
            {task.error.message}
            {task.error.toolName && (
              <div className="mt-1">
                <span className="font-medium">Tool:</span> {task.error.toolName}
              </div>
            )}
          </div>
        </div>
      )}

      {task.tokenUsage && (
        <div className="mt-2 text-sm grid grid-cols-2 gap-2">
          <div>
            <span className="font-medium text-gray-700">Input Tokens:</span>
            <span className="ml-2 font-mono">
              {task.tokenUsage.inputTokens}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Output Tokens:</span>
            <span className="ml-2 font-mono">
              {task.tokenUsage.outputTokens}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
