// app/api/teacher-email/rejected-request/route.ts

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
      '<html><body><h1>Invalid rejection link</h1><p>The rejection link is missing required parameters.</p></body></html>', 
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    );
  }
  
  try {
    console.log('Processing rejection request for reservation:', reservationId);
    
    // Update reservation EVCStatus to 'Rejected'
    await prisma.eVCReservation.update({
      where: { id: parseInt(reservationId) },
      data: { 
        EVCStatus: 'Rejected',
        ReceivedDate: new Date(),
        ApprovedBy: 'Rejected' // Mark as explicitly rejected
      }
    });
    
    console.log('Reservation status updated to Rejected');
    
    // Create a transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    
    // Send notification to student that their request was rejected
    const studentMailOptions = {
      from: process.env.EMAIL_USER,
      to: studentEmail,
      subject: `Your FabLAB Reservation Has Been Reviewed`,
      html: `
        <h3>FabLAB Reservation Update</h3>
        <p>Dear ${studentName},</p>
        <p>We're sorry to inform you that your teacher has not approved your FabLAB reservation request at this time.</p>
        <p>You may want to check with your teacher for more information and possibly resubmit with any requested changes.</p>
        <p>Thank you,<br>FabLAB Team</p>
      `,
    };
    
    // Send notification to FabLAB admin that teacher has rejected the request
    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL || 'fablab@evc.pshs.edu.ph',
      subject: `Teacher Rejected: ${studentName}'s FabLAB Reservation`,
      html: `
        <h3>Teacher Rejection Received</h3>
        <p>A teacher has rejected the FabLAB reservation for:</p>
        <p><strong>Student Name:</strong> ${studentName}</p>
        <p><strong>Student Email:</strong> ${studentEmail}</p>
        <p><strong>Reservation ID:</strong> ${reservationId}</p>
        <p>This reservation has been marked as rejected in the system.</p>
      `,
    };
    
    // Send both emails with error handling
    try {
      console.log('Sending rejection email to student:', studentEmail);
      await transporter.sendMail(studentMailOptions);
      console.log('Student rejection email sent successfully');
    } catch (emailError) {
      console.error('Error sending student rejection email:', emailError);
    }
    
    try {
      console.log('Sending rejection notification to admin');
      await transporter.sendMail(adminMailOptions);
      console.log('Admin rejection notification sent successfully');
    } catch (emailError) {
      console.error('Error sending admin rejection notification:', emailError);
    }
    
    // Return a rejection confirmation page to the teacher
    return new Response(
      `<html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
            h1 { color: #dc3545; }
            .message { background-color: #f8d7da; padding: 20px; border-radius: 5px; }
          </style>
        </head>
        <body>
          <h1>Reservation Rejected</h1>
          <div class="message">
            <p>You have rejected ${studentName}'s FabLAB reservation request.</p>
            <p>The student and the FabLAB team have both been notified.</p>
            <p>The reservation has been marked as rejected in our system.</p>
          </div>
        </body>
      </html>`, 
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error: any) {
    console.error('Error processing rejection:', error);
    return new Response(
      '<html><body><h1>Error</h1><p>Failed to process the rejection. Please try again later.</p></body></html>', 
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    );
  }
}