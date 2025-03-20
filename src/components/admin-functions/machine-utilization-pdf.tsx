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
 
  // Create the HTML content for printing
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Machine Utilization Report</title>
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
        .section {
          margin-bottom: 20px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f2f2f2;
        }
        .footer {
          margin-top: 30px;
          font-size: 12px;
          text-align: center;
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
        <h1>Machine Utilization Report</h1>
        <p>Generated on: ${new Date().toLocaleString()}</p>
      </div>
     
      <div class="section">
        <h2>Machine Information</h2>
        <table>
          <tr>
            <th>Machine Name</th>
            <td>${utilizationData.Machine}</td>
          </tr>
          <tr>
            <th>Utilization Date</th>
            <td>${formatDate(utilizationData.UtilizationDate)}</td>
          </tr>
          <tr>
            <th>Start Time</th>
            <td>${formatTime(utilizationData.StartTime)}</td>
          </tr>
          <tr>
            <th>End Time</th>
            <td>${formatTime(utilizationData.EndTime)}</td>
          </tr>
          <tr>
            <th>Duration</th>
            <td>${formatDuration(utilizationData.Duration)}</td>
          </tr>
          <tr>
            <th>Status</th>
            <td>${utilizationData.Status}</td>
          </tr>
        </table>
      </div>
     
      <div class="section">
        <h2>User Information</h2>
        <table>
          <tr>
            <th>Name</th>
            <td>${utilizationData.User.Name}</td>
          </tr>
          <tr>
            <th>Email</th>
            <td>${utilizationData.User.email}</td>
          </tr>
          <tr>
            <th>Role</th>
            <td>${utilizationData.User.Role}</td>
          </tr>
        </table>
      </div>
     
      <div class="section">
        <h2>Notes</h2>
        <p>${utilizationData.Notes || 'No notes provided.'}</p>
      </div>
     
      <div class="footer">
        <p>This is an automatically generated report and requires no signature.</p>
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
   
    // Add header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Machine Utilization Report', pageWidth / 2, 20, { align: 'center' });
   
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 28, { align: 'center' });
   
    // Ensure all data is properly formatted to prevent errors
    const safeUtilizationData = {
      ...utilizationData,
      id: utilizationData.id || 0,
      Machine: utilizationData.Machine || 'N/A',
      UtilizationDate: utilizationData.UtilizationDate || new Date().toISOString(),
      StartTime: utilizationData.StartTime || null,
      EndTime: utilizationData.EndTime || null,
      Duration: typeof utilizationData.Duration === 'number' ? utilizationData.Duration : 0,
      User: {
        Name: utilizationData.User?.Name || 'Unknown',
        email: utilizationData.User?.email || 'No email provided',
        Role: utilizationData.User?.Role || 'Unknown'
      },
      Status: utilizationData.Status || 'Pending',
      Notes: utilizationData.Notes || ''
    };
    
    // Add machine information section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Machine Information', margin, 40);
   
    const machineInfoData: AutoTableColumnOption[][] = [
      [{ content: 'Machine Name:', styles: { fontStyle: 'bold' } }, { content: safeUtilizationData.Machine }],
      [{ content: 'Utilization Date:', styles: { fontStyle: 'bold' } }, { content: formatDate(safeUtilizationData.UtilizationDate) }],
      [{ content: 'Start Time:', styles: { fontStyle: 'bold' } }, { content: formatTime(safeUtilizationData.StartTime) }],
      [{ content: 'End Time:', styles: { fontStyle: 'bold' } }, { content: formatTime(safeUtilizationData.EndTime) }],
      [{ content: 'Duration:', styles: { fontStyle: 'bold' } }, { content: formatDuration(safeUtilizationData.Duration) }],
      [{ content: 'Status:', styles: { fontStyle: 'bold' } }, { content: safeUtilizationData.Status }]
    ];
   
    let yPosition = 45;
    try {
      console.log('Generating machine info table');
      const result = autoTable(doc, {
        startY: yPosition,
        head: [],
        body: machineInfoData,
        theme: 'grid',
        styles: { fontSize: 10 },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: contentWidth / 3 },
          1: { cellWidth: (contentWidth * 2) / 3 }
        }
      });
      yPosition = (result.finalY !== undefined) ? result.finalY : 100;
      console.log('Machine info table completed at Y position:', yPosition);
    } catch (error) {
      console.error('Error in machine info table:', error);
      yPosition = 100; // Fallback position
    }
   
    // Add user information section
    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('User Information', margin, yPosition);
   
    const userInfoData: AutoTableColumnOption[][] = [
      [{ content: 'Name:', styles: { fontStyle: 'bold' } }, { content: safeUtilizationData.User.Name }],
      [{ content: 'Email:', styles: { fontStyle: 'bold' } }, { content: safeUtilizationData.User.email }],
      [{ content: 'Role:', styles: { fontStyle: 'bold' } }, { content: safeUtilizationData.User.Role }]
    ];
   
    try {
      console.log('Generating user info table');
      const result = autoTable(doc, {
        startY: yPosition + 5,
        head: [],
        body: userInfoData,
        theme: 'grid',
        styles: { fontSize: 10 },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: contentWidth / 3 },
          1: { cellWidth: (contentWidth * 2) / 3 }
        }
      });
      yPosition = (result.finalY !== undefined) ? result.finalY : (yPosition + 30);
      console.log('User info table completed at Y position:', yPosition);
    } catch (error) {
      console.error('Error in user info table:', error);
      yPosition += 30; // Fallback position
    }
   
    // Add notes section
    yPosition += 10;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Notes', margin, yPosition);
   
    const notesData: AutoTableColumnOption[][] = [
      [{ content: safeUtilizationData.Notes || 'No notes provided.' }]
    ];
   
    try {
      console.log('Generating notes table');
      const result = autoTable(doc, {
        startY: yPosition + 5,
        head: [],
        body: notesData,
        theme: 'grid',
        styles: { fontSize: 10 },
        margin: { left: margin, right: margin }
      });
      yPosition = (result.finalY !== undefined) ? result.finalY : (yPosition + 20);
      console.log('Notes table completed at Y position:', yPosition);
    } catch (error) {
      console.error('Error in notes table:', error);
      yPosition += 20; // Fallback position
    }
   
    // Add footer
    yPosition += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text('This is an automatically generated report and requires no signature.',
      pageWidth / 2, yPosition, { align: 'center' });
   
    console.log('PDF generation completed, saving file');
    
    // Save the PDF with a name based on the utilization ID
    doc.save(`Machine_Utilization_Report_${safeUtilizationData.id}.pdf`);
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

// Make sure to export the function properly
export { downloadMachineUtilPDF };