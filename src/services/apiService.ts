import { ChatMessage } from '../types/index';
import { logger } from '../utils/logger';

/**
 * Makes API call to the backend LLM service
 */
export const sendChatRequest = async (
  backendUrl: string,
  apiKey: string,
  llmProvider: string,
  messages: ChatMessage[],
  screenshotBase64?: string | null,
  panelData?: any,
  model?: string
) => {
  const response = await fetch(backendUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiKey,
      llmProvider,
      messages: messages.map(msg => ({ 
        role: msg.role,
        content: msg.content
      })),
      screenshot: screenshotBase64,
      panelData: panelData,
      options: model ? { model } : {},
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Backend request failed');
  }

  return await response.json();
};

/**
 * Forwards AI response to a control endpoint
 */
export const forwardResponseToEndpoint = async (
  content: string,
  url: string,
  method: string = 'POST',
  headersString: string = ''
): Promise<void> => {
  const headers: Record<string, string> = {};

  // Parse headers string
  headersString.split('\n').forEach(line => {
    const parts = line.split(':');
    if (parts.length === 2) {
      headers[parts[0].trim()] = parts[1].trim();
    }
  });

  let body = null;

  if (method === 'POST' || method === 'PUT') {
    let rawAiContent = content;
    let parsedPayload = null;

    // Try to parse the entire content as raw JSON first
    try {
      parsedPayload = JSON.parse(rawAiContent);
      logger.log("Successfully parsed raw JSON response");
    } catch (e) {
      logger.log("Content is not raw JSON, trying alternative extraction methods");
      
      // Try to parse as {"llmResponse": "..."} format
      try {
        const parsedOuter = JSON.parse(rawAiContent);
        if (typeof parsedOuter.llmResponse === 'string') {
          try {
            parsedPayload = JSON.parse(parsedOuter.llmResponse);
            logger.log("Parsed JSON from llmResponse field");
          } catch (innerError) {
            const innerString = parsedOuter.llmResponse;
            const jsonCodeBlockMatch = innerString.match(/```json\n([\s\S]*?)\n```/);
            if (jsonCodeBlockMatch && jsonCodeBlockMatch[1]) {
              try {
                parsedPayload = JSON.parse(jsonCodeBlockMatch[1].trim());
                logger.log("Parsed JSON from code block inside llmResponse");
              } catch (blockError) {
                logger.error("Found code block but content isn't valid JSON");
              }
            }
          }
        }
      } catch (outerError) {
        const jsonCodeBlockMatch = rawAiContent.match(/```json\n([\s\S]*?)\n```/);
        if (jsonCodeBlockMatch && jsonCodeBlockMatch[1]) {
          try {
            parsedPayload = JSON.parse(jsonCodeBlockMatch[1].trim());
            logger.log("Parsed JSON from markdown code block");
          } catch (blockError) {
            logger.error("Found code block but content isn't valid JSON");
          }
        }
      }
    }

    if (parsedPayload) {
      if (!Array.isArray(parsedPayload)) {
        throw new Error("Auto-forward failed: JSON content must be an array.");
      }

      body = JSON.stringify(parsedPayload);
      if (!headers['Content-Type'] && !headers['content-type']) {
        headers['Content-Type'] = 'application/json';
      }
      logger.log("Successfully prepared JSON array body for fetch:", body);
    } else {
      throw new Error("Auto-forward failed: Could not find valid JSON content to send.");
    }
  } else {
    throw new Error(`Auto-forward failed: HTTP method ${method} is not supported for sending a body.`);
  }

  const response = await fetch(url, {
    method: method,
    headers: headers,
    body: body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Auto-forward failed: Endpoint returned status ${response.status}: ${errorText || 'No details'}`);
  }
};
