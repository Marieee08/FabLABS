// /api/survey/submit-internal/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { reservationId, surveyData } = body;

    if (!reservationId || !surveyData) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    // Convert reservationId to number
    const resId = parseInt(reservationId);
    if (isNaN(resId)) {
      return new NextResponse("Invalid reservation ID", { status: 400 });
    }

    // First, determine if this is a UtilReq or EVCReservation
    // Check UtilReq first (for STAFF using utilization services)
    const utilReservation = await prisma.utilReq.findUnique({
      where: { id: resId },
      include: {
        accInfo: true
      }
    });

    let isEvcReservation = false;
    let reservation: any = null;
    
    if (utilReservation) {
      reservation = utilReservation;
      isEvcReservation = false;
    } else {
      // If not found in UtilReq, check EVCReservation (for STAFF using EVC services)
      const evcReservation = await prisma.eVCReservation.findUnique({
        where: { id: resId },
        include: {
          accInfo: true
        }
      });
      
      if (evcReservation) {
        isEvcReservation = true;
        reservation = evcReservation;
      }
    }

    if (!reservation) {
      return new NextResponse("Reservation not found", { status: 404 });
    }

    // Verify this is a STAFF reservation
    if (reservation.accInfo?.Role !== 'STAFF') {
      return new NextResponse("This survey is only for STAFF reservations", { status: 403 });
    }

    // Check if reservation is in "Ongoing" status
    const status = isEvcReservation ? (reservation as any).EVCStatus : reservation.Status;
    if (status !== 'Ongoing') {
      return new NextResponse("Survey can only be completed for ongoing reservations", { status: 400 });
    }

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Save preliminary survey data (only for UtilReq reservations)
      let preliminaryData = null;
      if (!isEvcReservation) {
        preliminaryData = await tx.preliminarySurvey.create({
          data: {
            userRole: surveyData.preliminary.userRole || 'STAFF',
            age: parseInt(surveyData.preliminary.age) || 0,
            sex: surveyData.preliminary.sex || '',
            CC1: surveyData.preliminary.CC1,
            CC2: surveyData.preliminary.CC2,
            CC3: surveyData.preliminary.CC3,
            clientType: surveyData.preliminary.clientType,
            region: 'VIII', // Fixed for Eastern Visayas
            office: 'SRA OFFICE', // Fixed for this office
            otherService: surveyData.preliminary.otherService,
            utilReqId: resId,
          }
        });
      }

      // 2. Save customer feedback (only for UtilReq reservations)
      let customerData = null;
      if (!isEvcReservation) {
        customerData = await tx.customerFeedback.create({
          data: {
            SQD0: surveyData.customer.SQD0,
            SQD1: surveyData.customer.SQD1,
            SQD2: surveyData.customer.SQD2,
            SQD3: surveyData.customer.SQD3,
            SQD4: surveyData.customer.SQD4,
            SQD5: surveyData.customer.SQD5,
            SQD6: surveyData.customer.SQD6,
            SQD7: surveyData.customer.SQD7,
            SQD8: surveyData.customer.SQD8,
            utilReqId: resId,
          }
        });
      }

      // 3. Save services availed (only for UtilReq reservations)
      if (!isEvcReservation && surveyData.serviceAvailed && surveyData.serviceAvailed.length > 0) {
        for (const service of surveyData.serviceAvailed) {
          await tx.serviceAvailed.create({
            data: {
              service: service,
              utilReqId: resId,
            }
          });
        }
      }

      // 4. Update reservation status to "Completed"
      if (isEvcReservation) {
        await tx.eVCReservation.update({
          where: { id: resId },
          data: {
            EVCStatus: 'Completed'
          }
        });
      } else {
        await tx.utilReq.update({
          where: { id: resId },
          data: {
            Status: 'Completed'
          }
        });
      }

      return {
        preliminaryData,
        customerData,
        reservationUpdated: true
      };
    });

    return NextResponse.json({ 
      success: true, 
      message: "Internal survey submitted successfully",
      data: result 
    });

  } catch (error) {
    console.error('[INTERNAL_SURVEY_SUBMIT]', error);
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return new NextResponse("Survey already submitted for this reservation", { status: 409 });
      }
    }
    
    return new NextResponse("Internal Error", { status: 500 });
  }
}