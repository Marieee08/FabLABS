// app/api/reservations/teacher-approval-request/route.ts

import nodemailer from 'nodemailer';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';

// Function to create a unique token for approval links
function generateToken() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

export async function POST(request: NextRequest) {
  // Verify authentication
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
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
    } = await request.json();
    
    // Validate required fields
    if (!reservationId || !studentName || !studentEmail || !teacherEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }
    
    // Generate a unique token for the approval link
    const approvalToken = generateToken();
    
    // In a production app, you would store this token in your database
    // For example:
    // await prisma.reservationApproval.create({
    //   data: {
    //     token: approvalToken,
    //     reservationId: reservationId,
    //     studentEmail,
    //     teacherEmail,
    //     expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    //   }
    // });
    
    // Create a transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Use your preferred service
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Base URL for approval (adjust for your environment)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const approvalUrl = `${baseUrl}/api/reservations/approve?token=${approvalToken}&reservationId=${reservationId}&studentEmail=${encodeURIComponent(studentEmail)}&studentName=${encodeURIComponent(studentName)}`;

    // Email to FabLab admin about the new request
    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL || 'fablab@evc.pshs.edu.ph',
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
        
        <h4>Reservation Dates:</h4>
        <ul>
          ${dates.map(day => `
            <li>
              <strong>${day.date}</strong>: ${day.startTime} - ${day.endTime}
            </li>
          `).join('')}
        </ul>
        
        ${students && students.length > 0 ? `
          <h4>Students:</h4>
          <ul>
            ${students.map(student => `<li>${student.name}</li>`).join('')}
          </ul>
        ` : ''}
        
        ${materials && materials.length > 0 ? `
          <h4>Materials Needed:</h4>
          <table border="1" cellpadding="5" style="border-collapse: collapse;">
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Description</th>
            </tr>
            ${materials.map(material => `
              <tr>
                <td>${material.Item}</td>
                <td>${material.ItemQty}</td>
                <td>${material.Description}</td>
              </tr>
            `).join('')}
          </table>
        ` : ''}
        
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
        
        <h4>Reservation Dates:</h4>
        <ul>
          ${dates.map(day => `
            <li>
              <strong>${day.date}</strong>: ${day.startTime} - ${day.endTime}
            </li>
          `).join('')}
        </ul>
        
        ${students && students.length > 0 ? `
          <h4>Students:</h4>
          <ul>
            ${students.map(student => `<li>${student.name}</li>`).join('')}
          </ul>
        ` : ''}
        
        ${materials && materials.length > 0 ? `
          <h4>Materials Needed:</h4>
          <table border="1" cellpadding="5" style="border-collapse: collapse;">
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Description</th>
            </tr>
            ${materials.map(material => `
              <tr>
                <td>${material.Item}</td>
                <td>${material.ItemQty}</td>
                <td>${material.Description}</td>
              </tr>
            `).join('')}
          </table>
        ` : ''}
        
        <p>Please review this reservation request and approve or deny it.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${approvalUrl}" style="background-color: #10539b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Approve Reservation
          </a>
        </div>
        
        <p>If you have any questions, please contact the FabLAB team.</p>
        
        <p>Thank you,<br>FabLAB Team</p>
      `,
    };

    // Send emails
    await transporter.sendMail(adminMailOptions);
    await transporter.sendMail(teacherMailOptions);
    
    // Return success response
    return NextResponse.json({ 
      success: true,
      message: 'Teacher approval request sent successfully' 
    });
    
  } catch (error: any) {
    console.error('Error processing teacher approval request:', error);
    return NextResponse.json(
      { success: false, error: error.message }, 
      { status: 500 }
    );
  }
}