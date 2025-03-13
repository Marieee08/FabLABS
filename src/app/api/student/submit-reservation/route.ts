// app/api/student/submit-reservation/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs';
import { format } from 'date-fns';
import nodemailer from 'nodemailer';
import { generateToken } from '@/lib/jwt';

// Configure email transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: Number(process.env.EMAIL_SERVER_PORT),
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
  secure: process.env.EMAIL_SERVER_SECURE === 'true',
});

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const data = await request.json();
    
    // Validate required fields
    if (!data.TeacherEmail || !data.Teacher || !data.days || data.days.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create reservation in database
    const reservation = await prisma.labReservation.create({
      data: {
        // User information
        userId: userId,
        StudentName: data.studentInfo?.name || '',
        StudentEmail: data.studentInfo?.email || '',
        
        // Class details
        LvlSec: data.LvlSec,
        NoofStudents: data.NoofStudents,
        Subject: data.Subject,
        Teacher: data.Teacher,
        TeacherEmail: data.TeacherEmail,
        Topic: data.Topic,
        SchoolYear: data.SchoolYear,
        
        // Set initial status to "Pending Teacher's Approval"
        Status: 'Pending Teacher\'s Approval',
        
        // Create related records
        UtilTimes: {
          create: data.days.map((day: any, index: number) => ({
            DayNum: index + 1,
            StartTime: day.startTime ? new Date(`${format(new Date(day.date), 'yyyy-MM-dd')}T${day.startTime}`) : null,
            EndTime: day.endTime ? new Date(`${format(new Date(day.date), 'yyyy-MM-dd')}T${day.endTime}`) : null,
          }))
        },
        
        // Create materials
        NeededMaterials: data.NeededMaterials?.length > 0 ? {
          create: data.NeededMaterials.map((material: any) => ({
            Item: material.Item,
            ItemQty: material.ItemQty,
            Description: material.Description,
          }))
        } : undefined,
      },
      include: {
        UtilTimes: true,
        NeededMaterials: true,
      }
    });

    // Generate approval token for the teacher (expires in 7 days)
    const approvalToken = generateToken({
      id: reservation.id.toString(),
      type: 'teacher_approval',
      teacherEmail: data.TeacherEmail,
      exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60, // 7 days expiration
    });

    // Format dates for email readability
    const formattedDates = data.days.map((day: any) => {
      const dateStr = format(new Date(day.date), 'EEEE, MMMM d, yyyy');
      const timeStr = day.startTime && day.endTime 
        ? `${day.startTime} - ${day.endTime}`
        : 'Time not specified';
      return `${dateStr}: ${timeStr}`;
    });

    // Base URL for approval links
    const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    const approvalUrl = `${baseUrl}/api/teacher-approval/confirm?token=${approvalToken}&id=${reservation.id}`;
    const declineUrl = `${baseUrl}/api/teacher-approval/decline?token=${approvalToken}&id=${reservation.id}`;

    // Prepare email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>FabLab Reservation Approval Request</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #143370; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
          .content { background-color: #f9f9f9; padding: 20px; border-left: 1px solid #ddd; border-right: 1px solid #ddd; }
          .details { background-color: white; padding: 15px; border-radius: 5px; border: 1px solid #eee; margin-bottom: 20px; }
          .detail-row { display: flex; border-bottom: 1px solid #eee; padding: 8px 0; }
          .detail-row:last-child { border-bottom: none; }
          .detail-label { font-weight: bold; width: 40%; }
          .detail-value { width: 60%; }
          .button-container { text-align: center; margin: 30px 0; }
          .approval-button { display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; padding: 12px 30px; border-radius: 5px; font-weight: bold; margin-right: 10px; }
          .decline-button { display: inline-block; background-color: #ef4444; color: white; text-decoration: none; padding: 12px 30px; border-radius: 5px; font-weight: bold; }
          .footer { background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px; border: 1px solid #ddd; border-top: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>FabLab Reservation Approval</h1>
          </div>
          
          <div class="content">
            <p>Dear Professor ${data.Teacher},</p>
            
            <p>A student has requested your approval for a FabLab reservation. Please review the details below:</p>
            
            <div class="details">
              <div class="detail-row">
                <div class="detail-label">Student:</div>
                <div class="detail-value">${data.studentInfo?.name || 'Student'}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Class/Section:</div>
                <div class="detail-value">${data.LvlSec}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Subject:</div>
                <div class="detail-value">${data.Subject}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Topic:</div>
                <div class="detail-value">${data.Topic}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Number of Students:</div>
                <div class="detail-value">${data.NoofStudents}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Date(s):</div>
                <div class="detail-value">${formattedDates.join('<br>')}</div>
              </div>
            </div>
            
            <p>Please confirm that you approve this lab reservation:</p>
            
            <div class="button-container">
              <a href="${approvalUrl}" class="approval-button">Approve Request</a>
              <a href="${declineUrl}" class="decline-button">Decline</a>
            </div>
            
            <p>If you have any questions, please contact the FabLab administrator.</p>
          </div>
          
          <div class="footer">
            <p>This is an automated message from the FabLab Reservation System. Please do not reply to this email.</p>
            <p>&copy; 2025 FabLab. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send email to teacher
    await transporter.sendMail({
      from: `"FabLab Scheduler" <${process.env.EMAIL_FROM || 'noreply@fablabscheduler.com'}>`,
      to: data.TeacherEmail,
      subject: 'FabLab Reservation Approval Request',
      html: emailHtml,
    });

    return NextResponse.json({
      success: true,
      message: 'Reservation submitted and approval email sent to teacher',
      reservationId: reservation.id,
    });
  } catch (error) {
    console.error('Error submitting reservation:', error);
    return NextResponse.json(
      { error: 'Failed to submit reservation' },
      { status: 500 }
    );
  }
}