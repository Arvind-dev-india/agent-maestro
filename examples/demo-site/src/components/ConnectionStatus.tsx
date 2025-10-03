'use client';

import { useState, useEffect } from 'react';

interface ConnectionStatusData {
  vscode: {
    connected: boolean;
    status?: number;
    responseTime?: number;
    error?: string;
  };
  tailscale: {
    connected: boolean;
    ip?: string;
    hostname?: string;
    backendState?: string;
    error?: string;
  };
  lastCheck: Date;
}

export default function ConnectionStatus() {
  const [status, setStatus] = useState<ConnectionStatusData>({
    vscode: { connected: false },
    tailscale: { connected: false },
    lastCheck: new Date()
  });

  const [loading, setLoading] = useState(true);

  const checkStatus = async () => {
    try {
      const [vsCodeResponse, tailscaleResponse] = await Promise.all([
        fetch('/api/health/vscode').catch(() => ({ ok: false, json: () => Promise.resolve({ connected: false, error: 'Network error' }) })),
        fetch('/api/health/tailscale').catch(() => ({ ok: false, json: () => Promise.resolve({ connected: false, error: 'Network error' }) }))
      ]);

      const [vsCodeData, tailscaleData] = await Promise.all([
        vsCodeResponse.json(),
        tailscaleResponse.json()
      ]);

      setStatus({
        vscode: vsCodeData,
        tailscale: tailscaleData,
        lastCheck: new Date()
      });
    } catch (error) {
      console.error('Status check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-gray-700 mb-2">Connection Status</h3>
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-lg p-4 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-700">Connection Status</h3>
        <button 
          onClick={checkStatus}
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          Refresh
        </button>
      </div>
      
      <div className="space-y-3">
        {/* Tailscale Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${status.tailscale.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">Tailscale Network</span>
          </div>
          <div className="text-right">
            {status.tailscale.connected ? (
              <div>
                <div className="text-sm text-green-600">Connected</div>
                {status.tailscale.ip && (
                  <div className="text-xs text-gray-500">{status.tailscale.ip}</div>
                )}
              </div>
            ) : (
              <div>
                <div className="text-sm text-red-600">Disconnected</div>
                {status.tailscale.error && (
                  <div className="text-xs text-gray-500">{status.tailscale.error}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* VS Code Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${status.vscode.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm font-medium">VS Code Extension</span>
          </div>
          <div className="text-right">
            {status.vscode.connected ? (
              <div>
                <div className="text-sm text-green-600">Connected</div>
                {status.vscode.responseTime && (
                  <div className="text-xs text-gray-500">{status.vscode.responseTime}ms</div>
                )}
              </div>
            ) : (
              <div>
                <div className="text-sm text-red-600">Disconnected</div>
                {status.vscode.error && (
                  <div className="text-xs text-gray-500 max-w-32 truncate" title={status.vscode.error}>
                    {status.vscode.error}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t text-xs text-gray-400">
        Last checked: {status.lastCheck.toLocaleTimeString()}
      </div>

      {/* Help text */}
      {!status.vscode.connected && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
          Make sure VS Code with Agent Maestro extension is running on port 23333
        </div>
      )}
    </div>
  );
}