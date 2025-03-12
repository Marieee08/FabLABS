// /api/survey/submit

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: Request) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { reservationId, surveyData } = await request.json();

    if (!reservationId) {
      return new NextResponse("Reservation ID is required", { status: 400 });
    }

    // Update the reservation status to Completed
    const updatedReservation = await prisma.utilReq.update({
      where: {
        id: parseInt(reservationId)
      },
      data: {
        Status: 'Completed',
        // Store the survey data if needed
        ...(surveyData?.preliminary && {
          PreliminarySurvey: {
            create: {
              // No userRole field - removed from the schema
              age: parseInt(surveyData.preliminary.age) || 0,
              sex: surveyData.preliminary.sex || '',
              CC1: surveyData.preliminary.CC1,
              CC2: surveyData.preliminary.CC2,
              CC3: surveyData.preliminary.CC3,
              clientType: surveyData.preliminary.clientType,
              region: surveyData.preliminary.region,
              office: surveyData.preliminary.office,
              otherService: surveyData.preliminary.otherService
            }
          }
        }),
        ...(surveyData?.customer && {
          CustomerFeedback: {
            create: {
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
          }
        }),
        ...(surveyData?.employee && {
          EmployeeEvaluation: {
            create: {
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
            }
          }
        }),
        ...(surveyData?.serviceAvailed && surveyData.serviceAvailed.length > 0 && {
          ServiceAvailed: {
            createMany: {
              data: surveyData.serviceAvailed.map((service: string) => ({
                service
              }))
            }
          }
        })
      }
      
    });

    console.log('Received data:', { reservationId, surveyData });

    return NextResponse.json({
      success: true,
      message: "Survey completed successfully",
      data: updatedReservation
    });

  } catch (error) {
    console.error('[COMPLETE_SURVEY_POST]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }

}
