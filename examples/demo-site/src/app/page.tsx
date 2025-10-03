"use client";

import Link from "next/link";
import ConnectionStatus from "../components/ConnectionStatus";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              🎵 Agent Maestro Demo
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Control your VS Code AI extensions remotely via Tailscale network. 
              Connect to Roo, Cline, and other AI coding assistants from anywhere in your network.
            </p>
          </div>

          {/* Connection Status */}
          <ConnectionStatus />

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            
            {/* Roo Interface */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl">🦘</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Roo Interface</h3>
                  <p className="text-gray-600">Interactive chat with Roo AI coding assistant</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div>• Create and manage coding tasks</div>
                <div>• Real-time streaming responses</div>
                <div>• Multiple mode support (Code, Ask, Debug, etc.)</div>
                <div>• File system integration</div>
              </div>
              <Link 
                href="/roo"
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
              >
                Launch Roo Interface
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* API Documentation */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <span className="text-2xl">📚</span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">API Documentation</h3>
                  <p className="text-gray-600">Explore available APIs and endpoints</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div>• REST API endpoints</div>
                <div>• OpenAPI/Swagger documentation</div>
                <div>• Real-time WebSocket events</div>
                <div>• Integration examples</div>
              </div>
              <a 
                href="/api/health"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                View API Health
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

          </div>

          {/* Network Information */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🌐 Network Access</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Tailscale Network</h4>
                <div className="space-y-1 text-gray-600">
                  <div>• Secure encrypted connection</div>
                  <div>• Access from any Tailscale device</div>
                  <div>• No firewall configuration needed</div>
                  <div>• Automatic reconnection</div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Local VS Code Connection</h4>
                <div className="space-y-1 text-gray-600">
                  <div>• Direct localhost communication</div>
                  <div>• Low latency responses</div>
                  <div>• Full API compatibility</div>
                  <div>• Real-time status monitoring</div>
                </div>
              </div>
            </div>
          </div>

          {/* Setup Instructions */}
          <div className="mt-8 bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 Quick Setup</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">1</div>
                <div>
                  <strong>Start VS Code Extension:</strong> Make sure Agent Maestro extension is running on port 23333
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">2</div>
                <div>
                  <strong>Check Connection:</strong> Verify both Tailscale and VS Code connections are active above
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-semibold">3</div>
                <div>
                  <strong>Start Coding:</strong> Use the Roo interface to interact with your AI coding assistant
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
