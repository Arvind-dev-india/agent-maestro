import React from "react";

interface TokenUsage {
  totalTokensIn: number;
  totalTokensOut: number;
  totalCacheWrites?: number;
  totalCacheReads?: number;
  totalCost: number;
  contextTokens: number;
}

interface TokenUsageDisplayProps {
  usage: TokenUsage;
  showCost?: boolean;
  className?: string;
}

export const TokenUsageDisplay: React.FC<TokenUsageDisplayProps> = ({
  usage,
  showCost = true,
  className = "",
}) => {
  const totalTokens = usage.totalTokensIn + usage.totalTokensOut;
  const cacheHits = (usage.totalCacheReads || 0) + (usage.totalCacheWrites || 0);

  return (
    <div className={`bg-gray-50 rounded-lg p-3 text-sm space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-700">Token Usage</span>
        {showCost && usage.totalCost > 0 && (
          <span className="font-semibold text-green-600">
            ${usage.totalCost.toFixed(4)}
          </span>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Input:</span>
            <span className="font-mono">{usage.totalTokensIn.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Output:</span>
            <span className="font-mono">{usage.totalTokensOut.toLocaleString()}</span>
          </div>
          {usage.contextTokens > 0 && (
            <div className="flex justify-between">
              <span className="text-gray-600">Context:</span>
              <span className="font-mono">{usage.contextTokens.toLocaleString()}</span>
            </div>
          )}
        </div>
        
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-600">Total:</span>
            <span className="font-mono font-medium">{totalTokens.toLocaleString()}</span>
          </div>
          {cacheHits > 0 && (
            <>
              <div className="flex justify-between text-blue-600">
                <span>Cache Reads:</span>
                <span className="font-mono">{(usage.totalCacheReads || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-purple-600">
                <span>Cache Writes:</span>
                <span className="font-mono">{(usage.totalCacheWrites || 0).toLocaleString()}</span>
              </div>
            </>
          )}
        </div>
      </div>
      
      {showCost && (
        <div className="pt-1 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Cost per 1K tokens:</span>
            <span className="font-mono text-xs">
              ${totalTokens > 0 ? ((usage.totalCost / totalTokens) * 1000).toFixed(6) : '0.000000'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

interface LiveTokenCounterProps {
  currentUsage: TokenUsage;
  sessionTotal: TokenUsage;
  className?: string;
}

export const LiveTokenCounter: React.FC<LiveTokenCounterProps> = ({
  currentUsage,
  sessionTotal,
  className = "",
}) => {
  return (
    <div className={`flex items-center space-x-4 text-xs text-gray-500 ${className}`}>
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        <span>Current: {(currentUsage.totalTokensIn + currentUsage.totalTokensOut).toLocaleString()}</span>
      </div>
      <div className="text-gray-400">|</div>
      <div>
        Session: {(sessionTotal.totalTokensIn + sessionTotal.totalTokensOut).toLocaleString()}
      </div>
      <div className="text-gray-400">|</div>
      <div className="font-medium text-green-600">
        ${sessionTotal.totalCost.toFixed(4)}
      </div>
    </div>
  );
};