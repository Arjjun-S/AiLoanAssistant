/**
 * Shared Types for Agent System
 * Defines interfaces used across all agents
 */

// Application status throughout the loan process
export type ApplicationStatus = 'IN_PROGRESS' | 'APPROVED' | 'REJECTED';

// Stages of the loan application conversation
export type ConversationStage = 
  | 'GREETING'           // Initial welcome
  | 'LOAN_TYPE'          // Selecting loan type
  | 'AMOUNT'             // Collecting loan amount
  | 'TENURE'             // Collecting tenure preference
  | 'PERSONAL_INFO'      // Collecting personal information
  | 'EMPLOYMENT_INFO'    // Collecting employment details
  | 'VERIFICATION'       // KYC verification stage
  | 'UNDERWRITING'       // Decision making stage
  | 'DECISION'           // Final decision communicated
  | 'COMPLETED';         // Application completed

// Loan application data collected during conversation
export interface LoanApplication {
  applicationId: string;
  
  // Loan Details
  loanType?: string;
  loanTypeName?: string;
  requestedAmount?: number;
  tenure?: number;
  
  // Personal Information
  fullName?: string;
  email?: string;
  phone?: string;
  panNumber?: string;
  dateOfBirth?: string;
  
  // Employment Information
  employmentType?: 'salaried' | 'self-employed';
  employer?: string;
  monthlySalary?: number;
  yearsEmployed?: number;
  
  // Verification Data (mock)
  creditScore?: number;
  kycVerified?: boolean;
  
  // Decision
  approvedAmount?: number;
  interestRate?: number;
  emi?: number;
  decision?: 'APPROVED' | 'REJECTED';
  decisionReason?: string;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

// Session data for tracking conversation
export interface SessionData {
  sessionId: string;
  application: LoanApplication;
  stage: ConversationStage;
  conversationHistory: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
}

// Agent response structure
export interface AgentResponse {
  message: string;
  nextStage?: ConversationStage;
  applicationUpdates?: Partial<LoanApplication>;
  requiresAI?: boolean;
}

// Underwriting result
export interface UnderwritingResult {
  decision: 'APPROVED' | 'REJECTED';
  reason: string;
  approvedAmount?: number;
  interestRate?: number;
  riskScore?: number;
}
