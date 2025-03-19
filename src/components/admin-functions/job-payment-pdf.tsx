import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  AutoTableResult,
  AutoTableColumnOption
} from '@/components/admin-functions/pdf-types';


// Define interfaces for JobPayment data
interface ServiceItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  description?: string;
}


interface Client {
  name: string;
  email: string;
  phone?: string;
  address?: string;
  role: string;
}


interface JobPayment {
  id: number;
  invoiceNumber: string;
  dateIssued: string;
  datePaid?: string;
  dueDate: string;
  paymentStatus: string;
  items: ServiceItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  notes?: string;
  client: Client;
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
 * Generates a PDF for a job payment using browser print capabilities
 * This is a fallback method that uses HTML and browser printing
 * @param paymentData - The job payment data
 */
const generatePrintPDF = (paymentData: JobPayment): void => {
  // Create a new window for printing
  const printWindow = window.open('', '_blank', 'width=800,height=600');
 
  if (!printWindow) {
    alert('Please allow pop-ups to generate the PDF');
    return;
  }
 
  // Create the HTML content for printing
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice #${paymentData.invoiceNumber}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        .header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
        }
        .company-info {
          text-align: left;
        }
        .invoice-info {
          text-align: right;
        }
        .invoice-title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #143370;
        }
        .client-info {
          margin-bottom: 30px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 10px;
          text-align: left;
        }
        th {
          background-color: #f5f5f5;
        }
        .amount-table {
          width: 40%;
          margin-left: auto;
        }
        .amount-table th {
          text-align: right;
        }
        .amount-table td {
          text-align: right;
        }
        .paid-badge {
          color: white;
          background-color: #4CAF50;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          display: inline-block;
          margin-left: 10px;
        }
        .unpaid-badge {
          color: white;
          background-color: #ff9800;
          padding: 5px 10px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          display: inline-block;
          margin-left: 10px;
        }
        .notes {
          margin-top: 30px;
          border-top: 1px solid #ddd;
          padding-top: 10px;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
        @media print {
          .no-print { display: none; }
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="padding: 10px; background: #f0f0f0; margin-bottom: 20px;">
        <button onclick="window.print()" style="padding: 8px 12px;">Print PDF</button>
        <button onclick="window.close()" style="padding: 8px 12px; margin-left: 10px;">Close</button>
      </div>
     
      <div class="header">
        <div class="company-info">
          <h2>Fabrication Laboratory</h2>
          <p>Philippine Science High School-Eastern Visayas Campus<br>
          AH26 Brgy. Pawing, Palo, Leyte 6501</p>
        </div>
       
        <div class="invoice-info">
          <div class="invoice-title">
            INVOICE
            <span class="${paymentData.paymentStatus === 'Paid' ? 'paid-badge' : 'unpaid-badge'}">
              ${paymentData.paymentStatus}
            </span>
          </div>
          <p><strong>Invoice #:</strong> ${paymentData.invoiceNumber}</p>
          <p><strong>Date Issued:</strong> ${formatDate(paymentData.dateIssued)}</p>
          <p><strong>Due Date:</strong> ${formatDate(paymentData.dueDate)}</p>
          ${paymentData.datePaid ? `<p><strong>Date Paid:</strong> ${formatDate(paymentData.datePaid)}</p>` : ''}
        </div>
      </div>
     
      <div class="client-info">
        <h3>Bill To:</h3>
        <p><strong>${paymentData.client.name}</strong><br>
        ${paymentData.client.email}<br>
        ${paymentData.client.phone || ''}<br>
        ${paymentData.client.address || ''}</p>
      </div>
     
      <table>
        <thead>
          <tr>
            <th>Item</th>
            <th>Description</th>
            <th>Quantity</th>
            <th>Unit Price</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          ${paymentData.items.map(item => `
            <tr>
              <td>${item.name}</td>
              <td>${item.description || ''}</td>
              <td>${item.quantity}</td>
              <td>${formatCurrency(item.unitPrice)}</td>
              <td>${formatCurrency(item.totalPrice)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
     
      <table class="amount-table">
        <tr>
          <th>Subtotal:</th>
          <td>${formatCurrency(paymentData.subtotal)}</td>
        </tr>
        <tr>
          <th>Tax (${paymentData.taxRate}%):</th>
          <td>${formatCurrency(paymentData.taxAmount)}</td>
        </tr>
        <tr>
          <th>Total:</th>
          <td>${formatCurrency(paymentData.totalAmount)}</td>
        </tr>
        <tr>
          <th>Amount Paid:</th>
          <td>${formatCurrency(paymentData.amountPaid)}</td>
        </tr>
        <tr>
          <th>Balance Due:</th>
          <td>${formatCurrency(paymentData.balanceDue)}</td>
        </tr>
      </table>
     
      ${paymentData.notes ? `
        <div class="notes">
          <h3>Notes</h3>
          <p>${paymentData.notes}</p>
        </div>
      ` : ''}
     
      <div class="footer">
        <p>If you have any questions about this invoice, please contact us.</p>
        <p>Thank you for your business!</p>
      </div>
    </body>
    </html>
  `;
 
  // Write to the new window and trigger the print dialog
  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
 
  // Focus the new window
  printWindow.focus();
};


/**
 * Main function to generate and download a PDF invoice for a job payment
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
   
    // Check if autoTable is available
    if (typeof autoTable !== 'function') {
      console.warn('jspdf-autotable function not available, falling back to browser print');
      generatePrintPDF(paymentData);
      return;
    }
   
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
   
    // Add company info
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Fabrication Laboratory', margin, 20);
   
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Philippine Science High School-Eastern Visayas Campus', margin, 25);
    doc.text('AH26 Brgy. Pawing, Palo, Leyte 6501', margin, 30);
   
    // Add invoice info
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth - margin, 20, { align: 'right' });
   
    // Add invoice status badge
    const statusText = paymentData.paymentStatus;
    const statusFontSize = 10;
    doc.setFontSize(statusFontSize);
    doc.setFont('helvetica', 'bold');
   
    // Set fill color based on status
    if (paymentData.paymentStatus === 'Paid') {
      doc.setFillColor(76, 175, 80); // Green
    } else {
      doc.setFillColor(255, 152, 0); // Orange/Amber
    }
   
    // Calculate status badge position
    const textWidth = doc.getTextWidth(statusText);
    const badgePadding = 4;
    const badgeWidth = textWidth + (badgePadding * 2);
    const badgeHeight = statusFontSize + (badgePadding * 0.8);
    const badgeX = pageWidth - margin - badgeWidth;
    const badgeY = 22 - badgeHeight + 1;
   
    // Draw badge rectangle and text
    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 2, 2, 'F');
    doc.setTextColor(255, 255, 255); // White
    doc.text(statusText, badgeX + badgePadding, 22);
   
    // Reset text color
    doc.setTextColor(0, 0, 0);
   
    // Add invoice details
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice #:', pageWidth - margin, 30, { align: 'right' });
    doc.text('Date Issued:', pageWidth - margin, 35, { align: 'right' });
    doc.text('Due Date:', pageWidth - margin, 40, { align: 'right' });
   
    doc.setFont('helvetica', 'normal');
    doc.text(paymentData.invoiceNumber, pageWidth - margin - 22, 30, { align: 'right' });
    doc.text(formatDate(paymentData.dateIssued), pageWidth - margin - 22, 35, { align: 'right' });
    doc.text(formatDate(paymentData.dueDate), pageWidth - margin - 22, 40, { align: 'right' });
   
    if (paymentData.datePaid) {
      doc.setFont('helvetica', 'bold');
      doc.text('Date Paid:', pageWidth - margin, 45, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      doc.text(formatDate(paymentData.datePaid), pageWidth - margin - 22, 45, { align: 'right' });
    }
   
    // Add billing info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', margin, 50);
   
    doc.setFontSize(10);
    doc.text(paymentData.client.name, margin, 55);
    doc.setFont('helvetica', 'normal');
    doc.text(paymentData.client.email, margin, 60);
   
    if (paymentData.client.phone) {
      doc.text(paymentData.client.phone, margin, 65);
    }
   
    if (paymentData.client.address) {
      doc.text(paymentData.client.address, margin, paymentData.client.phone ? 70 : 65);
    }
   
    // Add items table
    const tableHeaders: AutoTableColumnOption[] = [
      { content: 'Item', styles: { halign: 'left', fontStyle: 'bold' } },
      { content: 'Description', styles: { halign: 'left', fontStyle: 'bold' } },
      { content: 'Quantity', styles: { halign: 'center', fontStyle: 'bold' } },
      { content: 'Unit Price', styles: { halign: 'right', fontStyle: 'bold' } },
      { content: 'Total', styles: { halign: 'right', fontStyle: 'bold' } }
    ];
   
    const tableRows: AutoTableColumnOption[][] = paymentData.items.map(item => [
      { content: item.name, styles: { halign: 'left' } },
      { content: item.description || '', styles: { halign: 'left' } },
      { content: item.quantity.toString(), styles: { halign: 'center' } },
      { content: formatCurrency(item.unitPrice), styles: { halign: 'right' } },
      { content: formatCurrency(item.totalPrice), styles: { halign: 'right' } }
    ]);
   
    try {
      const result = autoTable(doc, {
        startY: 80,
        head: [tableHeaders],
        body: tableRows,
        theme: 'grid',
        styles: { fontSize: 9 },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 20 },
          3: { cellWidth: 30 },
          4: { cellWidth: 30 }
        }
      });
     
      // Get the ending Y position from the items table
      let yPosition = result.finalY || 150;
     
      // Add payment summary table
      const summaryTable = [
        [
          { content: 'Subtotal:', styles: { fontStyle: 'bold', halign: 'right' } },
          { content: formatCurrency(paymentData.subtotal), styles: { halign: 'right' } }
        ],
        [
          { content: `Tax (${paymentData.taxRate}%):`, styles: { fontStyle: 'bold', halign: 'right' } },
          { content: formatCurrency(paymentData.taxAmount), styles: { halign: 'right' } }
        ],
        [
          { content: 'Total:', styles: { fontStyle: 'bold', halign: 'right' } },
          { content: formatCurrency(paymentData.totalAmount), styles: { halign: 'right' } }
        ],
        [
          { content: 'Amount Paid:', styles: { fontStyle: 'bold', halign: 'right' } },
          { content: formatCurrency(paymentData.amountPaid), styles: { halign: 'right' } }
        ],
        [
          { content: 'Balance Due:', styles: { fontStyle: 'bold', halign: 'right' } },
          { content: formatCurrency(paymentData.balanceDue), styles: { halign: 'right' } }
        ]
      ];
     
      // Calculate width for summary table (40% of page width)
      const summaryWidth = contentWidth * 0.4;
      const summaryX = pageWidth - margin - summaryWidth;
     
      // Add summary table
      const summaryResult = autoTable(doc, {
        startY: yPosition + 10,
        head: [],
        body: summaryTable,
        theme: 'grid',
        styles: { fontSize: 9 },
        margin: { left: summaryX },
        tableWidth: summaryWidth
      });
     
      yPosition = summaryResult.finalY || (yPosition + 40);
     
      // Add notes if present
      if (paymentData.notes) {
        yPosition += 10;
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('Notes', margin, yPosition);
       
        const notesTable = [
          [{ content: paymentData.notes }]
        ];
       
        const notesResult = autoTable(doc, {
          startY: yPosition + 5,
          head: [],
          body: notesTable,
          theme: 'plain',
          styles: { fontSize: 9 },
          margin: { left: margin, right: margin }
        });
       
        yPosition = notesResult.finalY || (yPosition + 20);
      }
     
      // Add footer
      yPosition = Math.min(yPosition + 15, pageHeight - 20);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('If you have any questions about this invoice, please contact us.', pageWidth / 2, yPosition, { align: 'center' });
      doc.text('Thank you for your business!', pageWidth / 2, yPosition + 5, { align: 'center' });
     
      // Save the PDF
      doc.save(`Invoice_${paymentData.invoiceNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF with tables:', error);
      // Fall back to browser print method if any error occurs
      generatePrintPDF(paymentData);
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Fall back to browser print method
    generatePrintPDF(paymentData);
  }
};