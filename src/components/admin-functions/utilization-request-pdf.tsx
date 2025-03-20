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
  if (amount === null || amount === undefined) return '0.00';
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return Number(numAmount).toFixed(2);
};

/**
 * Format date for display in the form
 * @param dateString - Date string to format
 * @returns Formatted date string
 */
const formatDate = (dateString: string | null): string => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

/**
 * Format time for display in the form
 * @param timeString - Time string to format
 * @returns Formatted time string
 */
const formatTime = (timeString: string | null): string => {
  if (!timeString) return '';
  const date = new Date(timeString);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Generate a string with all service details
 * @param services - Array of UserService objects
 * @returns Formatted service details string
 */
const getServiceDetailsString = (services: UserService[]): string => {
  if (!services || services.length === 0) {
    return 'No services selected';
  }
 
  return services.map(service =>
    `Service: ${service.ServiceAvail}, Equipment: ${service.EquipmentAvail}, ` +
    `Duration: ${service.MinsAvail || 0} min, Cost: ₱${formatCurrency(service.CostsAvail)}`
  ).join('\n');
};

/**
 * Generates a PDF for a reservation using browser print capabilities
 * This is a fallback method that uses HTML and browser printing
 * @param reservationData - The reservation data
 */
const generatePrintPDF = (reservationData: DetailedReservation): void => {
  // Create service details string
  const serviceDetails = getServiceDetailsString(reservationData.UserServices || []);
 
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
      <title>Utilization Request Form</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          position: relative;
        }
        .logo-left {
          position: absolute;
          left: 20px;
          top: 0;
          width: 60px;
          height: 60px;
          border: 1px solid #000;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .logo-right {
          position: absolute;
          right: 20px;
          top: 0;
          width: 60px;
          height: 60px;
          border: 1px solid #000;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        h1 {
          font-size: 16px;
          margin-bottom: 5px;
        }
        h2 {
          font-size: 14px;
          margin-top: 5px;
          margin-bottom: 5px;
        }
        h3 {
          font-size: 12px;
          margin-top: 5px;
          margin-bottom: 15px;
          font-weight: normal;
        }
        .section-header {
          background-color: #ddd;
          padding: 5px;
          font-weight: bold;
          margin-top: 15px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 0;
        }
        th, td {
          border: 1px solid #000;
          padding: 5px;
          text-align: left;
        }
        .footer {
          margin-top: 30px;
          font-size: 12px;
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
        <div class="logo-left">LOGO</div>
        <div class="logo-right">DOST</div>
        <h1>FABRICATION LABORATORY SHARED SERVICE FACILITY</h1>
        <h2>UTILIZATION REQUEST FORM</h2>
        <h3>Philippine Science High School-Eastern Visayas Campus (PSHS-EVC)<br>AH26 Brgy. Pawing, Palo, Leyte 6501</h3>
      </div>
     
      <div class="section-header">BASIC INFORMATION</div>
      <table>
        <tr>
          <td width="50%"><strong>Name of Client(s) to Use Facility:</strong></td>
          <td width="50%"><strong>Position/Designation:</strong></td>
        </tr>
        <tr>
          <td>1. ${reservationData.accInfo?.Name || 'Name Not Available'}</td>
          <td>${reservationData.accInfo?.Role || 'Role Not Available'}</td>
        </tr>
        <tr>
          <td>2.</td>
          <td></td>
        </tr>
        <tr>
          <td>3.</td>
          <td></td>
        </tr>
        <tr>
          <td>4.</td>
          <td></td>
        </tr>
      </table>
     
      <div class="section-header">PROCESSING INFORMATION</div>
      <table>
        <tr>
          <td><strong>Service Type:</strong></td>
        </tr>
        <tr>
          <td>${serviceDetails}</td>
        </tr>
      </table>
     
      <table>
        <tr>
          <td><strong>Bulk of Commodity to be Processed<br>(in volume or weight):</strong></td>
        </tr>
        <tr>
          <td>${reservationData.BulkofCommodity || ''}</td>
        </tr>
      </table>
     
      <table>
        <tr>
          <td><strong>Tools to Use, Qty, & no. of hours:</strong></td>
        </tr>
        <tr>
          <td>${(reservationData.UserTools || []).map(tool =>
            `${tool.ToolUser} (Qty: ${tool.ToolQuantity})`
          ).join(', ') || ''}</td>
        </tr>
      </table>
     
      <table>
        <tr>
          <td width="50%"><strong>Request Date:</strong></td>
          <td width="50%"><strong>End Date:</strong></td>
        </tr>
        <tr>
          <td>${formatDate(reservationData.RequestDate)}</td>
          <td></td>
        </tr>
      </table>
     
      <table>
        <tr>
          <td width="50%"><strong>Day 1</strong></td>
          <td width="50%"><strong>Day 2</strong></td>
        </tr>
        <tr>
          <td>Start Time: ${formatTime((reservationData.UtilTimes || []).find(t => t.DayNum === 1)?.StartTime || null)}
              End Time: ${formatTime((reservationData.UtilTimes || []).find(t => t.DayNum === 1)?.EndTime || null)}</td>
          <td>Start Time: ${formatTime((reservationData.UtilTimes || []).find(t => t.DayNum === 2)?.StartTime || null)}
              End Time: ${formatTime((reservationData.UtilTimes || []).find(t => t.DayNum === 2)?.EndTime || null)}</td>
        </tr>
      </table>
     
      <table>
        <tr>
          <td width="50%"><strong>Day 3</strong></td>
          <td width="50%"><strong>Day 4</strong></td>
        </tr>
        <tr>
          <td>Start Time: ${formatTime((reservationData.UtilTimes || []).find(t => t.DayNum === 3)?.StartTime || null)}
              End Time: ${formatTime((reservationData.UtilTimes || []).find(t => t.DayNum === 3)?.EndTime || null)}</td>
          <td>Start Time: ${formatTime((reservationData.UtilTimes || []).find(t => t.DayNum === 4)?.StartTime || null)}
              End Time: ${formatTime((reservationData.UtilTimes || []).find(t => t.DayNum === 4)?.EndTime || null)}</td>
        </tr>
      </table>
     
      <table>
        <tr>
          <td width="50%"><strong>Date the processing of request was done:<br>Request processed by:</strong></td>
          <td width="50%"><strong>Name and Signature of employee:</strong></td>
        </tr>
        <tr>
          <td>${new Date().toLocaleDateString()}<br>${reservationData.accInfo?.Name || 'Name Not Available'}</td>
          <td>&nbsp;<br>&nbsp;</td>
        </tr>
      </table>
     
      <div class="footer">
        Generated on: ${new Date().toLocaleString()}
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
 * Main function to generate and download a PDF for a reservation
 * @param reservationData - The reservation data
 */
export const downloadPDF = (reservationData: DetailedReservation): void => {
  try {
    console.log('Starting utilization request PDF generation with data:', reservationData);
    
    // Robust validation - check if reservationData exists and has minimum required fields
    if (!reservationData) {
      console.error('Missing entire reservation data object');
      alert('Cannot generate PDF: No reservation data found');
      return;
    }
    
    // Check if accInfo exists at all
    if (!reservationData.accInfo) {
      console.error('Missing accInfo in reservation data');
      alert('Cannot generate PDF: Missing essential reservation data or account info');
      return;
    }
    
    // Create safe accInfo with defaults for all potentially missing properties
    const safeAccInfo = {
      Name: reservationData.accInfo.Name || 'Name Not Available',
      email: reservationData.accInfo.email || 'Email Not Available',
      Role: reservationData.accInfo.Role || 'Role Not Specified',
      ClientInfo: reservationData.accInfo.ClientInfo || {},
      BusinessInfo: reservationData.accInfo.BusinessInfo || {}
    };
    
    console.log('Using safe accInfo with defaults:', safeAccInfo);
    
    // Safe access to services, tools, and times
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
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);
   
    // Add headers and logos
    doc.setFontSize(13); // Smaller font size for the header
    doc.setFont('helvetica', 'bold');
    doc.text('FABRICATION LABORATORY SHARED SERVICE FACILITY', pageWidth / 2, 15, { align: 'center' });
   
    doc.setFontSize(14);
    doc.text('UTILIZATION REQUEST FORM', pageWidth / 2, 22, { align: 'center' });
   
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Philippine Science High School-Eastern Visayas Campus (PSHS-EVC)', pageWidth / 2, 28, { align: 'center' });
    doc.text('AH26 Brgy. Pawing, Palo, Leyte 6501', pageWidth / 2, 33, { align: 'center' });
   
    // Add logo placeholders - Use images instead of placeholder text
    try {
      // Left logo - Use the image path
      const leftLogoUrl = '/images/logos/left_logo.png';
      doc.addImage(leftLogoUrl, 'PNG', margin, 10, 20, 20);
    } catch (error) {
      console.error('Error adding left logo:', error);
      // Fallback to placeholder rectangle
      doc.rect(margin, 10, 20, 20);
      doc.text('LOGO', margin + 10, 22, { align: 'center' });
    }
   
    try {
      // Right logo - Use the image path
      const rightLogoUrl = '/images/logos/dti_logo.png';
      doc.addImage(rightLogoUrl, 'PNG', pageWidth - margin - 20, 10, 20, 20);
    } catch (error) {
      console.error('Error adding right logo:', error);
      // Fallback to placeholder rectangle
      doc.rect(pageWidth - margin - 20, 10, 20, 20);
      doc.text('DTI', pageWidth - margin - 10, 22, { align: 'center' });
    }
   
    // Add section header - BASIC INFORMATION
    doc.setFillColor(220, 220, 220);
    doc.rect(margin, 40, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('BASIC INFORMATION', margin + 2, 45);
   
    // Client names table
    const clientTableData: AutoTableColumnOption[][] = [
      [{ content: 'Name of Client(s) to Use Facility:', styles: { fontStyle: 'bold' } },
       { content: 'Position/Designation:', styles: { fontStyle: 'bold' } }],
      [{ content: '1. ' + safeAccInfo.Name }, { content: safeAccInfo.Role }],
      [{ content: '2.' }, { content: '' }],
      [{ content: '3.' }, { content: '' }],
      [{ content: '4.' }, { content: '' }]
    ];
   
    // Use autoTable as a standalone function for jsPDF 3.0.0+
    let yPosition = 48;
    try {
      const result = autoTable(doc, {
        startY: yPosition,
        head: [],
        body: clientTableData,
        theme: 'grid',
        styles: { fontSize: 10 },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: contentWidth / 2 },
          1: { cellWidth: contentWidth / 2 }
        }
      });
      yPosition = (result?.finalY) ? result.finalY : 70;
    } catch (error) {
      console.error('Error in first autoTable:', error);
      yPosition = 70;
    }
   
    // Add section header - PROCESSING INFORMATION
    doc.setFillColor(220, 220, 220);
    doc.rect(margin, yPosition, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('PROCESSING INFORMATION', margin + 2, yPosition + 5);
   
    // Service type - using our helper function
    const serviceDetails = getServiceDetailsString(safeServices);
   
    const serviceTableData: AutoTableColumnOption[][] = [
      [{ content: 'Service Type:', styles: { fontStyle: 'bold' } }],
      [{ content: serviceDetails }]
    ];
   
    try {
      const result = autoTable(doc, {
        startY: yPosition + 8,
        head: [],
        body: serviceTableData,
        theme: 'grid',
        styles: { fontSize: 10 },
        margin: { left: margin, right: margin }
      });
      yPosition = (result?.finalY) ? result.finalY : (yPosition + 15);
    } catch (error) {
      console.error('Error in service type table:', error);
      yPosition += 15;
    }
   
    // Bulk of commodity
    const bulkTableData: AutoTableColumnOption[][] = [
      [{ content: 'Bulk of Commodity to be Processed\n(in volume or weight):', styles: { fontStyle: 'bold' } }],
      [{ content: reservationData.BulkofCommodity || '' }]
    ];
   
    try {
      const result = autoTable(doc, {
        startY: yPosition,
        head: [],
        body: bulkTableData,
        theme: 'grid',
        styles: { fontSize: 10 },
        margin: { left: margin, right: margin }
      });
      yPosition = (result?.finalY) ? result.finalY : (yPosition + 20);
    } catch (error) {
      console.error('Error in bulk table:', error);
      yPosition += 20;
    }
   
    // Tools information
    let toolsText = '';
    if (safeTools.length > 0) {
      toolsText = safeTools.map(tool =>
        `${tool.ToolUser} (Qty: ${tool.ToolQuantity})`
      ).join(', ');
    }
   
    const toolsTableData: AutoTableColumnOption[][] = [
      [{ content: 'Tools to Use, Qty, & no. of hours:', styles: { fontStyle: 'bold' } }],
      [{ content: toolsText }]
    ];
   
    try {
      const result = autoTable(doc, {
        startY: yPosition,
        head: [],
        body: toolsTableData,
        theme: 'grid',
        styles: { fontSize: 10 },
        margin: { left: margin, right: margin }
      });
      yPosition = (result?.finalY) ? result.finalY : (yPosition + 20);
    } catch (error) {
      console.error('Error in tools table:', error);
      yPosition += 20;
    }
   
    // Request and end date
    const requestDateTableData: AutoTableColumnOption[][] = [
      [{ content: 'Request Date:', styles: { fontStyle: 'bold' } },
       { content: 'End Date:', styles: { fontStyle: 'bold' } }],
      [{ content: formatDate(reservationData.RequestDate) }, { content: '' }]
    ];
   
    try {
      const result = autoTable(doc, {
        startY: yPosition,
        head: [],
        body: requestDateTableData,
        theme: 'grid',
        styles: { fontSize: 10 },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: contentWidth / 2 },
          1: { cellWidth: contentWidth / 2 }
        }
      });
      yPosition = (result?.finalY) ? result.finalY : (yPosition + 15);
    } catch (error) {
      console.error('Error in request date table:', error);
      yPosition += 15;
    }
   
    // Days and times
    // Find time entries for each day - safely accessing with defaults
    const day1Time = safeTimes.find(t => t.DayNum === 1);
    const day2Time = safeTimes.find(t => t.DayNum === 2);
    const day3Time = safeTimes.find(t => t.DayNum === 3);
    const day4Time = safeTimes.find(t => t.DayNum === 4);
   
    // Day 1-2 row
    const day12TableData: AutoTableColumnOption[][] = [
      [{ content: 'Day 1', styles: { fontStyle: 'bold' } },
       { content: 'Day 2', styles: { fontStyle: 'bold' } }],
      [
        { content: `Start Time: ${formatTime(day1Time?.StartTime || null)}   End Time: ${formatTime(day1Time?.EndTime || null)}` },
        { content: `Start Time: ${formatTime(day2Time?.StartTime || null)}   End Time: ${formatTime(day2Time?.EndTime || null)}` }
      ]
    ];
   
    try {
      const result = autoTable(doc, {
        startY: yPosition,
        head: [],
        body: day12TableData,
        theme: 'grid',
        styles: { fontSize: 10 },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: contentWidth / 2 },
          1: { cellWidth: contentWidth / 2 }
        }
      });
      yPosition = (result?.finalY) ? result.finalY : (yPosition + 15);
    } catch (error) {
      console.error('Error in day12 table:', error);
      yPosition += 15;
    }
   
    // Day 3-4 row
    const day34TableData: AutoTableColumnOption[][] = [
      [{ content: 'Day 3', styles: { fontStyle: 'bold' } },
       { content: 'Day 4', styles: { fontStyle: 'bold' } }],
      [
        { content: `Start Time: ${formatTime(day3Time?.StartTime || null)}   End Time: ${formatTime(day3Time?.EndTime || null)}` },
        { content: `Start Time: ${formatTime(day4Time?.StartTime || null)}   End Time: ${formatTime(day4Time?.EndTime || null)}` }
      ]
    ];
   
    try {
      const result = autoTable(doc, {
        startY: yPosition,
        head: [],
        body: day34TableData,
        theme: 'grid',
        styles: { fontSize: 10 },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: contentWidth / 2 },
          1: { cellWidth: contentWidth / 2 }
        }
      });
      yPosition = (result?.finalY) ? result.finalY : (yPosition + 15);
    } catch (error) {
      console.error('Error in day34 table:', error);
      yPosition += 15;
    }
   
    // Processing and signature section
    const currentDate = formatDate(new Date().toISOString());
    const processingTableData: AutoTableColumnOption[][] = [
      [
        { content: 'Date the processing of request was done:\nRequest processed by:', styles: { fontStyle: 'bold', halign: 'right' } },
        { content: 'Name and Signature of employee:', styles: { fontStyle: 'bold', halign: 'right' } }
      ],
      [{ content: `${currentDate}\n${safeAccInfo.Name}` }, { content: '' }]
    ];
   
    try {
      autoTable(doc, {
        startY: yPosition,
        head: [],
        body: processingTableData,
        theme: 'grid',
        styles: { fontSize: 10 },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: contentWidth / 2 },
          1: { cellWidth: contentWidth / 2 }
        }
      });
    } catch (error) {
      console.error('Error in processing table:', error);
    }
   
    // Save the PDF with a name based on the reservation ID
    doc.save(`Utilization_Request_Form_${reservationData.id || 'Unknown'}.pdf`);
    console.log('Utilization request PDF saved successfully');
  } catch (error) {
    console.error('Error generating utilization request PDF:', error);
    // Fall back to browser print method
    try {
      generatePrintPDF(reservationData);
    } catch (printError) {
      console.error('Even fallback print failed:', printError);
      alert(`Unable to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};