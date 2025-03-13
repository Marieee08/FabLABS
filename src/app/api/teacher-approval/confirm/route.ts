
// app/api/teacher-approval/confirm/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';
import nodemailer from 'nodemailer';

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

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    const id = url.searchParams.get('id');

    if (!token || !id) {
      return NextResponse.json(
        { error: 'Missing token or reservation ID' },
        { status: 400 }
      );
    }

    // Verify the token
    const payload = verifyToken(token);
    if (!payload || payload.id !== id || payload.type !== 'teacher_approval') {
      return NextResponse.redirect(new URL('/approval-error', request.url));
    }

    // Retrieve the reservation
    const reservation = await prisma.labReservation.findUnique({
      where: { id: parseInt(id) },
      include: {
        UtilTimes: true,
      }
    });

    if (!reservation) {
      return NextResponse.redirect(new URL('/approval-error', request.url));
    }

    // Don't process if already approved
    if (reservation.Status !== 'Pending Teacher\'s Approval') {
      return NextResponse.redirect(new URL('/approval-success', request.url));
    }

    // Update the reservation status
    await prisma.labReservation.update({
      where: { id: parseInt(id) },
      data: { Status: 'Pending' },
    });

    // Send confirmation email to student
    if (reservation.StudentEmail) {
      await transporter.sendMail({
        from: `"FabLab Scheduler" <${process.env.EMAIL_FROM || 'noreply@fablabscheduler.com'}>`,
        to: reservation.StudentEmail,
        subject: 'Your Lab Reservation was Approved by Teacher',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin-bottom: 20px;">
              <h2 style="color: #1e40af; margin-top: 0;">Your Reservation Was Approved</h2>
              <p>Good news! Professor ${reservation.Teacher} has approved your lab reservation for ${reservation.Subject}.</p>
            </div>
            <p>Your reservation status has been updated to "Pending" and will now be reviewed by the lab administrators.</p>
            <p>You can track the status of your reservation in your dashboard.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
              <p>This is an automated message from the FabLab Reservation System.</p>
            </div>
          </div>
        `,
      });
    }

    // Redirect to a confirmation page
    return NextResponse.redirect(new URL('/approval-success', request.url));
  } catch (error) {
    console.error('Approval confirmation error:', error);
    return NextResponse.redirect(new URL('/approval-error', request.url));
  }
}