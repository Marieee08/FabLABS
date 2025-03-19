// app/api/teacher-confirm/route.ts

import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

// Function to create a unique token for approval links
function generateToken() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Main POST handler
export async function POST(request: Request) {
  try {
    const { 
      studentName, 
      studentEmail, 
      studentGrade,
      teacherEmail, 
      message 
    } = await request.json();
    
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
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const approvalUrl = `${baseUrl}/api/teacher-confirm-test/approve?token=${approvalToken}&studentEmail=${encodeURIComponent(studentEmail)}&studentName=${encodeURIComponent(studentName)}`;

    // Email to teacher for confirmation
    const teacherMailOptions = {
      from: process.env.EMAIL_USER,
      to: teacherEmail,
      subject: `Teacher Confirmation for ${studentName}'s FabLAB Request`,
      html: `
        <h3>FabLAB Request Confirmation</h3>
        <p>Dear Teacher,</p>
        <p>${studentName} from ${studentGrade} has submitted a request to use the FabLAB services.</p>
        
        <p><strong>Student details:</strong></p>
        <ul>
          <li><strong>Name:</strong> ${studentName}</li>
          <li><strong>Email:</strong> ${studentEmail}</li>
          <li><strong>Grade:</strong> ${studentGrade}</li>
        </ul>
        
        <p><strong>Message from student:</strong></p>
        <p>${message}</p>
        
        <p>Please click the button below to confirm that this student is authorized to use the FabLAB:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${approvalUrl}" style="background-color: #10539b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Confirm Student Authorization
          </a>
        </div>
        
        <p>Thank you,<br>FabLAB Team</p>
      `,
    };

    // Send email
    await transporter.sendMail(teacherMailOptions);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing request:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send confirmation email' }, 
      { status: 500 }
    );
  }
}

// GET handler for approval
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const studentName = searchParams.get('studentName');
  const studentEmail = searchParams.get('studentEmail');
  
  if (!token || !studentName || !studentEmail) {
    return new Response(
      '<html><body><h1>Invalid confirmation link</h1><p>The confirmation link is missing required parameters.</p></body></html>', 
      { status: 400, headers: { 'Content-Type': 'text/html' } }
    );
  }
  
  try {
    // In a real application, verify the token from a database
    // For this example, we'll assume the token is valid
    
    // Create a transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    
    // Send notification to FabLAB admin
    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL || 'fablab@evc.pshs.edu.ph',
      subject: `Teacher Confirmed: ${studentName}'s FabLAB Request`,
      html: `
        <h3>Teacher Confirmation Received</h3>
        <p>A teacher has confirmed authorization for:</p>
        <p><strong>Student Name:</strong> ${studentName}</p>
        <p><strong>Student Email:</strong> ${studentEmail}</p>
        <p>This student is now authorized to use the FabLAB services.</p>
      `,
    };
    
    await transporter.sendMail(adminMailOptions);
    
    // Return a success page
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
          <h1>Confirmation Successful</h1>
          <div class="message">
            <p>Thank you for confirming ${studentName}'s authorization to use the FabLAB.</p>
            <p>The FabLAB team has been notified and will process the request.</p>
          </div>
        </body>
      </html>`, 
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  } catch (error) {
    console.error('Error processing confirmation:', error);
    return new Response(
      '<html><body><h1>Error</h1><p>Failed to process the confirmation. Please try again later.</p></body></html>', 
      { status: 500, headers: { 'Content-Type': 'text/html' } }
    );
  }
}