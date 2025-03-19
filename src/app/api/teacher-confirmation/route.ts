import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Extract relevant information for the email
    const {
      teacherEmail,
      studentName,
      lvlSec,
      subject,
      topic,
      reservationDates,
      reservationId
    } = data;
    
    if (!teacherEmail) {
      return NextResponse.json(
        { error: 'Teacher email is required' },
        { status: 400 }
      );
    }

    // Create a formatted list of dates for the email
    const formattedDates = reservationDates?.map((date: any) => {
      const formattedDate = new Date(date.date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      return `${formattedDate} (${date.startTime} - ${date.endTime})`;
    }).join('<br>') || 'No dates specified';

    // Create a transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Generate a confirmation link (to be implemented in the future)
    const confirmationLink = `${process.env.NEXT_PUBLIC_APP_URL}/teacher/confirm-reservation/${reservationId}`;

    // Email options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: teacherEmail,
      subject: `PSHS-EVC FabLab Reservation Request`,
      text: `
        Dear Teacher,

        A student has requested a FabLab reservation. Here are the details:

        Student: ${studentName}
        Level/Section: ${lvlSec || 'Not specified'}
        Subject: ${subject || 'Not specified'}
        Topic: ${topic || 'Not specified'}
        Reservation Dates: 
        ${reservationDates?.map((date: any) => {
          const formattedDate = new Date(date.date).toLocaleDateString();
          return `${formattedDate} (${date.startTime} - ${date.endTime})`;
        }).join('\n') || 'No dates specified'}

        Please review this reservation request.
        Confirmation Link: ${confirmationLink}

        This is an automated message from the PSHS-EVC FabLab Reservation System.
      `,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #10539b; border-bottom: 2px solid #10539b; padding-bottom: 10px;">PSHS-EVC FabLab Reservation Request</h2>
          
          <p>Dear Teacher,</p>
          
          <p>A student has requested a FabLab reservation. Here are the details:</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <p><strong>Student:</strong> ${studentName}</p>
            <p><strong>Level/Section:</strong> ${lvlSec || 'Not specified'}</p>
            <p><strong>Subject:</strong> ${subject || 'Not specified'}</p>
            <p><strong>Topic:</strong> ${topic || 'Not specified'}</p>
            
            <p><strong>Reservation Dates:</strong></p>
            <div style="margin-left: 20px;">
              ${formattedDates}
            </div>
          </div>
          
          <p>Please review this reservation request.</p>
          
          <div style="text-align: center; margin: 25px 0;">
            <a href="${confirmationLink}" style="background-color: #10539b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Review Reservation</a>
          </div>
          
          <p style="font-size: 12px; color: #777; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px;">
            This is an automated message from the PSHS-EVC FabLab Reservation System. Please do not reply to this email.
          </p>
        </div>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);
    
    return NextResponse.json({
      success: true,
      message: 'Teacher notification email sent successfully',
    });
    
  } catch (error: any) {
    console.error('Error sending teacher notification:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to send notification email', 
        details: error.message
      },
      { status: 500 }
    );
  }
}