/**
 * Sales Agent
 * Responsible for collecting loan details through natural conversation
 * Collects: loan type, amount, tenure, personal info, employment details
 */

import { callOpenRouter, Message } from '../services/openrouter';
import { 
  SessionData, 
  AgentResponse, 
  ConversationStage,
  LoanApplication 
} from './types';
import mockData from '../data/mockData.json';

// Extract patterns from user messages
const AMOUNT_PATTERN = /(?:rs\.?|₹|inr)?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:lakhs?|lacs?|l)?/gi;
const PHONE_PATTERN = /\b[6-9]\d{9}\b/;
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
const PAN_PATTERN = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/i;

/**
 * Extracts loan type from user message
 */
function extractLoanType(message: string): { id: string; name: string } | null {
  const lowerMessage = message.toLowerCase();
  
  for (const loan of mockData.loanTypes) {
    const keywords = loan.name.toLowerCase().split(' ');
    if (keywords.some(keyword => lowerMessage.includes(keyword))) {
      return { id: loan.id, name: loan.name };
    }
  }
  
  // Check for common abbreviations
  if (lowerMessage.includes('pl') || lowerMessage.includes('personal')) {
    return { id: 'personal', name: 'Personal Loan' };
  }
  if (lowerMessage.includes('hl') || lowerMessage.includes('home') || lowerMessage.includes('house')) {
    return { id: 'home', name: 'Home Loan' };
  }
  if (lowerMessage.includes('car') || lowerMessage.includes('vehicle') || lowerMessage.includes('auto')) {
    return { id: 'car', name: 'Car Loan' };
  }
  if (lowerMessage.includes('education') || lowerMessage.includes('study') || lowerMessage.includes('student')) {
    return { id: 'education', name: 'Education Loan' };
  }
  
  return null;
}

/**
 * Extracts amount from user message
 */
function extractAmount(message: string): number | null {
  const match = message.match(AMOUNT_PATTERN);
  if (match) {
    let amountStr = match[0].replace(/[^\d.]/g, '');
    let amount = parseFloat(amountStr);
    
    // Check for lakhs
    if (message.toLowerCase().includes('lakh') || message.toLowerCase().includes('lac')) {
      amount *= 100000;
    }
    
    return amount > 0 ? amount : null;
  }
  return null;
}

/**
 * Extracts tenure from user message
 */
function extractTenure(message: string): number | null {
  const yearMatch = message.match(/(\d+)\s*(?:years?|yrs?)/i);
  if (yearMatch) {
    return parseInt(yearMatch[1]) * 12;
  }
  
  const monthMatch = message.match(/(\d+)\s*(?:months?|mos?)/i);
  if (monthMatch) {
    return parseInt(monthMatch[1]);
  }
  
  // Just a number
  const numMatch = message.match(/\b(\d+)\b/);
  if (numMatch) {
    const num = parseInt(numMatch[1]);
    // Assume years if small number, months if larger
    return num <= 30 ? num * 12 : num;
  }
  
  return null;
}

/**
 * Extracts salary from user message
 */
function extractSalary(message: string): number | null {
  const amount = extractAmount(message);
  if (amount && amount >= 5000 && amount <= 10000000) {
    return amount;
  }
  return null;
}

/**
 * Gets available loan types formatted for display
 */
function getLoanTypesDisplay(): string {
  return mockData.loanTypes
    .map((loan, index) => `${index + 1}. **${loan.name}** (${loan.interestRate}% p.a.)`)
    .join('\n');
}

/**
 * Generates a response using AI for natural conversation
 */
async function generateAIResponse(
  stage: ConversationStage,
  context: string,
  conversationHistory: Message[]
): Promise<string> {
  const systemPrompt = `You are a friendly loan sales assistant for TechBank. 
Your current task: ${context}

Guidelines:
- Be warm, conversational, and professional
- Ask ONE question at a time
- Keep responses concise (2-3 sentences max)
- Don't repeat information already collected
- If user seems confused, provide helpful examples`;

  try {
    return await callOpenRouter(conversationHistory, systemPrompt);
  } catch (error) {
    // Fallback to template response if AI fails
    return getFallbackResponse(stage);
  }
}

/**
 * Gets fallback response if AI is unavailable
 */
function getFallbackResponse(stage: ConversationStage): string {
  const responses: Record<ConversationStage, string> = {
    GREETING: "Welcome to TechBank! I'm here to help you with your loan application. What type of loan are you looking for?",
    LOAN_TYPE: `Please select a loan type:\n${getLoanTypesDisplay()}`,
    AMOUNT: "How much loan amount do you need? Please specify in rupees.",
    TENURE: "What repayment tenure would you prefer? (e.g., 2 years, 36 months)",
    PERSONAL_INFO: "I'll need some personal details. Could you please share your full name?",
    EMPLOYMENT_INFO: "What is your monthly salary/income?",
    VERIFICATION: "Please provide your PAN number for verification.",
    UNDERWRITING: "Thank you! I'm now reviewing your application...",
    DECISION: "Your application has been processed.",
    COMPLETED: "Your application is complete. Is there anything else I can help you with?",
  };
  return responses[stage];
}

/**
 * Main Sales Agent handler
 * Processes user input and collects loan application data
 */
export async function handleSalesAgent(
  userMessage: string,
  session: SessionData
): Promise<AgentResponse> {
  const { application, stage } = session;
  const updates: Partial<LoanApplication> = {};
  let responseMessage = '';
  let nextStage: ConversationStage = stage;

  switch (stage) {
    case 'GREETING':
      // Check if user already mentioned a loan type
      const loanTypeFromGreeting = extractLoanType(userMessage);
      if (loanTypeFromGreeting) {
        updates.loanType = loanTypeFromGreeting.id;
        updates.loanTypeName = loanTypeFromGreeting.name;
        const loanInfo = mockData.loanTypes.find(l => l.id === loanTypeFromGreeting.id);
        responseMessage = `Excellent choice! A **${loanTypeFromGreeting.name}** is a great option. ` +
          `We offer amounts from ₹${(loanInfo!.minAmount / 100000).toFixed(1)} lakhs to ₹${(loanInfo!.maxAmount / 100000).toFixed(0)} lakhs ` +
          `at ${loanInfo!.interestRate}% p.a.\n\nHow much loan amount do you need?`;
        nextStage = 'AMOUNT';
      } else {
        responseMessage = `Welcome to **TechBank Financial Services**! 🏦\n\n` +
          `I'm your AI loan assistant, and I'll help you apply for a loan in just a few minutes.\n\n` +
          `Which type of loan interests you?`;
        nextStage = 'LOAN_TYPE';
      }
      break;

    case 'LOAN_TYPE':
      const loanType = extractLoanType(userMessage);
      if (loanType) {
        updates.loanType = loanType.id;
        updates.loanTypeName = loanType.name;
        const loanInfo = mockData.loanTypes.find(l => l.id === loanType.id);
        responseMessage = `Great! **${loanType.name}** is an excellent choice! 👍\n\n` +
          `Here's what we offer:\n` +
          `• Amount: ₹${(loanInfo!.minAmount).toLocaleString('en-IN')} - ₹${(loanInfo!.maxAmount).toLocaleString('en-IN')}\n` +
          `• Interest Rate: ${loanInfo!.interestRate}% p.a.\n` +
          `• Tenure: ${loanInfo!.tenureMonths[0]} - ${loanInfo!.tenureMonths[loanInfo!.tenureMonths.length - 1]} months\n\n` +
          `How much loan amount would you like to apply for?`;
        nextStage = 'AMOUNT';
      } else {
        responseMessage = `Please select a loan type from the options above to continue.`;
      }
      break;

    case 'AMOUNT':
      const amount = extractAmount(userMessage);
      const currentLoan = mockData.loanTypes.find(l => l.id === application.loanType);
      
      if (amount && currentLoan) {
        if (amount < currentLoan.minAmount) {
          responseMessage = `The minimum amount for ${application.loanTypeName} is ₹${currentLoan.minAmount.toLocaleString('en-IN')}. ` +
            `Please enter a higher amount.`;
        } else if (amount > currentLoan.maxAmount) {
          responseMessage = `The maximum amount for ${application.loanTypeName} is ₹${currentLoan.maxAmount.toLocaleString('en-IN')}. ` +
            `Please enter a lower amount.`;
        } else {
          updates.requestedAmount = amount;
          responseMessage = `Got it! You're applying for **₹${amount.toLocaleString('en-IN')}**.\n\n` +
            `What repayment tenure would you prefer?\n` +
            `Available options: ${currentLoan.tenureMonths.map(t => t >= 12 ? `${t/12} year${t > 12 ? 's' : ''}` : `${t} months`).join(', ')}`;
          nextStage = 'TENURE';
        }
      } else {
        responseMessage = `Please enter a valid loan amount. For example: "5 lakhs" or "500000"`;
      }
      break;

    case 'TENURE':
      const tenure = extractTenure(userMessage);
      const loanForTenure = mockData.loanTypes.find(l => l.id === application.loanType);
      
      if (tenure && loanForTenure) {
        // Find closest valid tenure
        const validTenures = loanForTenure.tenureMonths;
        const closestTenure = validTenures.reduce((prev, curr) => 
          Math.abs(curr - tenure) < Math.abs(prev - tenure) ? curr : prev
        );
        
        updates.tenure = closestTenure;
        responseMessage = `Perfect! Your loan tenure is set to **${closestTenure} months** (${(closestTenure/12).toFixed(1)} years).\n\n` +
          `Now, I'll need some personal details.\n\n` +
          `What is your **full name** (as per PAN card)?`;
        nextStage = 'PERSONAL_INFO';
      } else {
        responseMessage = `Please specify a valid tenure. For example: "3 years" or "36 months"`;
      }
      break;

    case 'PERSONAL_INFO':
      // Handle different pieces of personal info based on what's already collected
      if (!application.fullName) {
        // Check if message looks like a name (at least 2 words, only letters/spaces)
        if (userMessage.trim().split(/\s+/).length >= 1 && /^[A-Za-z\s]+$/.test(userMessage.trim())) {
          updates.fullName = userMessage.trim();
          responseMessage = `Nice to meet you, **${userMessage.trim()}**! 👋\n\n` +
            `What is your **email address**?`;
        } else {
          responseMessage = `Please enter your full name (as it appears on your PAN card).`;
        }
      } else if (!application.email) {
        const email = userMessage.match(EMAIL_PATTERN);
        if (email) {
          updates.email = email[0];
          responseMessage = `Got it! 📧\n\nWhat is your **mobile number**?`;
        } else {
          responseMessage = `Please enter a valid email address (e.g., name@example.com)`;
        }
      } else if (!application.phone) {
        const phone = userMessage.match(PHONE_PATTERN);
        if (phone) {
          updates.phone = phone[0];
          responseMessage = `Great! 📱\n\nNow for employment details.\n\n` +
            `Are you **salaried** or **self-employed**?`;
          nextStage = 'EMPLOYMENT_INFO';
        } else {
          responseMessage = `Please enter a valid 10-digit mobile number.`;
        }
      }
      break;

    case 'EMPLOYMENT_INFO':
      if (!application.employmentType) {
        const lowerMsg = userMessage.toLowerCase();
        if (lowerMsg.includes('salaried') || lowerMsg.includes('salary') || lowerMsg.includes('employed')) {
          updates.employmentType = 'salaried';
          responseMessage = `What is the name of your **employer/company**?`;
        } else if (lowerMsg.includes('self') || lowerMsg.includes('business') || lowerMsg.includes('own')) {
          updates.employmentType = 'self-employed';
          responseMessage = `What is the name of your **business**?`;
        } else {
          responseMessage = `Please specify if you are **salaried** or **self-employed**.`;
        }
      } else if (!application.employer) {
        updates.employer = userMessage.trim();
        responseMessage = `And what is your **monthly income/salary** (take-home)?`;
      } else if (!application.monthlySalary) {
        const salary = extractSalary(userMessage);
        if (salary) {
          updates.monthlySalary = salary;
          responseMessage = `Thank you! 💼\n\n` +
            `Last step: Please provide your **PAN number** for verification.`;
          nextStage = 'VERIFICATION';
        } else {
          responseMessage = `Please enter your monthly salary in rupees (e.g., "50000" or "50,000")`;
        }
      }
      break;

    default:
      responseMessage = getFallbackResponse(stage);
  }

  return {
    message: responseMessage,
    nextStage,
    applicationUpdates: updates,
  };
}
