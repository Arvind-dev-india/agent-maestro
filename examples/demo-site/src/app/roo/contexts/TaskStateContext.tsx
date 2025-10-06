"use client";

import React, { createContext, useContext } from "react";

import { useTaskStateManager } from "../hooks/useTaskStateManager";
import type { TaskState, TaskStatus, TaskUpdate } from "../types/task";

interface TaskStateContextValue {
  tasks: Map<string, TaskState>;
  updateTask: (update: TaskUpdate) => void;
  getTask: (taskId: string) => TaskState | undefined;
  getParentTask: (taskId: string) => TaskState | undefined;
  removeTask: (taskId: string) => void;
  updateTaskStatus: (
    taskId: string,
    status: TaskStatus,
    error?: { message: string; toolName?: string; recoverable?: boolean },
  ) => void;
}

const TaskStateContext = createContext<TaskStateContextValue | undefined>(
  undefined,
);

export const useTaskState = () => {
  const context = useContext(TaskStateContext);
  if (!context) {
    throw new Error("useTaskState must be used within a TaskStateProvider");
  }
  return context;
};

export const TaskStateProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const taskStateManager = useTaskStateManager();

  return (
    <TaskStateContext.Provider value={taskStateManager}>
      {children}
    </TaskStateContext.Provider>
  );
};
