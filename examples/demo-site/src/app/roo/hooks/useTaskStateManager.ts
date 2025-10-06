import { useCallback, useState } from "react";

import type { TaskState, TaskStatus, TaskUpdate } from "../types/task";

export const useTaskStateManager = () => {
  const [tasks, setTasks] = useState<Map<string, TaskState>>(new Map());

  const updateTask = useCallback((update: TaskUpdate) => {
    setTasks((prevTasks) => {
      const newTasks = new Map(prevTasks);
      const existingTask = newTasks.get(update.id);

      if (existingTask) {
        newTasks.set(update.id, {
          ...existingTask,
          ...update,
          lastUpdated: Date.now(),
        });
      } else {
        newTasks.set(update.id, {
          id: update.id,
          status: update.status || "created",
          lastUpdated: Date.now(),
          ...(update.parentId && { parentId: update.parentId }),
          ...(update.tokenUsage && { tokenUsage: update.tokenUsage }),
          ...(update.toolUsage && { toolUsage: update.toolUsage }),
          ...(update.error && { error: update.error }),
        });
      }

      return newTasks;
    });
  }, []);

  const getTask = useCallback(
    (taskId: string) => {
      return tasks.get(taskId);
    },
    [tasks],
  );

  const getParentTask = useCallback(
    (taskId: string) => {
      const task = tasks.get(taskId);
      if (task?.parentId) {
        return tasks.get(task.parentId);
      }
      return undefined;
    },
    [tasks],
  );

  const removeTask = useCallback((taskId: string) => {
    setTasks((prevTasks) => {
      const newTasks = new Map(prevTasks);
      newTasks.delete(taskId);
      return newTasks;
    });
  }, []);

  const updateTaskStatus = useCallback(
    (
      taskId: string,
      status: TaskStatus,
      error?: { message: string; toolName?: string; recoverable?: boolean },
    ) => {
      updateTask({
        id: taskId,
        status,
        ...(error && { error }),
      });
    },
    [updateTask],
  );

  return {
    tasks,
    updateTask,
    getTask,
    getParentTask,
    removeTask,
    updateTaskStatus,
  };
};
