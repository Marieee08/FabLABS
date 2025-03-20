import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  AutoTableResult,
  AutoTableColumnOption
} from '@/components/admin-functions/pdf-types';

// Define interfaces for the laboratory request form data
interface MaterialItem {
  quantity: string;
  item: string;
  description: string;
  issuedCondition: string;
  returnedCondition: string;
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
 
  // Create the HTML content for printing
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Laboratory Request and Equipment Accountability Form</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #000;
          font-size: 12px;
        }
        .header {
          text-align: center;
          margin-bottom: 10px;
        }
        .title {
          font-weight: bold;
          font-size: 14px;
          margin: 5px 0;
        }
        .form-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .form-section {
          margin-bottom: 10px;
        }
        .form-row {
          display: flex;
          margin-bottom: 5px;
        }
        .form-field {
          margin-right: 20px;
          flex: 1;
        }
        .form-label {
          font-weight: bold;
        }
        .form-value {
          border-bottom: 1px solid #000;
          padding-left: 5px;
        }
        .materials-header {
          font-weight: bold;
          font-style: italic;
          margin: 10px 0 5px 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          border: 1px solid #000;
          padding: 5px;
          text-align: left;
          font-size: 11px;
        }
        th {
          font-weight: bold;
        }
        .notes {
          margin: 10px 0;
          font-size: 10px;
          font-style: italic;
        }
        .signatures {
          display: flex;
          justify-content: space-between;
          margin-top: 10px;
        }
        .signature-field {
          width: 45%;
          margin-bottom: 10px;
        }
        .sign-line {
          border-top: 1px solid #000;
          margin-top: 20px;
          text-align: center;
          font-weight: bold;
        }
        .students-list {
          margin-top: 10px;
        }
        .student-row {
          display: flex;
          margin-bottom: 5px;
        }
        .student-number {
          width: 20px;
        }
        .student-name {
          flex: 1;
          border-bottom: 1px solid #000;
        }
        .footer {
          margin-top: 20px;
          font-size: 10px;
          text-align: left;
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
        <div class="title">PHILIPPINE SCIENCE HIGH SCHOOL SYSTEM</div>
        <div>CAMPUS: <span class="form-value">${formData.campus || '_________________'}</span></div>
        <div class="title">LABORATORY REQUEST AND EQUIPMENT ACCOUNTABILITY FORM</div>
      </div>
     
      <div class="form-header">
        <div></div>
        <div>
          Control No: <span class="form-value">${formData.controlNo || '________'}</span> 
          SY: <span class="form-value">${formData.schoolYear || '________'}</span>
        </div>
      </div>
     
      <div class="form-section">
        <div class="form-row">
          <div class="form-field">
            <span class="form-label">Grade Level and Section:</span>
            <span class="form-value">${formData.gradeLevel || '_________________'}</span>
          </div>
          <div class="form-field">
            <span class="form-label">Number of Students:</span>
            <span class="form-value">${formData.numberOfStudents || '_________________'}</span>
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <span class="form-label">Subject:</span>
            <span class="form-value">${formData.subject || '_________________'}</span>
          </div>
          <div class="form-field">
            <span class="form-label">Concurrent Topic:</span>
            <span class="form-value">${formData.concurrentTopic || '_________________'}</span>
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <span class="form-label">Unit:</span>
            <span class="form-value">${formData.unit || '_________________'}</span>
          </div>
          <div class="form-field">
            <span class="form-label">Teacher In-Charge:</span>
            <span class="form-value">${formData.teacherInCharge || '_________________'}</span>
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <span class="form-label">Venue of the Experiment:</span>
            <span class="form-value">${formData.venue || '_________________'}</span>
          </div>
          <div class="form-field">
            <span class="form-label">Inclusive Time of Use:</span>
            <span class="form-value">${formData.inclusiveTimeOfUse || '_________________'}</span>
          </div>
        </div>
        <div class="form-row">
          <div class="form-field">
            <span class="form-label">Date/Inclusive Date:</span>
            <span class="form-value">${formData.date || '_________________'}</span>
          </div>
        </div>
      </div>
     
      <div class="materials-header">Materials/Equipment Needed:</div>
      <table>
        <thead>
          <tr>
            <th>Quantity</th>
            <th>Item</th>
            <th>Description</th>
            <th colspan="2">
              <table style="width:100%; border-collapse: collapse; border: none;">
                <tr style="border: none;">
                  <th style="border: none; border-bottom: 1px solid #000; text-align: center;" colspan="2">Condition</th>
                </tr>
                <tr style="border: none;">
                  <th style="border: none; text-align: center; width: 50%;">Issued Condition</th>
                  <th style="border: none; text-align: center; width: 50%;">Returned Condition/Remarks</th>
                </tr>
              </table>
            </th>
          </tr>
        </thead>
        <tbody>
          ${materialsData.map((material, index) => `
            <tr>
              <td>${material.quantity}</td>
              <td>${material.item}</td>
              <td>${material.description}</td>
              <td>${material.issuedCondition}</td>
              <td>${material.returnedCondition}</td>
            </tr>
          `).join('')}
          <tr>
            <td colspan="3" rowspan="2"></td>
            <td>
              <div>Received by:</div>
              <div style="margin-top: 15px;">${formData.receivedBy || ''}</div>
              <div style="margin-top: 15px;">Date: ${formData.receivedDate || ''}</div>
            </td>
            <td>
              <div>Received and Inspected by:</div>
              <div style="margin-top: 15px;">${formData.receivedAndInspectedBy || ''}</div>
              <div style="margin-top: 15px;">Date: ${formData.inspectedDate || ''}</div>
            </td>
          </tr>
        </tbody>
      </table>
     
      <div class="notes">
        <div>• Fill out this form completely and legibly; transact with the Unit SRA concerned during office hours.</div>
        <div>• Requests not in accordance with existing Unit regulations and considerations may not be granted.</div>
      </div>
     
      <div class="signatures">
        <div class="signature-field">
          <div>Requested by: <span class="form-value">${formData.requestedBy || '___________________'}</span></div>
          <div class="sign-line">Teacher/Student</div>
        </div>
        <div class="signature-field">
          <div>Date Requested: <span class="form-value">${formData.dateRequested || '___________________'}</span></div>
        </div>
      </div>
     
      <div class="students-list">
        <div>If user of the lab is a group, list down the names of students.</div>
        ${studentsData.map((student, index) => `
          <div class="student-row">
            <div class="student-number">${index + 1}.</div>
            <div class="student-name">${student.name}</div>
          </div>
        `).join('')}
      </div>
     
      <div class="signatures">
        <div class="signature-field">
          <div>Endorsed by: <span class="form-value">${formData.endorsedBy || '___________________'}</span></div>
          <div class="sign-line">Subject Teacher/Unit Head</div>
        </div>
        <div class="signature-field">
          <div>Approved by: <span class="form-value">${formData.approvedBy || '___________________'}</span></div>
          <div class="sign-line">SRS / SRA</div>
        </div>
      </div>
     
      <div class="footer">
        PSHS-00-F-CID-20-Ver02-Rev1-10/18/20
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
   
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
   
    // Add header
    let yPosition = 15;
    try {
      // Add title - PHILIPPINE SCIENCE HIGH SCHOOL SYSTEM
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('PHILIPPINE SCIENCE HIGH SCHOOL SYSTEM', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 7;
      
      // Add campus
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('CAMPUS:', margin, yPosition);
      
      // Draw line for campus
      const campusText = safeFormData.campus || '';
      const campusTextWidth = doc.getTextWidth('CAMPUS: ');
      doc.setDrawColor(0);
      doc.line(margin + campusTextWidth, yPosition, pageWidth - margin, yPosition);
      
      // Add campus text if available
      if (campusText) {
        doc.text(campusText, margin + campusTextWidth + 2, yPosition);
      }
      
      yPosition += 7;
      
      // Add form title
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('LABORATORY REQUEST AND EQUIPMENT ACCOUNTABILITY FORM', pageWidth / 2, yPosition, { align: 'center' });
      
      yPosition += 7;
      
      // Add control no and SY
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      // Calculate the right side text position
      const controlNoText = 'Control No: ';
      const controlNoValue = safeFormData.controlNo || '';
      const syText = 'SY: ';
      const syValue = safeFormData.schoolYear || '';
      
      // Draw line for control no
      const controlNoTextWidth = doc.getTextWidth(controlNoText);
      const controlNoStartX = pageWidth - margin - doc.getTextWidth(controlNoText + '__________ ' + syText + '__________');
      
      doc.text(controlNoText, controlNoStartX, yPosition);
      doc.line(controlNoStartX + controlNoTextWidth, yPosition, controlNoStartX + controlNoTextWidth + 30, yPosition);
      
      // Add control no value if available
      if (controlNoValue) {
        doc.text(controlNoValue, controlNoStartX + controlNoTextWidth + 2, yPosition);
      }
      
      // Draw line for SY
      const syTextWidth = doc.getTextWidth(syText);
      const syStartX = controlNoStartX + controlNoTextWidth + 35;
      
      doc.text(syText, syStartX, yPosition);
      doc.line(syStartX + syTextWidth, yPosition, syStartX + syTextWidth + 30, yPosition);
      
      // Add SY value if available
      if (syValue) {
        doc.text(syValue, syStartX + syTextWidth + 2, yPosition);
      }
      
      yPosition += 10;
    } catch (headerError) {
      console.error('Error creating header:', headerError);
      yPosition = 40; // Fallback position
    }
   
    // Add form details section
    try {
      // Grade Level and Section & Number of Students
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      const gradeText = 'Grade Level and Section: ';
      const gradeTextWidth = doc.getTextWidth(gradeText);
      doc.text(gradeText, margin, yPosition);
      
      // Draw underline for grade level
      const gradeValueWidth = (contentWidth / 2) - gradeTextWidth - 5;
      doc.line(margin + gradeTextWidth, yPosition, margin + gradeTextWidth + gradeValueWidth, yPosition);
      
      // Add grade level value if available
      if (safeFormData.gradeLevel) {
        doc.text(safeFormData.gradeLevel, margin + gradeTextWidth + 2, yPosition);
      }
      
      const studentsText = 'Number of Students: ';
      const studentsStartX = margin + contentWidth / 2;
      const studentsTextWidth = doc.getTextWidth(studentsText);
      doc.text(studentsText, studentsStartX, yPosition);
      
      // Draw underline for number of students
      doc.line(studentsStartX + studentsTextWidth, yPosition, pageWidth - margin, yPosition);
      
      // Add number of students value if available
      if (safeFormData.numberOfStudents) {
        doc.text(safeFormData.numberOfStudents, studentsStartX + studentsTextWidth + 2, yPosition);
      }
      
      yPosition += 7;
      
      // Subject & Concurrent Topic
      const subjectText = 'Subject: ';
      const subjectTextWidth = doc.getTextWidth(subjectText);
      doc.text(subjectText, margin, yPosition);
      
      // Draw underline for subject
      const subjectValueWidth = (contentWidth / 2) - subjectTextWidth - 5;
      doc.line(margin + subjectTextWidth, yPosition, margin + subjectTextWidth + subjectValueWidth, yPosition);
      
      // Add subject value if available
      if (safeFormData.subject) {
        doc.text(safeFormData.subject, margin + subjectTextWidth + 2, yPosition);
      }
      
      const topicText = 'Concurrent Topic: ';
      const topicStartX = margin + contentWidth / 2;
      const topicTextWidth = doc.getTextWidth(topicText);
      doc.text(topicText, topicStartX, yPosition);
      
      // Draw underline for concurrent topic
      doc.line(topicStartX + topicTextWidth, yPosition, pageWidth - margin, yPosition);
      
      // Add concurrent topic value if available
      if (safeFormData.concurrentTopic) {
        doc.text(safeFormData.concurrentTopic, topicStartX + topicTextWidth + 2, yPosition);
      }
      
      yPosition += 7;
      
      // Unit & Teacher In-Charge
      const unitText = 'Unit: ';
      const unitTextWidth = doc.getTextWidth(unitText);
      doc.text(unitText, margin, yPosition);
      
      // Draw underline for unit
      const unitValueWidth = (contentWidth / 2) - unitTextWidth - 5;
      doc.line(margin + unitTextWidth, yPosition, margin + unitTextWidth + unitValueWidth, yPosition);
      
      // Add unit value if available
      if (safeFormData.unit) {
        doc.text(safeFormData.unit, margin + unitTextWidth + 2, yPosition);
      }
      
      const teacherText = 'Teacher In-Charge: ';
      const teacherStartX = margin + contentWidth / 2;
      const teacherTextWidth = doc.getTextWidth(teacherText);
      doc.text(teacherText, teacherStartX, yPosition);
      
      // Draw underline for teacher in-charge
      doc.line(teacherStartX + teacherTextWidth, yPosition, pageWidth - margin, yPosition);
      
      // Add teacher in-charge value if available
      if (safeFormData.teacherInCharge) {
        doc.text(safeFormData.teacherInCharge, teacherStartX + teacherTextWidth + 2, yPosition);
      }
      
      yPosition += 7;
      
      // Venue of the Experiment & Inclusive Time of Use
      const venueText = 'Venue of the Experiment: ';
      const venueTextWidth = doc.getTextWidth(venueText);
      doc.text(venueText, margin, yPosition);
      
      // Draw underline for venue
      const venueValueWidth = (contentWidth / 2) - venueTextWidth - 5;
      doc.line(margin + venueTextWidth, yPosition, margin + venueTextWidth + venueValueWidth, yPosition);
      
      // Add venue value if available
      if (safeFormData.venue) {
        doc.text(safeFormData.venue, margin + venueTextWidth + 2, yPosition);
      }
      
      const timeText = 'Inclusive Time of Use: ';
      const timeStartX = margin + contentWidth / 2;
      const timeTextWidth = doc.getTextWidth(timeText);
      doc.text(timeText, timeStartX, yPosition);
      
      // Draw underline for inclusive time
      doc.line(timeStartX + timeTextWidth, yPosition, pageWidth - margin, yPosition);
      
      // Add inclusive time value if available
      if (safeFormData.inclusiveTimeOfUse) {
        doc.text(safeFormData.inclusiveTimeOfUse, timeStartX + timeTextWidth + 2, yPosition);
      }
      
      yPosition += 7;
      
      // Date/Inclusive Date
      const dateText = 'Date/Inclusive Date: ';
      const dateTextWidth = doc.getTextWidth(dateText);
      doc.text(dateText, margin, yPosition);
      
      // Draw underline for date
      doc.line(margin + dateTextWidth, yPosition, margin + dateTextWidth + 100, yPosition);
      
      // Add date value if available
      if (safeFormData.date) {
        doc.text(safeFormData.date, margin + dateTextWidth + 2, yPosition);
      }
      
      yPosition += 10;
    } catch (formDetailsError) {
      console.error('Error creating form details section:', formDetailsError);
      yPosition += 30; // Fallback position
    }
   
    // Add materials/equipment section
    try {
      // Section header - Materials/Equipment Needed
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('Materials/Equipment Needed:', margin, yPosition);
      
      yPosition += 5;
      
      // Create table headers
      const tableColumns = [
        { header: 'Quantity', dataKey: 'quantity' },
        { header: 'Item', dataKey: 'item' },
        { header: 'Description', dataKey: 'description' },
        { header: 'Issued\nCondition', dataKey: 'issuedCondition' },
        { header: 'Returned\nCondition/Remarks', dataKey: 'returnedCondition' }
      ];
      
      // Prepare table data
      const tableData = materialsData.map(item => ({
        quantity: item.quantity,
        item: item.item,
        description: item.description,
        issuedCondition: item.issuedCondition,
        returnedCondition: item.returnedCondition
      }));
      
      // Create the table
      const tableResult = autoTable(doc, {
        startY: yPosition,
        head: [['Quantity', 'Item', 'Description', 'Issued\nCondition', 'Returned\nCondition/Remarks']],
        body: tableData,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 1 },
        headStyles: { fillColor: [255, 255, 255], textColor: [0, 0, 0], fontStyle: 'bold' },
        margin: { left: margin, right: margin },
        columnStyles: {
          0: { cellWidth: 20 },
          1: { cellWidth: 35 },
          2: { cellWidth: 'auto' },
          3: { cellWidth: 30 },
          4: { cellWidth: 35 }
        }
      });
      
      // Get the ending Y position from the table
      yPosition = tableResult.finalY || 180;
      
      // Add received by and received and inspected by at the bottom of the table
      // Calculate position - we need to modify the last row of the table
      // This is complex to do with autoTable, so we'll add text and lines manually
      const cellHeight = 20;
      const lastRowY = yPosition - cellHeight;
      const colWidths = [20, 35, contentWidth - 20 - 35 - 30 - 35, 30, 35];
      const col1X = margin;
      const col2X = col1X + colWidths[0];
      const col3X = col2X + colWidths[1];
      const col4X = col3X + colWidths[2];
      const col5X = col4X + colWidths[3];
      const col6X = col5X + colWidths[4];
      
      // Draw the received by text in the 4th column
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('Received by:', col4X + 2, lastRowY + 4);
      
      if (safeFormData.receivedBy) {
        doc.text(safeFormData.receivedBy, col4X + 2, lastRowY + 12);
      }
      
      doc.text('Date:', col4X + 2, lastRowY + 18);
      if (safeFormData.receivedDate) {
        doc.text(safeFormData.receivedDate, col4X + 10, lastRowY + 18);
      }
      
      // Draw the received and inspected by text in the 5th column
      doc.text('Received and Inspected by:', col5X + 2, lastRowY + 4);
      
      if (safeFormData.receivedAndInspectedBy) {
        doc.text(safeFormData.receivedAndInspectedBy, col5X + 2, lastRowY + 12);
      }
      
      doc.text('Date:', col5X + 2, lastRowY + 18);
      if (safeFormData.inspectedDate) {
        doc.text(safeFormData.inspectedDate, col5X + 10, lastRowY + 18);
      }
      
      yPosition += 5;
    } catch (materialsError) {
      console.error('Error creating materials section:', materialsError);
      yPosition += 50; // Fallback position
    }
   
    // Add notes section
    try {
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('• Fill out this form completely and legibly; transact with the Unit SRA concerned during office hours.', margin, yPosition);
      yPosition += 4;
      doc.text('• Requests not in accordance with existing Unit regulations and considerations may not be granted.', margin, yPosition);
      yPosition += 8;
    } catch (notesError) {
      console.error('Error creating notes section:', notesError);
      yPosition += 12; // Fallback position
    }
   
    // Add requested by and date requested section
    try {
      // Requested by
      const requestedText = 'Requested by: ';
      const requestedTextWidth = doc.getTextWidth(requestedText);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(requestedText, margin, yPosition);
      
      // Draw underline for requested by
      const requestedLineWidth = contentWidth / 3;
      doc.line(margin + requestedTextWidth, yPosition, margin + requestedTextWidth + requestedLineWidth, yPosition);
      
      // Add requested by value if available
      if (safeFormData.requestedBy) {
        doc.text(safeFormData.requestedBy, margin + requestedTextWidth + 2, yPosition);
      }
      
      // Teacher/Student label under the line
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Teacher/Student', margin + requestedTextWidth + (requestedLineWidth / 2), yPosition + 4, { align: 'center' });
      
      // Date Requested
      const dateRequestedText = 'Date Requested: ';
      const dateRequestedTextWidth = doc.getTextWidth(dateRequestedText);
      const dateRequestedX = pageWidth - margin - contentWidth / 3 - dateRequestedTextWidth;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(dateRequestedText, dateRequestedX, yPosition);
      
      // Draw underline for date requested
      const dateRequestedLineWidth = contentWidth / 3;
      doc.line(dateRequestedX + dateRequestedTextWidth, yPosition, pageWidth - margin, yPosition);
      
      // Add date requested value if available
      if (safeFormData.dateRequested) {
        doc.text(safeFormData.dateRequested, dateRequestedX + dateRequestedTextWidth + 2, yPosition);
      }
      
      yPosition += 8;
    } catch (requestedError) {
      console.error('Error creating requested section:', requestedError);
      yPosition += 8; // Fallback position
    }
   
    // Add students list section
    try {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('If user of the lab is a group, list down the names of students.', margin, yPosition);
      yPosition += 5;
      
      // Add students rows
      const studentLineWidth = 60;
      for (let i = 0; i < 5; i++) {
        const studentNumber = `${i + 1}.`;
        const studentNumberWidth = doc.getTextWidth(studentNumber);
        const studentNumberX = margin + 5;
        
        doc.text(studentNumber, studentNumberX, yPosition);
        
        // Draw line for student name
        doc.line(studentNumberX + studentNumberWidth + 2, yPosition, studentNumberX + studentNumberWidth + 2 + studentLineWidth, yPosition);
        
        // Add student name if available
        if (studentsData[i] && studentsData[i].name) {
          doc.text(studentsData[i].name, studentNumberX + studentNumberWidth + 4, yPosition);
        }
        
        yPosition += 5;
      }
      
      yPosition += 3;
    } catch (studentsError) {
      console.error('Error creating students list section:', studentsError);
      yPosition += 30; // Fallback position
    }
   
    // Add endorsed by and approved by section
    try {
      // Endorsed by
      const endorsedByWidth = contentWidth / 2 - 10;
      const endorsedText = 'Endorsed by: ';
      const endorsedTextWidth = doc.getTextWidth(endorsedText);
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(endorsedText, margin, yPosition);
      
      // Draw underline for endorsed by
      doc.line(margin + endorsedTextWidth, yPosition, margin + endorsedByWidth, yPosition);
      
      // Add endorsed by value if available
      if (safeFormData.endorsedBy) {
        doc.text(safeFormData.endorsedBy, margin + endorsedTextWidth + 2, yPosition);
      }
      
      // Subject Teacher/Unit Head label under the line
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      const endorsedLabelX = margin + (endorsedByWidth / 2);
      doc.text('Subject Teacher/Unit Head', endorsedLabelX, yPosition + 4, { align: 'center' });
      
      // Approved by
      const approvedText = 'Approved by: ';
      const approvedTextWidth = doc.getTextWidth(approvedText);
      const approvedX = margin + contentWidth / 2 + 10;
      
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(approvedText, approvedX, yPosition);
      
      // Draw underline for approved by
      doc.line(approvedX + approvedTextWidth, yPosition, pageWidth - margin, yPosition);
      
      // Add approved by value if available
      if (safeFormData.approvedBy) {
        doc.text(safeFormData.approvedBy, approvedX + approvedTextWidth + 2, yPosition);
      }
      
      // SRS / SRA label under the line
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      const approvedLabelX = approvedX + ((pageWidth - margin - approvedX) / 2);
      doc.text('SRS / SRA', approvedLabelX, yPosition + 4, { align: 'center' });
      
      yPosition += 10;
    } catch (signaturesError) {
      console.error('Error creating signatures section:', signaturesError);
      yPosition += 10; // Fallback position
    }
   
    // Add footer
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