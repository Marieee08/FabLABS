// app/api/teacher-email/approval-request/route.ts

import nodemailer from 'nodemailer';
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createHash } from 'crypto';

// More secure token generation using crypto
function generateToken(reservationId: string, studentEmail: string) {
  const timestamp = Date.now().toString();
  const dataToHash = `${reservationId}-${studentEmail}-${timestamp}-${process.env.EMAIL_SECRET_KEY || 'default-secret'}`;
  return createHash('sha256').update(dataToHash).digest('hex').substring(0, 32);
}

// Cache transporter to reuse connection
let cachedTransporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  
  cachedTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    // Connection pool for better performance
    pool: true,
    maxConnections: 5
  });
  
  return cachedTransporter;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication - no need to await auth()
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestData = await request.json();
    
    // Destructure and sanitize data in one go for better performance
    const { 
      reservationId,
      studentName = '',
      studentEmail = '', 
      studentGrade = '',
      teacherEmail = '',
      teacherName = 'Teacher',
      subject = 'Not specified',
      topic = 'Not specified',
      dates = [],
      materials = [],
      students = []
    } = requestData;
    
    // Validate required fields - fail fast
    if (!reservationId || !studentName || !studentEmail || !teacherEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' }, 
        { status: 400 }
      );
    }
    
    // Generate a unique token using crypto
    const approvalToken = generateToken(reservationId, studentEmail);
    
    // Get environment variables once
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    const adminEmail = process.env.ADMIN_EMAIL || 'lnsabando@evc.pshs.edu.ph';
    
    // Create urls once
    const approvalUrl = `${baseUrl}/api/teacher-email/approved-request?token=${approvalToken}&reservationId=${reservationId}&studentEmail=${encodeURIComponent(studentEmail)}&studentName=${encodeURIComponent(studentName)}`;
    const rejectionUrl = `${baseUrl}/api/teacher-email/rejected-request?token=${approvalToken}&reservationId=${reservationId}&studentEmail=${encodeURIComponent(studentEmail)}&studentName=${encodeURIComponent(studentName)}`;

    // Construct email templates more efficiently
    const materialsHtml = materials.length > 0 
      ? `
        <h4>Materials Needed:</h4>
        <table border="1" cellpadding="5" style="border-collapse: collapse;">
          <tr>
            <th>Item</th>
            <th>Quantity</th>
            <th>Description</th>
          </tr>
          ${materials.map((material: any) => `
            <tr>
              <td>${material.Item || ''}</td>
              <td>${material.ItemQty || 0}</td>
              <td>${material.Description || ''}</td>
            </tr>
          `).join('')}
        </table>
      `
      : '';

    const studentsHtml = students.length > 0
      ? `
        <h4>Students:</h4>
        <ul>
          ${students.map((student: any) => `<li>${student.name || ''}</li>`).join('')}
        </ul>
      `
      : '';

    const datesHtml = dates.length > 0
      ? `
        <h4>Reservation Dates:</h4>
        <ul>
          ${dates.map((day: any) => `
            <li>
              <strong>${day.date || ''}</strong>: ${day.startTime || 'Not specified'} - ${day.endTime || 'Not specified'}
            </li>
          `).join('')}
        </ul>
      `
      : '';

    // Get transporter from cache or create new one
    const transporter = getTransporter();

    // Prepare both emails at once
    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: adminEmail,
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
      `
    };

    const teacherMailOptions = {
      from: process.env.EMAIL_USER,
      to: teacherEmail,
      subject: `FabLAB Reservation Approval for ${studentName}`,
      html: `
        <h3>FabLAB Reservation Approval Request</h3>
        <p>Dear ${teacherName},</p>
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
                <a href="${rejectionUrl}" style="display: inline-block; background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; min-width: 160px; text-align: center;">
                  Reject Reservation
                </a>
              </td>
            </tr>
          </table>
        </div>
        
        <p>If you have any questions, please contact the FabLAB team.</p>
        
        <p>Thank you,<br>FabLAB Team</p>
      `
    };

    // Send emails in parallel for better performance
    const [adminResult, teacherResult] = await Promise.allSettled([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(teacherMailOptions)
    ]);
    
    // Process results
    const adminEmailSent = adminResult.status === 'fulfilled';
    const teacherEmailSent = teacherResult.status === 'fulfilled';
    
    if (!teacherEmailSent) {
      const error = teacherResult.status === 'rejected' ? teacherResult.reason : 'Unknown error';
      return NextResponse.json(
        { success: false, error: 'Failed to send teacher approval email', details: String(error) }, 
        { status: 500 }
      );
    }
    
    // Return success response with minimal data
    return NextResponse.json({ 
      success: true,
      adminEmailSent,
      teacherEmailSent,
      message: 'Teacher approval request sent successfully'
    });
    
  } catch (error: any) {
    console.error('Error processing teacher approval request:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Unknown error' }, 
      { status: 500 }
    );
  }
}