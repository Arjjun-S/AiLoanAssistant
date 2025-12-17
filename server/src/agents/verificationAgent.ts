/**
 * Verification Agent
 * Responsible for KYC verification and data validation
 * Uses mock data to simulate PAN verification and credit score lookup
 */

import { SessionData, AgentResponse, LoanApplication } from './types';
import mockData from '../data/mockData.json';

const PAN_PATTERN = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/i;

interface VerificationResult {
  verified: boolean;
  creditScore?: number;
  customerData?: typeof mockData.mockCustomers[0];
  message: string;
}

/**
 * Validates PAN format
 */
function isValidPAN(pan: string): boolean {
  return PAN_PATTERN.test(pan);
}

/**
 * Simulates PAN verification against mock database
 */
function verifyPAN(pan: string): VerificationResult {
  const upperPAN = pan.toUpperCase();
  
  // Check if PAN exists in mock data
  const customer = mockData.mockCustomers.find(
    c => c.pan.toUpperCase() === upperPAN
  );
  
  if (customer) {
    return {
      verified: true,
      creditScore: customer.creditScore,
      customerData: customer,
      message: `PAN verified! Found existing customer: ${customer.name}`,
    };
  }
  
  // For new PANs, generate a random credit score (for demo purposes)
  // In production, this would call a credit bureau API
  const randomCreditScore = Math.floor(Math.random() * (800 - 550)) + 550;
  
  return {
    verified: true,
    creditScore: randomCreditScore,
    message: `PAN verified successfully! Credit score retrieved.`,
  };
}

/**
 * Validates all required fields are present
 */
function validateApplicationData(application: LoanApplication): {
  isComplete: boolean;
  missingFields: string[];
} {
  const requiredFields: Array<keyof LoanApplication> = [
    'loanType',
    'requestedAmount',
    'tenure',
    'fullName',
    'email',
    'phone',
    'monthlySalary',
    'employmentType',
  ];
  
  const missingFields = requiredFields.filter(
    field => !application[field]
  );
  
  return {
    isComplete: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Formats missing fields for user-friendly display
 */
function formatMissingFields(fields: string[]): string {
  const fieldLabels: Record<string, string> = {
    loanType: 'Loan Type',
    requestedAmount: 'Loan Amount',
    tenure: 'Loan Tenure',
    fullName: 'Full Name',
    email: 'Email Address',
    phone: 'Phone Number',
    monthlySalary: 'Monthly Salary',
    employmentType: 'Employment Type',
  };
  
  return fields.map(f => fieldLabels[f] || f).join(', ');
}

/**
 * Main Verification Agent handler
 * Validates user data and performs mock KYC
 */
export async function handleVerificationAgent(
  userMessage: string,
  session: SessionData
): Promise<AgentResponse> {
  const { application } = session;
  const updates: Partial<LoanApplication> = {};
  
  // First, check if PAN is being provided
  const panMatch = userMessage.toUpperCase().match(PAN_PATTERN);
  
  if (panMatch) {
    const pan = panMatch[0];
    updates.panNumber = pan;
    
    // Verify PAN
    const verificationResult = verifyPAN(pan);
    
    if (verificationResult.verified) {
      updates.creditScore = verificationResult.creditScore;
      updates.kycVerified = true;
      
      // If customer exists in database, we could auto-fill some data
      if (verificationResult.customerData) {
        const customer = verificationResult.customerData;
        // Only update if not already provided
        if (!application.fullName) updates.fullName = customer.name;
        if (!application.email) updates.email = customer.email;
        if (!application.phone) updates.phone = customer.phone;
        if (!application.monthlySalary) updates.monthlySalary = customer.salary;
        if (!application.employer) updates.employer = customer.employer;
        if (!application.employmentType) {
          updates.employmentType = customer.employmentType as 'salaried' | 'self-employed';
        }
      }
      
      // Validate all required data is present
      const validation = validateApplicationData({ ...application, ...updates });
      
      if (validation.isComplete) {
        return {
          message: `✅ **KYC Verification Successful!**\n\n` +
            `• PAN: ${pan}\n` +
            `• Credit Score: ${updates.creditScore}\n` +
            `• Status: Verified\n\n` +
            `All your information has been verified. I'm now processing your loan application...`,
          nextStage: 'UNDERWRITING',
          applicationUpdates: updates,
        };
      } else {
        return {
          message: `✅ PAN verified successfully!\n\n` +
            `However, we still need: ${formatMissingFields(validation.missingFields)}\n\n` +
            `Please provide the missing information.`,
          applicationUpdates: updates,
        };
      }
    } else {
      return {
        message: `❌ PAN verification failed. Please check and enter a valid PAN number.`,
        applicationUpdates: {},
      };
    }
  }
  
  // If no PAN provided, check what's needed
  if (!isValidPAN(userMessage)) {
    return {
      message: `Please enter a valid **PAN number** (e.g., ABCDE1234F).\n\n` +
        `This is required for KYC verification.`,
      applicationUpdates: {},
    };
  }
  
  return {
    message: `I need your PAN number to proceed with verification.`,
    applicationUpdates: {},
  };
}

/**
 * Pre-verification check - ensures all data is ready for underwriting
 */
export function verifyApplicationComplete(application: LoanApplication): {
  ready: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  if (!application.panNumber) {
    issues.push('PAN number not verified');
  }
  if (!application.creditScore) {
    issues.push('Credit score not available');
  }
  if (!application.monthlySalary || application.monthlySalary <= 0) {
    issues.push('Valid salary information required');
  }
  if (!application.requestedAmount || application.requestedAmount <= 0) {
    issues.push('Valid loan amount required');
  }
  
  return {
    ready: issues.length === 0,
    issues,
  };
}
