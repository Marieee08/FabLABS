// app/api/admin-email/approved-request/route.ts

import nodemailer from 'nodemailer';
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { reservationId, reservationType } = await request.json();
    
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
    let scheduledDates: Array<{ date: string; time: string } | null> = [];
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
          UtilTimes: {
            select: {
              StartTime: true,
              EndTime: true,
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
      subject = 'Your FabLAB Reservation Has Been Approved';
      
      // Format scheduled dates
      if (reservation.UtilTimes && Array.isArray(reservation.UtilTimes)) {
        scheduledDates = reservation.UtilTimes.map(time => {
          const startTime = time.StartTime ? new Date(time.StartTime) : null;
          const endTime = time.EndTime ? new Date(time.EndTime) : null;
          
          if (startTime && endTime) {
            return {
              date: startTime.toLocaleDateString(),
              time: `${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            };
          }
          return null;
        }).filter(Boolean);
      }

      // Format services for display in email
      if (reservation.UserServices && Array.isArray(reservation.UserServices)) {
        servicesHtml = `
          <h3 style="margin-top: 20px;">Services Approved:</h3>
          <ul>
            ${reservation.UserServices.map(service => `
              <li>
                <strong>${service.ServiceAvail || 'Unknown Service'}</strong>
                ${service.EquipmentAvail ? ` - Equipment: ${service.EquipmentAvail}` : ''}
              </li>
            `).join('')}
          </ul>
        `;
      }

    } else if (reservationType === 'evc') {
      // Fetch EVC reservation (ID is passed without the 'evc-' prefix)
      const reservation = await prisma.eVCReservation.findUnique({
        where: { id: parseInt(reservationId) },
        include: {
          accInfo: {
            select: {
              Name: true,
              email: true,
            },
          },
          UtilTimes: {
            select: {
              StartTime: true,
              EndTime: true,
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
      subject = 'Your FabLAB Educational Visit Reservation Has Been Approved';
      
      // Format scheduled dates
      if (reservation.UtilTimes && Array.isArray(reservation.UtilTimes)) {
        scheduledDates = reservation.UtilTimes.map(time => {
          const startTime = time.StartTime ? new Date(time.StartTime) : null;
          const endTime = time.EndTime ? new Date(time.EndTime) : null;
          
          if (startTime && endTime) {
            return {
              date: startTime.toLocaleDateString(),
              time: `${startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
            };
          }
          return null;
        }).filter(Boolean);
      }
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

    // Format scheduled dates for display in email
    const scheduledDatesHtml = scheduledDates.length > 0 ? `
      <h3 style="margin-top: 20px;">Scheduled Dates:</h3>
      <ul>
        ${scheduledDates.map(schedule => {
          if (schedule) {
            return `
              <li>
                <strong>${schedule.date}</strong>: ${schedule.time}
              </li>
            `;
          }
          return '';
        }).join('')}
      </ul>
    ` : '<p>No scheduled dates found.</p>';

    // Email content
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #10539b;">FabLAB Reservation Approved</h1>
        </div>
        
        <p>Dear ${userName},</p>
        
        <p>Good news! Your FabLAB reservation has been <strong style="color: #10539b;">approved</strong> by our admin team.</p>
        
        <p>Here are the details of your approved reservation:</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
          <p><strong>Reservation ID:</strong> ${reservationId}</p>
          <p><strong>Status:</strong> <span style="color: green;">Approved</span></p>
          ${reservationType === 'evc' ? `<p><strong>Reservation Type:</strong> Educational Visit</p>` : ''}
        </div>
        
        ${servicesHtml}
        
        ${scheduledDatesHtml}
        
        <div style="margin-top: 20px; padding: 15px; background-color: #e8f4fd; border-radius: 5px;">
          <h3 style="margin-top: 0;">Next Steps:</h3>
          <ol>
            <li>Please arrive on time for your scheduled session.</li>
            <li>Bring any required materials or documentation.</li>
            <li>For any changes to your reservation, please contact us at least 24 hours in advance.</li>
          </ol>
        </div>
        
        <p style="margin-top: 20px;">If you have any questions, please don't hesitate to contact us.</p>
        
        <p>Thank you for choosing FabLAB!</p>
        
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
      message: 'Approval email sent successfully' 
    });
    
  } catch (error) {
    console.error('Error sending approval email:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send approval email',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}