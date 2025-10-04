import React, { useState, useEffect, useCallback } from "react";
import { API_ENDPOINTS } from "../utils/constants";
import { TokenUsageDisplay } from "./TokenUsageDisplay";

interface HistoryItem {
  id: string;
  number?: number;
  ts: number;
  task: string;
  tokensIn: number;
  tokensOut: number;
  cacheWrites?: number;
  cacheReads?: number;
  totalCost: number;
  size?: number;
  workspace?: string;
}

interface TaskHistoryProps {
  onTaskResume: (taskId: string) => void;
  onTaskView: (taskId: string) => void;
  extensionId?: string;
  className?: string;
}

export const TaskHistory: React.FC<TaskHistoryProps> = ({
  onTaskResume,
  onTaskView,
  extensionId,
  className = "",
}) => {
  const [tasks, setTasks] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "cost" | "tokens">("date");
  const [selectedTask, setSelectedTask] = useState<HistoryItem | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setIsLoading(true);
      const url = extensionId 
        ? `${API_ENDPOINTS.INFO.replace('/info', '/roo/tasks')}?extensionId=${extensionId}`
        : API_ENDPOINTS.INFO.replace('/info', '/roo/tasks');
        
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch task history: ${response.statusText}`);
      }

      const data = await response.json();
      setTasks(data.data || []);
    } catch (err) {
      console.error("Error fetching task history:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch task history");
    } finally {
      setIsLoading(false);
    }
  }, [extensionId]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const filteredAndSortedTasks = React.useMemo(() => {
    let filtered = tasks;
    
    if (searchTerm) {
      filtered = tasks.filter(task => 
        task.task.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.id.includes(searchTerm)
      );
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return b.ts - a.ts;
        case "cost":
          return b.totalCost - a.totalCost;
        case "tokens":
          return (b.tokensIn + b.tokensOut) - (a.tokensIn + a.tokensOut);
        default:
          return b.ts - a.ts;
      }
    });
  }, [tasks, searchTerm, sortBy]);

  const totalStats = React.useMemo(() => {
    return tasks.reduce((acc, task) => ({
      totalTasks: acc.totalTasks + 1,
      totalTokens: acc.totalTokens + task.tokensIn + task.tokensOut,
      totalCost: acc.totalCost + task.totalCost,
    }), { totalTasks: 0, totalTokens: 0, totalCost: 0 });
  }, [tasks]);

  if (isLoading) {
    return (
      <div className={`p-4 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Task History</h3>
          <div className="flex items-center space-x-4 text-sm opacity-75 mt-1">
            <span>{totalStats.totalTasks} tasks</span>
            <span>{totalStats.totalTokens.toLocaleString()} tokens</span>
            <span className="font-medium text-green-600 md:text-green-400">
              ${totalStats.totalCost.toFixed(4)}
            </span>
          </div>
        </div>
        
        <button
          onClick={fetchHistory}
          className="px-3 py-2 text-sm bg-gray-100 md:bg-white/20 hover:bg-gray-200 md:hover:bg-white/30 text-gray-900 md:text-white rounded-md transition-colors"
        >
          Refresh
        </button>
      </div>

      {/* Search and Sort */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 md:border-white/20 bg-white md:bg-white/10 text-gray-900 md:text-white placeholder-gray-500 md:placeholder-white/60 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as "date" | "cost" | "tokens")}
          className="px-3 py-2 border border-gray-300 md:border-white/20 bg-white md:bg-white/10 text-gray-900 md:text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="date">Sort by Date</option>
          <option value="cost">Sort by Cost</option>
          <option value="tokens">Sort by Tokens</option>
        </select>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Task List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredAndSortedTasks.map((task) => (
          <TaskHistoryItem
            key={task.id}
            task={task}
            onResume={() => onTaskResume(task.id)}
            onView={() => onTaskView(task.id)}
            onSelect={() => setSelectedTask(task)}
            className={className}
          />
        ))}

        {filteredAndSortedTasks.length === 0 && !isLoading && (
          <div className="text-center py-8 opacity-75">
            {searchTerm ? (
              <p>No tasks found matching "{searchTerm}"</p>
            ) : (
              <p>No task history available</p>
            )}
          </div>
        )}
      </div>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onResume={() => {
            onTaskResume(selectedTask.id);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
};

interface TaskHistoryItemProps {
  task: HistoryItem;
  onResume: () => void;
  onView: () => void;
  onSelect: () => void;
  className?: string;
}

const TaskHistoryItem: React.FC<TaskHistoryItemProps> = ({
  task,
  onResume,
  onView,
  onSelect,
  className = "",
}) => {
  const totalTokens = task.tokensIn + task.tokensOut;
  const date = new Date(task.ts);

  return (
    <div className="border border-gray-200 md:border-white/20 bg-white/50 md:bg-white/10 rounded-lg p-4 hover:border-gray-300 md:hover:border-white/30 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0 cursor-pointer" onClick={onSelect}>
          <div className="flex items-center space-x-2 mb-2">
            <h4 className="font-medium truncate">
              {task.task.length > 60 ? `${task.task.substring(0, 60)}...` : task.task}
            </h4>
            {task.number && (
              <span className="text-xs opacity-75">#{task.number}</span>
            )}
          </div>
          
          <div className="flex items-center space-x-4 text-sm opacity-75 mb-2">
            <span>{date.toLocaleDateString()} {date.toLocaleTimeString()}</span>
            <span>{totalTokens.toLocaleString()} tokens</span>
            <span className="text-green-600 md:text-green-400 font-medium">
              ${task.totalCost.toFixed(4)}
            </span>
          </div>
          
          {task.workspace && (
            <p className="text-xs opacity-60 truncate">
              📁 {task.workspace}
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={onView}
            className="px-2 py-1 text-xs text-blue-600 md:text-blue-400 hover:text-blue-800 md:hover:text-blue-300"
            title="View details"
          >
            View
          </button>
          <button
            onClick={onResume}
            className="px-3 py-1 text-xs bg-blue-100 md:bg-blue-500 text-blue-700 md:text-white hover:bg-blue-200 md:hover:bg-blue-600 rounded"
            title="Resume task"
          >
            Resume
          </button>
        </div>
      </div>
    </div>
  );
};

interface TaskDetailModalProps {
  task: HistoryItem;
  onClose: () => void;
  onResume: () => void;
}

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({
  task,
  onClose,
  onResume,
}) => {
  const tokenUsage = {
    totalTokensIn: task.tokensIn,
    totalTokensOut: task.tokensOut,
    totalCacheWrites: task.cacheWrites,
    totalCacheReads: task.cacheReads,
    totalCost: task.totalCost,
    contextTokens: 0,
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Task Details</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task Description
              </label>
              <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-md">
                {task.task}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Task ID
              </label>
              <p className="text-sm font-mono text-gray-600 bg-gray-50 p-2 rounded">
                {task.id}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Created
              </label>
              <p className="text-sm text-gray-600">
                {new Date(task.ts).toLocaleString()}
              </p>
            </div>

            {task.workspace && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Workspace
                </label>
                <p className="text-sm text-gray-600 font-mono bg-gray-50 p-2 rounded">
                  {task.workspace}
                </p>
              </div>
            )}

            <TokenUsageDisplay usage={tokenUsage} showCost={true} />

            <div className="flex space-x-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={onResume}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Resume Task
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};