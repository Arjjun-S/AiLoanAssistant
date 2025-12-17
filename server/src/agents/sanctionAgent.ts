/**
 * Sanction Agent
 * Responsible for generating loan sanction letters
 * Calls PDF service to create official documents
 */

import { LoanApplication, AgentResponse } from './types';
import { generateSanctionLetter, calculateEMI, SanctionLetterData } from '../services/pdfService';

/**
 * Generates sanction letter for approved loans
 */
export async function handleSanctionAgent(
  application: LoanApplication
): Promise<{ success: boolean; pdfFilename?: string; message: string }> {
  // Validate that loan is approved
  if (application.decision !== 'APPROVED') {
    return {
      success: false,
      message: 'Cannot generate sanction letter for non-approved applications.',
    };
  }

  // Validate required data
  if (!application.approvedAmount || !application.interestRate || !application.tenure) {
    return {
      success: false,
      message: 'Missing required data for sanction letter generation.',
    };
  }

  try {
    // Calculate EMI
    const emi = calculateEMI(
      application.approvedAmount,
      application.interestRate,
      application.tenure
    );

    // Prepare data for PDF generation
    const sanctionData: SanctionLetterData = {
      applicantName: application.fullName || 'Valued Customer',
      loanType: application.loanTypeName || 'Personal Loan',
      approvedAmount: application.approvedAmount,
      interestRate: application.interestRate,
      tenureMonths: application.tenure,
      emi: emi,
      sanctionDate: new Date(),
      applicationId: application.applicationId,
    };

    // Generate PDF
    const pdfFilename = await generateSanctionLetter(sanctionData);

    return {
      success: true,
      pdfFilename,
      message: `🎉 **Congratulations, ${application.fullName}!**\n\n` +
        `Your **${application.loanTypeName}** has been sanctioned!\n\n` +
        `**Loan Details:**\n` +
        `• Approved Amount: ₹${application.approvedAmount.toLocaleString('en-IN')}\n` +
        `• Interest Rate: ${application.interestRate}% p.a.\n` +
        `• Tenure: ${application.tenure} months\n` +
        `• Monthly EMI: ₹${emi.toLocaleString('en-IN')}\n\n` +
        `📄 Your sanction letter has been generated. Click below to download.\n\n` +
        `Next steps:\n` +
        `1. Review your sanction letter\n` +
        `2. Complete e-KYC verification\n` +
        `3. Receive funds in your account within 24 hours\n\n` +
        `Thank you for choosing **TechBank Financial Services**! 🏦`,
    };
  } catch (error) {
    console.error('Sanction letter generation failed:', error);
    return {
      success: false,
      message: 'Failed to generate sanction letter. Please try again later.',
    };
  }
}

/**
 * Generates rejection response
 */
export function generateRejectionResponse(
  application: LoanApplication,
  reason: string
): string {
  return `We regret to inform you that your **${application.loanTypeName}** application ` +
    `for ₹${application.requestedAmount?.toLocaleString('en-IN')} has not been approved at this time.\n\n` +
    `**Reason:** ${reason}\n\n` +
    `**Suggestions to improve your eligibility:**\n` +
    `• Maintain a credit score above 650\n` +
    `• Ensure your monthly income is at least ₹25,000\n` +
    `• Pay off existing loans to reduce debt burden\n` +
    `• Consider applying for a smaller loan amount\n\n` +
    `You may reapply after 3 months or contact our customer support for guidance.\n\n` +
    `Thank you for considering **TechBank Financial Services**.`;
}
