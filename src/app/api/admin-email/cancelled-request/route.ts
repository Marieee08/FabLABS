// app/api/admin-email/cancelled-request/route.ts

import nodemailer from 'nodemailer';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { reservationId, reservationType, cancellationReason } = await request.json();
    
    if (!reservationId || !reservationType) {
      return NextResponse.json(
        { error: 'Missing required parameters' }, 
        { status: 400 }
      );
    }

    // Get reservation details based on type
    let userEmail = "";
    let userName = "";
    let subject = "";
    let servicesHtml = "";

    if (reservationType === 'utilization') {
      // Fetch utilization reservation
      const reservation = await prisma.utilReq.findUnique({
        where: { id: parseInt(reservationId) },
        include: {
          accInfo: {
            select: {
              Name: true,
              email: true,
            },
          },
          UserServices: {
            select: {
              ServiceAvail: true,
              EquipmentAvail: true,
            },
          },
        },
      });

      if (!reservation) {
        return NextResponse.json(
          { error: 'Utilization reservation not found' },
          { status: 404 }
        );
      }

      // Safely access properties with null checks
      userEmail = reservation.accInfo?.email || "";
      userName = reservation.accInfo?.Name || "";
      subject = 'Your FabLAB Reservation Has Been Cancelled';
      
      // Format services for display in email
      if (reservation.UserServices && Array.isArray(reservation.UserServices)) {
        servicesHtml = `
          <h3 style="margin-top: 20px;">Services Requested:</h3>
          <ul>
            ${reservation.UserServices.map((service: any) => `
              <li>
                <strong>${service.ServiceAvail || 'Unknown Service'}</strong>
                ${service.EquipmentAvail && service.EquipmentAvail !== 'Not Specified' ? ` - Equipment: ${service.EquipmentAvail}` : ''}
              </li>
            `).join('')}
          </ul>
        `;
      }
      
    } else if (reservationType === 'evc') {
      // Fetch EVC reservation
      const reservation = await prisma.eVCReservation.findUnique({
        where: { id: parseInt(reservationId) },
        include: {
          accInfo: {
            select: {
              Name: true,
              email: true,
            },
          },
        },
      });

      if (!reservation) {
        return NextResponse.json(
          { error: 'EVC reservation not found' },
          { status: 404 }
        );
      }

      // Safely access properties with null checks
      userEmail = reservation.accInfo?.email || "";
      userName = reservation.accInfo?.Name || "";
      subject = 'Your FabLAB Educational Visit Reservation Has Been Cancelled';
    } else {
      return NextResponse.json(
        { error: 'Invalid reservation type' },
        { status: 400 }
      );
    }
    
    // Validate that we have a valid email
    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email not found' },
        { status: 404 }
      );
    }
    
    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email content
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #10539b;">FabLAB Reservation Cancelled</h1>
        </div>
        
        <p>Dear ${userName},</p>
        
        <p>We would like to inform you that your FabLAB reservation (ID: ${reservationId}) has been <strong style="color: #d32f2f;">cancelled</strong>.</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Reservation ID:</strong> ${reservationId}</p>
          <p><strong>Status:</strong> <span style="color: #d32f2f;">Cancelled</span></p>
          ${reservationType === 'evc' ? `<p><strong>Reservation Type:</strong> Educational Visit</p>` : ''}
        </div>
        
        ${servicesHtml}
        
        <div style="margin-top: 20px; padding: 15px; background-color: #fff4f4; border-radius: 5px; border-left: 4px solid #d32f2f;">
          <h3 style="margin-top: 0; color: #d32f2f;">Reason for Cancellation:</h3>
          <p>${cancellationReason || 'This reservation has been cancelled. For more information, please contact the FabLAB team.'}</p>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; background-color: #e8f4fd; border-radius: 5px;">
          <h3 style="margin-top: 0;">What Next?</h3>
          <p>If you need to schedule another reservation, you can do so through our platform. If you have any questions regarding this cancellation, please feel free to contact us.</p>
        </div>
        
        <p style="margin-top: 20px;">We apologize for any inconvenience this may have caused.</p>
        
        <p>Thank you for your understanding,<br>The FabLAB Team</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 12px;">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>&copy; ${new Date().getFullYear()} FabLAB. All rights reserved.</p>
        </div>
      </div>
    `;

    // Send the email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: subject,
      html: html,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ 
      success: true, 
      message: 'Cancellation email sent successfully' 
    });
    
  } catch (error) {
    console.error('Error sending cancellation email:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send cancellation email',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}