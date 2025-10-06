import React from "react";

interface TaskDisplayProps {
  taskId: string;
  parentTaskId?: string;
  subtasks?: Array<{ id: string; status: string; description: string }>;
}

export const TaskDisplay: React.FC<TaskDisplayProps> = ({
  taskId,
  parentTaskId,
  subtasks,
}) => {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-2">
      <div className="text-sm text-gray-600">
        <div>
          <span className="font-medium">Task ID:</span> {taskId}
        </div>
        {parentTaskId && (
          <div>
            <span className="font-medium">Parent Task:</span> {parentTaskId}
          </div>
        )}
      </div>

      {subtasks && subtasks.length > 0 && (
        <div className="mt-2">
          <div className="font-medium text-sm text-gray-600 mb-1">
            Subtasks:
          </div>
          <div className="space-y-1">
            {subtasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center justify-between text-sm bg-white p-2 rounded border"
              >
                <div className="flex-1">{task.description}</div>
                <div
                  className={`px-2 py-0.5 rounded text-xs ${
                    task.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : task.status === "failed"
                        ? "bg-red-100 text-red-700"
                        : task.status === "running"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {task.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
