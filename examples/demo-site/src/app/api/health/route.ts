import { NextResponse } from 'next/server';

export async function GET() {
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    tailscale: {
      ip: process.env.TAILSCALE_IP || null,
      status: process.env.TAILSCALE_STATUS || 'unknown'
    },
    vscode: {
      host: process.env.LOCAL_VSCODE_HOST || 'host.docker.internal',
      port: process.env.LOCAL_VSCODE_PORT || '23333',
      apiUrl: process.env.API_BASE_URL || 'http://host.docker.internal:23333/api/v1'
    }
  };

  return NextResponse.json(healthData);
}