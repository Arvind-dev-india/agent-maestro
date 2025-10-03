import { NextResponse } from 'next/server';

export async function GET() {
  const vsCodeHost = process.env.LOCAL_VSCODE_HOST || 'host.docker.internal';
  const vsCodePort = process.env.LOCAL_VSCODE_PORT || '23333';
  const apiUrl = `http://${vsCodeHost}:${vsCodePort}/api/v1/info`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Agent-Maestro-Demo-Site',
        'Accept': 'application/json'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const result = {
      connected: response.ok,
      status: response.status,
      statusText: response.statusText,
      timestamp: new Date().toISOString(),
      apiUrl,
      responseTime: Date.now() // Could be enhanced with actual timing
    };

    if (response.ok) {
      try {
        const data = await response.json();
        result.data = data;
      } catch {
        // Response might not be JSON
      }
    }

    return NextResponse.json(result);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorName = error instanceof Error ? error.name : 'Error';
    
    return NextResponse.json({
      connected: false,
      error: errorMessage,
      errorType: errorName,
      timestamp: new Date().toISOString(),
      apiUrl
    }, { status: 503 });
  }
}