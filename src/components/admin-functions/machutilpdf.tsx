import { jsPDF } from 'jspdf';
// Import autoTable addon
import autoTable from 'jspdf-autotable';

// Create proper TypeScript definitions for jspdf-autotable
interface AutoTableResult {
  previousPageWidth?: number;
  width?: number;
  height?: number;
  startY?: number;
  lastEndY?: number;
  endY?: number;
  pageNumber?: number;
  pageCount?: number;
  pageBreak?: string;
  cursor?: {
    x?: number;
    y?: number;
  };
  lastAutoTable?: boolean;
  columns?: {
    dataKey: string | number;
    width?: number;
    wrappedWidth?: number;
    minReadableWidth?: number;
    minWidth?: number;
    raw?: any;
  }[];
}

interface AutoTableStyles {
  fontSize?: number;
  fontStyle?: 'normal' | 'bold' | 'italic' | 'bolditalic';
  cellWidth?: number | 'auto' | 'wrap';
  cellPadding?: number;
  font?: string;
  textColor?: string;
  fillColor?: string;
  lineColor?: string;
  lineWidth?: number;
  halign?: 'left' | 'center' | 'right';
  valign?: 'top' | 'middle' | 'bottom';
}

interface AutoTableColumnStyles {
  [key: number]: Partial<AutoTableStyles>;
}

interface AutoTableColumnOption {
  content?: string;
  styles?: Partial<AutoTableStyles>;
}

interface AutoTableSettings {
  head?: Array<string[] | AutoTableColumnOption[]>;
  body?: Array<string[] | AutoTableColumnOption[]>;
  foot?: Array<string[] | AutoTableColumnOption[]>;
  startY?: number;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  pageBreak?: 'auto' | 'avoid' | 'always';
  rowPageBreak?: 'auto' | 'avoid';
  showHead?: 'everyPage' | 'firstPage' | 'never';
  showFoot?: 'everyPage' | 'lastPage' | 'never';
  theme?: 'striped' | 'grid' | 'plain';
  styles?: Partial<AutoTableStyles>;
  columnStyles?: AutoTableColumnStyles;
  didDrawPage?: (data: any) => void;
}

declare module 'jspdf-autotable' {
  export default function autoTable(
    doc: jsPDF,
    options: AutoTableSettings
  ): AutoTableResult;
}

// Define interfaces for Machine Utilization Data
interface OperatingTimeEntry {
  date: string;
  productType: string;
  startTime: string;
  endTime: string;
  operatorName: string;
}

interface DowntimeEntry {
  date: string;
  productType: string;
  duration: string;
  cause: string;
  operatorName: string;
}

interface RepairEntry {
  date: string;
  serviceType: string;
  duration: string;
  reason: string;
  partsReplaced: string;
  personnelName: string;
}

interface MachineUtilizationData {
  machineType: string;
  operatingTimeEntries: OperatingTimeEntry[];
  downtimeEntries: DowntimeEntry[];
  repairEntries: RepairEntry[];
  reviewedBy: string;
  reviewDate: string;
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
 * Generates a PDF for a machine utilization using browser print capabilities
 * This is a fallback method that uses HTML and browser printing
 * @param utilizationData - The machine utilization data
 */
const generatePrintPDF = (utilizationData: MachineUtilizationData): void => {
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
          position: relative;
        }
        .logo-left {
          position: absolute;
          left: 20px;
          top: 0;
          width: 60px;
          height: 60px;
        }
        .logo-right {
          position: absolute;
          right: 20px;
          top: 0;
          width: 60px;
          height: 60px;
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
          margin-top: 5px;
        }
        th, td {
          border: 1px solid #000;
          padding: 5px;
          text-align: left;
        }
        .footer {
          margin-top: 20px;
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
        <img src="/images/logos/pshs_logo.png" class="logo-left" alt="PSHS Logo">
        <img src="/images/logos/dti_logo.png" class="logo-right" alt="DTI Logo">
        <h1>FABRICATION LABORATORY SHARED SERVICE FACILITY</h1>
        <h2>MACHINE UTILIZATION FORM</h2>
        <h3>Philippine Science High School-Eastern Visayas Campus (PSHS-EVC)<br>AH26 Brgy. Pawing, Palo, Leyte 6501</h3>
      </div>
      
      <div class="section-header">Type of Machine or Equipment used:</div>
      <div style="padding: 5px; border: 1px solid #000;">${utilizationData.machineType || ''}</div>
      
      <div class="section-header">Utilization Information</div>
      
      <div class="section-header">Operating Time</div>
      <table>
        <tr>
          <th>Date</th>
          <th>Type of products processed</th>
          <th>Start time</th>
          <th>End time</th>
          <th>Name and Signature of Machine operator</th>
        </tr>
        ${utilizationData.operatingTimeEntries.map(entry => `
        <tr>
          <td>${entry.date}</td>
          <td>${entry.productType}</td>
          <td>${entry.startTime}</td>
          <td>${entry.endTime}</td>
          <td>${entry.operatorName}</td>
        </tr>`).join('') || `
        <tr>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
        </tr>
        <tr>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
        </tr>
        <tr>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
        </tr>
        <tr>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
        </tr>`}
      </table>
      
      <div class="section-header">Downtimes</div>
      <table>
        <tr>
          <th>Date</th>
          <th>Type of products processed</th>
          <th>Duration of stoppage</th>
          <th>Cause/s of stoppage</th>
          <th>Name and Signature of Machine operator</th>
        </tr>
        ${utilizationData.downtimeEntries.map(entry => `
        <tr>
          <td>${entry.date}</td>
          <td>${entry.productType}</td>
          <td>${entry.duration}</td>
          <td>${entry.cause}</td>
          <td>${entry.operatorName}</td>
        </tr>`).join('') || `
        <tr>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
        </tr>
        <tr>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
        </tr>
        <tr>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
        </tr>`}
      </table>
      
      <div class="section-header">Repair and Maintenance Check</div>
      <table>
        <tr>
          <th>Date</th>
          <th>Type of service (R-repair, M-maintenance)</th>
          <th>Duration</th>
          <th>Reason for Repair or maintenance</th>
          <th>Parts replaced</th>
          <th>Name and Signature of the R&P personnel</th>
        </tr>
        ${utilizationData.repairEntries.map(entry => `
        <tr>
          <td>${entry.date}</td>
          <td>${entry.serviceType}</td>
          <td>${entry.duration}</td>
          <td>${entry.reason}</td>
          <td>${entry.partsReplaced}</td>
          <td>${entry.personnelName}</td>
        </tr>`).join('') || `
        <tr>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
        </tr>
        <tr>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
        </tr>
        <tr>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
        </tr>`}
      </table>
      
      <div class="footer">
        <table>
          <tr>
            <td style="border: 1px solid #000; padding: 5px;">
              <strong>Reviewed an checked by:</strong> ${utilizationData.reviewedBy}
            </td>
            <td style="border: 1px solid #000; padding: 5px;">
              <strong>Date:</strong> ${utilizationData.reviewDate}
            </td>
          </tr>
        </table>
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
 * Main function to generate and download a PDF for machine utilization
 * @param utilizationData - The machine utilization data
 */
export const downloadMachineUtilizationPDF = (utilizationData: MachineUtilizationData): void => {
  try {
    // Create new jsPDF instance
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    // Test if autoTable is available
    if (typeof autoTable !== 'function') {
      console.warn('jspdf-autotable function not available, falling back to browser print');
      generatePrintPDF(utilizationData);
      return;
    }
    
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);
    
    // Add headers and logos
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('FABRICATION LABORATORY SHARED SERVICE FACILITY', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('MACHINE UTILIZATION FORM', pageWidth / 2, 22, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Philippine Science High School-Eastern Visayas Campus (PSHS-EVC)', pageWidth / 2, 28, { align: 'center' });
    doc.text('AH26 Brgy. Pawing, Palo, Leyte 6501', pageWidth / 2, 33, { align: 'center' });
    
    // Add logos (with error handling to prevent freezing if images are missing)
    try {
      // Left logo - PSHS Logo (using a text placeholder if image fails)
      try {
        const leftLogoUrl = '/images/logos/left_logo.png';
        doc.addImage(leftLogoUrl, 'PNG', margin, 10, 20, 20);
      } catch (error) {
        console.warn('Error adding left logo, using placeholder instead');
        // Draw rectangle as placeholder
        doc.setDrawColor(0);
        doc.rect(margin, 10, 20, 20);
        doc.setFontSize(8);
        doc.text('PSHS', margin + 10, 20, { align: 'center' });
      }
      
      // Right logo - DTI Logo (using a text placeholder if image fails)
      try {
        const rightLogoUrl = '/images/logos/dti_logo.png';
        doc.addImage(rightLogoUrl, 'PNG', pageWidth - margin - 20, 10, 20, 20);
      } catch (error) {
        console.warn('Error adding right logo, using placeholder instead');
        // Draw rectangle as placeholder
        doc.setDrawColor(0);
        doc.rect(pageWidth - margin - 20, 10, 20, 20);
        doc.setFontSize(8);
        doc.text('DTI', pageWidth - margin - 10, 20, { align: 'center' });
      }
    } catch (error) {
      console.warn('Error adding logos:', error);
    }
    
    // Machine Type Section
    let yPosition = 40;
    doc.setFillColor(220, 220, 220);
    doc.rect(margin, yPosition, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Type of Machine or Equipment used:', margin + 2, yPosition + 5);
    
    // Machine Type Content
    doc.setDrawColor(0);
    doc.rect(margin, yPosition + 8, contentWidth, 8);
    doc.setFont('helvetica', 'normal');
    doc.text(utilizationData.machineType || '', margin + 2, yPosition + 13);
    
    // Utilization Information Header
    yPosition += 20;
    doc.setFillColor(220, 220, 220);
    doc.rect(margin, yPosition, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Utilization Information', margin + 2, yPosition + 5);
    
    // Operating Time Section
    yPosition += 10;
    doc.setFillColor(220, 220, 220);
    doc.rect(margin, yPosition, contentWidth, 8, 'F');
    doc.text('Operating Time', margin + 2, yPosition + 5);
    
    // Operating Time Table
    const operatingHeaders = [
      { content: 'Date', styles: { fontStyle: 'bold', halign: 'center' } },
      { content: 'Type of products processed', styles: { fontStyle: 'bold', halign: 'center' } },
      { content: 'Start time', styles: { fontStyle: 'bold', halign: 'center' } },
      { content: 'End time', styles: { fontStyle: 'bold', halign: 'center' } },
      { content: 'Name and Signature of Machine operator', styles: { fontStyle: 'bold', halign: 'center' } }
    ];
    
    // Prepare operating time data
    const operatingRows = [];
    
    if (utilizationData.operatingTimeEntries && utilizationData.operatingTimeEntries.length > 0) {
      utilizationData.operatingTimeEntries.forEach(entry => {
        operatingRows.push([
          { content: entry.date },
          { content: entry.productType },
          { content: entry.startTime },
          { content: entry.endTime },
          { content: entry.operatorName }
        ]);
      });
    } else {
      // Add empty rows if no data
      for (let i = 0; i < 4; i++) {
        operatingRows.push([
          { content: '' },
          { content: '' },
          { content: '' },
          { content: '' },
          { content: '' }
        ]);
      }
    }
    
    try {
      const result = autoTable(doc, {
        startY: yPosition + 8,
        head: [operatingHeaders],
        body: operatingRows,
        theme: 'grid',
        styles: { fontSize: 9 },
        margin: { left: margin, right: margin },
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] }
      });
      yPosition = (result && result.endY) ? result.endY : yPosition + 45;
    } catch (error) {
      console.error('Error in operating time table:', error);
      yPosition += 45;
    }
    
    // Downtimes Section
    doc.setFillColor(220, 220, 220);
    doc.rect(margin, yPosition, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Downtimes', margin + 2, yPosition + 5);
    
    // Downtimes Table
    const downtimeHeaders = [
      { content: 'Date', styles: { fontStyle: 'bold', halign: 'center' } },
      { content: 'Type of products processed', styles: { fontStyle: 'bold', halign: 'center' } },
      { content: 'Duration of stoppage', styles: { fontStyle: 'bold', halign: 'center' } },
      { content: 'Cause/s of stoppage', styles: { fontStyle: 'bold', halign: 'center' } },
      { content: 'Name and Signature of Machine operator', styles: { fontStyle: 'bold', halign: 'center' } }
    ];
    
    // Prepare downtime data
    const downtimeRows = [];
    
    if (utilizationData.downtimeEntries && utilizationData.downtimeEntries.length > 0) {
      utilizationData.downtimeEntries.forEach(entry => {
        downtimeRows.push([
          { content: entry.date },
          { content: entry.productType },
          { content: entry.duration },
          { content: entry.cause },
          { content: entry.operatorName }
        ]);
      });
    } else {
      // Add empty rows if no data
      for (let i = 0; i < 3; i++) {
        downtimeRows.push([
          { content: '' },
          { content: '' },
          { content: '' },
          { content: '' },
          { content: '' }
        ]);
      }
    }
    
    try {
      const result = autoTable(doc, {
        startY: yPosition + 8,
        head: [downtimeHeaders],
        body: downtimeRows,
        theme: 'grid',
        styles: { fontSize: 9 },
        margin: { left: margin, right: margin },
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] }
      });
      yPosition = (result && result.endY) ? result.endY : yPosition + 40;
    } catch (error) {
      console.error('Error in downtime table:', error);
      yPosition += 40;
    }
    
    // Repair and Maintenance Section
    doc.setFillColor(220, 220, 220);
    doc.rect(margin, yPosition, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('Repair and Maintenance Check', margin + 2, yPosition + 5);
    
    // Repair Table
    const repairHeaders = [
      { content: 'Date', styles: { fontStyle: 'bold', halign: 'center' } },
      { content: 'Type of service (R-repair, M-maintenance)', styles: { fontStyle: 'bold', halign: 'center' } },
      { content: 'Duration', styles: { fontStyle: 'bold', halign: 'center' } },
      { content: 'Reason for Repair or maintenance', styles: { fontStyle: 'bold', halign: 'center' } },
      { content: 'Parts replaced', styles: { fontStyle: 'bold', halign: 'center' } },
      { content: 'Name and Signature of the R&P personnel', styles: { fontStyle: 'bold', halign: 'center' } }
    ];
    
    // Prepare repair data
    const repairRows = [];
    
    if (utilizationData.repairEntries && utilizationData.repairEntries.length > 0) {
      utilizationData.repairEntries.forEach(entry => {
        repairRows.push([
          { content: entry.date },
          { content: entry.serviceType },
          { content: entry.duration },
          { content: entry.reason },
          { content: entry.partsReplaced },
          { content: entry.personnelName }
        ]);
      });
    } else {
      // Add empty rows if no data
      for (let i = 0; i < 3; i++) {
        repairRows.push([
          { content: '' },
          { content: '' },
          { content: '' },
          { content: '' },
          { content: '' },
          { content: '' }
        ]);
      }
    }
    
    try {
      const result = autoTable(doc, {
        startY: yPosition + 8,
        head: [repairHeaders],
        body: repairRows,
        theme: 'grid',
        styles: { fontSize: 9 },
        margin: { left: margin, right: margin },
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0] }
      });
      yPosition = (result && result.endY) ? result.endY : yPosition + 40;
    } catch (error) {
      console.error('Error in repair table:', error);
      yPosition += 40;
    }
    
    // Review footer
    const reviewTableData = [
      [
        { content: 'Reviewed an checked by: ' + (utilizationData.reviewedBy || ''), styles: { fontStyle: 'normal' } },
        { content: 'Date: ' + (utilizationData.reviewDate || ''), styles: { fontStyle: 'normal' } }
      ]
    ];
    
    try {
      autoTable(doc, {
        startY: yPosition + 5,
        head: [],
        body: reviewTableData,
        theme: 'grid',
        styles: { fontSize: 10 },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: contentWidth * 0.7 },
          1: { cellWidth: contentWidth * 0.3 }
        }
      });
    } catch (error) {
      console.error('Error in review table:', error);
    }
    
    // Save the PDF with a descriptive name
    doc.save(`Machine_Utilization_Form_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    // Fall back to browser print method
    generatePrintPDF(utilizationData);
  }
};

// Sample function with mock data to demonstrate the PDF generator
export const generateSampleMachineUtilizationPDF = (): void => {
  // Sample data
  const sampleData: MachineUtilizationData = {
    machineType: '3D Printer - Flashforge Creator Pro',
    operatingTimeEntries: [
      {
        date: '2025-03-10',
        productType: 'Prototype parts',
        startTime: '09:00',
        endTime: '12:30',
        operatorName: 'John Doe'
      },
      {
        date: '2025-03-11',
        productType: 'Educational models',
        startTime: '13:00',
        endTime: '16:45',
        operatorName: 'Jane Smith'
      }
    ],
    downtimeEntries: [
      {
        date: '2025-03-11',
        productType: 'Educational models',
        duration: '45 min',
        cause: 'Filament jam',
        operatorName: 'Jane Smith'
      }
    ],
    repairEntries: [
      {
        date: '2025-03-12',
        serviceType: 'R-repair',
        duration: '2 hours',
        reason: 'Extruder malfunction',
        partsReplaced: 'Heating element',
        personnelName: 'Mike Johnson'
      }
    ],
    reviewedBy: 'Dr. Sarah Williams',
    reviewDate: '2025-03-13'
  };
  
  // Call the PDF generator with the sample data
  downloadMachineUtilizationPDF(sampleData);
};