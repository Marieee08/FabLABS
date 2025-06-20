// src/app/api/survey/submit-internal/route.ts

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

    // Parse reservationId as integer
    const evcId = parseInt(reservationId);
    if (isNaN(evcId)) {
      return new NextResponse("Invalid reservation ID", { status: 400 });
    }

    // Check if EVCReservation exists and is "Ongoing"
    const evcReservation = await prisma.eVCReservation.findUnique({
      where: { id: evcId },
      include: {
        accInfo: true
      }
    });

    if (!evcReservation) {
      return new NextResponse("Reservation not found", { status: 404 });
    }

    if (evcReservation.EVCStatus !== 'Ongoing') {
      return new NextResponse("Reservation is not in Ongoing status", { status: 400 });
    }

    // Verify this is a STAFF reservation
    if (evcReservation.accInfo?.Role !== 'STAFF') {
      return new NextResponse("This API is only for STAFF reservations", { status: 403 });
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Save Preliminary Survey
      const preliminarySurvey = await tx.preliminarySurvey.create({
        data: {
          evcId: evcId,
          userRole: surveyData.preliminary.userRole || 'STAFF',
          age: parseInt(surveyData.preliminary.age),
          sex: surveyData.preliminary.sex,
          clientType: surveyData.preliminary.clientType,
          region: surveyData.preliminary.region || 'VIII',
          office: surveyData.preliminary.office || 'SRA OFFICE',
          CC1: surveyData.preliminary.CC1,
          CC2: surveyData.preliminary.CC2,
          CC3: surveyData.preliminary.CC3,
          otherService: surveyData.preliminary.otherService
        }
      });

      // 2. Save Customer Feedback (SQD questions)
      const customerFeedback = await tx.customerFeedback.create({
        data: {
          evcId: evcId,
          SQD0: surveyData.customer.SQD0,
          SQD1: surveyData.customer.SQD1,
          SQD2: surveyData.customer.SQD2,
          SQD3: surveyData.customer.SQD3,
          SQD4: surveyData.customer.SQD4,
          SQD5: surveyData.customer.SQD5,
          SQD6: surveyData.customer.SQD6,
          SQD7: surveyData.customer.SQD7,
          SQD8: surveyData.customer.SQD8
        }
      });

      // 3. Update EVCReservation status to "Completed"
      const updatedReservation = await tx.eVCReservation.update({
        where: { id: evcId },
        data: {
          EVCStatus: 'Completed'
        }
      });

      return {
        preliminarySurvey,
        customerFeedback,
        updatedReservation
      };
    });

    console.log('Internal survey submitted successfully:', {
      evcId,
      preliminarySurveyId: result.preliminarySurvey.id,
      customerFeedbackId: result.customerFeedback.id,
      newStatus: result.updatedReservation.EVCStatus
    });

    return NextResponse.json({
      success: true,
      message: "Internal survey submitted successfully",
      data: {
        reservationId: evcId,
        status: "Completed",
        surveyIds: {
          preliminary: result.preliminarySurvey.id,
          customer: result.customerFeedback.id
        }
      }
    });

  } catch (error) {
    console.error('[INTERNAL_SURVEY_SUBMIT]', error);
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return new NextResponse("Survey already submitted for this reservation", { status: 409 });
      }
    }
    
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}