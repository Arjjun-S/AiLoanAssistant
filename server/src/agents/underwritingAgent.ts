/**
 * Underwriting Agent
 * Responsible for rule-based loan decision making
 * Uses deterministic rules - AI is NOT used for decisions
 * 
 * Rules:
 * - Minimum salary: ₹25,000
 * - Minimum credit score: 650
 * - Debt-to-income ratio: Max 50%
 */

import { LoanApplication, UnderwritingResult } from './types';
import { calculateEMI } from '../services/pdfService';
import mockData from '../data/mockData.json';

// Underwriting configuration
const RULES = {
  MIN_SALARY: 25000,
  MIN_CREDIT_SCORE: 650,
  MAX_DTI_RATIO: 0.5, // Debt-to-Income ratio (EMI should be max 50% of salary)
  CREDIT_SCORE_EXCELLENT: 750,
  CREDIT_SCORE_GOOD: 700,
};

/**
 * Calculates the risk score based on application data
 * Higher score = lower risk = better
 */
function calculateRiskScore(application: LoanApplication): number {
  let score = 0;
  const maxScore = 100;
  
  // Credit score component (40% weight)
  if (application.creditScore) {
    if (application.creditScore >= RULES.CREDIT_SCORE_EXCELLENT) {
      score += 40;
    } else if (application.creditScore >= RULES.CREDIT_SCORE_GOOD) {
      score += 30;
    } else if (application.creditScore >= RULES.MIN_CREDIT_SCORE) {
      score += 20;
    } else {
      score += 5;
    }
  }
  
  // Salary component (30% weight)
  if (application.monthlySalary) {
    if (application.monthlySalary >= 100000) {
      score += 30;
    } else if (application.monthlySalary >= 50000) {
      score += 25;
    } else if (application.monthlySalary >= RULES.MIN_SALARY) {
      score += 15;
    } else {
      score += 5;
    }
  }
  
  // Employment stability (20% weight)
  if (application.employmentType === 'salaried') {
    score += 20;
  } else {
    score += 12; // Self-employed gets slightly lower score
  }
  
  // Loan-to-income ratio (10% weight)
  if (application.requestedAmount && application.monthlySalary) {
    const annualIncome = application.monthlySalary * 12;
    const loanToIncome = application.requestedAmount / annualIncome;
    if (loanToIncome <= 2) {
      score += 10;
    } else if (loanToIncome <= 4) {
      score += 7;
    } else if (loanToIncome <= 6) {
      score += 4;
    }
  }
  
  return Math.min(score, maxScore);
}

/**
 * Calculates maximum eligible loan amount based on salary
 */
function calculateMaxEligibleAmount(
  monthlySalary: number,
  tenure: number,
  interestRate: number
): number {
  // Max EMI = 50% of salary
  const maxEMI = monthlySalary * RULES.MAX_DTI_RATIO;
  
  // Calculate max loan amount that results in this EMI
  const monthlyRate = interestRate / 12 / 100;
  const maxAmount = maxEMI * (Math.pow(1 + monthlyRate, tenure) - 1) / 
                    (monthlyRate * Math.pow(1 + monthlyRate, tenure));
  
  return Math.floor(maxAmount / 10000) * 10000; // Round down to nearest 10000
}

/**
 * Gets interest rate based on credit score
 */
function getInterestRate(creditScore: number, baseRate: number): number {
  if (creditScore >= RULES.CREDIT_SCORE_EXCELLENT) {
    return baseRate; // Best rate
  } else if (creditScore >= RULES.CREDIT_SCORE_GOOD) {
    return baseRate + 0.5;
  } else if (creditScore >= RULES.MIN_CREDIT_SCORE) {
    return baseRate + 1.0;
  }
  return baseRate + 2.0; // Higher rate for lower scores
}

/**
 * Main Underwriting decision function
 * Returns deterministic decision based on rules
 */
export function makeUnderwritingDecision(application: LoanApplication): UnderwritingResult {
  const salary = application.monthlySalary || 0;
  const creditScore = application.creditScore || 0;
  const requestedAmount = application.requestedAmount || 0;
  const tenure = application.tenure || 12;
  
  // Get base interest rate for loan type
  const loanType = mockData.loanTypes.find(l => l.id === application.loanType);
  const baseRate = loanType?.interestRate || 12;
  
  // Rule 1: Minimum salary check
  if (salary < RULES.MIN_SALARY) {
    return {
      decision: 'REJECTED',
      reason: `Monthly salary of ₹${salary.toLocaleString('en-IN')} is below our minimum requirement of ₹${RULES.MIN_SALARY.toLocaleString('en-IN')}.`,
      riskScore: calculateRiskScore(application),
    };
  }
  
  // Rule 2: Minimum credit score check
  if (creditScore < RULES.MIN_CREDIT_SCORE) {
    return {
      decision: 'REJECTED',
      reason: `Credit score of ${creditScore} is below our minimum requirement of ${RULES.MIN_CREDIT_SCORE}. Consider improving your credit score by paying bills on time and reducing outstanding debt.`,
      riskScore: calculateRiskScore(application),
    };
  }
  
  // Calculate personalized interest rate
  const interestRate = getInterestRate(creditScore, baseRate);
  
  // Calculate max eligible amount
  const maxEligible = calculateMaxEligibleAmount(salary, tenure, interestRate);
  
  // Rule 3: Check if requested amount is within eligibility
  if (requestedAmount > maxEligible) {
    // We can approve a lower amount
    const approvedAmount = maxEligible;
    const emi = calculateEMI(approvedAmount, interestRate, tenure);
    
    return {
      decision: 'APPROVED',
      reason: `Based on your income of ₹${salary.toLocaleString('en-IN')}/month, we can approve ₹${approvedAmount.toLocaleString('en-IN')} (reduced from your requested ₹${requestedAmount.toLocaleString('en-IN')}) to maintain a healthy EMI-to-income ratio.`,
      approvedAmount,
      interestRate,
      riskScore: calculateRiskScore(application),
    };
  }
  
  // Rule 4: Check EMI affordability (DTI ratio)
  const emi = calculateEMI(requestedAmount, interestRate, tenure);
  const dtiRatio = emi / salary;
  
  if (dtiRatio > RULES.MAX_DTI_RATIO) {
    // Suggest lower amount or longer tenure
    const adjustedAmount = Math.floor(salary * RULES.MAX_DTI_RATIO * tenure * 0.7);
    const adjustedEMI = calculateEMI(adjustedAmount, interestRate, tenure);
    
    return {
      decision: 'APPROVED',
      reason: `To ensure comfortable repayment, we've adjusted your loan to ₹${adjustedAmount.toLocaleString('en-IN')} with an EMI of ₹${adjustedEMI.toLocaleString('en-IN')}.`,
      approvedAmount: adjustedAmount,
      interestRate,
      riskScore: calculateRiskScore(application),
    };
  }
  
  // All checks passed - Approve full amount
  const riskScore = calculateRiskScore(application);
  
  return {
    decision: 'APPROVED',
    reason: `Congratulations! Your ${application.loanTypeName} application meets all our criteria. Your credit score of ${creditScore} qualifies you for a competitive interest rate of ${interestRate}% p.a.`,
    approvedAmount: requestedAmount,
    interestRate,
    riskScore,
  };
}

/**
 * Generates a summary of the underwriting decision
 */
export function generateDecisionSummary(
  application: LoanApplication,
  result: UnderwritingResult
): string {
  if (result.decision === 'APPROVED') {
    const emi = calculateEMI(result.approvedAmount!, result.interestRate!, application.tenure || 12);
    const totalPayable = emi * (application.tenure || 12);
    const totalInterest = totalPayable - result.approvedAmount!;
    
    return `
📊 **Loan Decision Summary**
━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Status:** ✅ APPROVED

**Applicant:** ${application.fullName}
**Loan Type:** ${application.loanTypeName}

**Approved Amount:** ₹${result.approvedAmount!.toLocaleString('en-IN')}
**Interest Rate:** ${result.interestRate}% p.a.
**Tenure:** ${application.tenure} months
**Monthly EMI:** ₹${emi.toLocaleString('en-IN')}

**Total Interest:** ₹${totalInterest.toLocaleString('en-IN')}
**Total Payable:** ₹${totalPayable.toLocaleString('en-IN')}

**Risk Score:** ${result.riskScore}/100

${result.reason}
    `.trim();
  } else {
    return `
📊 **Loan Decision Summary**
━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Status:** ❌ NOT APPROVED

**Applicant:** ${application.fullName}
**Loan Type:** ${application.loanTypeName}
**Requested Amount:** ₹${application.requestedAmount?.toLocaleString('en-IN')}

**Reason:** ${result.reason}

**Your Profile:**
• Monthly Income: ₹${application.monthlySalary?.toLocaleString('en-IN')}
• Credit Score: ${application.creditScore}

**Tips to Improve Eligibility:**
1. Maintain a credit score above 650
2. Ensure stable employment
3. Reduce existing debt obligations
4. Consider a lower loan amount or longer tenure

Please feel free to reapply after addressing these factors.
    `.trim();
  }
}
