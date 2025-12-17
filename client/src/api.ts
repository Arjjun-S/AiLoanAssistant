/**
 * API Service
 * Handles all communication with the backend
 */

// API base URL - uses proxy in development, full URL in production
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export interface ChatRequest {
  message: string;
  sessionId: string;
}

export interface ChatResponse {
  reply: string;
  status: 'IN_PROGRESS' | 'APPROVED' | 'REJECTED';
  pdfUrl?: string;
}

/**
 * Sends a message to the chat API
 */
export async function sendMessage(
  message: string,
  sessionId: string
): Promise<ChatResponse> {
  const response = await fetch(`${API_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      sessionId,
    } as ChatRequest),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || 'Failed to send message');
  }

  return response.json();
}

/**
 * Gets the full PDF download URL
 */
export function getPdfDownloadUrl(pdfUrl: string): string {
  return `${API_BASE_URL}${pdfUrl}`;
}

/**
 * Checks API health
 */
export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat/health`);
    return response.ok;
  } catch {
    return false;
  }
}
