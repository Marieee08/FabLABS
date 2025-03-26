// src/components/admin-functions/pdf/dashboard-report-pdf.tsx
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import {
  AutoTableResult,
  AutoTableColumnOption
} from '@/components/admin-functions/pdf/pdf-types';

// Define interfaces for Dashboard report data
interface ReportOptions {
  title: string;
  subtitle?: string;
  dateRange: {
    from: Date;
    to: Date;
  };
  includeCharts: boolean;
  includeMachineStats: boolean;
  includeReservationStats: boolean;
  includeUserStats: boolean;
  includeTables: boolean;
  showCosts: boolean; // Allow admin to hide financial data if needed
  logo?: boolean;
}

interface MachineUsageData {
  machineName: string;
  totalHours: number;
  utilization: number; // percentage
  maintenanceCount: number;
  downtimeHours: number;
}

interface ServiceData {
  serviceName: string;
  count: number;
  revenue?: number;
  mostPopularMachine?: string;
}

interface UserStatData {
  userRole: string;
  count: number;
  reservationsCount: number;
  averageSessionDuration?: number;
}

interface ReservationStatData {
  status: string;
  count: number;
  percentageOfTotal: number;
}

export interface DashboardReportData {
  reportDate: Date;
  dateRange: {
    from: Date;
    to: Date;
  };
  pendingRequests: number;
  completedRequests: number;
  activeReservations: number;
  totalRevenue?: number;
  machineUsage: MachineUsageData[];
  services: ServiceData[];
  userStats: UserStatData[];
  reservationStats: ReservationStatData[];
  // Chart data will be handled separately by capturing chart elements
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
 * @param date - Date to format
 * @returns Formatted date string
 */
const formatDateString = (date: Date | null): string => {
  if (!date) return '';
  return format(date, 'MMM dd, yyyy');
};

/**
 * Format percentage values
 * @param value - The percentage value
 * @returns Formatted percentage string
 */
const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

/**
 * Format duration in hours
 * @param hours - Duration in hours
 * @returns Formatted duration string
 */
const formatDuration = (hours: number): string => {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours}h ${minutes}m`;
};

/**
 * Generate a PDF report for dashboard data
 * @param data - The dashboard data to include in the report
 * @param options - Report generation options
 */
export const generateDashboardReport = async (
  data: DashboardReportData,
  options: ReportOptions
): Promise<void> => {
  try {
    console.log('Starting dashboard report PDF generation with data:', data);
    
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
    
    // Check if autoTable is available
    if (typeof autoTable !== 'function') {
      console.warn('jspdf-autotable function not available');
      alert('Cannot generate PDF: Required plugin not available');
      return;
    }
    
    // Start position for content
    let y = 15;
    
    // ============ HEADER SECTION ============
    // Add logo if enabled
    if (options.logo) {
      try {
        // Left logo - Use the image path
        const leftLogoUrl = '/images/logos/left_logo.png';
        doc.addImage(leftLogoUrl, 'PNG', margin, y, 20, 20);
      } catch (error) {
        console.error('Error adding left logo:', error);
        // Fallback to placeholder text
        doc.setFontSize(10);
        doc.text('FABLAB', margin + 10, y + 10, { align: 'center' });
      }
    }
    
    // Add report title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(options.title || 'FABRICATION LABORATORY DASHBOARD REPORT', pageWidth / 2, y + 10, { align: 'center' });
    
    // Add subtitle if provided
    if (options.subtitle) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(options.subtitle, pageWidth / 2, y + 18, { align: 'center' });
    }
    
    // Add date range
    doc.setFontSize(10);
    const dateRangeText = `Report Period: ${formatDateString(data.dateRange.from)} to ${formatDateString(data.dateRange.to)}`;
    doc.text(dateRangeText, pageWidth / 2, y + 25, { align: 'center' });
    
    // Add generation date
    const generatedText = `Generated on: ${formatDateString(data.reportDate)}`;
    doc.text(generatedText, pageWidth / 2, y + 30, { align: 'center' });
    
    y += 40; // Move past header section
    
    // ============ SUMMARY SECTION ============
    // Add summary header
    doc.setFillColor(30, 51, 112); // #143370
    doc.setTextColor(255, 255, 255);
    doc.rect(margin, y, contentWidth, 8, 'F');
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SUMMARY STATISTICS', margin + 5, y + 5.5);
    doc.setTextColor(0, 0, 0);
    
    y += 10;
    
    // Create key metrics table
    const keyMetricsTableData: AutoTableColumnOption[][] = [
      [
        { content: 'Pending Requests', styles: { fontStyle: 'bold' } },
        { content: 'Completed Requests', styles: { fontStyle: 'bold' } },
        { content: 'Active Reservations', styles: { fontStyle: 'bold' } },
        ...(options.showCosts ? [{ content: 'Total Revenue', styles: { fontStyle: 'bold' } }] : [])
      ],
      [
        { content: data.pendingRequests.toString() },
        { content: data.completedRequests.toString() },
        { content: data.activeReservations.toString() },
        ...(options.showCosts ? [{ content: formatCurrency(data.totalRevenue || 0) }] : [])
      ]
    ];
    
    try {
      const metricsResult = autoTable(doc, {
        startY: y,
        head: [],
        body: keyMetricsTableData as any,
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 5, valign: 'middle', halign: 'center' },
        headStyles: { fillColor: [240, 240, 240] },
        columnStyles: {},
        margin: { left: margin, right: margin },
        tableWidth: contentWidth
      });
      
      y = (metricsResult as any)?.finalY || (y + 20);
    } catch (error) {
      console.error('Error creating key metrics table:', error);
      y += 20;
    }
    
    y += 10;
    
    // ============ MACHINE USAGE SECTION ============
    if (options.includeMachineStats && data.machineUsage && data.machineUsage.length > 0) {
      // Add machine usage header
      doc.setFillColor(94, 134, 202); // #5e86ca
      doc.setTextColor(255, 255, 255);
      doc.rect(margin, y, contentWidth, 8, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('MACHINE UTILIZATION', margin + 5, y + 5.5);
      doc.setTextColor(0, 0, 0);
      
      y += 10;
      
      // Create machine usage table headers
      const machineHeaders = [
        { content: 'Machine', styles: { fontStyle: 'bold', halign: 'left' } },
        { content: 'Total Hours', styles: { fontStyle: 'bold', halign: 'center' } },
        { content: 'Utilization %', styles: { fontStyle: 'bold', halign: 'center' } },
        { content: 'Downtime', styles: { fontStyle: 'bold', halign: 'center' } },
        { content: 'Maintenance', styles: { fontStyle: 'bold', halign: 'center' } }
      ];
      
      // Create machine usage table rows
      const machineRows = data.machineUsage.map(machine => [
        { content: machine.machineName, styles: { halign: 'left' } },
        { content: formatDuration(machine.totalHours), styles: { halign: 'center' } },
        { content: formatPercentage(machine.utilization), styles: { halign: 'center' } },
        { content: formatDuration(machine.downtimeHours), styles: { halign: 'center' } },
        { content: machine.maintenanceCount.toString(), styles: { halign: 'center' } }
      ]);
      
      try {
        const machineResult = autoTable(doc, {
          startY: y,
          head: [machineHeaders as any],
          body: machineRows as any,
          theme: 'grid',
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
          margin: { left: margin, right: margin },
          tableWidth: contentWidth
        });
        
        y = (machineResult as any)?.finalY || (y + 30);
      } catch (error) {
        console.error('Error creating machine usage table:', error);
        y += 30;
      }
      
      y += 10;
    }
    
    // ============ SERVICE STATS SECTION ============
    if (options.includeTables && data.services && data.services.length > 0) {
      // Check if we need to add a new page
      if (y > pageHeight - 70) {
        doc.addPage();
        y = 20;
      }
      
      // Add services header
      doc.setFillColor(94, 134, 202); // #5e86ca
      doc.setTextColor(255, 255, 255);
      doc.rect(margin, y, contentWidth, 8, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('SERVICE STATISTICS', margin + 5, y + 5.5);
      doc.setTextColor(0, 0, 0);
      
      y += 10;
      
      // Create service stats table headers
      const serviceHeaders = [
        { content: 'Service', styles: { fontStyle: 'bold', halign: 'left' } },
        { content: 'Count', styles: { fontStyle: 'bold', halign: 'center' } },
        ...(options.showCosts ? [{ content: 'Revenue', styles: { fontStyle: 'bold', halign: 'center' } }] : []),
        { content: 'Most Used Machine', styles: { fontStyle: 'bold', halign: 'left' } }
      ];
      
      // Create service stats table rows
      const serviceRows = data.services.map(service => [
        { content: service.serviceName, styles: { halign: 'left' } },
        { content: service.count.toString(), styles: { halign: 'center' } },
        ...(options.showCosts ? [{ content: formatCurrency(service.revenue || 0), styles: { halign: 'center' } }] : []),
        { content: service.mostPopularMachine || 'N/A', styles: { halign: 'left' } }
      ]);
      
      try {
        const serviceResult = autoTable(doc, {
          startY: y,
          head: [serviceHeaders as any],
          body: serviceRows as any,
          theme: 'grid',
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
          margin: { left: margin, right: margin },
          tableWidth: contentWidth
        });
        
        y = (serviceResult as any)?.finalY || (y + 30);
      } catch (error) {
        console.error('Error creating service stats table:', error);
        y += 30;
      }
      
      y += 10;
    }
    
    // ============ USER STATS SECTION ============
    if (options.includeUserStats && data.userStats && data.userStats.length > 0) {
      // Check if we need to add a new page
      if (y > pageHeight - 70) {
        doc.addPage();
        y = 20;
      }
      
      // Add user stats header
      doc.setFillColor(94, 134, 202); // #5e86ca
      doc.setTextColor(255, 255, 255);
      doc.rect(margin, y, contentWidth, 8, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('USER STATISTICS', margin + 5, y + 5.5);
      doc.setTextColor(0, 0, 0);
      
      y += 10;
      
      // Create user stats table headers
      const userHeaders = [
        { content: 'User Role', styles: { fontStyle: 'bold', halign: 'left' } },
        { content: 'Count', styles: { fontStyle: 'bold', halign: 'center' } },
        { content: 'Reservations', styles: { fontStyle: 'bold', halign: 'center' } },
        { content: 'Avg. Session', styles: { fontStyle: 'bold', halign: 'center' } }
      ];
      
      // Create user stats table rows
      const userRows = data.userStats.map(stat => [
        { content: stat.userRole, styles: { halign: 'left' } },
        { content: stat.count.toString(), styles: { halign: 'center' } },
        { content: stat.reservationsCount.toString(), styles: { halign: 'center' } },
        { content: stat.averageSessionDuration ? formatDuration(stat.averageSessionDuration) : 'N/A', styles: { halign: 'center' } }
      ]);
      
      try {
        const userResult = autoTable(doc, {
          startY: y,
          head: [userHeaders as any],
          body: userRows as any,
          theme: 'grid',
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
          margin: { left: margin, right: margin },
          tableWidth: contentWidth
        });
        
        y = (userResult as any)?.finalY || (y + 30);
      } catch (error) {
        console.error('Error creating user stats table:', error);
        y += 30;
      }
      
      y += 10;
    }
    
    // ============ RESERVATION STATS SECTION ============
    if (options.includeReservationStats && data.reservationStats && data.reservationStats.length > 0) {
      // Check if we need to add a new page
      if (y > pageHeight - 70) {
        doc.addPage();
        y = 20;
      }
      
      // Add reservation stats header
      doc.setFillColor(94, 134, 202); // #5e86ca
      doc.setTextColor(255, 255, 255);
      doc.rect(margin, y, contentWidth, 8, 'F');
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('RESERVATION STATUS', margin + 5, y + 5.5);
      doc.setTextColor(0, 0, 0);
      
      y += 10;
      
      // Create reservation stats table headers
      const reservationHeaders = [
        { content: 'Status', styles: { fontStyle: 'bold', halign: 'left' } },
        { content: 'Count', styles: { fontStyle: 'bold', halign: 'center' } },
        { content: '% of Total', styles: { fontStyle: 'bold', halign: 'center' } }
      ];
      
      // Create reservation stats table rows
      const reservationRows = data.reservationStats.map(stat => [
        { content: stat.status, styles: { halign: 'left' } },
        { content: stat.count.toString(), styles: { halign: 'center' } },
        { content: formatPercentage(stat.percentageOfTotal), styles: { halign: 'center' } }
      ]);
      
      try {
        const reservationResult = autoTable(doc, {
          startY: y,
          head: [reservationHeaders as any],
          body: reservationRows as any,
          theme: 'grid',
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
          margin: { left: margin, right: margin },
          tableWidth: contentWidth
        });
        
        y = (reservationResult as any)?.finalY || (y + 30);
      } catch (error) {
        console.error('Error creating reservation stats table:', error);
        y += 30;
      }
    }
    
    // ============ FOOTER SECTION ============
    // Add footer to each page
    const addFooter = (doc: jsPDF) => {
      const pageCount = doc.getNumberOfPages();
      
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        
        // Page number
        doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        
        // Footer line
        doc.setDrawColor(94, 134, 202); // #5e86ca
        doc.setLineWidth(0.5);
        doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
        
        // Footer text
        doc.text('PSHS-EVC Fabrication Laboratory Dashboard Report', margin, pageHeight - 10);
        doc.text(format(new Date(), 'yyyy-MM-dd HH:mm'), pageWidth - margin, pageHeight - 10, { align: 'right' });
      }
    };
    
    addFooter(doc);
    
    // Save the PDF with a formatted name
    const reportName = `FabLab_Report_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    doc.save(reportName);
    console.log('Dashboard report PDF created successfully:', reportName);
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error generating dashboard report PDF:', error);
    alert(`Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return Promise.reject(error);
  }
};

export default generateDashboardReport;