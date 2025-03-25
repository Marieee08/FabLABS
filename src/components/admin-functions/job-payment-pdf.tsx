import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// Define interfaces for JobPayment data
interface ServiceItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description?: string;
  minutes?: number;
  costPerMinute?: number; // Added for clarity
}

interface Client {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
  type?: 'Student' | 'MSME' | 'Others';
  otherSpecify?: string;
}

interface JobPayment {
  id: number;
  orderNumber: string;
  dateIssued: string;
  datePaid?: string;
  completionDate?: string;
  paymentStatus: string;
  items: ServiceItem[];
  subtotal: number;
  taxRate?: number;
  taxAmount?: number;
  totalAmount: number;
  amountPaid?: number;
  balanceDue?: number;
  notes?: string;
  client: Client;
  evaluatedBy?: string;
  approvedBy?: string;
  paymentReceivedBy?: string;
  orNumber?: string;
}

/**
 * Format currency values
 * @param amount - The amount to format
 * @returns Formatted amount
 */
const formatCurrency = (amount: number | string | null): string => {
  if (amount === null || amount === undefined) return '₱0.00';
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `₱${Number(numAmount).toFixed(2)}`;
};

/**
 * Format date for display
 * @param dateString - Date string to format
 * @returns Formatted date string
 */
const formatDate = (dateString: string | null): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

/**
 * Draw a cell with border
 */
const drawCell = (
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  width: number,
  height: number,
  align: string = 'left',
  fill: boolean = false,
  fillColor: number[] = [255, 255, 255],
  fontSize: number = 10,
  fontStyle: string = 'normal'
) => {
  // Draw the cell border
  doc.setDrawColor(0);
  doc.setLineWidth(0.1);
  doc.rect(x, y, width, height);
  
  // Fill the cell if needed
  if (fill) {
    doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
    doc.rect(x, y, width, height, 'F');
  }
  
  // Set text properties
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', fontStyle);
  
  // Calculate text position
  const textX = align === 'center' ? x + width / 2 :
                align === 'right' ? x + width - 2 :
                x + 2;
  const textY = y + height / 2 + fontSize / 4;
  
  // Add the text
  doc.text(text, textX, textY, align);
};

/**
 * Draw a checkbox
 */
const drawCheckbox = (
  doc: jsPDF,
  x: number,
  y: number,
  size: number = 3,
  checked: boolean = false
) => {
  doc.setDrawColor(0);
  doc.setLineWidth(0.1);
  doc.rect(x, y, size, size);
  
  if (checked) {
    doc.setDrawColor(0);
    doc.line(x, y, x + size, y + size);
    doc.line(x + size, y, x, y + size);
  }
};

/**
 * Draw an underline
 */
const drawUnderline = (
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  thickness: number = 0.1
) => {
  doc.setDrawColor(0);
  doc.setLineWidth(thickness);
  doc.line(x, y, x + width, y);
};

/**
 * Generate a PDF for a job payment order
 * @param paymentData - The job payment data
 */
export const downloadJobPaymentPDF = (paymentData: JobPayment): void => {
  try {
    // Initialize jsPDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    
    // Add header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('PHILIPPINE SCIENCE HIGH SCHOOL - EASTERN VISAYAS CAMPUS', pageWidth / 2, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Arl26 Brgy. Pawing, Palo, Leyte', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('PSHS-EVC Fabrication Laboratory', pageWidth / 2, 35, { align: 'center' });
    doc.text('JOB AND PAYMENT ORDER', pageWidth / 2, 40, { align: 'center' });
    
    // Add order number and date
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('No.:', pageWidth - margin - 20, 35);
    drawUnderline(doc, pageWidth - margin - 15, 35, 15);
    doc.text(paymentData.orderNumber || '', pageWidth - margin - 15, 35);
    
    doc.text('Date:', pageWidth - margin - 25, 40);
    drawUnderline(doc, pageWidth - margin - 15, 40, 15);
    doc.text(formatDate(paymentData.dateIssued) || '', pageWidth - margin - 15, 40);
    
    // Client information
    doc.setFontSize(10);
    doc.text('Client\'s Name:', margin, 50);
    drawUnderline(doc, margin + 25, 50, contentWidth - 25);
    doc.text(paymentData.client.name || '', margin + 25, 50);
    
    doc.text('Address:', margin, 55);
    drawUnderline(doc, margin + 18, 55, contentWidth - 18);
    doc.text(paymentData.client.address || '', margin + 18, 55);
    
    // Client profile and project description sections
    const sectionY = 65;
    const sectionHeight = 35;
    
    // Section headers
    drawCell(doc, 'Client Profile', margin, sectionY, contentWidth / 2, 7, 'center', true, [240, 240, 240], 10, 'bold');
    drawCell(doc, 'Description of Project', margin + contentWidth / 2, sectionY, contentWidth / 2, 7, 'center', true, [240, 240, 240], 10, 'bold');
    
    // Client profile section
    drawCell(doc, '', margin, sectionY + 7, contentWidth / 2, sectionHeight - 7, 'left', false);
    
    // Draw checkboxes
    const checkboxX = margin + 5;
    drawCheckbox(doc, checkboxX, sectionY + 12, 3, paymentData.client.type === 'Student');
    doc.text('Student', checkboxX + 5, sectionY + 13.5);
    
    drawCheckbox(doc, checkboxX, sectionY + 18, 3, paymentData.client.type === 'MSME');
    doc.text('MSME', checkboxX + 5, sectionY + 19.5);
    
    drawCheckbox(doc, checkboxX, sectionY + 24, 3, paymentData.client.type === 'Others');
    doc.text('Others, specify:', checkboxX + 5, sectionY + 25.5);
    
    drawUnderline(doc, checkboxX + 28, sectionY + 25.5, contentWidth / 2 - 33);
    doc.text(paymentData.client.otherSpecify || '', checkboxX + 28, sectionY + 25.5);
    
    // Project description section
    drawCell(doc, '', margin + contentWidth / 2, sectionY + 7, contentWidth / 2, sectionHeight - 7, 'left', false);
    
    // Services section
    const servicesY = sectionY + sectionHeight + 5;
    
    // Services header
    drawCell(doc, 'Details of the Services to be rendered', margin, servicesY, contentWidth, 7, 'center', true, [240, 240, 240], 10, 'bold');
    
    // Services table headers - Modified to separate minute/s and cost per minute into distinct columns
    drawCell(doc, 'Services', margin, servicesY + 7, contentWidth * 0.4, 7, 'center', true, [240, 240, 240], 10, 'normal');
    drawCell(doc, 'Minute/s', margin + contentWidth * 0.4, servicesY + 7, contentWidth * 0.15, 7, 'center', true, [240, 240, 240], 10, 'normal');
    drawCell(doc, 'Cost per minute', margin + contentWidth * 0.55, servicesY + 7, contentWidth * 0.15, 7, 'center', true, [240, 240, 240], 10, 'normal');
    drawCell(doc, 'Total Cost', margin + contentWidth * 0.7, servicesY + 7, contentWidth * 0.3, 7, 'center', true, [240, 240, 240], 10, 'normal');
    
    // Services rows (dynamic based on items)
    const rowHeight = 8;
    let currentY = servicesY + 14;
    
    // Draw empty row if no items
    if (!paymentData.items || paymentData.items.length === 0) {
      drawCell(doc, '', margin, currentY, contentWidth * 0.4, rowHeight, 'left');
      drawCell(doc, '', margin + contentWidth * 0.4, currentY, contentWidth * 0.15, rowHeight, 'center');
      drawCell(doc, '', margin + contentWidth * 0.55, currentY, contentWidth * 0.15, rowHeight, 'center');
      drawCell(doc, '', margin + contentWidth * 0.7, currentY, contentWidth * 0.3, rowHeight, 'right');
      currentY += rowHeight;
    } else {
      // Draw item rows
      paymentData.items.forEach((item, index) => {
        drawCell(doc, item.name, margin, currentY, contentWidth * 0.4, rowHeight, 'left');
        drawCell(doc, item.minutes?.toString() || '', margin + contentWidth * 0.4, currentY, contentWidth * 0.15, rowHeight, 'center');
        drawCell(doc, item.costPerMinute ? formatCurrency(item.costPerMinute) : '', margin + contentWidth * 0.55, currentY, contentWidth * 0.15, rowHeight, 'center');
        // Keep the cell but don't display the total cost value
        drawCell(doc, '', margin + contentWidth * 0.7, currentY, contentWidth * 0.3, rowHeight, 'right');
        currentY += rowHeight;
      });
    }
    
    // Total amount due row - Keep the cell but don't display the total amount value
    drawCell(doc, 'Total Amount Due', margin, currentY, contentWidth * 0.7, rowHeight, 'center', true, [240, 240, 240], 10, 'bold');
    drawCell(doc, '', margin + contentWidth * 0.7, currentY, contentWidth * 0.3, rowHeight, 'left');
    
    currentY += rowHeight + 10;
    
    // Completion date
    doc.text('Completion Date:', margin, currentY);
    drawUnderline(doc, margin + 30, currentY, contentWidth - 30);
    
    currentY += 10;
    
    // Terms and conditions acceptance
    doc.setFontSize(9);
    const termsText = 'I, hereby understand and agree to the terms and';
    doc.text(termsText, margin, currentY);
    
    doc.text('Evaluated by:', margin + contentWidth - 40, currentY);
    
    currentY += 5;
    
    doc.text('conditions set forth by PSHS-EVC FabLab.', margin, currentY);
    
    // Position name above the line
    doc.setFontSize(8);
    doc.text('Cyril D. Tapales', margin + contentWidth - 20, currentY-1, { align: 'center' });
    drawUnderline(doc, margin + contentWidth - 40, currentY, 40);
    // Position job title below the line
    doc.text('PSHS-EVC FabLab SRA', margin + contentWidth - 20, currentY + 4, { align: 'center' });
    
    currentY += 15;
    
    // Modified signature line - move text inside the cell
    const signatureLineX = margin + (contentWidth / 4); // Center the signature line
    const signatureLineWidth = contentWidth / 2 - 20;
    
    // Draw signature line in client section but keep the text inside
    drawUnderline(doc, signatureLineX - signatureLineWidth/2, currentY, signatureLineWidth);
    doc.setFontSize(8);
    doc.text('(Signature over printed name of Client)', signatureLineX, currentY + 3, { align: 'center' });
    
    // Date alignment fix - text remains within client section area
    doc.text('Date:', margin + 5, currentY + 7);
    drawUnderline(doc, margin + 15, currentY + 7, contentWidth / 4 - 15);
    
    doc.text('Date:', margin + contentWidth - 40, currentY + 7);
    drawUnderline(doc, margin + contentWidth - 30, currentY + 7, 30);
    
    currentY += 15;
    
    // Payment section
    const paymentBoxY = currentY;
    const paymentBoxHeight = 50;
    
    // Payment section headers
    drawCell(doc, 'Order of Payment', margin, paymentBoxY, contentWidth / 2, 7, 'center', true, [240, 240, 240], 10, 'bold');
    drawCell(doc, 'Payment', margin + contentWidth / 2, paymentBoxY, contentWidth / 2, 7, 'center', true, [240, 240, 240], 10, 'bold');
    
    // Payment order section
    drawCell(doc, '', margin, paymentBoxY + 7, contentWidth / 2, paymentBoxHeight, 'left');
    
    // Payment details section
    drawCell(doc, '', margin + contentWidth / 2, paymentBoxY + 7, contentWidth / 2, paymentBoxHeight, 'left');
    
    // Payment order content - moved inside the cell
    doc.setFontSize(9);
    
    // Content positioned inside the Order of Payment cell
    doc.text('Please issue an Official Receipt in favor of', margin + 5, paymentBoxY + 15);
    
    drawUnderline(doc, margin + 5, paymentBoxY + 20, contentWidth / 2 - 10);
    
    doc.text('for the amount of', margin + 5, paymentBoxY + 25);
    
    drawUnderline(doc, margin + 5, paymentBoxY + 30, contentWidth / 2 - 10);
    
    // Approval section
    doc.text('Approved by:', margin + 5, paymentBoxY + 40);
    
    // Position name above the line
    doc.setFontSize(8);
    doc.text('Cynthia C. Ocaña, D.M.', margin + (contentWidth / 4), paymentBoxY + 39, { align: 'center' });
    drawUnderline(doc, margin + 30, paymentBoxY + 40, contentWidth / 2 - 35);
    // Position job title below the line
    doc.text('FAD Chief', margin + (contentWidth / 4), paymentBoxY + 44, { align: 'center' });
    
    doc.text('Date:', margin + 5, paymentBoxY + 50);
    drawUnderline(doc, margin + 15, paymentBoxY + 50, contentWidth / 2 - 20);
    
    // Payment section content - moved inside the cell
    doc.setFontSize(9);
    
    // Content positioned inside the Payment cell
    doc.text('OR No.', margin + contentWidth / 2 + 5, paymentBoxY + 15);
    drawUnderline(doc, margin + contentWidth / 2 + 20, paymentBoxY + 15, contentWidth / 2 - 25);
    
    doc.text('Date:', margin + contentWidth / 2 + 5, paymentBoxY + 20);
    drawUnderline(doc, margin + contentWidth / 2 + 20, paymentBoxY + 20, contentWidth / 2 - 25);
    
    doc.text('Payment Received by:', margin + contentWidth / 2 + 5, paymentBoxY + 25);
    
    // Position name above the line
    doc.setFontSize(8);
    doc.text('Leah I. Loteyro', margin + contentWidth * 0.75, paymentBoxY + 27.5, { align: 'center' });
    drawUnderline(doc, margin + contentWidth / 2 + 5, paymentBoxY + 29, contentWidth / 2 - 10);
    // Position job title below the line
    doc.text('Cashier', margin + contentWidth * 0.75, paymentBoxY + 31, { align: 'center' });
    
    // Receipt of completed work
    doc.setFontSize(9);
    doc.text('Receipt of Completed Work', margin + contentWidth / 2 + 5, paymentBoxY + 37);
    doc.text('Received by:', margin + contentWidth / 2 + 5, paymentBoxY + 42);
    
    drawUnderline(doc, margin + contentWidth / 2 + 5, paymentBoxY + 45, contentWidth / 2 - 10);
    doc.setFontSize(8);
    doc.text('(Signature over printed name of Client)', margin + contentWidth * 0.75, paymentBoxY + 48, { align: 'center' });
    
    doc.text('Date:', margin + contentWidth / 2 + 5, paymentBoxY + 52);
    drawUnderline(doc, margin + contentWidth / 2 + 17, paymentBoxY + 52, contentWidth / 2 - 22);
    
    // Save the PDF
    doc.save(`Job_Order_${paymentData.orderNumber || 'New'}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('An error occurred while generating the PDF. Please try again.');
  }
};

export default downloadJobPaymentPDF;