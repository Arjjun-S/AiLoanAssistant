/**
 * Master Agent (Orchestrator)
 * Controls the conversation flow and coordinates other agents
 * This is the main entry point for all chat interactions
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  SessionData, 
  LoanApplication, 
  ConversationStage,
  ApplicationStatus 
} from './types';
import { handleSalesAgent } from './salesAgent';
import { handleVerificationAgent } from './verificationAgent';
import { makeUnderwritingDecision, generateDecisionSummary } from './underwritingAgent';
import { handleSanctionAgent, generateRejectionResponse } from './sanctionAgent';
import { generateDecisionExplanation } from '../services/openrouter';
import { calculateEMI } from '../services/pdfService';

// In-memory session store (in production, use Redis or database)
const sessions: Map<string, SessionData> = new Map();

/**
 * Gets or creates a session for a given sessionId
 */
function getOrCreateSession(sessionId: string): SessionData {
  if (sessions.has(sessionId)) {
    return sessions.get(sessionId)!;
  }
  
  const newSession: SessionData = {
    sessionId,
    application: {
      applicationId: `LOAN${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    stage: 'GREETING',
    conversationHistory: [],
  };
  
  sessions.set(sessionId, newSession);
  return newSession;
}

/**
 * Updates session with new data
 */
function updateSession(
  session: SessionData,
  updates: {
    stage?: ConversationStage;
    applicationUpdates?: Partial<LoanApplication>;
    userMessage?: string;
    assistantMessage?: string;
  }
): void {
  if (updates.stage) {
    session.stage = updates.stage;
  }
  
  if (updates.applicationUpdates) {
    session.application = {
      ...session.application,
      ...updates.applicationUpdates,
      updatedAt: new Date(),
    };
  }
  
  if (updates.userMessage) {
    session.conversationHistory.push({
      role: 'user',
      content: updates.userMessage,
      timestamp: new Date(),
    });
  }
  
  if (updates.assistantMessage) {
    session.conversationHistory.push({
      role: 'assistant',
      content: updates.assistantMessage,
      timestamp: new Date(),
    });
  }
  
  sessions.set(session.sessionId, session);
}

/**
 * Gets the current application status
 */
function getApplicationStatus(session: SessionData): ApplicationStatus {
  if (session.application.decision === 'APPROVED') {
    return 'APPROVED';
  }
  if (session.application.decision === 'REJECTED') {
    return 'REJECTED';
  }
  return 'IN_PROGRESS';
}

export interface MasterAgentResponse {
  reply: string;
  status: ApplicationStatus;
  pdfUrl?: string;
}

/**
 * Main Master Agent handler
 * Orchestrates the conversation by delegating to appropriate agents
 */
export async function handleMasterAgent(
  message: string,
  sessionId: string
): Promise<MasterAgentResponse> {
  const session = getOrCreateSession(sessionId);
  
  // Add user message to history
  updateSession(session, { userMessage: message });
  
  let reply = '';
  let pdfUrl: string | undefined;
  
  try {
    switch (session.stage) {
      case 'GREETING':
      case 'LOAN_TYPE':
      case 'AMOUNT':
      case 'TENURE':
      case 'PERSONAL_INFO':
      case 'EMPLOYMENT_INFO':
        // Delegate to Sales Agent
        const salesResponse = await handleSalesAgent(message, session);
        reply = salesResponse.message;
        
        updateSession(session, {
          stage: salesResponse.nextStage,
          applicationUpdates: salesResponse.applicationUpdates,
        });
        break;
        
      case 'VERIFICATION':
        // Delegate to Verification Agent
        const verificationResponse = await handleVerificationAgent(message, session);
        reply = verificationResponse.message;
        
        updateSession(session, {
          stage: verificationResponse.nextStage,
          applicationUpdates: verificationResponse.applicationUpdates,
        });
        
        // If verification complete, automatically proceed to underwriting
        if (verificationResponse.nextStage === 'UNDERWRITING') {
          // Perform underwriting
          const underwritingResult = makeUnderwritingDecision({
            ...session.application,
            ...verificationResponse.applicationUpdates,
          });
          
          // Update application with decision
          const decisionUpdates: Partial<LoanApplication> = {
            decision: underwritingResult.decision,
            decisionReason: underwritingResult.reason,
          };
          
          if (underwritingResult.decision === 'APPROVED') {
            decisionUpdates.approvedAmount = underwritingResult.approvedAmount;
            decisionUpdates.interestRate = underwritingResult.interestRate;
            decisionUpdates.emi = calculateEMI(
              underwritingResult.approvedAmount!,
              underwritingResult.interestRate!,
              session.application.tenure || 12
            );
          }
          
          updateSession(session, {
            applicationUpdates: { ...verificationResponse.applicationUpdates, ...decisionUpdates },
            stage: 'DECISION',
          });
          
          // Add underwriting summary to reply
          const updatedApplication = { ...session.application, ...decisionUpdates };
          reply = verificationResponse.message + '\n\n' + 
                  generateDecisionSummary(updatedApplication, underwritingResult);
          
          // If approved, generate sanction letter
          if (underwritingResult.decision === 'APPROVED') {
            const sanctionResult = await handleSanctionAgent(updatedApplication);
            
            if (sanctionResult.success && sanctionResult.pdfFilename) {
              pdfUrl = `/downloads/${sanctionResult.pdfFilename}`;
              reply = sanctionResult.message;
              
              updateSession(session, { stage: 'COMPLETED' });
            }
          } else {
            // Rejected - provide explanation
            reply = generateRejectionResponse(
              updatedApplication,
              underwritingResult.reason
            );
            updateSession(session, { stage: 'COMPLETED' });
          }
        }
        break;
        
      case 'UNDERWRITING':
        // This shouldn't happen as underwriting is automatic after verification
        // But handle it just in case
        reply = "Your application is being processed. Please wait...";
        break;
        
      case 'DECISION':
      case 'COMPLETED':
        // Application already completed - handle follow-up questions
        const status = session.application.decision;
        
        if (status === 'APPROVED') {
          // Check if user wants to download again or has questions
          if (message.toLowerCase().includes('download') || 
              message.toLowerCase().includes('letter') ||
              message.toLowerCase().includes('pdf')) {
            reply = `You can download your sanction letter using the link provided above.\n\n` +
                    `If you need any assistance, please contact our customer support.`;
          } else if (message.toLowerCase().includes('new') || 
                     message.toLowerCase().includes('another') ||
                     message.toLowerCase().includes('start over')) {
            // Start new application
            sessions.delete(sessionId);
            return handleMasterAgent("Hi, I want to apply for a loan", sessionId);
          } else {
            reply = `Your **${session.application.loanTypeName}** of ` +
                    `₹${session.application.approvedAmount?.toLocaleString('en-IN')} ` +
                    `has been approved! 🎉\n\n` +
                    `Is there anything else I can help you with?\n` +
                    `• Download your sanction letter\n` +
                    `• Apply for another loan\n` +
                    `• Get help with your application`;
          }
        } else {
          // Rejected application
          if (message.toLowerCase().includes('new') || 
              message.toLowerCase().includes('another') ||
              message.toLowerCase().includes('try again')) {
            sessions.delete(sessionId);
            return handleMasterAgent("Hi, I want to apply for a loan", sessionId);
          } else {
            reply = `I'm sorry your previous application wasn't approved. ` +
                    `Would you like to try again with different parameters?\n\n` +
                    `Type "new application" to start fresh.`;
          }
        }
        break;
        
      default:
        reply = "I'm not sure how to proceed. Let me start fresh.\n\n" +
                "Welcome to TechBank! How can I help you with your loan today?";
        updateSession(session, { stage: 'GREETING' });
    }
  } catch (error) {
    console.error('Master Agent error:', error);
    reply = "I apologize, but I encountered an error. Let me try again.\n\n" +
            "Could you please repeat your last message?";
  }
  
  // Update session with assistant response
  updateSession(session, { assistantMessage: reply });
  
  return {
    reply,
    status: getApplicationStatus(session),
    pdfUrl,
  };
}

/**
 * Gets session data for debugging/testing
 */
export function getSessionData(sessionId: string): SessionData | undefined {
  return sessions.get(sessionId);
}

/**
 * Clears a session (for testing)
 */
export function clearSession(sessionId: string): void {
  sessions.delete(sessionId);
}
