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
  TypeOfProducts?: string;
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
 
};


/**
 * Main function to generate and download a PDF for a machine utilization
 * @param utilizationData - The machine utilization data
 */
function downloadMachineUtilPDF(utilizationData: MachineUtilization): void {
  try {
    console.log('Starting machine utilization PDF generation with data:', utilizationData);
   
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
      Notes: utilizationData.Notes || '',
      TypeOfProducts: utilizationData.TypeOfProducts || ''
    };
   
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
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);
   
    // ============ HEADER SECTION (Matching the image) ============
   
    // Create a border around the entire header  
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
   
    // Add header text (centered)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('FABRICATION LABORATORY SHARED SERVICE FACILITY', pageWidth / 2, 15, { align: 'center' });
   
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('MACHINE UTILIZATION FORM', pageWidth / 2, 22, { align: 'center' });
   
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Philippine Science High School-Eastern Visayas Campus (PSHS-EVC)', pageWidth / 2, 27, { align: 'center' });
    doc.text('AH26 Brgy. Pawing, Palo, Leyte 6501', pageWidth / 2, 31, { align: 'center' });
   
    // ============ MACHINE TYPE SECTION ============
    let yPosition = 40;
   
    // Machine type section with a bordered header
    const machineTypeHeader: AutoTableColumnOption[][] = [
      [{ content: 'Type of Machine or Equipment used:', styles: { fontStyle: 'bold', fillColor: '#f0f0f0' } }]
    ];
   
    try {
      const result = autoTable(doc, {
        startY: yPosition,
        head: [],
        body: machineTypeHeader as any,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 2 },
        margin: { left: margin, right: margin },
        tableWidth: contentWidth
      });
     
      // Safely check for finalY property and provide a fallback
      yPosition = (result as any)?.finalY || (yPosition + 7);
    } catch (error) {
      console.error('Error in machine type header:', error);
      yPosition += 7;
    }
   
    // Machine name cell (empty cell for filling)
    const machineNameData: AutoTableColumnOption[][] = [
      [{ content: safeUtilizationData.Machine }]
    ];
   
    try {
      const result = autoTable(doc, {
        startY: yPosition,
        head: [],
        body: machineNameData as any,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 2 },
        margin: { left: margin, right: margin },
        tableWidth: contentWidth
      });
     
      // Safely check for finalY property and provide a fallback
      yPosition = (result as any)?.finalY || (yPosition + 7);
    } catch (error) {
      console.error('Error in machine name table:', error);
      yPosition += 7;
    }
   
    // ============ UTILIZATION INFORMATION SECTION ============
   
    // Utilization Information header
    const utilizationInfoHeader: AutoTableColumnOption[][] = [
      [{ content: 'Utilization Information', styles: { fontStyle: 'bold', fillColor: '#f0f0f0' } }]
    ];
   
    try {
      const result = autoTable(doc, {
        startY: yPosition,
        head: [],
        body: utilizationInfoHeader as any,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 2 },
        margin: { left: margin, right: margin },
        tableWidth: contentWidth
      });
     
      // Safely check for finalY property and provide a fallback
      yPosition = (result as any)?.finalY || (yPosition + 7);
    } catch (error) {
      console.error('Error in utilization info header:', error);
      yPosition += 7;
    }
   
    // ============ OPERATING TIME SECTION ============
   
    // Operating Time header
    const operatingTimeHeader: AutoTableColumnOption[][] = [
      [{ content: 'Operating Time', styles: { fontStyle: 'bold', fillColor: '#f0f0f0' } }]
    ];
   
    try {
      const result = autoTable(doc, {
        startY: yPosition,
        head: [],
        body: operatingTimeHeader as any,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 2 },
        margin: { left: margin, right: margin },
        tableWidth: contentWidth
      });
     
      // Safely check for finalY property and provide a fallback
      yPosition = (result as any)?.finalY || (yPosition + 7);
    } catch (error) {
      console.error('Error in operating time header:', error);
      yPosition += 7;
    }
   
    // Operating Time table
    const operatingTimeHeaders: AutoTableColumnOption[] = [
      { content: 'Date', styles: { halign: 'center', fontStyle: 'bold', textColor: '#333' } },
      { content: 'Type of products processed', styles: { halign: 'center', fontStyle: 'bold', textColor: '#333'} },
      { content: 'Start time', styles: { halign: 'center', fontStyle: 'bold', textColor: '#333' } },
      { content: 'End time', styles: { halign: 'center', fontStyle: 'bold', textColor: '#333' } },
      { content: 'Name and Signature of Machine operator', styles: { halign: 'center', fontStyle: 'bold', textColor: '#333'} }
    ];
   
    // First row with actual data
    const operatingTimeFirstRow: AutoTableColumnOption[] = [
      { content: formatDate(safeUtilizationData.UtilizationDate) },
      { content: safeUtilizationData.TypeOfProducts || '' },
      { content: formatTime(safeUtilizationData.StartTime) },
      { content: formatTime(safeUtilizationData.EndTime) },
      { content: safeUtilizationData.User.Name }
    ];
   
    // Empty rows for additional entries
    const emptyRow: AutoTableColumnOption[] = [
      { content: '' }, { content: '' }, { content: '' }, { content: '' }, { content: '' }
    ];
   
    const operatingTimeData: AutoTableColumnOption[][] = [
      operatingTimeFirstRow,
      [...emptyRow],
      [...emptyRow],
      [...emptyRow]
    ];
   
    try {
      const result = autoTable(doc, {
        startY: yPosition,
        head: [operatingTimeHeaders],
        body: operatingTimeData as any,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: '#ffffff' },
        margin: { left: margin, right: margin },
        tableWidth: contentWidth,
        columnStyles: {
          0: { cellWidth: contentWidth * 0.15 }, // Date
          1: { cellWidth: contentWidth * 0.30 }, // Type of products
          2: { cellWidth: contentWidth * 0.15 }, // Start time
          3: { cellWidth: contentWidth * 0.15 }, // End time
          4: { cellWidth: contentWidth * 0.25 }  // Name and signature
        }
      });
     
      // Safely check for finalY property and provide a fallback
      yPosition = (result as any)?.finalY || (yPosition + 35);
    } catch (error) {
      console.error('Error in operating time table:', error);
      yPosition += 35;
    }
   
    // ============ DOWNTIMES SECTION ============
   
    // Downtimes header
    const downtimesHeader: AutoTableColumnOption[][] = [
      [{ content: 'Downtimes', styles: { fontStyle: 'bold', fillColor: '#f0f0f0' } }]
    ];
   
    try {
      const result = autoTable(doc, {
        startY: yPosition,
        head: [],
        body: downtimesHeader as any,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 2 },
        margin: { left: margin, right: margin },
        tableWidth: contentWidth
      });
     
      // Safely check for finalY property and provide a fallback
      yPosition = (result as any)?.finalY || (yPosition + 7);
    } catch (error) {
      console.error('Error in downtimes header:', error);
      yPosition += 7;
    }
   
    // Downtimes table
    const downtimesHeaders: AutoTableColumnOption[] = [
      { content: 'Date', styles: { halign: 'center', fontStyle: 'bold', textColor: '#333' } },
      { content: 'Type of products processed', styles: { halign: 'center', fontStyle: 'bold', textColor: '#333' } },
      { content: 'Duration of stoppage', styles: { halign: 'center', fontStyle: 'bold', textColor: '#333' } },
      { content: 'Cause/s of stoppage', styles: { halign: 'center', fontStyle: 'bold', textColor: '#333' } },
      { content: 'Name and Signature of Machine operator', styles: { halign: 'center', fontStyle: 'bold', textColor: '#333' } }
    ];
   
    // Empty rows for downtime entries
    const downtimesData: AutoTableColumnOption[][] = [
      [...emptyRow],
      [...emptyRow],
      [...emptyRow]
    ];
   
    try {
      const result = autoTable(doc, {
        startY: yPosition,
        head: [downtimesHeaders],
        body: downtimesData as any,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [255, 255, 255] },
        margin: { left: margin, right: margin },
        tableWidth: contentWidth,
        columnStyles: {
          0: { cellWidth: contentWidth * 0.15 }, // Date
          1: { cellWidth: contentWidth * 0.25 }, // Type of products
          2: { cellWidth: contentWidth * 0.15 }, // Duration of stoppage
          3: { cellWidth: contentWidth * 0.25 }, // Cause/s of stoppage
          4: { cellWidth: contentWidth * 0.20 }  // Name and signature
        }
      });
     
      // Safely check for finalY property and provide a fallback
      yPosition = (result as any)?.finalY || (yPosition + 28);
    } catch (error) {
      console.error('Error in downtimes table:', error);
      yPosition += 28;
    }
   
    // ============ REPAIR AND MAINTENANCE SECTION ============
   
    // Repair and Maintenance header
    const repairHeader: AutoTableColumnOption[][] = [
      [{ content: 'Repair and Maintenance Check', styles: { fontStyle: 'bold', fillColor: '#f0f0f0' } }]
    ];
   
    try {
      const result = autoTable(doc, {
        startY: yPosition,
        head: [],
        body: repairHeader as any,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 2 },
        margin: { left: margin, right: margin },
        tableWidth: contentWidth
      });
     
      // Safely check for finalY property and provide a fallback
      yPosition = (result as any)?.finalY || (yPosition + 7);
    } catch (error) {
      console.error('Error in repair header:', error);
      yPosition += 7;
    }
   
    // Repair and Maintenance table
    const repairHeaders: AutoTableColumnOption[] = [
      { content: 'Date', styles: { halign: 'center', fontStyle: 'bold', textColor: '#333' } },
      { content: 'Type of service\n(R-repair, M-maintenance)', styles: { halign: 'center', fontStyle: 'bold', textColor: '#333' } },
      { content: 'Duration', styles: { halign: 'center', fontStyle: 'bold', textColor: '#333' } },
      { content: 'Reason for Repair or maintenance', styles: { halign: 'center', fontStyle: 'bold', textColor: '#333' } },
      { content: 'Parts replaced', styles: { halign: 'center', fontStyle: 'bold', textColor: '#333' } },
      { content: 'Name and Signature of the R&P personnel', styles: { halign: 'center', fontStyle: 'bold', textColor: '#333' } }
    ];
   
    // Empty rows for repair entries
    const emptyRepairRow: AutoTableColumnOption[] = [
      { content: '' }, { content: '' }, { content: '' }, { content: '' }, { content: '' }, { content: '' }
    ];
   
    const repairData: AutoTableColumnOption[][] = [
      [...emptyRepairRow],
      [...emptyRepairRow],
      [...emptyRepairRow]
    ];
   
    try {
      const result = autoTable(doc, {
        startY: yPosition,
        head: [repairHeaders],
        body: repairData as any,
        theme: 'grid',
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [255, 255, 255] },
        margin: { left: margin, right: margin },
        tableWidth: contentWidth,
        columnStyles: {
          0: { cellWidth: contentWidth * 0.12 }, // Date
          1: { cellWidth: contentWidth * 0.18 }, // Type of service
          2: { cellWidth: contentWidth * 0.12 }, // Duration
          3: { cellWidth: contentWidth * 0.20 }, // Reason for Repair
          4: { cellWidth: contentWidth * 0.15 }, // Parts replaced
          5: { cellWidth: contentWidth * 0.23 }  // Name and signature
        }
      });
     
      // Safely check for finalY property and provide a fallback
      yPosition = (result as any)?.finalY || (yPosition + 28);
    } catch (error) {
      console.error('Error in repair table:', error);
      yPosition += 28;
    }
   
    // ============ REVIEWED AND CHECKED SECTION ============
   
    // Create a single row for the reviewed and checked section
    const reviewedData: AutoTableColumnOption[][] = [
      [
        { content: 'Reviewed an checked by: Name and signature of the employee', styles: { fontStyle: 'bold' } },
        { content: 'Date:', styles: { fontStyle: 'bold' } }
      ]
    ];
   
    try {
      autoTable(doc, {
        startY: yPosition + 20,
        head: [],
        body: reviewedData as any,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 3 },
        margin: { left: margin, right: margin },
        tableWidth: contentWidth,
        columnStyles: {
          0: { cellWidth: contentWidth * 0.7 },
          1: { cellWidth: contentWidth * 0.3 }
        }
      });
    } catch (error) {
      console.error('Error in reviewed section:', error);
    }
   
    // Save the PDF with a name based on the machine utilization
    doc.save(`Machine_Utilization_Form_${safeUtilizationData.id}.pdf`);
    console.log('Machine utilization form PDF saved successfully');
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
