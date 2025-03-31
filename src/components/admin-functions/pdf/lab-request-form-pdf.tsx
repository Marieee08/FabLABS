import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  AutoTableResult,
  AutoTableColumnOption
} from '@/components/admin-functions/pdf/pdf-types';


// Define interfaces for the laboratory request form data
interface MaterialItem {
  quantity: string;
  item: string;
  description: string;
  issuedCondition: string;
  returnedCondition: string;
  machineName?: string;    // Add machine name field
  machineQuantity?: string; // Add machine quantity field
}


interface StudentInfo {
  name: string;
}


interface LabRequestFormData {
  campus: string;
  controlNo: string;
  schoolYear: string;
  gradeLevel: string;
  numberOfStudents: string;
  subject: string;
  concurrentTopic: string;
  unit: string;
  teacherInCharge: string;
  venue: string;
  inclusiveTimeOfUse: string;
  date: string;
  materials: MaterialItem[];
  receivedBy: string;
  receivedAndInspectedBy: string;
  receivedDate: string;
  inspectedDate: string;
  requestedBy: string;
  dateRequested: string;
  students: StudentInfo[];
  endorsedBy: string;
  approvedBy: string;
}


/**
 * Generates a PDF for a laboratory request form using browser print capabilities
 * This is a fallback method that uses HTML and browser printing
 * @param formData - The laboratory request form data
 */
const generatePrintPDF = (formData: LabRequestFormData): void => {
  // Create a new window for printing
  const printWindow = window.open('', '_blank', 'width=800,height=600');
 
  if (!printWindow) {
    alert('Please allow pop-ups to generate the PDF');
    return;
  }
 
  // Ensure we have at least 15 rows for materials (or use existing data)
  const materialsData = [...formData.materials];
  while (materialsData.length < 15) {
    materialsData.push({
      quantity: '',
      item: '',
      description: '',
      issuedCondition: '',
      returnedCondition: ''
    });
  }
 
  // Ensure we have 5 student spots (or use existing data)
  const studentsData = [...formData.students];
  while (studentsData.length < 5) {
    studentsData.push({ name: '' });
  }
};


/**
 * Main function to generate and download a PDF laboratory request form
 * @param formData - The laboratory request form data
 */
export const downloadLabRequestFormPDF = (formData: LabRequestFormData): void => {
  try {
    console.log('Starting laboratory request form PDF generation with data:', formData);
   
    // Ensure formData has default values to prevent null/undefined errors
    const safeFormData = {
      campus: formData.campus || '',
      controlNo: formData.controlNo || '',
      schoolYear: formData.schoolYear || '',
      gradeLevel: formData.gradeLevel || '',
      numberOfStudents: formData.numberOfStudents || '',
      subject: formData.subject || '',
      concurrentTopic: formData.concurrentTopic || '',
      unit: formData.unit || '',
      teacherInCharge: formData.teacherInCharge || '',
      venue: formData.venue || '',
      inclusiveTimeOfUse: formData.inclusiveTimeOfUse || '',
      date: formData.date || '',
      materials: Array.isArray(formData.materials) ? formData.materials : [],
      receivedBy: formData.receivedBy || '',
      receivedAndInspectedBy: formData.receivedAndInspectedBy || '',
      receivedDate: formData.receivedDate || '',
      inspectedDate: formData.inspectedDate || '',
      requestedBy: formData.requestedBy || '',
      dateRequested: formData.dateRequested || '',
      students: Array.isArray(formData.students) ? formData.students : [],
      endorsedBy: formData.endorsedBy || '',
      approvedBy: formData.approvedBy || ''
    };
   
    // Ensure we have at least 15 rows for materials
    const materialsData = [...safeFormData.materials];
    while (materialsData.length < 15) {
      materialsData.push({
        quantity: '',
        item: '',
        description: '',
        issuedCondition: '',
        returnedCondition: ''
      });
    }
   
    // Ensure we have 5 student spots
    const studentsData = [...safeFormData.students];
    while (studentsData.length < 5) {
      studentsData.push({ name: '' });
    }
   
    // Initialize jsPDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
   
    // Check if autoTable is available
    if (typeof autoTable !== 'function') {
      console.warn('jspdf-autotable function not available, falling back to browser print');
      generatePrintPDF(safeFormData);
      return;
    }


    // Define page dimensions and margins
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
   
    // Start position for content
    let y = 15;


    // HEADER SECTION
    try {
      // Add header text
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('PHILIPPINE SCIENCE HIGH SCHOOL SYSTEM', margin, y);
      y += 7;


      // Add campus field with underline
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('CAMPUS:', margin, y);
     
      // Draw underline for campus
      const campusTextWidth = doc.getTextWidth('CAMPUS: ');
      doc.line(margin + campusTextWidth, y, pageWidth - margin, y);
     
      // Add campus value if available
      if (safeFormData.campus) {
        doc.text(safeFormData.campus, margin + campusTextWidth + 2, y);
      }
     
      y += 10;
     
      // Form title
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('LABORATORY REQUEST AND EQUIPMENT ACCOUNTABILITY FORM', margin, y);
     
      y += 10;
     
      // Control No and SY fields (right-aligned)
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
     
      const controlNoText = 'Control No:';
      const syText = 'SY:';
     
      // Position for Control No (right-aligned)
      const controlNoWidth = doc.getTextWidth(controlNoText);
      const controlNoX = pageWidth - margin - 120;
      doc.text(controlNoText, controlNoX, y);
     
      // Draw underline for Control No
      doc.line(controlNoX + controlNoWidth + 2, y, controlNoX + 70, y);
     
      // Add Control No value if available
      if (safeFormData.controlNo) {
        doc.text(safeFormData.controlNo, controlNoX + controlNoWidth + 4, y);
      }
     
      // Position for SY (right-aligned)
      const syX = pageWidth - margin - 40;
      const syWidth = doc.getTextWidth(syText);
      doc.text(syText, syX, y);
     
      // Draw underline for SY
      doc.line(syX + syWidth + 2, y, pageWidth - margin, y);
     
      // Add SY value if available
      if (safeFormData.schoolYear) {
        doc.text(safeFormData.schoolYear, syX + syWidth + 4, y);
      }
     
      y += 10;
    } catch (headerError) {
      console.error('Error creating header:', headerError);
      y = 45; // Fallback position
    }
   
    // FORM FIELDS SECTION
    try {
      // Grade Level and Section & Number of Students
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
     
      // Draw Grade Level field
      const gradeText = 'Grade Level and Section:';
      const gradeTextWidth = doc.getTextWidth(gradeText);
      doc.text(gradeText, margin, y);
     
      // Draw underline for grade level
      const halfWidth = (contentWidth / 2) - 5;
      doc.setDrawColor(0);
      doc.setLineWidth(0.1);
      doc.line(margin + gradeTextWidth + 2, y, margin + halfWidth, y);
     
      // Add grade level value if available
      if (safeFormData.gradeLevel) {
        doc.text(safeFormData.gradeLevel, margin + gradeTextWidth + 4, y);
      }
     
      // Draw Number of Students field
      const studentsText = 'Number of Students:';
      const studentsX = margin + halfWidth + 10;
      const studentsWidth = doc.getTextWidth(studentsText);
      doc.text(studentsText, studentsX, y);
     
      // Draw underline for number of students
      doc.setDrawColor(0);
      doc.setLineWidth(0.1);
      doc.line(studentsX + studentsWidth + 2, y, pageWidth - margin, y);
     
      // Add number of students value if available
      if (safeFormData.numberOfStudents) {
        doc.text(safeFormData.numberOfStudents, studentsX + studentsWidth + 4, y);
      }
     
      y += 7;
     
      // Subject & Concurrent Topic
      const subjectText = 'Subject:';
      const subjectWidth = doc.getTextWidth(subjectText);
      doc.text(subjectText, margin, y);
     
      // Draw underline for subject
      doc.line(margin + subjectWidth + 2, y, margin + halfWidth, y);
     
      // Add subject value if available
      if (safeFormData.subject) {
        doc.text(safeFormData.subject, margin + subjectWidth + 4, y);
      }
     
      // Draw Concurrent Topic field
      const topicText = 'Concurrent Topic:';
      const topicX = margin + halfWidth + 10;
      const topicWidth = doc.getTextWidth(topicText);
      doc.text(topicText, topicX, y);
     
      // Draw underline for concurrent topic
      doc.line(topicX + topicWidth + 2, y, pageWidth - margin, y);
     
      // Add concurrent topic value if available
      if (safeFormData.concurrentTopic) {
        doc.text(safeFormData.concurrentTopic, topicX + topicWidth + 4, y);
      }
     
      y += 7;
     
      // Unit & Teacher In-Charge
      const unitText = 'Unit:';
      const unitWidth = doc.getTextWidth(unitText);
      doc.text(unitText, margin, y);
     
      // Draw underline for unit
      doc.line(margin + unitWidth + 2, y, margin + halfWidth, y);
     
      // Add unit value if available
      if (safeFormData.unit) {
        doc.text(safeFormData.unit, margin + unitWidth + 4, y);
      }
     
      // Draw Teacher In-Charge field
      const teacherText = 'Teacher In-Charge:';
      const teacherX = margin + halfWidth + 10;
      const teacherWidth = doc.getTextWidth(teacherText);
      doc.text(teacherText, teacherX, y);
     
      // Draw underline for teacher
      doc.line(teacherX + teacherWidth + 2, y, pageWidth - margin, y);
     
      // Add teacher value if available
      if (safeFormData.teacherInCharge) {
        doc.text(safeFormData.teacherInCharge, teacherX + teacherWidth + 4, y);
      }
     
      y += 7;
     
      // Venue of the Experiment & Inclusive Time of Use
      const venueText = 'Venue of the Experiment:';
      const venueWidth = doc.getTextWidth(venueText);
      doc.text(venueText, margin, y);
     
      // Draw underline for venue
      doc.line(margin + venueWidth + 2, y, margin + halfWidth, y);
     
      // Add venue value if available
      if (safeFormData.venue) {
        doc.text(safeFormData.venue, margin + venueWidth + 4, y);
      }
     
      // Draw Inclusive Time of Use field
      const timeText = 'Inclusive Time of Use:';
      const timeX = margin + halfWidth + 10;
      const timeWidth = doc.getTextWidth(timeText);
      doc.text(timeText, timeX, y);
     
      // Draw underline for time
      doc.line(timeX + timeWidth + 2, y, pageWidth - margin, y);
     
      // Add time value if available
      if (safeFormData.inclusiveTimeOfUse) {
        doc.text(safeFormData.inclusiveTimeOfUse, timeX + timeWidth + 4, y);
      }
     
      y += 7;
     
      // Date/Inclusive Date
      const dateText = 'Date/Inclusive Date:';
      const dateWidth = doc.getTextWidth(dateText);
      doc.text(dateText, margin, y);
     
      // Draw underline for date
      doc.line(margin + dateWidth + 2, y, margin + halfWidth * 1.5, y);
     
      // Add date value if available
      if (safeFormData.date) {
        doc.text(safeFormData.date, margin + dateWidth + 4, y);
      }
     
      y += 10;
    } catch (formFieldsError) {
      console.error('Error creating form fields section:', formFieldsError);
      y += 30; // Fallback position
    }
   
    // MATERIALS SECTION
    try {
      // Materials/Equipment Needed header
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('Materials/Equipment Needed:', margin, y);
     
      y += 5;
     
      // Create table for materials
      // Calculate column widths similar to the image
      const colQuantity = 20;
      const colItem = 30;
      const colDesc = contentWidth - colQuantity - colItem - 40 - 40; // 40 for each condition column
      const colIssued = 40;
      const colReturned = 40;
     
      // Table header cells
      const addCell = (text: string, x: number, width: number, height: number, align: string = 'center', fontSize: number = 10, bold: boolean = true) => {
        // Draw cell border
        doc.setDrawColor(0);
        doc.setLineWidth(0.1);
        doc.rect(x, y, width, height);
       
        // Add cell text
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', bold ? 'bold' : 'normal');
       
        // Handle multi-line text for condition columns
        if (text.includes('\n')) {
          const parts = text.split('\n');
          const lineHeight = 4;
          let currentY = y + (height / 2) - ((parts.length - 1) * lineHeight / 2);
         
          for (let lineIndex = 0; lineIndex < parts.length; lineIndex++) {
            const part = parts[lineIndex];
            if (align === 'center') {
              doc.text(part, x + (width / 2), currentY, { align: 'center' });
            } else {
              doc.text(part, x + 2, currentY);
            }
            currentY += lineHeight;
          }
        } else {
          if (align === 'center') {
            doc.text(text, x + (width / 2), y + (height / 2) + 1, { align: 'center' });
          } else {
            doc.text(text, x + 2, y + (height / 2) + 1);
          }
        }
      };
     
      // Table header
      const headerHeight = 7;
      let currentX = margin;
     
      // Add header cells
      addCell('Quantity', currentX, colQuantity, headerHeight);
      currentX += colQuantity;
      
      // Update Item header to Machine
      addCell('Machine', currentX, colItem, headerHeight);
      currentX += colItem;
     
      addCell('Description', currentX, colDesc, headerHeight);
      currentX += colDesc;
     
      addCell('Issued\nCondition/Remarks', currentX, colIssued, headerHeight);
      currentX += colIssued;
     
      addCell('Returned\nCondition/Remarks', currentX, colReturned, headerHeight);
     
      y += headerHeight;
     
      // Data rows
      const rowHeight = 7;
      const numDataRows = 12; // Regular rows
     
      // Add data rows
      for (let i = 0; i < numDataRows; i++) {
        currentX = margin;
       
        // Get data for the current row
        const rowData = materialsData[i] || { 
          quantity: '', 
          item: '', 
          description: '', 
          issuedCondition: '', 
          returnedCondition: '',
          machineName: '',
          machineQuantity: ''
        };
       
        // Display machine quantity in quantity column - prioritize machineQuantity if available
        const quantityValue = rowData.machineQuantity || rowData.quantity || '';
        addCell(quantityValue, currentX, colQuantity, rowHeight, 'center', 9, false);
        currentX += colQuantity;
       
        // Display machine name in item column - prioritize machineName if available
        const itemValue = rowData.machineName || rowData.item || '';
        addCell(itemValue, currentX, colItem, rowHeight, 'left', 9, false);
        currentX += colItem;
       
        addCell(rowData.description, currentX, colDesc, rowHeight, 'left', 9, false);
        currentX += colDesc;
       
        addCell(rowData.issuedCondition, currentX, colIssued, rowHeight, 'left', 9, false);
        currentX += colIssued;
       
        addCell(rowData.returnedCondition, currentX, colReturned, rowHeight, 'left', 9, false);
       
        y += rowHeight;
      }
     
      // Special rows for receiving signatures
      const sigRowHeight = 15;
     
      // First signature row (for text)
      currentX = margin;
     
      // Regular cells
      addCell('', currentX, colQuantity, sigRowHeight, 'center', 9, false);
      currentX += colQuantity;
     
      addCell('', currentX, colItem, sigRowHeight, 'left', 9, false);
      currentX += colItem;
     
      addCell('', currentX, colDesc, sigRowHeight, 'left', 9, false);
      currentX += colDesc;
     
      // Add "Received by:" text
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Received by:', currentX + 2, y + 5);
      doc.rect(currentX, y, colIssued, sigRowHeight);
     
      if (safeFormData.receivedBy) {
        doc.text(safeFormData.receivedBy, currentX + 2, y + 12);
      }
     
      currentX += colIssued;
     
      // Add "Received and Inspected by:" text
      doc.text('Received and', currentX + 2, y + 5);
      doc.text('Inspected by:', currentX + 2, y + 9);
      doc.rect(currentX, y, colReturned, sigRowHeight);
     
      if (safeFormData.receivedAndInspectedBy) {
        doc.text(safeFormData.receivedAndInspectedBy, currentX + 2, y + 12);
      }
     
      y += sigRowHeight;
     
      // Second signature row (for dates)
      currentX = margin;
     
      // Regular cells
      addCell('', currentX, colQuantity, sigRowHeight / 2, 'center', 9, false);
      currentX += colQuantity;
     
      addCell('', currentX, colItem, sigRowHeight / 2, 'left', 9, false);
      currentX += colItem;
     
      addCell('', currentX, colDesc, sigRowHeight / 2, 'left', 9, false);
      currentX += colDesc;
     
      // Add date fields
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Date:', currentX + 2, y + 5);
      doc.rect(currentX, y, colIssued, sigRowHeight / 2);
     
      if (safeFormData.receivedDate) {
        doc.text(safeFormData.receivedDate, currentX + 12, y + 5);
      }
     
      currentX += colIssued;
     
      doc.text('Date:', currentX + 2, y + 5);
      doc.rect(currentX, y, colReturned, sigRowHeight / 2);
     
      if (safeFormData.inspectedDate) {
        doc.text(safeFormData.inspectedDate, currentX + 12, y + 5);
      }
     
      y += sigRowHeight / 2 + 5;
    } catch (materialsError) {
      console.error('Error creating materials section:', materialsError);
      y += 80; // Fallback position
    }
   
    // NOTES SECTION
    try {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('• Fill out this form completely and legibly; transact with the Unit SRA concerned during office hours.', margin, y);
      y += 4;
      doc.text('• Requests not in accordance with existing Unit regulations and considerations may not be granted.', margin, y);
      y += 7;
    } catch (notesError) {
      console.error('Error creating notes section:', notesError);
      y += 11; // Fallback position
    }
   
    // SIGNATURE SECTION
    try {
      // Requested by
      const thirdWidth = contentWidth / 3;
     
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
     
      // Requested by
      const requestedText = 'Requested by:';
      const requestedWidth = doc.getTextWidth(requestedText);
     
      doc.text(requestedText, margin, y);
      doc.line(margin + requestedWidth + 2, y, margin + thirdWidth, y);
     
      if (safeFormData.requestedBy) {
        doc.text(safeFormData.requestedBy, margin + requestedWidth + 4, y - 1);
      }
     
      // Add Teacher/Student label
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Teacher/Student', margin + (thirdWidth / 2), y + 4, { align: 'center' });
     
      // Date Requested
      const dateReqText = 'Date Requested:';
      const dateReqWidth = doc.getTextWidth(dateReqText);
      const dateReqX = pageWidth - margin - thirdWidth;
     
      doc.setFontSize(10);
      doc.text(dateReqText, dateReqX, y);
      doc.line(dateReqX + dateReqWidth + 2, y, pageWidth - margin, y);
     
      if (safeFormData.dateRequested) {
        doc.text(safeFormData.dateRequested, dateReqX + dateReqWidth + 4, y - 1);
      }
     
      y += 8;
     
      // If user is a group text
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text('If user of the lab is a group, list down the names of students.', margin, y);
     
      y += 5;
     
      // Student list
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
     
      for (let i = 0; i < 5; i++) {
        const studentNumber = `${i + 1}.`;
        const studentX = margin + 5;
       
        doc.text(studentNumber, studentX, y);
       
        // Draw line for student name
        const lineStart = studentX + doc.getTextWidth(studentNumber) + 2;
        doc.line(lineStart, y, lineStart + 70, y);
       
        // Add student name if available
        if (studentsData[i] && studentsData[i].name) {
          doc.text(studentsData[i].name, lineStart + 2, y - 1);
        }
       
        y += 5;
      }
     
      y += 5;
     
      // Endorsements section
      const halfWidth = contentWidth / 2;
     
      // Endorsed by
      const endorsedText = 'Endorsed by:';
      const endorsedWidth = doc.getTextWidth(endorsedText);
     
      doc.setFontSize(10);
      doc.text(endorsedText, margin, y);
      doc.line(margin + endorsedWidth + 2, y, margin + halfWidth - 10, y);
     
      if (safeFormData.endorsedBy) {
        doc.text(safeFormData.endorsedBy, margin + endorsedWidth + 4, y - 1);
      }
     
      // Add Subject Teacher/Unit Head label
      doc.setFontSize(8);
      doc.text('Subject Teacher/Unit Head', margin + (halfWidth - 10) / 2, y + 4, { align: 'center' });
     
      // Approved by
      const approvedText = 'Approved by:';
      const approvedWidth = doc.getTextWidth(approvedText);
      const approvedX = margin + halfWidth + 10;
     
      doc.setFontSize(10);
      doc.text(approvedText, approvedX, y);
      doc.line(approvedX + approvedWidth + 2, y, pageWidth - margin, y);
     
      if (safeFormData.approvedBy) {
        doc.text(safeFormData.approvedBy, approvedX + approvedWidth + 4, y - 1);
      }
     
      // Add SRS/SRA label
      doc.setFontSize(8);
      doc.text('SRS / SRA', approvedX + (pageWidth - margin - approvedX) / 2, y + 4, { align: 'center' });
     
      y += 10;
    } catch (signaturesError) {
      console.error('Error creating signatures section:', signaturesError);
      y += 40; // Fallback position
    }
   
    // FOOTER
    try {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('PSHS-00-F-CID-20-Ver02-Rev1-10/18/20', margin, pageHeight - 10);
    } catch (footerError) {
      console.error('Error creating footer:', footerError);
    }
   
    // Save the PDF
    doc.save(`Laboratory_Request_Form.pdf`);
    console.log('Laboratory Request Form PDF saved successfully');
  } catch (error) {
    console.error('Error generating laboratory request form PDF:', error);
    // Fall back to browser print method
    try {
      generatePrintPDF(formData);
    } catch (printError) {
      console.error('Even fallback print failed:', printError);
      alert(`Unable to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};


export default downloadLabRequestFormPDF;



