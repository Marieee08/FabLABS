// src/utils/generate-services-pdf.ts
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ServiceData {
  name: string;
  value: number;
  color: string;
}

interface ServicesPdfOptions {
  title: string;
  totalUsages: number;
  services: ServiceData[];
  dateRange?: string;
}

export const generateServicesPdf = ({ title, totalUsages, services, dateRange }: ServicesPdfOptions) => {
  const doc = new jsPDF();
  const date = new Date().toLocaleDateString();
  const time = new Date().toLocaleTimeString();
  
  // Add title and header information
  doc.setFontSize(18);
  doc.setTextColor(20, 51, 112);
  doc.text(title, 14, 20);
  
  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated on: ${date} at ${time}`, 14, 28);
  
  // Add date range if provided
  if (dateRange) {
    doc.text(`Date Range: ${dateRange}`, 14, 36);
  }
  
  // Add summary statistics
  doc.setFontSize(14);
  doc.setTextColor(20, 51, 112);
  doc.text(`Total Service Usages: ${totalUsages}`, 14, dateRange ? 48 : 40);
  doc.text(`Number of Services: ${services.length}`, 14, dateRange ? 58 : 50);
  
  // Calculate and show top services
  const topServices = [...services].sort((a, b) => b.value - a.value).slice(0, 3);
  doc.text('Most Used Services:', 14, dateRange ? 68 : 60);
  topServices.forEach((service, index) => {
    const percentage = Math.round((service.value / totalUsages) * 100);
    doc.text(
      `${index + 1}. ${service.name}: ${service.value} usages (${percentage}%)`, 
      20, 
      (dateRange ? 73 : 65) + (index * 5)
    );
  });
  
  // Prepare detailed data for the table
  const tableData = services
    .sort((a, b) => b.value - a.value)
    .map(service => {
      const percentage = Math.round((service.value / totalUsages) * 100);
      return [
        service.name,
        service.value,
        `${percentage}%`
      ];
    });
  
  // Calculate dynamic column widths
  const pageWidth = doc.internal.pageSize.width;
  const margin = 14;
  const availableWidth = pageWidth - (margin * 2);
  
  // Column width ratios - service name gets more space
  const columnWidths = {
    name: availableWidth * 0.6, // 60% for service name
    value: availableWidth * 0.2, // 20% for usages
    percentage: availableWidth * 0.2 // 20% for percentage
  };
  
  // Add the detailed table with adjusted column widths
  autoTable(doc, {
    startY: dateRange ? 88 : 80,
    head: [['Service Name', 'Usages', 'Percentage']],
    body: tableData,
    headStyles: {
      fillColor: [20, 51, 112],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 12
    },
    bodyStyles: {
      textColor: [50, 50, 50],
      fontSize: 10,
      cellPadding: 5,
      overflow: 'linebreak'
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240]
    },
    columnStyles: {
      0: { 
        cellWidth: columnWidths.name,
        fontStyle: 'bold'
      },
      1: { 
        cellWidth: columnWidths.value,
        halign: 'right'
      },
      2: { 
        cellWidth: columnWidths.percentage,
        halign: 'right'
      }
    },
    didDrawPage: (data: any) => {
      // Footer
      doc.setFontSize(10);
      doc.setTextColor(150);
      const pageCount = doc.getNumberOfPages();
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`, 
        data.settings.margin.left, 
        doc.internal.pageSize.height - 10
      );
      
      // Add watermark
      doc.setFontSize(60);
      doc.setTextColor(230, 230, 230);;
    }
  });
  
  doc.save(`Services_Report_${date.replace(/\//g, '-')}.pdf`);
};

// Helper function to convert hex color to RGB
const hexToRgb = (hex: string): [number, number, number] => {
  hex = hex.replace('#', '');
  
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  return [r, g, b];
};

export default generateServicesPdf;