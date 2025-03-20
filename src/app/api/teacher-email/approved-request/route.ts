// app/api/teacher-email/approved-request/route.ts

import nodemailer from 'nodemailer';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const token = searchParams.get('token');
  const reservationId = searchParams.get('reservationId');
  const studentName = searchParams.get('studentName');
  const studentEmail = searchParams.get('studentEmail');
  
  if (!token || !reservationId || !studentName || !studentEmail) {
    return new Response(
      '<html><body><h1>Invalid approval link</h1><p>The approval link is missing required parameters.</p></body></html>', 
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    );
  }
  
  try {
    console.log('Processing approval request for reservation:', reservationId);
    
    // Update reservation EVCStatus to 'Approved'
    await prisma.eVCReservation.update({
      where: { id: parseInt(reservationId) },
      data: { 
        EVCStatus: 'Pending',
        ReceivedDate: new Date()
      }
    });
    
    console.log('Reservation updated successfully');
    
    // Create a transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    
    // Send notification to student that their request was approved
    const studentMailOptions = {
      from: process.env.EMAIL_USER,
      to: studentEmail,
      subject: `Your FabLAB Reservation Has Been Approved`,
      html: `
        <h3>FabLAB Reservation Approved</h3>
        <p>Dear ${studentName},</p>
        <p>Good news! Your teacher has approved your FabLAB reservation request.</p>
        <p>You can now proceed with your project. The FabLAB staff will be in touch with you soon with further instructions.</p>
        <p>Thank you,<br>FabLAB Team</p>
      `,
    };
    
    // Send notification to FabLAB admin that teacher has approved
    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL || 'fablab@evc.pshs.edu.ph',
      subject: `Teacher Approved: ${studentName}'s FabLAB Reservation`,
      html: `
        <h3>Teacher Approval Received</h3>
        <p>A teacher has approved the FabLAB reservation for:</p>
        <p><strong>Student Name:</strong> ${studentName}</p>
        <p><strong>Student Email:</strong> ${studentEmail}</p>
        <p><strong>Reservation ID:</strong> ${reservationId}</p>
        <p>This reservation is now approved. Please coordinate with the student for their scheduled FabLAB use.</p>
      `,
    };
    
    // Send both emails with more error handling
    try {
      console.log('Sending email to student:', studentEmail);
      await transporter.sendMail(studentMailOptions);
      console.log('Student email sent successfully');
    } catch (emailError) {
      console.error('Error sending student email:', emailError);
    }
    
    try {
      console.log('Sending email to admin');
      await transporter.sendMail(adminMailOptions);
      console.log('Admin email sent successfully');
    } catch (emailError) {
      console.error('Error sending admin email:', emailError);
    }
    
    // Return a success page to the teacher
    return new Response(
      `<html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
            h1 { color: #10539b; }
            .message { background-color: #f0f8ff; padding: 20px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1>Approval Successful</h1>
          <div class="message">
            <p>Thank you for approving ${studentName}'s FabLAB reservation request.</p>
            <p>The student and the FabLAB team have both been notified.</p>
            <p>The student will now be able to proceed with their project.</p>
          </div>
        </body>
      </html>`, 
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error: any) {
    console.error('Error processing approval:', error);
    return new Response(
      '<html><body><h1>Error</h1><p>Failed to process the approval. Please try again later.</p></body></html>', 
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    );
  }
}