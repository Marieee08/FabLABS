// app/api/teacher-confirm-test/approve-request/route.ts

import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const studentName = searchParams.get('studentName');
  const studentEmail = searchParams.get('studentEmail');
  
  if (!token || !studentName || !studentEmail) {
    return new Response(
      '<html><body><h1>Invalid approval link</h1><p>The approval link is missing required parameters.</p></body></html>', 
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    );
  }
  
  try {
    // In a real application, verify the token from a database
    // For this development version, we'll assume the token is valid
    
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
      subject: `Your FabLAB Request Has Been Approved`,
      html: `
        <h3>FabLAB Request Approved</h3>
        <p>Dear ${studentName},</p>
        <p>Good news! Your teacher has approved your request to use the FabLAB services.</p>
        <p>You can now proceed with your project. The FabLAB staff will be in touch with you soon with further instructions.</p>
        <p>Thank you,<br>FabLAB Team</p>
      `,
    };
    
    // Send notification to FabLAB admin that teacher has approved
    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: 'leilasabando@gmail.com', // Replace with fablab@evc.pshs.edu.ph in production
      subject: `Teacher Approved: ${studentName}'s FabLAB Request`,
      html: `
        <h3>Teacher Approval Received</h3>
        <p>A teacher has approved the FabLAB request for:</p>
        <p><strong>Student Name:</strong> ${studentName}</p>
        <p><strong>Student Email:</strong> ${studentEmail}</p>
        <p>This student is now authorized to use the FabLAB services. Please reach out to them with further instructions.</p>
      `,
    };
    
    // Send both emails
    await transporter.sendMail(studentMailOptions);
    await transporter.sendMail(adminMailOptions);
    
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
            <p>Thank you for approving ${studentName}'s request to use the FabLAB.</p>
            <p>The student and the FabLAB team have both been notified.</p>
            <p>The student will now be able to proceed with their project.</p>
          </div>
        </body>
      </html>`, 
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error) {
    console.error('Error processing approval:', error);
    return new Response(
      '<html><body><h1>Error</h1><p>Failed to process the approval. Please try again later.</p></body></html>', 
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    );
  }
}