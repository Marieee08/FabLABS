// app/api/teacher-email/approval-request/route.ts

import nodemailer from 'nodemailer';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Function to create a unique token for approval links
function generateToken() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication - using await with auth()
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestData = await request.json();
    console.log('Received approval request data:', requestData);
    
    const { 
      reservationId,
      studentName, 
      studentEmail, 
      studentGrade,
      teacherEmail,
      teacherName,
      subject,
      topic,
      dates,
      materials,
      students
    } = requestData;
    
    // Validate required fields
    if (!reservationId || !studentName || !studentEmail || !teacherEmail) {
      return NextResponse.json(
        { error: 'Missing required fields', details: { reservationId, studentName, studentEmail, teacherEmail } }, 
        { status: 400 }
      );
    }
    
    // Generate a unique token for the approval link
    const approvalToken = generateToken();
    
    // Create a transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Base URL for approval (adjust for your environment)
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    
    // Make sure reservationId is handled correctly in URL
    const approvalUrl = `${baseUrl}/api/teacher-email/approved-request?token=${approvalToken}&reservationId=${reservationId}&studentEmail=${encodeURIComponent(studentEmail)}&studentName=${encodeURIComponent(studentName)}`;

    console.log('Generated approval URL:', approvalUrl);

    // Construct email HTML for materials table
    let materialsHtml = '';
    if (materials && materials.length > 0) {
      materialsHtml = `
        <h4>Materials Needed:</h4>
        <table border="1" cellpadding="5" style="border-collapse: collapse;">
          <tr>
            <th>Item</th>
            <th>Quantity</th>
            <th>Description</th>
          </tr>
          ${materials.map((material: any) => `
            <tr>
              <td>${material.Item}</td>
              <td>${material.ItemQty}</td>
              <td>${material.Description}</td>
            </tr>
          `).join('')}
        </table>
      `;
    }

    // Construct email HTML for students list
    let studentsHtml = '';
    if (students && students.length > 0) {
      studentsHtml = `
        <h4>Students:</h4>
        <ul>
          ${students.map((student: any) => `<li>${student.name}</li>`).join('')}
        </ul>
      `;
    }

    // Construct email HTML for dates
    let datesHtml = '';
    if (dates && dates.length > 0) {
      datesHtml = `
        <h4>Reservation Dates:</h4>
        <ul>
          ${dates.map((day: any) => `
            <li>
              <strong>${day.date}</strong>: ${day.startTime} - ${day.endTime}
            </li>
          `).join('')}
        </ul>
      `;
    }

    // Email to FabLab admin about the new request
    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL || 'lnsabando@evc.pshs.edu.ph',
      subject: `New FabLAB Reservation from ${studentName}`,
      html: `
        <h3>New FabLAB Reservation Request</h3>
        <p><strong>Student Name:</strong> ${studentName}</p>
        <p><strong>Student Email:</strong> ${studentEmail}</p>
        <p><strong>Student Grade:</strong> ${studentGrade}</p>
        <p><strong>Teacher:</strong> ${teacherName}</p>
        <p><strong>Teacher Email:</strong> ${teacherEmail}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Topic:</strong> ${topic}</p>
        
        ${datesHtml}
        ${studentsHtml}
        ${materialsHtml}
        
        <p>This reservation requires teacher approval. The teacher has been notified.</p>
      `,
    };

    // Email to teacher for approval
    const teacherMailOptions = {
      from: process.env.EMAIL_USER,
      to: teacherEmail,
      subject: `FabLAB Reservation Approval for ${studentName}`,
      html: `
        <h3>FabLAB Reservation Approval Request</h3>
        <p>Dear ${teacherName || 'Teacher'},</p>
        <p>${studentName} from ${studentGrade} has submitted a reservation request to use the FabLAB services.</p>
        
        <p><strong>Reservation Details:</strong></p>
        <ul>
          <li><strong>Student:</strong> ${studentName}</li>
          <li><strong>Email:</strong> ${studentEmail}</li>
          <li><strong>Grade/Section:</strong> ${studentGrade}</li>
          <li><strong>Subject:</strong> ${subject}</li>
          <li><strong>Topic:</strong> ${topic}</li>
        </ul>
        
        ${datesHtml}
        ${studentsHtml}
        ${materialsHtml}
        
        <p>Please review this reservation request and approve or reject it.</p>
        
        <div style="text-align: center; margin: 30px 0;">
        <table style="margin: 0 auto; border-collapse: separate; border-spacing: 25px 0;">
          <tr>
            <td>
              <a href="${approvalUrl}" style="display: inline-block; background-color: #10539b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; min-width: 160px; text-align: center;">
                Approve Reservation
              </a>
            </td>
            <td>
              <a href="${baseUrl}/api/teacher-email/rejected-request?token=${approvalToken}&reservationId=${reservationId}&studentEmail=${encodeURIComponent(studentEmail)}&studentName=${encodeURIComponent(studentName)}" style="display: inline-block; background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; min-width: 160px; text-align: center;">
                Reject Reservation
              </a>
            </td>
          </tr>
        </table>
      </div>
        
        <p>If you have any questions, please contact the FabLAB team.</p>
        
        <p>Thank you,<br>FabLAB Team</p>
      `,
    };


    // Send emails with better error handling
    let adminEmailSent = false;
    let teacherEmailSent = false;
    
    try {
      console.log('Sending admin email to:', adminMailOptions.to);
      await transporter.sendMail(adminMailOptions);
      console.log('Admin email sent successfully');
      adminEmailSent = true;
    } catch (emailError) {
      console.error('Error sending admin email:', emailError);
    }
    
    try {
      console.log('Sending teacher email to:', teacherMailOptions.to);
      const teacherEmailResult = await transporter.sendMail(teacherMailOptions);
      console.log('Teacher email sent successfully:', teacherEmailResult.accepted);
      teacherEmailSent = true;
    } catch (emailError) {
      console.error('Error sending teacher email:', emailError);
      return NextResponse.json(
        { success: false, error: 'Failed to send teacher approval email', details: JSON.stringify(emailError) }, 
        { status: 500 }
      );
    }
    
    // Return success response
    return NextResponse.json({ 
      success: true,
      adminEmailSent,
      teacherEmailSent,
      message: 'Teacher approval request sent successfully'
    });
    
  } catch (error: any) {
    console.error('Error processing teacher approval request:', error);
    return NextResponse.json(
      { success: false, error: error.message, stack: error.stack }, 
      { status: 500 }
    );
  }
}