import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  AutoTableResult,
  AutoTableColumnOption
} from "@/components/admin-functions/pdf-types";

// Define interfaces for DetailedReservation
interface UserService {
  id: string;
  ServiceAvail: string;
  EquipmentAvail: string;
  CostsAvail: number | string | null;
  MinsAvail: number | null;
}

interface UserTool {
  id: string;
  ToolUser: string;
  ToolQuantity: number;
}

interface UtilTime {
  id: number;
  DayNum: number | null;
  StartTime: string | null;
  EndTime: string | null;
}

interface ClientInfo {
  ContactNum: string;
  Address: string;
  City: string;
  Province: string;
  Zipcode: number;
}

interface BusinessInfo {
  CompanyName: string;
  BusinessOwner: string;
  BusinessPermitNum: string;
  TINNum: string;
  CompanyIDNum: string;
  CompanyEmail: string;
  ContactPerson: string;
  Designation: string;
  CompanyAddress: string;
  CompanyCity: string;
  CompanyProvince: string;
  CompanyZipcode: number;
  CompanyPhoneNum: string;
  CompanyMobileNum: string;
  Manufactured: string;
  ProductionFrequency: string;
  Bulk: string;
}

interface AccountInfo {
  Name: string;
  email: string;
  Role: string;
  ClientInfo?: ClientInfo;
  BusinessInfo?: BusinessInfo;
}

interface DetailedReservation {
  id: number;
  Status: string;
  RequestDate: string;
  TotalAmntDue: number | string | null;
  BulkofCommodity: string | null;
  UserServices: UserService[];
  UserTools: UserTool[];
  UtilTimes: UtilTime[];
  accInfo: AccountInfo;
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
 * Format time for display
 * @param timeString - Time string to format
 * @returns Formatted time string
 */
const formatTime = (timeString: string | null | undefined): string => {
  if (!timeString) return '';
  try {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
};

/**
 * Format day number to day name
 * @param dayNum - Day number (0-6, where 0 is Sunday)
 * @returns Day name
 */
const formatDayName = (dayNum: number | null): string => {
  // Format day number to day name
  if (dayNum === null || dayNum === undefined) return '';
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const index = typeof dayNum === 'number' ? dayNum % 7 : 0;
  return days[index]; // Ensure value is within 0-6 range
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
  doc.text(text, textX, textY, { align });
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
 * Generates a PDF for a job payment using browser print capabilities
 * This is a fallback method that uses HTML and browser printing
 * @param reservationData - The detailed reservation data
 */
const generatePrintPDF = (reservationData: DetailedReservation): void => {
  // Create a new window for printing
  const printWindow = window.open('', '_blank', 'width=800,height=600');
 
  if (!printWindow) {
    alert('Please allow pop-ups to generate the PDF');
    return;
  }
  
  // Create content for the print window
  printWindow.document.write(`
    <html>
      <head>
        <title>Job Order - ${reservationData.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1, h2 { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          th, td { border: 1px solid #000; padding: 8px; }
          th { background-color: #f2f2f2; }
          .header { text-align: center; margin-bottom: 20px; }
          .section { margin-top: 20px; font-weight: bold; }
          .signature-line { border-top: 1px solid #000; margin-top: 50px; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PHILIPPINE SCIENCE HIGH SCHOOL - EASTERN VISAYAS CAMPUS</h1>
          <p>Arl26 Brgy. Pawing, Palo, Leyte</p>
          <h2>PSHS-EVC Fabrication Laboratory</h2>
          <h2>JOB AND PAYMENT ORDER</h2>
        </div>
        
        <p><strong>No.:</strong> ${reservationData.id}</p>
        <p><strong>Date:</strong> ${formatDate(reservationData.RequestDate)}</p>
        
        <p><strong>Client's Name:</strong> ${reservationData.accInfo.Name}</p>
        <p><strong>Address:</strong> ${reservationData.accInfo.ClientInfo ? 
          `${reservationData.accInfo.ClientInfo.Address}, ${reservationData.accInfo.ClientInfo.City}, ${reservationData.accInfo.ClientInfo.Province}, ${reservationData.accInfo.ClientInfo.Zipcode}` : 
          reservationData.accInfo.BusinessInfo ? 
          `${reservationData.accInfo.BusinessInfo.CompanyAddress}, ${reservationData.accInfo.BusinessInfo.CompanyCity}, ${reservationData.accInfo.BusinessInfo.CompanyProvince}, ${reservationData.accInfo.BusinessInfo.CompanyZipcode}` : 
          ''}
        </p>
        
        <div class="section">Client Profile</div>
        <p>
          ${reservationData.accInfo.Role.toLowerCase().includes('student') ? '☑' : '☐'} Student<br>
          ${reservationData.accInfo.BusinessInfo ? '☑' : '☐'} MSME<br>
          ${!reservationData.accInfo.Role.toLowerCase().includes('student') && !reservationData.accInfo.BusinessInfo ? '☑' : '☐'} Others, specify: ${reservationData.accInfo.Role}
        </p>
        
        <div class="section">Description of Project</div>
        <p>${reservationData.BulkofCommodity || ''}</p>
        
        <div class="section">Details of the Services to be rendered</div>
        <table>
          <tr>
            <th>Services</th>
            <th>Minutes/Cost per minute</th>
            <th>Total Cost</th>
          </tr>
          ${reservationData.UserServices && reservationData.UserServices.length > 0 ? 
            reservationData.UserServices.map(service => `
              <tr>
                <td>${service.ServiceAvail} ${service.EquipmentAvail ? `(${service.EquipmentAvail})` : ''}</td>
                <td>${service.MinsAvail || 0}</td>
                <td>${formatCurrency(service.CostsAvail)}</td>
              </tr>
            `).join('') : 
            '<tr><td colspan="3">No services selected</td></tr>'
          }
          ${reservationData.UserTools && reservationData.UserTools.length > 0 ? 
            reservationData.UserTools.map(tool => `
              <tr>
                <td>Tool: ${tool.ToolUser} (Qty: ${tool.ToolQuantity})</td>
                <td></td>
                <td></td>
              </tr>
            `).join('') : ''
          }
          <tr>
            <th colspan="2">Total Amount Due</th>
            <td>${formatCurrency(reservationData.TotalAmntDue)}</td>
          </tr>
        </table>
        
        <p><strong>Reservation Times:</strong></p>
        <ul>
          ${reservationData.UtilTimes && reservationData.UtilTimes.length > 0 ? 
            reservationData.UtilTimes.map(time => `
              <li>${formatDayName(time.DayNum)}: ${formatTime(time.StartTime)} - ${formatTime(time.EndTime)}</li>
            `).join('') : 
            '<li>No times specified</li>'
          }
        </ul>
        
        <p>I, hereby understand and agree to the terms and conditions set forth by PSHS-EVC FabLab.</p>
        
        <table>
          <tr>
            <td width="50%">
              <div class="signature-line">
                <p style="text-align: center;">(Signature over printed name of Client)</p>
                <p>Date: ____________________</p>
              </div>
            </td>
            <td width="50%">
              <div class="signature-line">
                <p style="text-align: center;">Cyril D. Tapales</p>
                <p style="text-align: center;">PSHS-EVC FabLab SRA</p>
                <p>Date: ____________________</p>
              </div>
            </td>
          </tr>
        </table>
        
        <table>
          <tr>
            <th>Order of Payment</th>
            <th>Payment</th>
          </tr>
          <tr>
            <td>
              <p>Please issue an Official Receipt in favor of</p>
              <p>${reservationData.accInfo.Name}</p>
              <p>for the amount of</p>
              <p>${formatCurrency(reservationData.TotalAmntDue)}</p>
              <br>
              <p>Approved by:</p>
              <div class="signature-line">
                <p style="text-align: center;">Cynthia C. Ocaña, D.M.</p>
                <p style="text-align: center;">FAD Chief</p>
              </div>
              <p>Date: ____________________</p>
            </td>
            <td>
              <p>OR No. ____________________</p>
              <p>Date: ____________________</p>
              <p>Payment Received by:</p>
              <div class="signature-line">
                <p style="text-align: center;">Leah I. Loteyro</p>
                <p style="text-align: center;">Cashier</p>
              </div>
              <p>Receipt of Completed Work</p>
              <p>Received by:</p>
              <div class="signature-line">
                <p style="text-align: center;">(Signature over printed name of Client)</p>
              </div>
              <p>Date: ____________________</p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `);
  
  // Close the document and trigger print
  printWindow.document.close();
  printWindow.setTimeout(() => {
    printWindow.print();
  }, 500);
};

/**
 * Main function to generate and download a PDF for a job payment order
 * @param reservationData - The detailed reservation data
 */
export const downloadJobPaymentPDF = (reservationData: DetailedReservation): void => {
  try {
    console.log('Starting job payment PDF generation with data:', reservationData);
    
    // Robust validation
    if (!reservationData) {
      console.error('Missing reservation data object');
      alert('Cannot generate PDF: No reservation data found');
      return;
    }
    
    if (!reservationData.accInfo) {
      console.error('Missing accInfo in reservation data');
      alert('Cannot generate PDF: Missing essential reservation data');
      return;
    }
    
    // Create safe objects with defaults
    const safeAccInfo = {
      Name: reservationData.accInfo.Name || 'Name Not Available',
      email: reservationData.accInfo.email || 'Email Not Available',
      Role: reservationData.accInfo.Role || 'Role Not Specified',
      ClientInfo: reservationData.accInfo.ClientInfo || {},
      BusinessInfo: reservationData.accInfo.BusinessInfo || {}
    };
    
    const safeServices = Array.isArray(reservationData.UserServices) ? reservationData.UserServices : [];
    const safeTools = Array.isArray(reservationData.UserTools) ? reservationData.UserTools : [];
    const safeTimes = Array.isArray(reservationData.UtilTimes) ? reservationData.UtilTimes : [];
    
    // Initialize jsPDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Check if autoTable is available
    if (typeof autoTable !== 'function') {
      console.warn('jspdf-autotable function not available, falling back to browser print');
      generatePrintPDF(reservationData);
      return;
    }
    
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
    doc.text(reservationData.id.toString() || '', pageWidth - margin - 15, 35);
    
    doc.text('Date:', pageWidth - margin - 20, 40);
    drawUnderline(doc, pageWidth - margin - 15, 40, 15);
    doc.text(formatDate(reservationData.RequestDate) || '', pageWidth - margin - 15, 40);
    
    // Client information
    doc.setFontSize(10);
    doc.text('Client\'s Name:', margin, 50);
    drawUnderline(doc, margin + 25, 50, contentWidth - 25);
    doc.text(safeAccInfo.Name || '', margin + 25, 50);
    
    doc.text('Address:', margin, 55);
    
    // Safely access nested properties
    let address = '';
    try {
      if (safeAccInfo.ClientInfo) {
        const clientInfo = safeAccInfo.ClientInfo;
        const addressParts = [];
        if (typeof clientInfo === 'object') {
          if ('Address' in clientInfo) addressParts.push(clientInfo.Address);
          if ('City' in clientInfo) addressParts.push(clientInfo.City);
          if ('Province' in clientInfo) addressParts.push(clientInfo.Province);
          if ('Zipcode' in clientInfo) addressParts.push(String(clientInfo.Zipcode));
        }
        address = addressParts.join(', ');
      } else if (safeAccInfo.BusinessInfo) {
        const businessInfo = safeAccInfo.BusinessInfo;
        const addressParts = [];
        if (typeof businessInfo === 'object') {
          if ('CompanyAddress' in businessInfo) addressParts.push(businessInfo.CompanyAddress);
          if ('CompanyCity' in businessInfo) addressParts.push(businessInfo.CompanyCity);
          if ('CompanyProvince' in businessInfo) addressParts.push(businessInfo.CompanyProvince);
          if ('CompanyZipcode' in businessInfo) addressParts.push(String(businessInfo.CompanyZipcode));
        }
        address = addressParts.join(', ');
      }
    } catch (error) {
      console.error('Error formatting address:', error);
    }
    
    drawUnderline(doc, margin + 18, 55, contentWidth - 18);
    doc.text(address, margin + 18, 55);
    
    // Client profile and project description sections
    const sectionY = 65;
    const sectionHeight = 25;
    
    // Section headers
    drawCell(doc, 'Client Profile', margin, sectionY, contentWidth / 2, 7, 'center', true, [240, 240, 240], 10, 'bold');
    drawCell(doc, 'Description of Project', margin + contentWidth / 2, sectionY, contentWidth / 2, 7, 'center', true, [240, 240, 240], 10, 'bold');
    
    // Client profile section
    drawCell(doc, '', margin, sectionY + 7, contentWidth / 2, sectionHeight - 7, 'left', false);
    
    // Draw checkboxes
    const checkboxX = margin + 5;
    const isStudent = safeAccInfo.Role.toLowerCase().includes('student');
    const isBusiness = safeAccInfo.BusinessInfo && Object.keys(safeAccInfo.BusinessInfo).length > 0;
    const isOther = !isStudent && !isBusiness;
    
    drawCheckbox(doc, checkboxX, sectionY + 12, 3, isStudent);
    doc.text('Student', checkboxX + 5, sectionY + 13.5);
    
    drawCheckbox(doc, checkboxX, sectionY + 18, 3, isBusiness);
    doc.text('MSME', checkboxX + 5, sectionY + 19.5);
    
    drawCheckbox(doc, checkboxX, sectionY + 24, 3, isOther);
    doc.text('Others, specify:', checkboxX + 5, sectionY + 25.5);
    
    drawUnderline(doc, checkboxX + 28, sectionY + 25.5, contentWidth / 2 - 33);
    if (isOther) {
      doc.text(safeAccInfo.Role || '', checkboxX + 28, sectionY + 25.5);
    }
    
    // Project description section
    drawCell(doc, '', margin + contentWidth / 2, sectionY + 7, contentWidth / 2, sectionHeight - 7, 'left', false);
    
    // Add commodity information if available
    if (reservationData.BulkofCommodity) {
      doc.setFontSize(9);
      doc.text('Commodity: ' + (reservationData.BulkofCommodity || ''), margin + contentWidth / 2 + 3, sectionY + 13);
    }
    
    // If it's a business, add manufacturing details
    if (safeAccInfo.BusinessInfo && Object.keys(safeAccInfo.BusinessInfo).length > 0) {
      doc.setFontSize(9);
      try {
        const businessInfo = safeAccInfo.BusinessInfo;
        if (typeof businessInfo === 'object') {
          // Safe access to Manufactured property
          let product = '';
          if ('Manufactured' in businessInfo && businessInfo.Manufactured !== undefined) {
            product = businessInfo.Manufactured;
          }
          doc.text('Product: ' + product, margin + contentWidth / 2 + 3, sectionY + 18);
          
          // Safe access to ProductionFrequency property
          let frequency = '';
          if ('ProductionFrequency' in businessInfo && businessInfo.ProductionFrequency !== undefined) {
            frequency = businessInfo.ProductionFrequency;
          }
          doc.text('Production: ' + frequency, margin + contentWidth / 2 + 3, sectionY + 23);
        }
      } catch (error) {
        console.error('Error displaying business info:', error);
      }
    }
    
    // Services section
    const servicesY = sectionY + sectionHeight + 5;
    
    // Services header
    drawCell(doc, 'Details of the Services to be rendered', margin, servicesY, contentWidth, 7, 'center', true, [240, 240, 240], 10, 'bold');
    
    // Services table headers
    drawCell(doc, 'Services', margin, servicesY + 7, contentWidth * 0.5, 7, 'center', true, [240, 240, 240], 10, 'normal');
    drawCell(doc, 'Minutes/', margin + contentWidth * 0.5, servicesY + 7, contentWidth * 0.2, 7, 'center', true, [240, 240, 240], 10, 'normal');
    drawCell(doc, 'Cost per', margin + contentWidth * 0.5, servicesY + 10, contentWidth * 0.2, 4, 'center', true, [240, 240, 240], 10, 'normal');
    drawCell(doc, 'minute', margin + contentWidth * 0.5, servicesY + 13, contentWidth * 0.2, 1, 'center', true, [240, 240, 240], 10, 'normal');
    drawCell(doc, 'Total Cost', margin + contentWidth * 0.7, servicesY + 7, contentWidth * 0.3, 7, 'center', true, [240, 240, 240], 10, 'normal');
    
    // Services rows
    const rowHeight = 8;
    let currentY = servicesY + 14;
    
    // Draw empty row if no items
    if (safeServices.length === 0) {
      drawCell(doc, '', margin, currentY, contentWidth * 0.5, rowHeight, 'left');
      drawCell(doc, '', margin + contentWidth * 0.5, currentY, contentWidth * 0.2, rowHeight, 'center');
      drawCell(doc, '', margin + contentWidth * 0.7, currentY, contentWidth * 0.3, rowHeight, 'right');
      currentY += rowHeight;
    } else {
      // Draw service rows
      safeServices.forEach((service) => {
        const serviceDisplay = service.EquipmentAvail 
          ? `${service.ServiceAvail} (${service.EquipmentAvail})`
          : service.ServiceAvail;
          
        drawCell(doc, serviceDisplay, margin, currentY, contentWidth * 0.5, rowHeight, 'left');
        drawCell(doc, service.MinsAvail?.toString() || '', margin + contentWidth * 0.5, currentY, contentWidth * 0.2, rowHeight, 'center');
        drawCell(doc, formatCurrency(service.CostsAvail), margin + contentWidth * 0.7, currentY, contentWidth * 0.3, rowHeight, 'right');
        currentY += rowHeight;
      });
    }
    
    // Add tools if available
    if (safeTools.length > 0) {
      safeTools.forEach((tool) => {
        const toolDisplay = `Tool: ${tool.ToolUser} (Qty: ${tool.ToolQuantity})`;
        drawCell(doc, toolDisplay, margin, currentY, contentWidth * 0.5, rowHeight, 'left');
        drawCell(doc, '', margin + contentWidth * 0.5, currentY, contentWidth * 0.2, rowHeight, 'center');
        drawCell(doc, '', margin + contentWidth * 0.7, currentY, contentWidth * 0.3, rowHeight, 'right');
        currentY += rowHeight;
      });
    }
    
    // Total amount due row
    drawCell(doc, 'Total Amount Due', margin, currentY, contentWidth * 0.7, rowHeight, 'center', true, [240, 240, 240], 10, 'bold');
    drawCell(doc, formatCurrency(reservationData.TotalAmntDue), margin + contentWidth * 0.7, currentY, contentWidth * 0.3, rowHeight, 'right');
    
    currentY += rowHeight + 10;
    
    // Reservation times
    if (safeTimes.length > 0) {
      doc.text('Reservation Times:', margin, currentY);
      currentY += 5;
      
      safeTimes.forEach((time, index) => {
        try {
          const dayName = formatDayName(time.DayNum);
          const startTime = formatTime(time.StartTime || '');
          const endTime = formatTime(time.EndTime || '');
          const timeText = `${dayName}: ${startTime} - ${endTime}`;
          doc.text(timeText, margin + 5, currentY);
          currentY += 5;
        } catch (error) {
          console.error('Error displaying time:', error);
        }
      });
      
      currentY += 5;
    } else {
      // Completion date placeholder
      doc.text('Completion Date:', margin, currentY);
      drawUnderline(doc, margin + 30, currentY, contentWidth - 30);
      currentY += 10;
    }
    
    // Check if we need to add a new page for signatures
    if (currentY > pageHeight - 80) {
      doc.addPage();
      currentY = 20;
    }
    
    // Terms and conditions acceptance
    doc.setFontSize(9);
    const termsText = 'I, hereby understand and agree to the terms and';
    doc.text(termsText, margin, currentY);
    
    doc.text('Evaluated by:', margin + contentWidth - 40, currentY);
    
    currentY += 5;
    
    doc.text('conditions set forth by PSHS-EVC FabLab.', margin, currentY);
    
    drawUnderline(doc, margin + contentWidth - 40, currentY, 40);
    doc.setFontSize(8);
    doc.text('Cyril D. Tapales', margin + contentWidth - 40, currentY + 3, { align: 'center' });
    doc.text('PSHS-EVC FabLab SRA', margin + contentWidth - 40, currentY + 7, { align: 'center' });
    
    currentY += 15;
    
    // Client signature line
    drawUnderline(doc, margin, currentY, contentWidth / 2 - 10);
    doc.setFontSize(8);
    doc.text('(Signature over printed name of Client)', margin, currentY + 3, { align: 'center' });
    doc.text('Date:', margin, currentY + 7);
    drawUnderline(doc, margin + 10, currentY + 7, contentWidth / 2 - 20);
    
    doc.text('Date:', margin + contentWidth - 40, currentY + 7);
    drawUnderline(doc, margin + contentWidth - 30, currentY + 7, 30);
    
    currentY += 15;
    
    // Check if we need to add a new page for payment section
    if (currentY > pageHeight - 65) {
      doc.addPage();
      currentY = 20;
    }
    
    // Payment section
    const paymentBoxY = currentY;
    const paymentBoxHeight = 50;
    
    // Payment section headers
    drawCell(doc, 'Order of Payment', margin, paymentBoxY, contentWidth / 2, 7, 'center', true, [240, 240, 240], 10, 'bold');
    drawCell(doc, 'Payment', margin + contentWidth / 2, paymentBoxY, contentWidth / 2, 7, 'center', true, [240, 240, 240], 10, 'bold');
    
    // Payment order section
    drawCell(doc, '', margin, paymentBoxY + 7, contentWidth / 2, paymentBoxHeight - 7, 'left');
    
    // Payment details section
    drawCell(doc, '', margin + contentWidth / 2, paymentBoxY + 7, contentWidth / 2, paymentBoxHeight - 7, 'left');
    
    // Payment order content
    doc.setFontSize(9);
    doc.text('Please issue an Official Receipt in favor of', margin + 3, paymentBoxY + 12);
    
    drawUnderline(doc, margin + 3, paymentBoxY + 17, contentWidth / 2 - 6);
    doc.text(safeAccInfo.Name, margin + 3, paymentBoxY + 17);
    
    doc.text('for the amount of', margin + 3, paymentBoxY + 22);
    
    drawUnderline(doc, margin + 3, paymentBoxY + 27, contentWidth / 2 - 6);
    doc.text(formatCurrency(reservationData.TotalAmntDue), margin + 3, paymentBoxY + 27);
    
    drawUnderline(doc, margin + 3, paymentBoxY + 32, contentWidth / 2 - 6);
    
    // Approval section
    doc.text('Approved by:', margin + 3, paymentBoxY + 40);
    
    drawUnderline(doc, margin + 30, paymentBoxY + 40, contentWidth / 2 - 33);
    doc.setFontSize(8);
    doc.text('Cynthia C. Ocaña, D.M.', margin + (contentWidth / 4), paymentBoxY + 43, { align: 'center' });
    doc.text('FAD Chief', margin + (contentWidth / 4), paymentBoxY + 47, { align: 'center' });
    
    doc.text('Date:', margin + 3, paymentBoxY + 52);
    drawUnderline(doc, margin + 15, paymentBoxY + 52, contentWidth / 2 - 18);
    
    // Payment section content
    doc.setFontSize(9);
    doc.text('OR No.', margin + contentWidth / 2 + 3, paymentBoxY + 12);
    drawUnderline(doc, margin + contentWidth / 2 + 20, paymentBoxY + 12, contentWidth / 2 - 23);
    
    doc.text('Date:', margin + contentWidth / 2 + 3, paymentBoxY + 17);
    drawUnderline(doc, margin + contentWidth / 2 + 20, paymentBoxY + 17, contentWidth / 2 - 23);
    
    doc.text('Payment Received by:', margin + contentWidth / 2 + 3, paymentBoxY + 22);
    
    drawUnderline(doc, margin + contentWidth / 2 + 3, paymentBoxY + 27, contentWidth / 2 - 6);
    doc.setFontSize(8);
    doc.text('Leah I. Loteyro', margin + contentWidth * 0.75, paymentBoxY + 30, { align: 'center' });
    doc.text('Cashier', margin + contentWidth * 0.75, paymentBoxY + 34, { align: 'center' });
    
    // Receipt of completed work
    doc.setFontSize(9);
    doc.text('Receipt of Completed Work', margin + contentWidth / 2 + 3, paymentBoxY + 40);
    doc.text('Received by:', margin + contentWidth / 2 + 3, paymentBoxY + 45);
    
    drawUnderline(doc, margin + contentWidth / 2 + 3, paymentBoxY + 50, contentWidth / 2 - 6);
    doc.setFontSize(8);
    doc.text('(Signature over printed name of Client)', margin + contentWidth * 0.75, paymentBoxY + 53, { align: 'center' });
    
    doc.text('Date:', margin + contentWidth / 2 + 3, paymentBoxY + 57);
    drawUnderline(doc, margin + contentWidth / 2 + 15, paymentBoxY + 57, contentWidth / 2 - 18);
    
    // Save the PDF
    try {
      doc.save(`Job_Order_${reservationData.id || 'New'}.pdf`);
      console.log('Job payment PDF saved successfully');
    } catch (saveError) {
      console.error('Error saving PDF:', saveError);
      alert('Error saving PDF. Please try again.');
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Fall back to browser print method if any error occurs
    try {
      generatePrintPDF(reservationData);
    } catch (printError) {
      console.error('Even fallback print failed:', printError);
      alert(`Unable to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};

export default downloadJobPaymentPDF;