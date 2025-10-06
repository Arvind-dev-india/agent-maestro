import { useCallback } from "react";

import { useTaskState } from "../contexts/TaskStateContext";

interface UseTaskRestartProps {
  setCurrentTaskId: (taskId: string | null) => void;
  setIsWaitingForResponse: (waiting: boolean) => void;
}

export const useTaskRestart = ({
  setCurrentTaskId,
  setIsWaitingForResponse,
}: UseTaskRestartProps) => {
  const { getTask } = useTaskState();

  const restartTask = useCallback(
    async (taskId: string) => {
      const task = getTask(taskId);
      if (!task) {
        console.error(`[Task Restart] Task ${taskId} not found`);
        return;
      }

      // Resume task with existing context
      try {
        setIsWaitingForResponse(true);

        // Call your API to resume the task here
        const response = await fetch(`/api/v1/roo/task/${taskId}/resume`, {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error(`Failed to restart task: ${response.statusText}`);
        }

        const data = await response.json();
        setCurrentTaskId(data.taskId);
      } catch (error) {
        console.error("[Task Restart] Failed to restart task:", error);
        setIsWaitingForResponse(false);
      }
    },
    [getTask, setCurrentTaskId, setIsWaitingForResponse],
  );

  return { restartTask };
};
