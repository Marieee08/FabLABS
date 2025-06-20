// src/app/api/survey/submit/route.ts

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
    const id = parseInt(reservationId);
    if (isNaN(id)) {
      return new NextResponse("Invalid reservation ID", { status: 400 });
    }

    // First, determine if this is a UtilReq or EVCReservation
    const [utilReq, evcReservation] = await Promise.all([
      prisma.utilReq.findUnique({
        where: { id },
        include: { accInfo: true }
      }),
      prisma.eVCReservation.findUnique({
        where: { id },
        include: { accInfo: true }
      })
    ]);

    let reservationType: 'utilReq' | 'evcReservation';
    let reservation: any;
    let userRole: string;
    let currentStatus: string;

    if (utilReq) {
      reservationType = 'utilReq';
      reservation = utilReq;
      userRole = utilReq.accInfo?.Role || 'MSME';
      currentStatus = utilReq.Status;
    } else if (evcReservation) {
      reservationType = 'evcReservation';
      reservation = evcReservation;
      userRole = evcReservation.accInfo?.Role || 'STUDENT';
      currentStatus = evcReservation.EVCStatus;
    } else {
      return new NextResponse("Reservation not found", { status: 404 });
    }

    // Check if reservation is "Ongoing"
    if (currentStatus !== 'Ongoing') {
      return new NextResponse("Reservation is not in Ongoing status", { status: 400 });
    }

    // Prevent STAFF from using this API (they should use internal survey)
    if (userRole === 'STAFF') {
      return new NextResponse("STAFF should use the internal survey API", { status: 403 });
    }

    // Use transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // 1. Save Preliminary Survey
      const preliminaryData = {
        userRole: surveyData.preliminary.userRole || userRole,
        age: parseInt(surveyData.preliminary.age),
        sex: surveyData.preliminary.sex,
        clientType: surveyData.preliminary.clientType,
        region: surveyData.preliminary.region,
        office: surveyData.preliminary.office,
        CC1: surveyData.preliminary.CC1,
        CC2: surveyData.preliminary.CC2,
        CC3: surveyData.preliminary.CC3,
        otherService: surveyData.preliminary.otherService
      };

      const preliminarySurvey = await tx.preliminarySurvey.create({
        data: reservationType === 'utilReq' 
          ? { ...preliminaryData, utilReqId: id }
          : { ...preliminaryData, evcId: id }
      });

      // 2. Save Customer Feedback (SQD questions)
      const customerData = {
        SQD0: surveyData.customer.SQD0,
        SQD1: surveyData.customer.SQD1,
        SQD2: surveyData.customer.SQD2,
        SQD3: surveyData.customer.SQD3,
        SQD4: surveyData.customer.SQD4,
        SQD5: surveyData.customer.SQD5,
        SQD6: surveyData.customer.SQD6,
        SQD7: surveyData.customer.SQD7,
        SQD8: surveyData.customer.SQD8
      };

      const customerFeedback = await tx.customerFeedback.create({
        data: reservationType === 'utilReq'
          ? { ...customerData, utilReqId: id }
          : { ...customerData, evcId: id }
      });

      // 3. Save Employee Evaluation
      const employeeData = {
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
        E17: surveyData.employee.E17
      };

      const employeeEvaluation = await tx.employeeEvaluation.create({
        data: reservationType === 'utilReq'
          ? { ...employeeData, utilReqId: id }
          : { ...employeeData, evcId: id }
      });

      // 4. Save Service Availed (only for UtilReq)
      if (reservationType === 'utilReq' && surveyData.serviceAvailed) {
        for (const service of surveyData.serviceAvailed) {
          await tx.serviceAvailed.create({
            data: {
              service,
              utilReqId: id
            }
          });
        }
      }

      // 5. Update reservation status based on user role
      let updatedReservation;
      if (reservationType === 'utilReq') {
        // MSME: Ongoing → Pending Payment
        updatedReservation = await tx.utilReq.update({
          where: { id },
          data: { Status: 'Pending Payment' }
        });
      } else {
        // STUDENT: Ongoing → Completed
        updatedReservation = await tx.eVCReservation.update({
          where: { id },
          data: { EVCStatus: 'Completed' }
        });
      }

      return {
        preliminarySurvey,
        customerFeedback,
        employeeEvaluation,
        updatedReservation,
        reservationType
      };
    });

    const newStatus = reservationType === 'utilReq' ? 'Pending Payment' : 'Completed';

    console.log('Standard survey submitted successfully:', {
      id,
      reservationType,
      userRole,
      preliminarySurveyId: result.preliminarySurvey.id,
      customerFeedbackId: result.customerFeedback.id,
      employeeEvaluationId: result.employeeEvaluation.id,
      newStatus
    });

    return NextResponse.json({
      success: true,
      message: "Survey submitted successfully",
      data: {
        reservationId: id,
        reservationType,
        userRole,
        status: newStatus,
        surveyIds: {
          preliminary: result.preliminarySurvey.id,
          customer: result.customerFeedback.id,
          employee: result.employeeEvaluation.id
        }
      }
    });

  } catch (error) {
    console.error('[STANDARD_SURVEY_SUBMIT]', error);
    
    // Handle specific Prisma errors
    if (error instanceof Error) {
      if (error.message.includes('Unique constraint')) {
        return new NextResponse("Survey already submitted for this reservation", { status: 409 });
      }
    }
    
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}