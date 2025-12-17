/**
 * PDF Service
 * Generates loan sanction letters using PDFKit
 */

import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface SanctionLetterData {
  applicantName: string;
  loanType: string;
  approvedAmount: number;
  interestRate: number;
  tenureMonths: number;
  emi: number;
  sanctionDate: Date;
  applicationId: string;
}

// Ensure downloads directory exists
const DOWNLOADS_DIR = path.join(__dirname, '../../downloads');

function ensureDownloadsDir(): void {
  if (!fs.existsSync(DOWNLOADS_DIR)) {
    fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
  }
}

/**
 * Calculates EMI for a loan
 */
export function calculateEMI(principal: number, annualRate: number, tenureMonths: number): number {
  const monthlyRate = annualRate / 12 / 100;
  const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths) 
              / (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  return Math.round(emi);
}

/**
 * Formats currency in Indian format
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formats date in readable format
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Generates a PDF sanction letter and returns the filename
 */
export async function generateSanctionLetter(data: SanctionLetterData): Promise<string> {
  ensureDownloadsDir();
  
  const filename = `sanction_letter_${data.applicationId}_${uuidv4().slice(0, 8)}.pdf`;
  const filepath = path.join(DOWNLOADS_DIR, filename);

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        margin: 50,
        size: 'A4'
      });
      
      const writeStream = fs.createWriteStream(filepath);
      doc.pipe(writeStream);

      // Header - Bank Logo and Title
      doc.fontSize(24)
         .font('Helvetica-Bold')
         .fillColor('#1a365d')
         .text('TechBank Financial Services', { align: 'center' });
      
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#4a5568')
         .text('Digital Banking Division', { align: 'center' })
         .text('123 Finance Street, Mumbai - 400001', { align: 'center' })
         .text('CIN: U65100MH2020PLC123456', { align: 'center' });

      doc.moveDown(1);
      
      // Horizontal line
      doc.strokeColor('#2b6cb0')
         .lineWidth(2)
         .moveTo(50, doc.y)
         .lineTo(545, doc.y)
         .stroke();
      
      doc.moveDown(1);

      // Sanction Letter Title
      doc.fontSize(18)
         .font('Helvetica-Bold')
         .fillColor('#2d3748')
         .text('LOAN SANCTION LETTER', { align: 'center' });
      
      doc.moveDown(0.5);
      
      // Reference Number and Date
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#4a5568')
         .text(`Reference No: TB/LOAN/${data.applicationId}`, { align: 'center' })
         .text(`Date: ${formatDate(data.sanctionDate)}`, { align: 'center' });

      doc.moveDown(1.5);

      // Applicant Details Section
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#2d3748')
         .text('Dear ' + data.applicantName + ',');
      
      doc.moveDown(0.5);
      
      doc.fontSize(11)
         .font('Helvetica')
         .fillColor('#4a5568')
         .text(
           `We are pleased to inform you that your application for a ${data.loanType} has been `,
           { continued: true }
         )
         .font('Helvetica-Bold')
         .fillColor('#38a169')
         .text('APPROVED', { continued: true })
         .font('Helvetica')
         .fillColor('#4a5568')
         .text('.');

      doc.moveDown(1);

      // Loan Details Box
      const boxTop = doc.y;
      doc.rect(50, boxTop, 495, 180)
         .fillAndStroke('#f7fafc', '#e2e8f0');
      
      doc.y = boxTop + 15;
      
      doc.fontSize(14)
         .font('Helvetica-Bold')
         .fillColor('#1a365d')
         .text('LOAN DETAILS', 70);
      
      doc.moveDown(0.5);
      
      // Loan details in two columns
      const leftCol = 70;
      const rightCol = 320;
      const startY = doc.y;
      
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#4a5568');

      // Left column
      doc.text('Loan Type:', leftCol, startY);
      doc.font('Helvetica-Bold').fillColor('#2d3748')
         .text(data.loanType, leftCol + 100, startY);
      
      doc.font('Helvetica').fillColor('#4a5568')
         .text('Approved Amount:', leftCol, startY + 25);
      doc.font('Helvetica-Bold').fillColor('#2d3748')
         .text(formatCurrency(data.approvedAmount), leftCol + 100, startY + 25);
      
      doc.font('Helvetica').fillColor('#4a5568')
         .text('Interest Rate:', leftCol, startY + 50);
      doc.font('Helvetica-Bold').fillColor('#2d3748')
         .text(`${data.interestRate}% p.a.`, leftCol + 100, startY + 50);

      // Right column
      doc.font('Helvetica').fillColor('#4a5568')
         .text('Tenure:', rightCol, startY);
      doc.font('Helvetica-Bold').fillColor('#2d3748')
         .text(`${data.tenureMonths} months`, rightCol + 100, startY);
      
      doc.font('Helvetica').fillColor('#4a5568')
         .text('Monthly EMI:', rightCol, startY + 25);
      doc.font('Helvetica-Bold').fillColor('#38a169')
         .text(formatCurrency(data.emi), rightCol + 100, startY + 25);
      
      doc.font('Helvetica').fillColor('#4a5568')
         .text('Processing Fee:', rightCol, startY + 50);
      doc.font('Helvetica-Bold').fillColor('#2d3748')
         .text('Waived', rightCol + 100, startY + 50);

      // Total payable
      doc.y = startY + 90;
      doc.moveTo(70, doc.y).lineTo(525, doc.y).strokeColor('#e2e8f0').stroke();
      doc.y += 10;
      
      const totalPayable = data.emi * data.tenureMonths;
      doc.font('Helvetica').fillColor('#4a5568')
         .text('Total Amount Payable:', 70, doc.y);
      doc.font('Helvetica-Bold').fillColor('#2d3748')
         .text(formatCurrency(totalPayable), 170, doc.y);

      doc.y = boxTop + 200;

      // Terms and Conditions
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#2d3748')
         .text('Terms & Conditions:');
      
      doc.moveDown(0.3);
      
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#4a5568');
      
      const terms = [
        'This sanction is valid for 30 days from the date of issue.',
        'Loan disbursement is subject to completion of documentation and verification.',
        'Interest rate is subject to change based on RBI guidelines.',
        'Prepayment charges may apply as per bank policy.',
        'All terms are governed by the bank\'s loan agreement.',
      ];
      
      terms.forEach((term, index) => {
        doc.text(`${index + 1}. ${term}`, { indent: 10 });
      });

      doc.moveDown(1.5);

      // Signature Section
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#4a5568')
         .text('For TechBank Financial Services');
      
      doc.moveDown(1.5);
      
      // Signature line
      doc.fontSize(12)
         .font('Helvetica-Bold')
         .fillColor('#1a365d')
         .text('_____________________');
      
      doc.fontSize(10)
         .font('Helvetica')
         .fillColor('#4a5568')
         .text('Authorized Signatory')
         .text('Digital Loans Division');

      doc.moveDown(1);

      // Footer
      doc.fontSize(8)
         .font('Helvetica')
         .fillColor('#718096')
         .text('This is a system-generated document and does not require a physical signature.', 
               50, doc.page.height - 80, { align: 'center' })
         .text('For any queries, contact us at support@techbank.com or call 1800-TECH-BANK', 
               { align: 'center' });

      // Status watermark
      doc.save();
      doc.rotate(45, { origin: [300, 400] });
      doc.fontSize(60)
         .font('Helvetica-Bold')
         .fillColor('#38a16920')
         .text('APPROVED', 150, 350);
      doc.restore();

      doc.end();

      writeStream.on('finish', () => {
        resolve(filename);
      });

      writeStream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}
