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
 * Generate a string with service details - WITHOUT cost information
 * @param services - Array of UserService objects
 * @returns Formatted service details string
 */
const getServiceDetailsString = (services: UserService[]): string => {
  if (!services || services.length === 0) {
    return 'No services selected';
  }
 
  return services.map(service =>
    `Service: ${service.ServiceAvail}, Equipment: ${service.EquipmentAvail}, ` +
    `Duration: ${service.MinsAvail || 0} min`
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
        body: clientTableData as any,
        theme: 'grid',
        styles: { fontSize: 10 },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: contentWidth / 2 },
          1: { cellWidth: contentWidth / 2 }
        }
      }) as AutoTableResult;
      yPosition = result && typeof result.finalY === 'number' ? result.finalY : 70;
    } catch (error) {
      console.error('Error in first autoTable:', error);
      yPosition = 70;
    }
   
    // Add section header - PROCESSING INFORMATION
    doc.setFillColor(220, 220, 220);
    doc.rect(margin, yPosition, contentWidth, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text('PROCESSING INFORMATION', margin + 2, yPosition + 5);
   
    // Create completely separate tables for the service type header and each service
    // First, add just the header
    const serviceHeaderRows = [
      [{ content: 'Service Type:', styles: { fontStyle: 'bold' } }]
    ];
   
    try {
      const headerResult = autoTable(doc, {
        startY: yPosition + 8,
        head: [],
        body: serviceHeaderRows as any,
        theme: 'grid',
        styles: { fontSize: 10 },
        margin: { left: margin, right: margin }
      }) as AutoTableResult;
     
      yPosition = headerResult && typeof headerResult.finalY === 'number' ? headerResult.finalY : (yPosition + 15);
    } catch (error) {
      console.error('Error in service header table:', error);
      yPosition += 15;
    }
   
    // Now add each service as a separate table row for better formatting
    const serviceTableRows = [];
   
    if (safeServices.length === 0) {
      serviceTableRows.push([{ content: 'No services selected' }]);
    } else {
      safeServices.forEach(service => {
        serviceTableRows.push([{
          content: `Service: ${service.ServiceAvail}, Equipment: ${service.EquipmentAvail}, Duration: ${service.MinsAvail || 0} min`
        }]);
      });
    }
   
    // Now add the service details in a separate table
    try {
      const result = autoTable(doc, {
        startY: yPosition,
        head: [],
        body: serviceTableRows as any,
        theme: 'grid',
        styles: { fontSize: 10 },
        margin: { left: margin, right: margin, bottom: 0 },
        willDrawCell: function(data) {
          // Ensure text fits within cell by allowing wrapping
          if (data.column.index === 0) {
            data.cell.styles.cellPadding = 3;
            data.cell.styles.overflow = 'linebreak';
            data.cell.styles.cellWidth = 'wrap';
          }
        }
      }) as AutoTableResult;
      yPosition = result && typeof result.finalY === 'number' ? result.finalY : (yPosition + 15);
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
        body: bulkTableData as any,
        theme: 'grid',
        styles: { fontSize: 10 },
        margin: { left: margin, right: margin }
      }) as AutoTableResult;
      yPosition = result && typeof result.finalY === 'number' ? result.finalY : (yPosition + 20);
    } catch (error) {
      console.error('Error in bulk table:', error);
      yPosition += 10;
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
        body: toolsTableData as any,
        theme: 'grid',
        styles: { fontSize: 10 },
        margin: { left: margin, right: margin }
      }) as AutoTableResult;
      yPosition = result && typeof result.finalY === 'number' ? result.finalY : (yPosition + 20);
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
        body: requestDateTableData as any,
        theme: 'grid',
        styles: { fontSize: 10 },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: contentWidth / 2 },
          1: { cellWidth: contentWidth / 2 }
        }
      }) as AutoTableResult;
      yPosition = result && typeof result.finalY === 'number' ? result.finalY : (yPosition + 15);
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
        body: day12TableData as any,
        theme: 'grid',
        styles: { fontSize: 10 },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: contentWidth / 2 },
          1: { cellWidth: contentWidth / 2 }
        }
      }) as AutoTableResult;
      yPosition = result && typeof result.finalY === 'number' ? result.finalY : (yPosition + 15);
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
        body: day34TableData as any,
        theme: 'grid',
        styles: { fontSize: 10 },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: contentWidth / 2 },
          1: { cellWidth: contentWidth / 2 }
        }
      }) as AutoTableResult;
      yPosition = result && typeof result.finalY === 'number' ? result.finalY : (yPosition + 15);
    } catch (error) {
      console.error('Error in day34 table:', error);
      yPosition += 15;
    }
   
    // Processing and signature section
    const currentDate = formatDate(new Date().toISOString());
    const processingTableData: AutoTableColumnOption[][] = [
      [
        { content: 'Date the processing of request was done:\nRequest processed by:', styles: { fontStyle: 'bold', halign: 'left' } },
        { content: 'Name and Signature of employee:', styles: { fontStyle: 'bold', halign: 'left' } }
      ],
      [{ content: `${currentDate}\n${safeAccInfo.Name}` }, { content: '' }]
    ];
   
    try {
      autoTable(doc, {
        startY: yPosition,
        head: [],
        body: processingTableData as any,
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

export default generatePrintPDF;