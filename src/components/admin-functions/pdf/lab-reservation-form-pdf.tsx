import { jsPDF } from 'jspdf';

// Define interfaces for the laboratory reservation form data
interface StudentInfo {
  name: string;
}

interface UtilTime {
  id: number;
  timeStart: string;
  timeEnd: string;
  date: string;
}

interface DetailedEVCReservation {
  id: number;
  ControlNo: number | null;
  EVCStatus: string;
  LvlSec: string | null;
  NoofStudents: number | null;
  Subject: string | null;
  Teacher: string | null;
  TeacherEmail: string | null;
  Topic: string | null;
  DateRequested: string | null;
  ApprovedBy: string | null;
  SchoolYear: number | null;
  ReceivedBy: string | null;
  ReceivedDate: string | null;
  InspectedBy: string | null;
  InspectedDate: string | null;
  EVCStudents: any[];
  NeededMaterials: any[];
  UtilTimes: UtilTime[];
  accInfo: {
    Name: string;
    email: string;
    Role: string;
  };
}

interface LabReservationFormData {
  campus: string;
  controlNo: string;
  schoolYear: string;
  gradeLevel: string;
  numberOfStudents: string;
  subject: string;
  teacherInCharge: string;
  inclusiveTimeOfUse: string;
  date: string;
  preferredLabRoom: string;
  requestedBy: string;
  dateRequested: string;
  students: StudentInfo[];
  endorsedBy: string;
  approvedBy: string;
}

/**
 * Draw an underline
 */
const drawUnderline = (
  doc: jsPDF,
  x: number,
  y: number,
  width: number,
  thickness: number = 0.1
) => {
  doc.setDrawColor(0);
  doc.setLineWidth(thickness);
  doc.line(x, y, x + width, y);
};

/**
 * Format date for display
 */
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch (e) {
    return dateString; // Return the original string if parsing fails
  }
};

/**
 * Convert DetailedEVCReservation to LabReservationFormData
 * @param evcData - The EVC reservation data
 * @returns The formatted lab reservation form data
 */
export const convertEVCToLabFormData = (evcData: DetailedEVCReservation): LabReservationFormData => {
  // Format the time from UtilTime objects
  let timeString = '';
  if (evcData.UtilTimes && evcData.UtilTimes.length > 0) {
    const times = evcData.UtilTimes.map(time =>
      `${time.timeStart} - ${time.timeEnd}`
    );
    timeString = times.join(', ');
  }

  // Format date from UtilTimes
  let dateString = '';
  if (evcData.UtilTimes && evcData.UtilTimes.length > 0) {
    const dates = [...new Set(evcData.UtilTimes.map(time => time.date))];
    dateString = dates.join(', ');
  }

  // Convert student data from EVCStudents
  const students: StudentInfo[] = [];
  
  if (evcData.EVCStudents && evcData.EVCStudents.length > 0) {
    // Iterate through EVCStudents array
    evcData.EVCStudents.forEach(student => {
      // Based on your UI code, the primary property seems to be StudentName
      // First try to get StudentName directly
      let studentName = student.StudentName;
      
      // If StudentName is not available, try other possible property names
      if (!studentName) {
        studentName = student.Name || student.name;
        
        // If student is a string itself (e.g., just the name)
        if (!studentName && typeof student === 'string') {
          studentName = student;
        }
        
        // Last resort - try to stringify if it's an object without expected properties
        if (!studentName && typeof student === 'object') {
          try {
            // This is a fallback - try to get any usable string representation
            studentName = JSON.stringify(student);
          } catch (e) {
            studentName = 'Unknown Student';
          }
        }
      }
      
      // Only add non-empty student names
      if (studentName && studentName.trim() !== '') {
        students.push({ name: studentName.trim() });
      }
    });
  }

  // Add debug logging to check the extracted student data
  console.log('Extracted students:', students);

  return {
    campus: '',  // Default or from configuration
    controlNo: evcData.ControlNo?.toString() || '',
    schoolYear: evcData.SchoolYear?.toString() || '',
    gradeLevel: evcData.LvlSec || '',
    numberOfStudents: evcData.NoofStudents?.toString() || '',
    subject: evcData.Subject || '',
    teacherInCharge: evcData.Teacher || '',
    inclusiveTimeOfUse: timeString,
    date: dateString,
    preferredLabRoom: 'Fabrication Laboratory', // Default for EVC reservations
    requestedBy: evcData.Teacher || evcData.accInfo?.Name || '',
    dateRequested: evcData.DateRequested || '',
    students: students,
    endorsedBy: '',  // To be filled manually or from other data
    approvedBy: evcData.ApprovedBy || ''
  };
};

/**
 * Generate and download a PDF laboratory reservation form
 * @param formData - The laboratory reservation form data
 */
export const downloadLabReservationFormPDF = (formData: LabReservationFormData): void => {
  try {
    // Ensure formData has default values to prevent null/undefined errors
    const safeFormData = {
      campus: formData.campus || '',
      controlNo: formData.controlNo || '',
      schoolYear: formData.schoolYear || '',
      gradeLevel: formData.gradeLevel || '',
      numberOfStudents: formData.numberOfStudents || '',
      subject: formData.subject || '',
      teacherInCharge: formData.teacherInCharge || '',
      inclusiveTimeOfUse: formData.inclusiveTimeOfUse || '',
      date: formData.date || '',
      preferredLabRoom: formData.preferredLabRoom || '',
      requestedBy: formData.requestedBy || '',
      dateRequested: formData.dateRequested || '',
      students: Array.isArray(formData.students) ? formData.students : [],
      endorsedBy: formData.endorsedBy || '',
      approvedBy: formData.approvedBy || ''
    };

    // Log students data for debugging
    console.log('Student data for PDF:', safeFormData.students);

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

    // Define page dimensions and margins
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);

    // Start position for content
    let y = 15;

    // HEADER SECTION
    // Add header text
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('PHILIPPINE SCIENCE HIGH SCHOOL SYSTEM', pageWidth / 2, y, { align: 'left' });
    y += 7;

    // Add campus field with underline
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('CAMPUS:', margin, y);
   
    // Draw underline for campus
    const campusTextWidth = doc.getTextWidth('CAMPUS: ');
    drawUnderline(doc, margin + campusTextWidth, y, contentWidth / 2 - campusTextWidth);
   
    // Add campus value if available
    if (safeFormData.campus) {
      doc.text(safeFormData.campus, margin + campusTextWidth + 2, y);
    }
   
    y += 10;
   
    // Form title
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('LABORATORY RESERVATION FORM', pageWidth / 2, y, { align: 'left' });
   
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
    drawUnderline(doc, controlNoX + controlNoWidth + 2, y, 50);
   
    // Add Control No value if available
    if (safeFormData.controlNo) {
      doc.text(safeFormData.controlNo, controlNoX + controlNoWidth + 4, y);
    }
   
    // Position for SY (right-aligned)
    const syX = pageWidth - margin - 40;
    const syWidth = doc.getTextWidth(syText);
    doc.text(syText, syX, y);
   
    // Draw underline for SY
    drawUnderline(doc, syX + syWidth + 2, y, 30);
   
    // Add SY value if available
    if (safeFormData.schoolYear) {
      doc.text(safeFormData.schoolYear, syX + syWidth + 4, y);
    }
   
    y += 10;

    // FORM FIELDS SECTION
    // Grade Level and Section & Number of Students
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
   
    // Draw Grade Level field
    const gradeText = 'Grade Level and Section:';
    const gradeTextWidth = doc.getTextWidth(gradeText);
    doc.text(gradeText, margin, y);
   
    // Draw underline for grade level
    const halfWidth = (contentWidth / 2) - 5;
    drawUnderline(doc, margin + gradeTextWidth + 2, y, halfWidth - gradeTextWidth - 2);
   
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
    drawUnderline(doc, studentsX + studentsWidth + 2, y, contentWidth - halfWidth - 10 - studentsWidth - 2);
   
    // Add number of students value if available
    if (safeFormData.numberOfStudents) {
      doc.text(safeFormData.numberOfStudents, studentsX + studentsWidth + 4, y);
    }
   
    y += 7;
   
    // Subject field
    const subjectText = 'Subject:';
    const subjectWidth = doc.getTextWidth(subjectText);
    doc.text(subjectText, margin, y);
   
    // Draw underline for subject
    drawUnderline(doc, margin + subjectWidth + 2, y, halfWidth - subjectWidth - 2);
   
    // Add subject value if available
    if (safeFormData.subject) {
      doc.text(safeFormData.subject, margin + subjectWidth + 4, y);
    }
   
    // Teacher In-Charge field
    const teacherText = 'Teacher In-Charge:';
    const teacherX = margin + halfWidth + 10;
    const teacherWidth = doc.getTextWidth(teacherText);
    doc.text(teacherText, teacherX, y);
   
    // Draw underline for teacher
    drawUnderline(doc, teacherX + teacherWidth + 2, y, contentWidth - halfWidth - 10 - teacherWidth - 2);
   
    // Add teacher value if available
    if (safeFormData.teacherInCharge) {
      doc.text(safeFormData.teacherInCharge, teacherX + teacherWidth + 4, y);
    }
   
    y += 7;
   
    // Date/Inclusive Dates
    const dateText = 'Date/Inclusive Dates:';
    const dateWidth = doc.getTextWidth(dateText);
    doc.text(dateText, margin, y);
   
    // Draw underline for date
    drawUnderline(doc, margin + dateWidth + 2, y, halfWidth - dateWidth - 2);
   
    // Add date value if available
    if (safeFormData.date) {
      doc.text(safeFormData.date, margin + dateWidth + 4, y);
    }
   
    // Inclusive Time of Use field
    const timeText = 'Inclusive Time of Use:';
    const timeX = margin + halfWidth + 10;
    const timeWidth = doc.getTextWidth(timeText);
    doc.text(timeText, timeX, y);
   
    // Draw underline for time
    drawUnderline(doc, timeX + timeWidth + 2, y, contentWidth - halfWidth - 10 - timeWidth - 2);
   
    // Add time value if available
    if (safeFormData.inclusiveTimeOfUse) {
      doc.text(safeFormData.inclusiveTimeOfUse, timeX + timeWidth + 4, y);
    }
   
    y += 7;
   
    // Preferred Lab Room
    const labRoomText = 'Preferred Lab Room:';
    const labRoomWidth = doc.getTextWidth(labRoomText);
    doc.text(labRoomText, margin, y);
   
    // Draw underline for lab room
    drawUnderline(doc, margin + labRoomWidth + 2, y, contentWidth - labRoomWidth - 2);
   
    // Add lab room value if available
    if (safeFormData.preferredLabRoom) {
      doc.text(safeFormData.preferredLabRoom, margin + labRoomWidth + 4, y);
    }
   
    y += 25;
   
    // SIGNATURE SECTION
    // Requested by
    const thirdWidth = contentWidth / 3;
   
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
   
    // Requested by
    const requestedText = 'Requested by:';
    const requestedWidth = doc.getTextWidth(requestedText);
   
    doc.text(requestedText, margin, y);
    drawUnderline(doc, margin + requestedWidth + 2, y, thirdWidth);
   
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
    drawUnderline(doc, dateReqX + dateReqWidth + 2, y, thirdWidth - dateReqWidth - 2);
   
    if (safeFormData.dateRequested) {
      doc.text(formatDate(safeFormData.dateRequested), dateReqX + dateReqWidth + 4, y - 1);
    }
   
    y += 15;
   
    // If user is a group text
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.text('If user of the lab is a group, list down the names of students.', margin, y);
   
    y += 7;
   
// Student list
doc.setFontSize(10);
doc.setFont('helvetica', 'normal');

for (let i = 0; i < 5; i++) {
  const studentNumber = `${i + 1}.`;
  const studentX = margin + 5;
  
  doc.text(studentNumber, studentX, y);
  
  // Draw line for student name
  const lineStart = studentX + doc.getTextWidth(studentNumber) + 2;
  const lineWidth = 70;
  drawUnderline(doc, lineStart, y, lineWidth);
  
  // Add student name if available
  if (studentsData[i] && studentsData[i].name) {
    // Calculate text width to prevent overflow
    const studentName = studentsData[i].name;
    const textWidth = doc.getTextWidth(studentName);
    
    // Adjust font size if name is too long
    if (textWidth > lineWidth - 4) {
      const originalSize = doc.getFontSize();
      const scaleFactor = (lineWidth - 4) / textWidth;
      const newSize = originalSize * Math.min(scaleFactor, 1);
      doc.setFontSize(newSize);
      doc.text(studentName, lineStart + 2, y - 1);
      doc.setFontSize(originalSize); // Reset to original size
    } else {
      doc.text(studentName, lineStart + 2, y - 1);
    }
  }
  
  y += 7;
}
   
    y += 15;
   
    // Endorsements section
    const halfContentWidth = contentWidth / 2;
   
    // Endorsed by
    const endorsedText = 'Endorsed by:';
    const endorsedWidth = doc.getTextWidth(endorsedText);
   
    doc.setFontSize(10);
    doc.text(endorsedText, margin, y);
    drawUnderline(doc, margin + endorsedWidth + 2, y, halfContentWidth - endorsedWidth - 10);
   
    if (safeFormData.endorsedBy) {
      doc.text(safeFormData.endorsedBy, margin + endorsedWidth + 4, y - 1);
    }
   
    // Add Subject Teacher/Unit Head label
    doc.setFontSize(8);
    doc.text('Subject Teacher/Unit Head', margin + (halfContentWidth / 2) - 15, y + 4, { align: 'center' });
   
    // Approved by
    const approvedText = 'Approved by:';
    const approvedWidth = doc.getTextWidth(approvedText);
    const approvedX = margin + halfContentWidth + 10;
   
    doc.setFontSize(10);
    doc.text(approvedText, approvedX, y);
    drawUnderline(doc, approvedX + approvedWidth + 2, y, halfContentWidth - approvedWidth - 10);
   
    if (safeFormData.approvedBy) {
      doc.text(safeFormData.approvedBy, approvedX + approvedWidth + 4, y - 1);
    }
   
    // Add SRS/SRA label
    doc.setFontSize(8);
    doc.text('SRS/ SRA', approvedX + (halfContentWidth / 2) - 15, y + 4, { align: 'center' });
   
    // FOOTER
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('PSHS-00-F-CID-05-Ver02-Rev1-10/18/20', margin, pageHeight - 10);
   
    // Save the PDF
    doc.save(`Laboratory_Reservation_Form.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    alert('An error occurred while generating the PDF. Please try again.');
  }
};

/**
 * Generate and download a PDF laboratory reservation form directly from EVC reservation data
 * @param evcData - The EVC reservation data
 */
export const downloadEVCReservationFormPDF = (evcData: DetailedEVCReservation): void => {
  const formData = convertEVCToLabFormData(evcData);
  downloadLabReservationFormPDF(formData);
};

export default downloadLabReservationFormPDF;