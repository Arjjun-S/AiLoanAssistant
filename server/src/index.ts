/**
 * AI-Driven Conversational Loan Sales Assistant
 * Main Server Entry Point
 * 
 * This is an Agentic AI system that uses multiple specialized agents
 * to handle loan applications through natural conversation.
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import chatRouter from './routes/chat';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Serve static files (for PDF downloads)
const downloadsPath = path.join(__dirname, '../downloads');
app.use('/downloads', express.static(downloadsPath));

// API Routes
app.use('/api/chat', chatRouter);

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    name: 'AI Loan Sales Assistant API',
    version: '1.0.0',
    description: 'Agentic AI system for conversational loan applications',
    endpoints: {
      chat: 'POST /api/chat',
      health: 'GET /api/chat/health',
      downloads: 'GET /downloads/:filename',
    },
    agents: [
      'MasterAgent - Orchestrates conversation flow',
      'SalesAgent - Collects loan and personal details',
      'VerificationAgent - Performs KYC verification',
      'UnderwritingAgent - Makes loan decisions',
      'SanctionAgent - Generates approval documents',
    ],
  });
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     🏦 AI Loan Sales Assistant Server                        ║
║                                                              ║
║     Server running on: http://localhost:${PORT}               ║
║                                                              ║
║     Endpoints:                                               ║
║     • POST /api/chat         - Chat with the assistant       ║
║     • GET  /api/chat/health  - Health check                  ║
║     • GET  /downloads/:file  - Download sanction letters     ║
║                                                              ║
║     Agents Active:                                           ║
║     ✓ MasterAgent (Orchestrator)                             ║
║     ✓ SalesAgent (Data Collection)                           ║
║     ✓ VerificationAgent (KYC)                                ║
║     ✓ UnderwritingAgent (Decision Engine)                    ║
║     ✓ SanctionAgent (Document Generation)                    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export default app;
