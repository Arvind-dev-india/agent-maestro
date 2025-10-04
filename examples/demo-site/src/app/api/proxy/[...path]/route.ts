import { NextRequest, NextResponse } from 'next/server';

// Configure route segment to handle long-running SSE connections
export const maxDuration = 300; // 5 minutes maximum
export const dynamic = 'force-dynamic';

// Enhanced logging utilities
const logRequest = (method: string, url: string, headers: Headers) => {
  console.log(`📡 [${new Date().toISOString()}] ${method} ${url}`);
  console.log(`📋 Headers:`, {
    'content-type': headers.get('content-type'),
    'authorization': headers.get('authorization') ? '[REDACTED]' : 'none',
    'accept': headers.get('accept'),
    'user-agent': headers.get('user-agent'),
  });
};

const logResponse = (status: number, statusText: string, headers: Headers, url: string) => {
  console.log(`📤 [${new Date().toISOString()}] Response ${status} ${statusText} for ${url}`);
  console.log(`📋 Response headers:`, {
    'content-type': headers.get('content-type'),
    'cache-control': headers.get('cache-control'),
    'connection': headers.get('connection'),
  });
};

const logError = (error: unknown, context: string, url: string, method: string) => {
  console.error(`❌ [${new Date().toISOString()}] ${context} Error:`, {
    url,
    method,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
    timestamp: new Date().toISOString(),
  });
};

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
  const startTime = Date.now();
  const vsCodeHost = process.env.LOCAL_VSCODE_HOST || 'host.docker.internal';
  const vsCodePort = process.env.LOCAL_VSCODE_PORT || '23333';
  
  // Reconstruct the path
  const path = pathSegments.join('/');
  const targetUrl = `http://${vsCodeHost}:${vsCodePort}/api/v1/${path}`;
  
  // Get query parameters
  const searchParams = request.nextUrl.searchParams.toString();
  const fullUrl = searchParams ? `${targetUrl}?${searchParams}` : targetUrl;
  
  // Log incoming request
  logRequest(request.method, fullUrl, request.headers);
  
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
    let bodyContent = '';
    if (request.method !== 'GET' && request.method !== 'DELETE') {
      bodyContent = await request.text();
      body = bodyContent;
      
      // Log request body (redacted for sensitive data)
      if (bodyContent) {
        try {
          const parsedBody = JSON.parse(bodyContent);
          console.log(`📝 Request body:`, {
            ...parsedBody,
            // Redact sensitive fields
            ...(parsedBody.apiKey && { apiKey: '[REDACTED]' }),
            ...(parsedBody.password && { password: '[REDACTED]' }),
          });
        } catch {
          console.log(`📝 Request body (non-JSON):`, bodyContent.substring(0, 200) + (bodyContent.length > 200 ? '...' : ''));
        }
      }
    }
    
    console.log(`🚀 [${new Date().toISOString()}] Making upstream request to ${fullUrl}`);
    
    // For SSE endpoints, don't set any timeout. For regular requests, use 5 minute timeout
    const isSSEEndpoint = path.includes('/task') || path.includes('/message');
    const timeoutMs = isSSEEndpoint ? 0 : 300000; // 5 minutes for regular requests, no timeout for SSE
    
    const fetchOptions: RequestInit = {
      method: request.method,
      headers,
      body: body || undefined,
    };
    
    // Only add timeout signal if not an SSE endpoint
    if (timeoutMs > 0) {
      fetchOptions.signal = AbortSignal.timeout(timeoutMs);
    }
    
    const response = await fetch(fullUrl, fetchOptions);
    
    const duration = Date.now() - startTime;
    
    // Log response details
    logResponse(response.status, response.statusText, response.headers, fullUrl);
    console.log(`⏱️ Request duration: ${duration}ms`);
    
    // Create response headers
    const responseHeaders = new Headers();
    
    // Copy important headers from the upstream response
    const contentType = response.headers.get('Content-Type');
    if (contentType) {
      responseHeaders.set('Content-Type', contentType);
    }
    
    // Copy SSE-specific headers
    const cacheControl = response.headers.get('Cache-Control');
    if (cacheControl) {
      responseHeaders.set('Cache-Control', cacheControl);
    }
    
    const connection = response.headers.get('Connection');
    if (connection) {
      responseHeaders.set('Connection', connection);
    }
    
    // Add CORS headers
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    
    // Check if this is an SSE response (text/event-stream)
    if (contentType === 'text/event-stream') {
      console.log(`🌊 [${new Date().toISOString()}] Establishing SSE stream for ${fullUrl}`);
      
      // Add additional SSE headers for better connection handling
      responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      responseHeaders.set('Connection', 'keep-alive');
      responseHeaders.set('X-Accel-Buffering', 'no'); // Disable Nginx buffering if behind reverse proxy
      
      // For SSE streams, we need to pass through the response body as-is
      // Use a ReadableStream to monitor the connection and add error handling
      const stream = new ReadableStream({
        start(controller) {
          if (!response.body) {
            controller.close();
            return;
          }

          const reader = response.body.getReader();
          
          const pump = async () => {
            try {
              while (true) {
                const { done, value } = await reader.read();
                
                if (done) {
                  console.log(`🔚 [${new Date().toISOString()}] SSE stream completed for ${fullUrl}`);
                  controller.close();
                  break;
                }
                
                controller.enqueue(value);
              }
            } catch (error) {
              console.error(`❌ [${new Date().toISOString()}] SSE stream error for ${fullUrl}:`, {
                error: error instanceof Error ? error.message : String(error),
                errorType: error instanceof Error ? error.constructor.name : typeof error,
              });
              
              try {
                controller.error(error);
              } catch (controllerError) {
                console.warn(`⚠️ [${new Date().toISOString()}] Could not signal controller error:`, controllerError);
              }
            }
          };
          
          pump();
        },
        
        cancel() {
          console.log(`🚫 [${new Date().toISOString()}] SSE stream cancelled for ${fullUrl}`);
        }
      });
      
      return new NextResponse(stream, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      });
    } else {
      // For regular responses, read the full body
      const responseData = await response.text();
      
      // Log response data (truncated for large responses)
      if (responseData) {
        try {
          const parsedResponse = JSON.parse(responseData);
          console.log(`📥 Response data:`, {
            ...parsedResponse,
            // Truncate large arrays/objects for logging
            ...(Array.isArray(parsedResponse) && parsedResponse.length > 5 && {
              '[truncated]': `Array with ${parsedResponse.length} items`,
              first_few: parsedResponse.slice(0, 2),
            }),
          });
        } catch {
          const truncated = responseData.substring(0, 500) + (responseData.length > 500 ? '...' : '');
          console.log(`📥 Response data (non-JSON):`, truncated);
        }
      }
      
      return new NextResponse(responseData, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders
      });
    }
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Enhanced error logging
    logError(error, 'Proxy Request', fullUrl, request.method);
    console.log(`⏱️ Failed request duration: ${duration}ms`);
    
    // Determine error type and create appropriate response
    let errorResponse = {
      error: 'Proxy request failed',
      message: 'Unknown error occurred',
      details: {},
      targetUrl: fullUrl,
      method: request.method,
      timestamp: new Date().toISOString(),
      duration: duration,
    };
    
    if (error instanceof Error) {
      errorResponse.message = error.message;
      errorResponse.details = {
        name: error.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
      
      // Categorize common error types
      if (error.name === 'AbortError') {
        errorResponse.error = 'Request timeout';
        errorResponse.message = 'The request took too long to complete';
      } else if (error.message.includes('ECONNREFUSED')) {
        errorResponse.error = 'Connection refused';
        errorResponse.message = 'Could not connect to the VS Code extension. Make sure it is running.';
      } else if (error.message.includes('ENOTFOUND')) {
        errorResponse.error = 'Host not found';
        errorResponse.message = 'Could not resolve the VS Code extension host.';
      } else if (error.message.includes('ETIMEDOUT')) {
        errorResponse.error = 'Network timeout';
        errorResponse.message = 'The network request timed out.';
      }
    }
    
    // Log the final error response
    console.error(`💥 [${new Date().toISOString()}] Sending error response:`, errorResponse);
    
    return NextResponse.json(errorResponse, { 
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
  console.log(`🔧 [${new Date().toISOString()}] Handling OPTIONS preflight request`);
  
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With'
    }
  });
}