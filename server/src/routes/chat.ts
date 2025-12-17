/**
 * Chat Router
 * Handles all chat-related API endpoints
 */

import { Router, Request, Response } from 'express';
import { handleMasterAgent, getSessionData, clearSession } from '../agents/masterAgent';

const router = Router();

interface ChatRequest {
  message: string;
  sessionId: string;
}

interface ChatResponse {
  reply: string;
  status: 'IN_PROGRESS' | 'APPROVED' | 'REJECTED';
  pdfUrl?: string;
}

/**
 * POST /api/chat
 * Main chat endpoint that processes user messages
 */
router.post('/', async (req: Request<{}, {}, ChatRequest>, res: Response<ChatResponse | { error: string }>) => {
  try {
    const { message, sessionId } = req.body;
    
    // Validate request
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required and must be a string' });
    }
    
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'SessionId is required and must be a string' });
    }
    
    // Process message through Master Agent
    const result = await handleMasterAgent(message.trim(), sessionId);
    
    // Return response
    res.json({
      reply: result.reply,
      status: result.status,
      pdfUrl: result.pdfUrl,
    });
    
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ 
      error: 'An error occurred while processing your message. Please try again.' 
    });
  }
});

/**
 * GET /api/chat/session/:sessionId
 * Gets session data (for debugging)
 */
router.get('/session/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const session = getSessionData(sessionId);
  
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  res.json({
    sessionId: session.sessionId,
    stage: session.stage,
    application: session.application,
    messageCount: session.conversationHistory.length,
  });
});

/**
 * DELETE /api/chat/session/:sessionId
 * Clears a session (for testing)
 */
router.delete('/session/:sessionId', (req: Request, res: Response) => {
  const { sessionId } = req.params;
  clearSession(sessionId);
  res.json({ message: 'Session cleared' });
});

/**
 * GET /api/chat/health
 * Health check endpoint
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'AI Loan Sales Assistant'
  });
});

export default router;
