import { useCallback } from "react";
import {
  API_ENDPOINTS,
  ACTION_TYPES,
  SUGGESTION_ACTIONS,
} from "../utils/constants";
import type { ActionType } from "../types/chat";

// Enhanced error logging utilities
const logApiCall = (method: string, url: string, data?: any) => {
  console.log(`🌐 [${new Date().toISOString()}] API Call: ${method} ${url}`);
  if (data) {
    console.log(`📤 Request data:`, {
      ...data,
      // Redact sensitive fields
      ...(data.apiKey && { apiKey: '[REDACTED]' }),
      ...(data.configuration && { configuration: '[CONFIG]' }),
    });
  }
};

const logApiResponse = (url: string, status: number, data?: any) => {
  console.log(`📥 [${new Date().toISOString()}] API Response: ${status} for ${url}`);
  if (data) {
    const logData = typeof data === 'string' && data.length > 500
      ? data.substring(0, 500) + '...[truncated]'
      : data;
    console.log(`📋 Response data:`, logData);
  }
};

const logApiError = (method: string, url: string, error: any, context?: any) => {
  console.error(`❌ [${new Date().toISOString()}] API Error: ${method} ${url}`, {
    error: {
      message: error.message,
      name: error.name,
      status: error.status || 'unknown',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    },
    context: {
      ...context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    },
  });
};

// Enhanced request wrapper
const makeApiRequest = async (
  url: string,
  options: RequestInit,
  context?: any
): Promise<Response> => {
  logApiCall(options.method || 'GET', url, context?.body);
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        ...options.headers,
      },
    });

    logApiResponse(url, response.status);

    if (!response.ok) {
      let errorData;
      try {
        const text = await response.text();
        errorData = text ? JSON.parse(text) : {};
      } catch {
        errorData = { message: response.statusText };
      }

      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      (error as any).status = response.status;
      (error as any).statusText = response.statusText;
      (error as any).responseData = errorData;
      
      // Categorize errors
      if (response.status === 502) {
        (error as any).category = 'connection_failed';
        (error as any).userMessage = 'Connection failed. Please check if the VS Code extension is running.';
      } else if (response.status === 404) {
        (error as any).category = 'not_found';
        (error as any).userMessage = 'The requested resource was not found.';
      } else if (response.status >= 500) {
        (error as any).category = 'server_error';
        (error as any).userMessage = 'Server error occurred. Please try again.';
      } else if (response.status === 429) {
        (error as any).category = 'rate_limited';
        (error as any).userMessage = 'Too many requests. Please wait a moment.';
      } else {
        (error as any).category = 'client_error';
        (error as any).userMessage = errorData?.message || 'Request failed.';
      }
      
      throw error;
    }

    return response;
  } catch (error: any) {
    const errorContext = {
      url,
      method: options.method || 'GET',
      hasBody: !!options.body,
      ...context,
    };

    logApiError(options.method || 'GET', url, error, errorContext);

    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      const networkError = new Error('Network connection failed');
      (networkError as any).category = 'network_error';
      (networkError as any).userMessage = 'Network error. Please check your connection.';
      (networkError as any).originalError = error;
      throw networkError;
    }

    // Re-throw with context if not already enhanced
    if (!(error as any).category) {
      (error as any).category = 'unknown_error';
      (error as any).userMessage = 'An unexpected error occurred. Please try again.';
      (error as any).context = errorContext;
    }

    throw error;
  }
};

export const useApiClient = () => {
  const sendTaskAction = useCallback(
    async (taskId: string, suggestion: string): Promise<boolean> => {
      const action: ActionType =
        suggestion === SUGGESTION_ACTIONS.APPROVE
          ? ACTION_TYPES.APPROVE
          : ACTION_TYPES.REJECT;

      try {
        console.log(`🎯 [${new Date().toISOString()}] Sending task action: ${action} for task ${taskId}`);
        
        await makeApiRequest(
          API_ENDPOINTS.TASK_ACTION(taskId),
          {
            method: "POST",
            body: JSON.stringify({ action }),
          },
          { operation: 'task_action', taskId, action }
        );

        console.log(`✅ [${new Date().toISOString()}] Task action sent successfully: ${action} for task ${taskId}`);
        return true;
      } catch (error: any) {
        console.error(`💥 [${new Date().toISOString()}] Failed to send task action:`, {
          taskId,
          action,
          error: error.message,
          category: error.category,
        });
        
        // Enhance error with task action context
        (error as any).operation = 'send_task_action';
        (error as any).taskId = taskId;
        (error as any).action = action;
        
        return false;
      }
    },
    [],
  );

  const sendMessage = useCallback(
    async (
      message: string,
      mode: string,
      extensionId: string,
      taskId?: string,
      images?: string[],
    ): Promise<Response> => {
      const url = taskId
        ? API_ENDPOINTS.TASK_MESSAGE(taskId)
        : API_ENDPOINTS.TASK;

      const body = { 
        text: message, 
        configuration: { mode }, 
        extensionId,
        images: images || [],
      };

      try {
        console.log(`💬 [${new Date().toISOString()}] Sending message${taskId ? ` to task ${taskId}` : ' (new task)'}`);
        console.log(`📋 Message details:`, {
          hasMessage: !!message,
          messageLength: message?.length || 0,
          mode,
          extensionId,
          hasImages: !!(images?.length),
          imageCount: images?.length || 0,
          isNewTask: !taskId,
        });

        const response = await makeApiRequest(
          url,
          {
            method: "POST",
            body: JSON.stringify(body),
          },
          { 
            operation: taskId ? 'send_message' : 'create_task',
            taskId,
            messageLength: message?.length,
            imageCount: images?.length,
          }
        );

        console.log(`✅ [${new Date().toISOString()}] Message sent successfully${taskId ? ` to task ${taskId}` : ' (task created)'}`);
        
        // Add connection monitoring for SSE responses
        if (response.headers.get('content-type') === 'text/event-stream') {
          console.log(`📡 [${new Date().toISOString()}] SSE response received, monitoring connection...`);
          
          // Monitor the response for early closure
          const originalClone = response.clone();
          setTimeout(() => {
            if (!originalClone.body?.locked) {
              console.warn(`⚠️ [${new Date().toISOString()}] SSE response body not consumed after 5 seconds`);
            }
          }, 5000);
        }
        
        return response;
      } catch (error: any) {
        console.error(`💥 [${new Date().toISOString()}] Failed to send message:`, {
          taskId: taskId || 'new',
          messageLength: message?.length || 0,
          mode,
          error: error.message,
          category: error.category,
          userMessage: error.userMessage,
        });
        
        // Enhance error with message context
        (error as any).operation = taskId ? 'send_message' : 'create_task';
        (error as any).taskId = taskId;
        (error as any).messageData = {
          hasMessage: !!message,
          messageLength: message?.length || 0,
          mode,
          extensionId,
          hasImages: !!(images?.length),
          imageCount: images?.length || 0,
        };
        
        throw error;
      }
    },
    [],
  );

  const createSSEReader = useCallback((response: Response) => {
    const reader = response.body?.getReader();
    if (!reader) {
      const error = new Error("No response body for SSE stream");
      (error as any).category = 'sse_error';
      (error as any).userMessage = 'Failed to establish real-time connection.';
      throw error;
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let eventCount = 0;
    let lastActivity = Date.now();

    console.log(`🌊 [${new Date().toISOString()}] Creating SSE reader for response`);

    return {
      async read() {
        try {
          // Add a timeout for individual reads to detect stalled connections
          const readPromise = reader.read();
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => {
              reject(new Error('SSE read timeout - no data received within 60 seconds'));
            }, 60000); // 60 second timeout per read
          });

          const { done, value } = await Promise.race([readPromise, timeoutPromise]);
          
          if (done) {
            console.log(`🔚 [${new Date().toISOString()}] SSE stream ended. Total events processed: ${eventCount}`);
            return { done: true, events: [] };
          }

          lastActivity = Date.now();
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          const events: Array<{ event: string; data: any }> = [];
          let currentEvent = "";

          for (const line of lines) {
            if (line.startsWith("event: ")) {
              currentEvent = line.substring(7).trim();
            } else if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.substring(6));
                events.push({ event: currentEvent, data });
                eventCount++;
                
                console.log(`📨 [${new Date().toISOString()}] SSE event received:`, {
                  event: currentEvent,
                  eventCount: eventCount,
                  dataType: typeof data,
                  hasMessage: !!data.message,
                  messageType: data.message?.type,
                  messageAsk: data.message?.ask,
                  messageSay: data.message?.say,
                  messageText: data.message?.text ? `"${data.message.text.substring(0, 100)}${data.message.text.length > 100 ? '...' : ''}"` : null,
                  messagePartial: data.message?.partial,
                  taskId: data.taskId,
                  fullData: JSON.stringify(data, null, 2),
                });
              } catch (parseError: any) {
                console.error(`❌ [${new Date().toISOString()}] Error parsing SSE data:`, {
                  error: parseError.message,
                  line: line.substring(6),
                  currentEvent,
                });
                
                // Don't throw here, just log and continue
              }
            } else if (line.trim() === "") {
              // Empty line indicates end of event, reset current event
              currentEvent = "";
            }
          }

          return { done: false, events };
        } catch (error: any) {
          console.error(`❌ [${new Date().toISOString()}] Error reading SSE stream:`, {
            error: error.message,
            name: error.name,
            eventCount,
            timeSinceLastActivity: Date.now() - lastActivity,
          });
          
          // Clean up reader on error
          try {
            reader.releaseLock();
          } catch (releaseError) {
            console.warn(`⚠️ [${new Date().toISOString()}] Could not release SSE reader lock:`, releaseError);
          }
          
          (error as any).category = 'sse_read_error';
          (error as any).userMessage = 'Connection to the agent was lost. Please try again.';
          (error as any).eventCount = eventCount;
          
          throw error;
        }
      },
    };
  }, []);

  return {
    sendTaskAction,
    sendMessage,
    createSSEReader,
  };
};
