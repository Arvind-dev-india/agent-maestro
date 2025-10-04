import React, { useState } from "react";

interface ClineSayTool {
  tool: string;
  path?: string;
  content?: string;
  diff?: string;
  reason?: string;
  lineNumber?: number;
  regex?: string;
  filePattern?: string;
  query?: string;
  isOutsideWorkspace?: boolean;
  isProtected?: boolean;
  mode?: string;
  additionalFileCount?: number;
  question?: string;
  batchFiles?: Array<{
    path: string;
    lineSnippet: string;
    isOutsideWorkspace: boolean;
    key: string;
    content: string;
  }>;
  batchDiffs?: Array<{
    path: string;
    changeCount: number;
    key: string;
    content: string;
    diffs: Array<{
      content: string;
      startLine?: number;
    }>;
  }>;
  search?: string;
  replace?: string;
  useRegex?: boolean;
  ignoreCase?: boolean;
  startLine?: number;
  endLine?: number;
}

interface ToolOperationDisplayProps {
  toolData: ClineSayTool;
  className?: string;
}

export const ToolOperationDisplay: React.FC<ToolOperationDisplayProps> = ({
  toolData,
  className = "",
}) => {
  const [showFullContent, setShowFullContent] = useState(false);
  const [showBatchDetails, setShowBatchDetails] = useState(false);

  const getToolIcon = (tool: string) => {
    switch (tool) {
      case "readFile":
        return "📖";
      case "editedExistingFile":
      case "newFileCreated":
        return "✏️";
      case "appliedDiff":
        return "🔄";
      case "listFilesTopLevel":
      case "listFilesRecursive":
        return "📁";
      case "searchFiles":
        return "🔍";
      case "listCodeDefinitionNames":
        return "🏗️";
      case "searchAndReplace":
        return "🔀";
      case "insertContent":
        return "➕";
      case "fetchInstructions":
        return "📋";
      case "switchMode":
        return "🔧";
      case "newTask":
        return "✨";
      case "codebaseSearch":
        return "🕵️";
      default:
        return "🛠️";
    }
  };

  const getToolDescription = (tool: string) => {
    switch (tool) {
      case "readFile":
        return "Reading file contents";
      case "editedExistingFile":
        return "Modified existing file";
      case "newFileCreated":
        return "Created new file";
      case "appliedDiff":
        return "Applied code changes";
      case "listFilesTopLevel":
        return "Listed directory contents";
      case "listFilesRecursive":
        return "Scanned directory tree";
      case "searchFiles":
        return "Searched files";
      case "listCodeDefinitionNames":
        return "Analyzed code structure";
      case "searchAndReplace":
        return "Find and replace operation";
      case "insertContent":
        return "Inserted content";
      case "fetchInstructions":
        return "Fetched instructions";
      case "switchMode":
        return "Switched mode";
      case "newTask":
        return "Created new task";
      case "codebaseSearch":
        return "Semantic code search";
      default:
        return "Tool operation";
    }
  };

  const getToolColor = (tool: string) => {
    switch (tool) {
      case "readFile":
      case "listFilesTopLevel":
      case "listFilesRecursive":
      case "searchFiles":
      case "listCodeDefinitionNames":
      case "codebaseSearch":
        return "bg-blue-50 border-blue-200 text-blue-800";
      case "editedExistingFile":
      case "newFileCreated":
      case "appliedDiff":
      case "searchAndReplace":
      case "insertContent":
        return "bg-green-50 border-green-200 text-green-800";
      case "switchMode":
      case "newTask":
      case "fetchInstructions":
        return "bg-purple-50 border-purple-200 text-purple-800";
      default:
        return "bg-gray-50 border-gray-200 text-gray-800";
    }
  };

  const truncateContent = (content: string, maxLength = 300) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  const renderFileOperation = () => {
    if (!toolData.path) return null;

    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-700">File:</span>
          <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
            {toolData.path}
          </code>
          {toolData.isOutsideWorkspace && (
            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
              Outside Workspace
            </span>
          )}
          {toolData.isProtected && (
            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
              Protected
            </span>
          )}
        </div>

        {toolData.reason && (
          <div className="text-sm text-gray-600">
            <strong>Reason:</strong> {toolData.reason}
          </div>
        )}

        {toolData.lineNumber && (
          <div className="text-sm text-gray-600">
            <strong>Line:</strong> {toolData.lineNumber}
          </div>
        )}
      </div>
    );
  };

  const renderSearchOperation = () => {
    if (!toolData.regex && !toolData.query && !toolData.search) return null;

    return (
      <div className="space-y-2">
        {toolData.regex && (
          <div className="text-sm">
            <strong>Pattern:</strong>{" "}
            <code className="bg-gray-100 px-2 py-1 rounded font-mono">
              {toolData.regex}
            </code>
          </div>
        )}
        
        {toolData.query && (
          <div className="text-sm">
            <strong>Query:</strong> {toolData.query}
          </div>
        )}

        {toolData.search && (
          <div className="text-sm">
            <strong>Search:</strong>{" "}
            <code className="bg-gray-100 px-2 py-1 rounded font-mono">
              {toolData.search}
            </code>
          </div>
        )}

        {toolData.replace && (
          <div className="text-sm">
            <strong>Replace:</strong>{" "}
            <code className="bg-gray-100 px-2 py-1 rounded font-mono">
              {toolData.replace}
            </code>
          </div>
        )}

        {toolData.filePattern && (
          <div className="text-sm">
            <strong>File Pattern:</strong>{" "}
            <code className="bg-gray-100 px-2 py-1 rounded font-mono">
              {toolData.filePattern}
            </code>
          </div>
        )}

        {(toolData.useRegex || toolData.ignoreCase) && (
          <div className="text-xs text-gray-500 space-x-2">
            {toolData.useRegex && <span>• Regex mode</span>}
            {toolData.ignoreCase && <span>• Case insensitive</span>}
          </div>
        )}

        {(toolData.startLine || toolData.endLine) && (
          <div className="text-sm text-gray-600">
            <strong>Range:</strong> Lines {toolData.startLine || 1} - {toolData.endLine || "end"}
          </div>
        )}
      </div>
    );
  };

  const renderBatchOperations = () => {
    if (!toolData.batchFiles && !toolData.batchDiffs) return null;

    return (
      <div className="space-y-2">
        {toolData.batchFiles && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-700">
                Batch Files ({toolData.batchFiles.length})
              </span>
              <button
                onClick={() => setShowBatchDetails(!showBatchDetails)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {showBatchDetails ? "Hide" : "Show"} Details
              </button>
            </div>
            
            {showBatchDetails && (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {toolData.batchFiles.map((file, index) => (
                  <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                    <div className="font-mono">{file.path}</div>
                    <div className="text-gray-600">{file.lineSnippet}</div>
                    {file.isOutsideWorkspace && (
                      <span className="bg-yellow-100 text-yellow-700 px-1 rounded">
                        Outside workspace
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {toolData.batchDiffs && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium text-gray-700">
                Batch Changes ({toolData.batchDiffs.length} files)
              </span>
              <button
                onClick={() => setShowBatchDetails(!showBatchDetails)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                {showBatchDetails ? "Hide" : "Show"} Details
              </button>
            </div>
            
            {showBatchDetails && (
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {toolData.batchDiffs.map((diff, index) => (
                  <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                    <div className="font-mono">{diff.path}</div>
                    <div className="text-gray-600">
                      {diff.changeCount} change{diff.changeCount !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (!toolData.content && !toolData.diff) return null;

    const content = toolData.diff || toolData.content || "";
    const displayContent = showFullContent ? content : truncateContent(content);
    const needsTruncation = content.length > 300;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-medium text-gray-700">
            {toolData.diff ? "Changes:" : "Content:"}
          </span>
          {needsTruncation && (
            <button
              onClick={() => setShowFullContent(!showFullContent)}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              {showFullContent ? "Show Less" : "Show More"}
            </button>
          )}
        </div>
        
        <div className={`${toolData.diff ? "bg-gray-800 text-green-400" : "bg-white border"} rounded p-3 font-mono text-sm max-h-60 overflow-y-auto`}>
          <pre className="whitespace-pre-wrap">{displayContent}</pre>
        </div>
      </div>
    );
  };

  const renderModeOperation = () => {
    if (!toolData.mode && toolData.tool !== "switchMode") return null;

    return (
      <div className="text-sm">
        <strong>Mode:</strong>{" "}
        <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">
          {toolData.mode}
        </span>
      </div>
    );
  };

  return (
    <div className={`border rounded-lg p-4 ${getToolColor(toolData.tool)} ${className}`}>
      {/* Tool Header */}
      <div className="flex items-center space-x-2 mb-3">
        <span className="text-lg">{getToolIcon(toolData.tool)}</span>
        <div>
          <h4 className="font-medium">{getToolDescription(toolData.tool)}</h4>
          <p className="text-xs opacity-75">Tool: {toolData.tool}</p>
        </div>
        {toolData.additionalFileCount && toolData.additionalFileCount > 0 && (
          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded">
            +{toolData.additionalFileCount} more files
          </span>
        )}
      </div>

      {/* Tool-specific content */}
      <div className="space-y-3">
        {renderFileOperation()}
        {renderSearchOperation()}
        {renderModeOperation()}
        {renderBatchOperations()}
        {renderContent()}
        
        {toolData.question && (
          <div className="text-sm">
            <strong>Question:</strong> {toolData.question}
          </div>
        )}
      </div>
    </div>
  );
};

export default ToolOperationDisplay;