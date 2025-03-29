// app/api/email/send/route.ts
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    // Verify the user is authenticated and has admin role
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to send emails' },
        { status: 401 }
      );
    }
    
    // Check if the user is an admin
    const user = await prisma.accInfo.findUnique({
      where: { clerkId: userId },
      select: { Role: true }
    });
    
    if (!user || user.Role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Forbidden: Only admins can send emails' },
        { status: 403 }
      );
    }

    // Get request body
    const body = await req.json();
    const { to, subject, message, name } = body;

    // Validate required fields
    if (!to || !subject || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, or message' },
        { status: 400 }
      );
    }

    // Create nodemailer transporter (use the same config as your other endpoints)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Send email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text: message,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #0d172c; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">FABLAB</h1>
          </div>
          <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
            <p>Dear ${name},</p>
            <div style="white-space: pre-line;">${message}</div>
            <p style="margin-top: 20px;">Best regards,</p>
            <p>FabLab Administration Team</p>
          </div>
          <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
            <p>This is a message from FabLab.</p>
            <p>&copy; ${new Date().getFullYear()} FabLab. All rights reserved.</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json(
      { error: 'Failed to send email', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}