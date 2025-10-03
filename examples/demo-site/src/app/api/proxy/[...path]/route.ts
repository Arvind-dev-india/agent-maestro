import { NextRequest, NextResponse } from 'next/server';

// Proxy API requests to the VS Code extension
export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxyRequest(request, params.path);
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxyRequest(request, params.path);
}

export async function PUT(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxyRequest(request, params.path);
}

export async function DELETE(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxyRequest(request, params.path);
}

async function handleProxyRequest(request: NextRequest, pathSegments: string[]) {
  const vsCodeHost = process.env.LOCAL_VSCODE_HOST || 'host.docker.internal';
  const vsCodePort = process.env.LOCAL_VSCODE_PORT || '23333';
  
  // Reconstruct the path
  const path = pathSegments.join('/');
  const targetUrl = `http://${vsCodeHost}:${vsCodePort}/api/v1/${path}`;
  
  // Get query parameters
  const searchParams = request.nextUrl.searchParams.toString();
  const fullUrl = searchParams ? `${targetUrl}?${searchParams}` : targetUrl;
  
  console.log(`Proxying ${request.method} ${fullUrl}`);
  
  try {
    const headers = new Headers();
    
    // Copy relevant headers from the original request
    const originalHeaders = request.headers;
    ['content-type', 'authorization', 'accept', 'user-agent'].forEach(headerName => {
      const value = originalHeaders.get(headerName);
      if (value) {
        headers.set(headerName, value);
      }
    });
    
    let body = undefined;
    if (request.method !== 'GET' && request.method !== 'DELETE') {
      body = await request.text();
    }
    
    const response = await fetch(fullUrl, {
      method: request.method,
      headers,
      body: body || undefined,
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });
    
    const responseData = await response.text();
    
    // Create response headers
    const responseHeaders = new Headers();
    
    // Copy content type and other important headers
    const contentType = response.headers.get('Content-Type');
    if (contentType) {
      responseHeaders.set('Content-Type', contentType);
    }
    
    // Add CORS headers
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    return new NextResponse(responseData, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
    
  } catch (error) {
    console.error('Proxy error:', error);
    
    return NextResponse.json({
      error: 'Proxy request failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      targetUrl: fullUrl,
      timestamp: new Date().toISOString()
    }, { 
      status: 502,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
      }
    });
  }
}

// Handle preflight OPTIONS requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    }
  });
}