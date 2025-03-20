import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  AutoTableResult,
  AutoTableColumnOption
} from '@/components/admin-functions/pdf-types';

// Define your interfaces for MachineUtilization data
interface MachineUtilization {
  id: number;
  Machine: string;
  UtilizationDate: string;
  StartTime: string | null;
  EndTime: string | null;
  Duration: number | null;
  User: {
    Name: string;
    email: string;
    Role: string;
  };
  Status: string;
  Notes?: string;
  ProductType?: string;
  OperatorName?: string;
  Downtime?: {
    Date: string;
    ProductType: string;
    Duration: number;
    Cause: string;
    OperatorName: string;
  }[];
  Maintenance?: {
    Date: string;
    ServiceType: string;
    Duration: number;
    Reason: string;
    PartsReplaced: string;
    PersonnelName: string;
  }[];
  ReviewedBy?: string;
  ReviewDate?: string;
}

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
 * Format duration in minutes to hours and minutes
 * @param minutes - Duration in minutes
 * @returns Formatted duration string
 */
const formatDuration = (minutes: number | null): string => {
  if (!minutes) return '0h 0m';
 
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
 
  return `${hours}h ${mins}m`;
};

/**
 * Main function to generate and download a PDF for a machine utilization
 * @param utilizationData - The machine utilization data
 */
function downloadMachineUtilPDF(utilizationData: MachineUtilization): void {
  try {
    // Log the data received to help with debugging
    console.log('Starting machine utilization PDF generation with data:', utilizationData);
    
    // Initialize jsPDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
   
    // Check if autoTable is available
    if (typeof autoTable !== 'function') {
      console.warn('jspdf-autotable function not available, falling back to browser print');
      generatePrintPDF(utilizationData);
      return;
    }
   
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
   
    // Add header with logos and title
    // Top position
    let yPosition = 20;
    
    // Add title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('FABRICATION LABORATORY SHARED SERVICE FACILITY', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 8;
    doc.setFontSize(18);
    doc.text('MACHINE UTILIZATION FORM', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Philippine Science High School-Eastern Visayas Campus (PSHS-EVC)', pageWidth / 2, yPosition, { align: 'center' });
    
    yPosition += 5;
    doc.text('AH26 Brgy. Pawing, Palo, Leyte 6501', pageWidth / 2, yPosition, { align: 'center' });
    
    // Add machine type section
    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Type of Machine or Equipment used:', margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(utilizationData.Machine || 'N/A', margin + 80, yPosition);
    
    // Add Utilization Information section title
    yPosition += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Utilization Information', margin, yPosition);
    
    // Operating Time Table
    yPosition += 8;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Operating Time', margin, yPosition);
    
    // Create the header for the operating time table
    const operatingTimeHead = [
      [
        { content: 'Date', styles: { fontStyle: 'bold', halign: 'center' } },
        { content: 'Type of products processed', styles: { fontStyle: 'bold', halign: 'center' } },
        { content: 'Start time', styles: { fontStyle: 'bold', halign: 'center' } },
        { content: 'End time', styles: { fontStyle: 'bold', halign: 'center' } },
        { content: 'Name and Signature of Machine operator', styles: { fontStyle: 'bold', halign: 'center' } }
      ]
    ];
    
    // Create the body for the operating time table
    const operatingTimeBody = [
      [
        formatDate(utilizationData.UtilizationDate),
        utilizationData.ProductType || '',
        formatTime(utilizationData.StartTime),
        formatTime(utilizationData.EndTime),
        utilizationData.OperatorName || utilizationData.User.Name
      ],
      ['', '', '', '', ''],
      ['', '', '', '', ''],
      ['', '', '', '', '']
    ];
    
    // Draw the operating time table
    const operatingTimeTable = autoTable(doc, {
      startY: yPosition + 2,
      head: operatingTimeHead as any,
      body: operatingTimeBody,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
      margin: { left: margin, right: margin }
    }) as unknown as AutoTableResult;
    
    // Downtimes section
    yPosition = (operatingTimeTable.finalY || yPosition + 30) + 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Downtimes', margin, yPosition);
    
    // Create the header for the downtimes table
    const downtimesHead = [
      [
        { content: 'Date', styles: { fontStyle: 'bold', halign: 'center' } },
        { content: 'Type of products processed', styles: { fontStyle: 'bold', halign: 'center' } },
        { content: 'Duration of stoppage', styles: { fontStyle: 'bold', halign: 'center' } },
        { content: 'Cause/s of stoppage', styles: { fontStyle: 'bold', halign: 'center' } },
        { content: 'Name and Signature of Machine operator', styles: { fontStyle: 'bold', halign: 'center' } }
      ]
    ];
    
    // Create the body for the downtimes table
    const downtimesBody = [];
    if (utilizationData.Downtime && utilizationData.Downtime.length > 0) {
      for (const downtime of utilizationData.Downtime) {
        downtimesBody.push([
          formatDate(downtime.Date),
          downtime.ProductType,
          formatDuration(downtime.Duration),
          downtime.Cause,
          downtime.OperatorName
        ]);
      }
    } else {
      downtimesBody.push(['', '', '', '', '']);
      downtimesBody.push(['', '', '', '', '']);
      downtimesBody.push(['', '', '', '', '']);
    }
    
    // Draw the downtimes table
    const downtimesTable = autoTable(doc, {
      startY: yPosition + 2,
      head: downtimesHead as any,
      body: downtimesBody,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
      margin: { left: margin, right: margin }
    }) as unknown as AutoTableResult;
    
    // Repair and Maintenance Check section
    yPosition = (downtimesTable.finalY || yPosition + 30) + 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Repair and Maintenance Check', margin, yPosition);
    
    // Create the header for the maintenance table
    const maintenanceHead = [
      [
        { content: 'Date', styles: { fontStyle: 'bold', halign: 'center' } },
        { content: 'Type of service (R-repair, M-maintenance)', styles: { fontStyle: 'bold', halign: 'center' } },
        { content: 'Duration', styles: { fontStyle: 'bold', halign: 'center' } },
        { content: 'Reason for Repair or maintenance', styles: { fontStyle: 'bold', halign: 'center' } },
        { content: 'Parts replaced', styles: { fontStyle: 'bold', halign: 'center' } },
        { content: 'Name and Signature of the R&P personnel', styles: { fontStyle: 'bold', halign: 'center' } }
      ]
    ];
    
    // Create the body for the maintenance table
    const maintenanceBody = [];
    if (utilizationData.Maintenance && utilizationData.Maintenance.length > 0) {
      for (const maintenance of utilizationData.Maintenance) {
        maintenanceBody.push([
          formatDate(maintenance.Date),
          maintenance.ServiceType,
          formatDuration(maintenance.Duration),
          maintenance.Reason,
          maintenance.PartsReplaced,
          maintenance.PersonnelName
        ]);
      }
    } else {
      maintenanceBody.push(['', '', '', '', '', '']);
      maintenanceBody.push(['', '', '', '', '', '']);
      maintenanceBody.push(['', '', '', '', '', '']);
    }
    
    // Draw the maintenance table
    const maintenanceTable = autoTable(doc, {
      startY: yPosition + 2,
      head: maintenanceHead as any,
      body: maintenanceBody,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] },
      margin: { left: margin, right: margin }
    }) as unknown as AutoTableResult;
    
    // Add review section
    yPosition = (maintenanceTable.finalY || yPosition + 30) + 5;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Reviewed and checked by: ', margin, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(utilizationData.ReviewedBy || 'Name and signature of the employee', margin + 60, yPosition);
    
    doc.setFont('helvetica', 'bold');
    doc.text('Date: ', pageWidth - margin - 30, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(utilizationData.ReviewDate ? formatDate(utilizationData.ReviewDate) : '', pageWidth - margin - 15, yPosition);
    
    console.log('PDF generation completed, saving file');
    
    // Save the PDF with a name based on the utilization ID
    doc.save(`Machine_Utilization_Form_${utilizationData.id}.pdf`);
    console.log('PDF saved successfully');
  } catch (error) {
    console.error('Error generating machine utilization PDF:', error);
    // Fall back to browser print method
    try {
      generatePrintPDF(utilizationData);
    } catch (printError) {
      console.error('Even fallback print failed:', printError);
      alert('Unable to generate PDF. Please try again or contact support.');
    }
  }
}

/**
 * Generates a PDF for a machine utilization using browser print capabilities
 * This is a fallback method that uses HTML and browser printing
 * @param utilizationData - The machine utilization data
 */
const generatePrintPDF = (utilizationData: MachineUtilization): void => {
  // Create a new window for printing
  const printWindow = window.open('', '_blank', 'width=800,height=600');
 
  if (!printWindow) {
    alert('Please allow pop-ups to generate the PDF');
    return;
  }
 
  // Create the HTML content for printing based on the new form layout
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Machine Utilization Form</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
        }
        h1 {
          font-size: 18px;
          margin-bottom: 5px;
        }
        h2 {
          font-size: 20px;
          margin-bottom: 5px;
          font-weight: bold;
        }
        .section {
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 15px;
        }
        th, td {
          border: 1px solid #000;
          padding: 8px;
          text-align: left;
        }
        th {
          font-weight: bold;
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
        <h1>FABRICATION LABORATORY SHARED SERVICE FACILITY</h1>
        <h2>MACHINE UTILIZATION FORM</h2>
        <p>Philippine Science High School-Eastern Visayas Campus (PSHS-EVC)</p>
        <p>AH26 Brgy. Pawing, Palo, Leyte 6501</p>
      </div>
     
      <div class="section">
        <p><strong>Type of Machine or Equipment used:</strong> ${utilizationData.Machine || 'N/A'}</p>
      </div>
     
      <div class="section">
        <h3>Utilization Information</h3>
        <h4>Operating Time</h4>
        <table>
          <tr>
            <th>Date</th>
            <th>Type of products processed</th>
            <th>Start time</th>
            <th>End time</th>
            <th>Name and Signature of Machine operator</th>
          </tr>
          <tr>
            <td>${formatDate(utilizationData.UtilizationDate)}</td>
            <td>${utilizationData.ProductType || ''}</td>
            <td>${formatTime(utilizationData.StartTime)}</td>
            <td>${formatTime(utilizationData.EndTime)}</td>
            <td>${utilizationData.OperatorName || utilizationData.User.Name}</td>
          </tr>
          <tr><td></td><td></td><td></td><td></td><td></td></tr>
          <tr><td></td><td></td><td></td><td></td><td></td></tr>
          <tr><td></td><td></td><td></td><td></td><td></td></tr>
        </table>
      </div>
     
      <div class="section">
        <h4>Downtimes</h4>
        <table>
          <tr>
            <th>Date</th>
            <th>Type of products processed</th>
            <th>Duration of stoppage</th>
            <th>Cause/s of stoppage</th>
            <th>Name and Signature of Machine operator</th>
          </tr>
          ${utilizationData.Downtime && utilizationData.Downtime.length > 0 
            ? utilizationData.Downtime.map(d => `
              <tr>
                <td>${formatDate(d.Date)}</td>
                <td>${d.ProductType}</td>
                <td>${formatDuration(d.Duration)}</td>
                <td>${d.Cause}</td>
                <td>${d.OperatorName}</td>
              </tr>
            `).join('')
            : `
              <tr><td></td><td></td><td></td><td></td><td></td></tr>
              <tr><td></td><td></td><td></td><td></td><td></td></tr>
              <tr><td></td><td></td><td></td><td></td><td></td></tr>
            `
          }
        </table>
      </div>
     
      <div class="section">
        <h4>Repair and Maintenance Check</h4>
        <table>
          <tr>
            <th>Date</th>
            <th>Type of service (R-repair, M-maintenance)</th>
            <th>Duration</th>
            <th>Reason for Repair or maintenance</th>
            <th>Parts replaced</th>
            <th>Name and Signature of the R&P personnel</th>
          </tr>
          ${utilizationData.Maintenance && utilizationData.Maintenance.length > 0 
            ? utilizationData.Maintenance.map(m => `
              <tr>
                <td>${formatDate(m.Date)}</td>
                <td>${m.ServiceType}</td>
                <td>${formatDuration(m.Duration)}</td>
                <td>${m.Reason}</td>
                <td>${m.PartsReplaced}</td>
                <td>${m.PersonnelName}</td>
              </tr>
            `).join('')
            : `
              <tr><td></td><td></td><td></td><td></td><td></td><td></td></tr>
              <tr><td></td><td></td><td></td><td></td><td></td><td></td></tr>
              <tr><td></td><td></td><td></td><td></td><td></td><td></td></tr>
            `
          }
        </table>
      </div>
     
      <div class="footer">
        <p><strong>Reviewed and checked by:</strong> ${utilizationData.ReviewedBy || 'Name and signature of the employee'} <span style="float: right;"><strong>Date:</strong> ${utilizationData.ReviewDate ? formatDate(utilizationData.ReviewDate) : ''}</span></p>
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

// Make sure to export the function properly
export { downloadMachineUtilPDF };