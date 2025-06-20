// /api/survey/submit/route.ts (Standard Questionnaire)

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
    // Check UtilReq first (for MSME)
    let reservation = await prisma.utilReq.findUnique({
      where: { id: resId },
      include: {
        accInfo: true
      }
    });

    let isEvcReservation = false;
    
    // If not found in UtilReq, check EVCReservation (for STUDENT)
    if (!reservation) {
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

    // Verify this is NOT a STAFF reservation (STAFF uses internal survey)
    if (reservation.accInfo?.Role === 'STAFF') {
      return new NextResponse("STAFF should use the internal survey", { status: 403 });
    }

    // Check if reservation is in "Ongoing" status
    const status = isEvcReservation ? (reservation as any).EVCStatus : reservation.Status;
    if (status !== 'Ongoing') {
      return new NextResponse("Survey can only be completed for ongoing reservations", { status: 400 });
    }

    // Start a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Save preliminary survey data
      const preliminaryData = await tx.preliminarySurvey.create({
        data: {
          userRole: surveyData.preliminary.userRole || 'STUDENT',
          age: parseInt(surveyData.preliminary.age) || 0,
          sex: surveyData.preliminary.sex || '',
          CC1: surveyData.preliminary.CC1,
          CC2: surveyData.preliminary.CC2,
          CC3: surveyData.preliminary.CC3,
          clientType: surveyData.preliminary.clientType,
          region: surveyData.preliminary.region,
          office: surveyData.preliminary.office,
          otherService: surveyData.preliminary.otherService,
          utilReqId: isEvcReservation ? undefined : resId,
        }
      });

      // 2. Save customer feedback (SQD responses)
      const customerData = await tx.customerFeedback.create({
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
          utilReqId: isEvcReservation ? undefined : resId,
        }
      });

      // 3. Save employee evaluation data
      const employeeData = await tx.employeeEvaluation.create({
        data: {
          E1: surveyData.employee.E1,
          E2: surveyData.employee.E2,
          E3: surveyData.employee.E3,
          E4: surveyData.employee.E4,
          E5: surveyData.employee.E5,
          E6: surveyData.employee.E6,
          E7: surveyData.employee.E7,
          E8: surveyData.employee.E8,
          E9: surveyData.employee.E9,
          E10: surveyData.employee.E10,
          E11: surveyData.employee.E11,
          E12: surveyData.employee.E12,
          E13: surveyData.employee.E13,
          E14: surveyData.employee.E14,
          E15: surveyData.employee.E15,
          E16: surveyData.employee.E16,
          E17: surveyData.employee.E17,
          utilReqId: isEvcReservation ? undefined : resId,
        }
      });

      // 4. Save services availed
      if (surveyData.serviceAvailed && surveyData.serviceAvailed.length > 0) {
        for (const service of surveyData.serviceAvailed) {
          await tx.serviceAvailed.create({
            data: {
              service: service,
              utilReqId: isEvcReservation ? undefined : resId,
            }
          });
        }
      }

      // 5. Update reservation status based on type
      let newStatus: string;
      
      if (isEvcReservation) {
        // STUDENT EVC reservations go to "Completed"
        newStatus = 'Completed';
        await tx.eVCReservation.update({
          where: { id: resId },
          data: {
            EVCStatus: newStatus
          }
        });
      } else {
        // MSME utilization requests go to "Pending Payment"
        newStatus = 'Pending Payment';
        await tx.utilReq.update({
          where: { id: resId },
          data: {
            Status: newStatus
          }
        });
      }

      return {
        preliminaryData,
        customerData,
        employeeData,
        reservationUpdated: true,
        newStatus,
        reservationType: isEvcReservation ? 'evc' : 'utilization'
      };
    });

    return NextResponse.json({ 
      success: true, 
      message: "Survey submitted successfully",
      data: result 
    });

  } catch (error) {
    console.error('[STANDARD_SURVEY_SUBMIT]', error);
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return new NextResponse("Survey already submitted for this reservation", { status: 409 });
      }
    }
    
    return new NextResponse("Internal Error", { status: 500 });
  }
}