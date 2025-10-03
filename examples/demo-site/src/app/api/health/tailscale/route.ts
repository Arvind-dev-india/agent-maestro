import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function GET() {
  try {
    // Try to get Tailscale status
    const { stdout } = await execAsync('tailscale status --json 2>/dev/null || echo "{}"');
    
    let tailscaleStatus;
    try {
      tailscaleStatus = JSON.parse(stdout);
    } catch {
      tailscaleStatus = {};
    }

    // Try to get IP
    let tailscaleIP = process.env.TAILSCALE_IP;
    if (!tailscaleIP) {
      try {
        const { stdout: ipOutput } = await execAsync('tailscale ip -4 2>/dev/null');
        tailscaleIP = ipOutput.trim();
      } catch {
        tailscaleIP = null;
      }
    }

    const isConnected = tailscaleStatus.BackendState === 'Running' && tailscaleIP;

    return NextResponse.json({
      connected: isConnected,
      ip: tailscaleIP,
      hostname: process.env.TAILSCALE_HOSTNAME,
      backendState: tailscaleStatus.BackendState || 'unknown',
      timestamp: new Date().toISOString(),
      fullStatus: tailscaleStatus
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      connected: false,
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}