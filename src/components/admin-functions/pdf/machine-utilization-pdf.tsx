import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  AutoTableResult,
  AutoTableColumnOption
} from '@/components/admin-functions/pdf/pdf-types';


interface MachineUtilization {
  id?: number;
  Machine: string | null;
  ReviewedBy: string | null;
  ServiceName: string | null;
  OperatingTimes: OperatingTime[];
  DownTimes: DownTime[];
  RepairChecks: RepairCheck[];
}

interface OperatingTime {
  OTDate: string | null;
  OTTypeofProducts: string | null;
  OTStartTime: string | null;
  OTEndTime: string | null;
  OTMachineOp: string | null;
}

interface DownTime {
  DTDate: string | null;
  DTTypeofProducts: string | null;
  DTTime: number | null;
  Cause: string | null;
  DTMachineOp: string | null;
}

interface RepairCheck {
  RepairDate: string | null;
  Service: string | null;
  Duration: number | null;
  RepairReason: string | null;
  PartsReplaced: string | null;
  RPPersonnel: string | null;
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateString;
  }
};

const formatTime = (timeString: string | null): string => {
  if (!timeString) return '';
  if (/^\d{2}:\d{2}$/.test(timeString)) {
    return timeString;
  }
  try {
    const date = new Date(`1970-01-01T${timeString}:00`);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  } catch {
    return timeString;
  }
};

const formatDuration = (minutes: number | null): string => {
  if (!minutes) return '0h 0m';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};

function downloadMachineUtilPDF(utilizationData: MachineUtilization): void {
  try {
    const safeUtilizationData = {
      ...utilizationData,
      id: utilizationData.id || 0,
      Machine: utilizationData.Machine || 'N/A',
      ReviewedBy: utilizationData.ReviewedBy || 'Unknown',
      ServiceName: utilizationData.ServiceName || 'Unspecified',
      OperatingTimes: utilizationData.OperatingTimes || [],
      DownTimes: utilizationData.DownTimes || [],
      RepairChecks: utilizationData.RepairChecks || []
    };

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 10;
    const contentWidth = pageWidth - (margin * 2);
    let yPosition = 40;
    const rowHeight = 7;
    const sectionSpacing = 10;

    // Header logos and text (unchanged from your original)
    try {
      const leftLogoUrl = '/images/logos/left_logo.png';
      doc.addImage(leftLogoUrl, 'PNG', margin, 10, 20, 20);
    } catch (error) {
      doc.rect(margin, 10, 20, 20);
      doc.text('LOGO', margin + 10, 22, { align: 'center' });
    }

    try {
      const rightLogoUrl = '/images/logos/dti_logo.png';
      doc.addImage(rightLogoUrl, 'PNG', pageWidth - margin - 20, 10, 20, 20);
    } catch (error) {
      doc.rect(pageWidth - margin - 20, 10, 20, 20);
      doc.text('DTI', pageWidth - margin - 10, 22, { align: 'center' });
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('FABRICATION LABORATORY SHARED SERVICE FACILITY', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(14);
    doc.text('MACHINE UTILIZATION FORM', pageWidth / 2, 22, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('Philippine Science High School-Eastern Visayas Campus (PSHS-EVC)', pageWidth / 2, 27, { align: 'center' });
    doc.text('AH26 Brgy. Pawing, Palo, Leyte 6501', pageWidth / 2, 31, { align: 'center' });

    // Machine Type Section
    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: [
        [{ content: 'Type of Machine or Equipment used:', styles: { fontStyle: 'bold', fillColor: '#f0f0f0' } }],
        [{ content: safeUtilizationData.Machine }]
      ],
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 2 },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth
    });
    yPosition += (2 * rowHeight);

    // Utilization Information
    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: [
        [{ content: 'Utilization Information', styles: { fontStyle: 'bold', fillColor: '#f0f0f0' } }]
      ],
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 2 },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth
    });
    yPosition += rowHeight;

    // Operating Time Section
    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: [
        [{ content: 'Operating Time', styles: { fontStyle: 'bold', fillColor: '#f0f0f0' } }]
      ],
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 2 },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth
    });
    yPosition += rowHeight;

    const operatingTimeHeaders: AutoTableColumnOption[] = [
      { 
        content: 'Date', 
        styles: { 
          halign: 'center', 
          fontStyle: 'bold', 
          textColor: '#333',
          cellPadding: 3,
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
          fillColor: [240, 240, 240]
        } 
      },
      { 
        content: 'Type of products', 
        styles: { 
          halign: 'center', 
          fontStyle: 'bold', 
          textColor: '#333',
          cellPadding: 3,
          lineWidth: 0.1,
          lineColor: [0, 0, 0] as any,
          fillColor: [240, 240, 240] as any
        } 
      },
      { 
        content: 'Start time', 
        styles: { 
          halign: 'center', 
          fontStyle: 'bold', 
          textColor: '#333',
          cellPadding: 3,
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
          fillColor: [240, 240, 240]
        } 
      },
      { 
        content: 'End time', 
        styles: { 
          halign: 'center', 
          fontStyle: 'bold', 
          textColor: '#333',
          cellPadding: 3,
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
          fillColor: [240, 240, 240]
        } 
      },
      { 
        content: 'Machine operator', 
        styles: { 
          halign: 'center', 
          fontStyle: 'bold', 
          textColor: '#333',
          cellPadding: 3,
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
          fillColor: [240, 240, 240]
        } 
      }
    ];

    let operatingTimeData: AutoTableColumnOption[][] = [];
    if (safeUtilizationData.OperatingTimes.length > 0) {
      operatingTimeData = safeUtilizationData.OperatingTimes.map(ot => [
        { content: formatDate(ot.OTDate) },
        { content: ot.OTTypeofProducts || '' },
        { content: formatTime(ot.OTStartTime) },
        { content: formatTime(ot.OTEndTime) },
        { content: ot.OTMachineOp || '' }
      ]);
    }
    while (operatingTimeData.length < 3) {
      operatingTimeData.push(['', '', '', '', ''].map(content => ({ content })));
    }

    autoTable(doc, {
      startY: yPosition,
      head: [operatingTimeHeaders],
      body: operatingTimeData,
      theme: 'grid',
      styles: { 
        fontSize: 9, 
        cellPadding: 3,
        lineWidth: 0.1,
        lineColor: [0, 0, 0]
      },
      headStyles: { 
        fillColor: [240, 240, 240],
        textColor: '#333',
        fontStyle: 'bold'
      },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      columnStyles: {
        0: { cellWidth: contentWidth * 0.15 },
        1: { cellWidth: contentWidth * 0.30 },
        2: { cellWidth: contentWidth * 0.15 },
        3: { cellWidth: contentWidth * 0.15 },
        4: { cellWidth: contentWidth * 0.25 }
      }
    });
    yPosition += (operatingTimeData.length * rowHeight) + (3*rowHeight);

    // Downtimes Section (follow same pattern as Operating Time)
    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: [
        [{ content: 'Downtimes', styles: { fontStyle: 'bold', fillColor: '#f0f0f0' } }]
      ],
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 2 },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth
    });
    yPosition += rowHeight;

    const downtimesHeaders: AutoTableColumnOption[] = [
      { 
        content: 'Date', 
        styles: { 
          halign: 'center', 
          fontStyle: 'bold', 
          textColor: '#333',
          cellPadding: 3,
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
          fillColor: [240, 240, 240]
        } 
      },
      { 
        content: 'Type of products', 
        styles: { 
          halign: 'center', 
          fontStyle: 'bold', 
          textColor: '#333',
          cellPadding: 3,
          lineWidth: 0.1,
          lineColor: [0, 0, 0] as any,
          fillColor: [240, 240, 240] as any
        } 
      },
      { 
        content: 'Duration', 
        styles: { 
          halign: 'center', 
          fontStyle: 'bold', 
          textColor: '#333',
          cellPadding: 3,
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
          fillColor: [240, 240, 240]
        } 
      },
      { 
        content: 'Cause', 
        styles: { 
          halign: 'center', 
          fontStyle: 'bold', 
          textColor: '#333',
          cellPadding: 3,
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
          fillColor: [240, 240, 240]
        } 
      },
      { 
        content: 'Machine operator', 
        styles: { 
          halign: 'center', 
          fontStyle: 'bold', 
          textColor: '#333',
          cellPadding: 3,
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
          fillColor: [240, 240, 240]
        } 
      }
    ];

    let downtimesData: AutoTableColumnOption[][] = [];
    if (safeUtilizationData.DownTimes.length > 0) {
      downtimesData = safeUtilizationData.DownTimes.map(dt => [
        { content: formatDate(dt.DTDate) },
        { content: dt.DTTypeofProducts || '' },
        { content: dt.DTTime ? formatDuration(dt.DTTime) : '' },
        { content: dt.Cause || '' },
        { content: dt.DTMachineOp || '' }
      ]);
    }
    while (downtimesData.length < 3) {
      downtimesData.push(['', '', '', '', ''].map(content => ({ content })));
    }

    autoTable(doc, {
      startY: yPosition,
      head: [downtimesHeaders],
      body: downtimesData,
      theme: 'grid',
      styles: { 
        fontSize: 9, 
        cellPadding: 3,
        lineWidth: 0.1,
        lineColor: [0, 0, 0]
      },
      headStyles: { 
        fillColor: [240, 240, 240],
        textColor: '#333',
        fontStyle: 'bold'
      },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      columnStyles: {
        0: { cellWidth: contentWidth * 0.15 },
        1: { cellWidth: contentWidth * 0.25 },
        2: { cellWidth: contentWidth * 0.15 },
        3: { cellWidth: contentWidth * 0.25 },
        4: { cellWidth: contentWidth * 0.20 }
      }
    });
    yPosition += (downtimesData.length * rowHeight) + (3*rowHeight);

    // Repair Section (follow same pattern)
    autoTable(doc, {
      startY: yPosition,
      head: [],
      body: [
        [{ content: 'Repair and Maintenance', styles: { fontStyle: 'bold', fillColor: '#f0f0f0' } }]
      ],
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 2 },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth
    });
    yPosition += rowHeight;

    const repairHeaders: AutoTableColumnOption[] = [
      { 
        content: 'Date', 
        styles: { 
          halign: 'center', 
          fontStyle: 'bold', 
          textColor: '#333',
          cellPadding: 3,
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
          fillColor: [240, 240, 240]
        } 
      },
      { 
        content: 'Service Type', 
        styles: { 
          halign: 'center', 
          fontStyle: 'bold', 
          textColor: '#333',
          cellPadding: 3,
          lineWidth: 0.1,
          lineColor: [0, 0, 0] as any,
          fillColor: [240, 240, 240] as any
        } 
      },
      { 
        content: 'Duration', 
        styles: { 
          halign: 'center', 
          fontStyle: 'bold', 
          textColor: '#333',
          cellPadding: 3,
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
          fillColor: [240, 240, 240]
        } 
      },
      { 
        content: 'Reason', 
        styles: { 
          halign: 'center', 
          fontStyle: 'bold', 
          textColor: '#333',
          cellPadding: 3,
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
          fillColor: [240, 240, 240]
        } 
      },
      { 
        content: 'Parts Replaced', 
        styles: { 
          halign: 'center', 
          fontStyle: 'bold', 
          textColor: '#333',
          cellPadding: 3,
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
          fillColor: [240, 240, 240]
        } 
      },
      { 
        content: 'Personnel', 
        styles: { 
          halign: 'center', 
          fontStyle: 'bold', 
          textColor: '#333',
          cellPadding: 3,
          lineWidth: 0.1,
          lineColor: [0, 0, 0],
          fillColor: [240, 240, 240]
        } 
      }
    ];

    let repairData: AutoTableColumnOption[][] = [];
    if (safeUtilizationData.RepairChecks.length > 0) {
      repairData = safeUtilizationData.RepairChecks.map(rc => [
        { content: formatDate(rc.RepairDate) },
        { content: rc.Service || '' },
        { content: rc.Duration ? formatDuration(rc.Duration) : '' },
        { content: rc.RepairReason || '' },
        { content: rc.PartsReplaced || '' },
        { content: rc.RPPersonnel || '' }
      ]);
    }
    while (repairData.length < 3) {
      repairData.push(['', '', '', '', '', ''].map(content => ({ content })));
    }

    autoTable(doc, {
      startY: yPosition,
      head: [repairHeaders],
      body: repairData,
      theme: 'grid',
      styles: { 
        fontSize: 9, 
        cellPadding: 3,
        lineWidth: 0.1,
        lineColor: [0, 0, 0]
      },
      headStyles: { 
        fillColor: [240, 240, 240],
        textColor: '#333',
        fontStyle: 'bold'
      },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      columnStyles: {
        0: { cellWidth: contentWidth * 0.12 },
        1: { cellWidth: contentWidth * 0.18 },
        2: { cellWidth: contentWidth * 0.12 },
        3: { cellWidth: contentWidth * 0.20 },
        4: { cellWidth: contentWidth * 0.15 },
        5: { cellWidth: contentWidth * 0.23 }
      }
    });
    yPosition += (repairData.length  * rowHeight) + (3*rowHeight);

    // Reviewed Section
    autoTable(doc, {
      startY: yPosition + rowHeight,
      head: [],
      body: [
        [
          { 
            content: `Reviewed and checked by: ${safeUtilizationData.ReviewedBy || '________________'}`, 
            styles: { fontStyle: 'bold' } 
          },
          { 
            content: `Date: ${formatDate(new Date().toISOString())}`, 
            styles: { fontStyle: 'bold' } 
          }
        ]
      ],
      theme: 'grid',
      styles: { fontSize: 10, cellPadding: 3 },
      margin: { left: margin, right: margin },
      tableWidth: contentWidth,
      columnStyles: {
        0: { cellWidth: contentWidth * 0.7 },
        1: { cellWidth: contentWidth * 0.3 }
      }
    });

    const fileName = `Machine_Utilization_${safeUtilizationData.Machine || 'Unknown'}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('Failed to generate PDF. Please try again.');
  }
}

export { downloadMachineUtilPDF };