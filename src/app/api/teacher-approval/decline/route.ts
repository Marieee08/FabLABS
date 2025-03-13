
// app/api/teacher-approval/decline/route.ts
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
    });

    if (!reservation) {
      return NextResponse.redirect(new URL('/approval-error', request.url));
    }

    // Don't process if already declined or processed
    if (reservation.Status !== 'Pending Teacher\'s Approval') {
      return NextResponse.redirect(new URL('/decline-success', request.url));
    }

    // Update the reservation status
    await prisma.labReservation.update({
      where: { id: parseInt(id) },
      data: { Status: 'Declined by Teacher' },
    });

    // Send notification email to student
    if (reservation.StudentEmail) {
      await transporter.sendMail({
        from: `"FabLab Scheduler" <${process.env.EMAIL_FROM || 'noreply@fablabscheduler.com'}>`,
        to: reservation.StudentEmail,
        subject: 'Your Lab Reservation was Declined by Teacher',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin-bottom: 20px;">
              <h2 style="color: #b91c1c; margin-top: 0;">Reservation Not Approved</h2>
              <p>Professor ${reservation.Teacher} has declined your lab reservation for ${reservation.Subject}.</p>
            </div>
            <p>Your reservation status has been updated to "Declined by Teacher".</p>
            <p>Please contact your teacher directly to discuss any concerns, then submit a new reservation request if needed.</p>
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
              <p>This is an automated message from the FabLab Reservation System.</p>
            </div>
          </div>
        `,
      });
    }

    // Redirect to a confirmation page
    return NextResponse.redirect(new URL('/decline-success', request.url));
  } catch (error) {
    console.error('Decline confirmation error:', error);
    return NextResponse.redirect(new URL('/approval-error', request.url));
  }
}