import React, { useState } from "react";

interface ToolUsageStats {
  [toolName: string]: {
    attempts: number;
    failures: number;
    lastUsed: number;
    totalTime?: number;
  };
}

interface ToolUsageTrackerProps {
  toolUsage: ToolUsageStats;
  className?: string;
  compact?: boolean;
}

export const ToolUsageTracker: React.FC<ToolUsageTrackerProps> = ({
  toolUsage,
  className = "",
  compact = false,
}) => {
  const [sortBy, setSortBy] = useState<"usage" | "success" | "recent">("usage");
  const [showDetails, setShowDetails] = useState(!compact);

  const getToolIcon = (toolName: string) => {
    switch (toolName) {
      case "read_file":
        return "📖";
      case "write_to_file":
        return "✏️";
      case "apply_diff":
        return "🔄";
      case "list_files":
        return "📁";
      case "search_files":
        return "🔍";
      case "list_code_definition_names":
        return "🏗️";
      case "search_and_replace":
        return "🔀";
      case "insert_content":
        return "➕";
      case "execute_command":
        return "⚡";
      case "browser_action":
        return "🌐";
      case "use_mcp_tool":
      case "access_mcp_resource":
        return "🔧";
      case "ask_followup_question":
        return "❓";
      case "attempt_completion":
        return "✅";
      case "switch_mode":
        return "🔧";
      case "new_task":
        return "✨";
      case "fetch_instructions":
        return "📋";
      case "codebase_search":
        return "🕵️";
      default:
        return "🛠️";
    }
  };

  const getToolCategory = (toolName: string) => {
    if (["read_file", "write_to_file", "apply_diff", "list_files", "search_files", "insert_content", "search_and_replace"].includes(toolName)) {
      return "File System";
    }
    if (["list_code_definition_names", "codebase_search"].includes(toolName)) {
      return "Code Analysis";
    }
    if (["execute_command"].includes(toolName)) {
      return "System";
    }
    if (["browser_action"].includes(toolName)) {
      return "Browser";
    }
    if (["use_mcp_tool", "access_mcp_resource"].includes(toolName)) {
      return "MCP";
    }
    if (["ask_followup_question", "attempt_completion", "switch_mode", "new_task", "fetch_instructions"].includes(toolName)) {
      return "Task Management";
    }
    return "Other";
  };

  const calculateSuccessRate = (stats: { attempts: number; failures: number }) => {
    if (stats.attempts === 0) return 0;
    return ((stats.attempts - stats.failures) / stats.attempts) * 100;
  };

  const sortedTools = Object.entries(toolUsage).sort(([, a], [, b]) => {
    switch (sortBy) {
      case "usage":
        return b.attempts - a.attempts;
      case "success":
        return calculateSuccessRate(b) - calculateSuccessRate(a);
      case "recent":
        return b.lastUsed - a.lastUsed;
      default:
        return 0;
    }
  });

  const totalAttempts = Object.values(toolUsage).reduce((sum, stats) => sum + stats.attempts, 0);
  const totalFailures = Object.values(toolUsage).reduce((sum, stats) => sum + stats.failures, 0);
  const overallSuccessRate = totalAttempts > 0 ? ((totalAttempts - totalFailures) / totalAttempts) * 100 : 0;

  const groupedTools = sortedTools.reduce((groups, [toolName, stats]) => {
    const category = getToolCategory(toolName);
    if (!groups[category]) groups[category] = [];
    groups[category].push([toolName, stats]);
    return groups;
  }, {} as Record<string, Array<[string, ToolUsageStats[string]]>>);

  if (compact) {
    return (
      <div className={`rounded-lg p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Tools Used:</span>
            <span className="text-sm opacity-75">{Object.keys(toolUsage).length}</span>
          </div>
          <div className="flex items-center space-x-4 text-sm opacity-75">
            <span>Success: {overallSuccessRate.toFixed(1)}%</span>
            <span>Total: {totalAttempts}</span>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-blue-600 md:text-blue-400 hover:text-blue-800 md:hover:text-blue-300"
            >
              {showDetails ? "Hide" : "Show"}
            </button>
          </div>
        </div>
        
        {showDetails && (
          <div className="mt-2 grid grid-cols-4 sm:grid-cols-6 gap-1">
            {sortedTools.slice(0, 12).map(([toolName, stats]) => (
              <div
                key={toolName}
                className="flex flex-col items-center p-1 bg-white md:bg-white/20 rounded text-xs"
                title={`${toolName}: ${stats.attempts} uses, ${calculateSuccessRate(stats).toFixed(1)}% success`}
              >
                <span className="text-lg">{getToolIcon(toolName)}</span>
                <span className="text-xs opacity-75 text-center truncate w-full">
                  {toolName.split('_').pop()}
                </span>
                <span className="text-xs font-mono">{stats.attempts}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`border rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Tool Usage Statistics</h3>
        <div className="flex items-center space-x-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "usage" | "success" | "recent")}
            className="text-sm border border-gray-300 md:border-white/20 bg-white md:bg-white/10 text-gray-900 md:text-white rounded px-2 py-1"
          >
            <option value="usage">Sort by Usage</option>
            <option value="success">Sort by Success Rate</option>
            <option value="recent">Sort by Recent</option>
          </select>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6 text-center">
        <div className="bg-blue-50 md:bg-blue-500/20 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-600 md:text-blue-400">{Object.keys(toolUsage).length}</div>
          <div className="text-sm text-blue-800 md:text-blue-300">Tools Used</div>
        </div>
        <div className="bg-green-50 md:bg-green-500/20 rounded-lg p-3">
          <div className="text-2xl font-bold text-green-600 md:text-green-400">{overallSuccessRate.toFixed(1)}%</div>
          <div className="text-sm text-green-800 md:text-green-300">Success Rate</div>
        </div>
        <div className="bg-purple-50 md:bg-purple-500/20 rounded-lg p-3">
          <div className="text-2xl font-bold text-purple-600 md:text-purple-400">{totalAttempts}</div>
          <div className="text-sm text-purple-800 md:text-purple-300">Total Operations</div>
        </div>
      </div>

      {/* Tool Categories */}
      <div className="space-y-4">
        {Object.entries(groupedTools).map(([category, tools]) => (
          <div key={category}>
            <h4 className="font-medium mb-2">{category} Tools</h4>
            <div className="grid gap-2">
              {tools.map(([toolName, stats]) => {
                const successRate = calculateSuccessRate(stats);
                const usagePercent = totalAttempts > 0 ? (stats.attempts / totalAttempts) * 100 : 0;
                
                return (
                  <div key={toolName} className="flex items-center space-x-3 p-2 bg-gray-50 md:bg-white/5 rounded">
                    <span className="text-xl">{getToolIcon(toolName)}</span>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium truncate">{toolName}</span>
                        <div className="flex items-center space-x-3 text-sm opacity-75">
                          <span>{stats.attempts} uses</span>
                          <span className={`${successRate >= 90 ? 'text-green-600 md:text-green-400' : successRate >= 70 ? 'text-yellow-600 md:text-yellow-400' : 'text-red-600 md:text-red-400'}`}>
                            {successRate.toFixed(1)}%
                          </span>
                          {usagePercent > 0 && (
                            <span>{usagePercent.toFixed(1)}% of total</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Usage bar */}
                      <div className="mt-1 flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 md:bg-white/20 rounded-full h-2">
                          <div 
                            className="bg-blue-500 md:bg-blue-400 h-2 rounded-full"
                            style={{ width: `${Math.min(usagePercent * 5, 100)}%` }}
                          />
                        </div>
                        {stats.failures > 0 && (
                          <span className="text-xs text-red-600 md:text-red-400">
                            {stats.failures} failed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {Object.keys(toolUsage).length === 0 && (
        <div className="text-center py-8 opacity-75">
          <span className="text-4xl">🛠️</span>
          <p className="mt-2">No tool usage data available yet</p>
          <p className="text-sm">Tool usage will appear here as you interact with the AI</p>
        </div>
      )}
    </div>
  );
};

export default ToolUsageTracker;