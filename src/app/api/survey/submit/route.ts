// /api/survey/submit/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// Helper function to validate required fields in the survey data
function validateSurveyData(surveyData: { preliminary: { clientType: any; sex: any; age: any; region: any; office: any; CC1: any; }; customer: {}; employee: {}; }) {
  console.log('Validating survey data:', JSON.stringify(surveyData, null, 2));
  
  if (!surveyData) {
    console.log('No survey data provided');
    return false;
  }
  
  if (!surveyData.preliminary) {
    console.log('Missing preliminary data');
    return false;
  }
  
  if (!surveyData.preliminary.clientType) {
    console.log('Missing clientType');
    return false;
  }

  // Validate preliminary data
  if (!surveyData.preliminary || 
      !surveyData.preliminary.clientType || 
      !surveyData.preliminary.sex || 
      !surveyData.preliminary.age || 
      !surveyData.preliminary.region ||
      !surveyData.preliminary.office ||
      !surveyData.preliminary.CC1) {
    return false;
  }
  
  // Validate customer feedback data (at least basic check)
  if (!surveyData.customer || Object.keys(surveyData.customer).length === 0) {
    return false;
  }
  
  // Validate employee evaluation data (at least basic check)
  if (!surveyData.employee || Object.keys(surveyData.employee).length === 0) {
    return false;
  }
  
  return true;
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Parse request data
    const body = await request.json();
    const { reservationId, surveyData } = body;

    console.log('Received reservationId:', reservationId);

    // Validation checks
    if (!reservationId) {
      return new NextResponse("Reservation ID is required", { status: 400 });
    }
    
    if (!validateSurveyData(surveyData)) {
      return new NextResponse("Invalid survey data format", { status: 400 });
    }

    // Parse numeric values safely
    const parsedAge = surveyData.preliminary.age ? parseInt(surveyData.preliminary.age) : 0;
    
    // Use Prisma transactions to ensure atomicity
    const updatedReservation = await prisma.$transaction(async (prisma: any) => {
      // Check both utilReq (for MSME) and evcReservation (for STUDENT) tables
      const [utilReservation, evcReservation] = await Promise.all([
        // MSME reservations are in utilReq
        prisma.utilReq.findFirst({
          where: {
            id: parseInt(reservationId),
            Status: 'Ongoing'
          },
          select: { 
            id: true,
            accInfo: {
              select: {
                Role: true
              }
            }
          }
        }),
        // STUDENT reservations are in evcReservation
        prisma.eVCReservation.findFirst({
          where: {
            id: parseInt(reservationId),
            EVCStatus: 'Ongoing'
          },
          select: { 
            id: true,
            accInfo: {
              select: {
                Role: true
              }
            }
          }
        })
      ]);

      console.log('Found utilReservation:', utilReservation);
      console.log('Found evcReservation:', evcReservation);

      if (!utilReservation && !evcReservation) {
        throw new Error('Reservation not found or not in ongoing status');
      }

      // Get the account role to determine next status
      const accountRole = utilReservation?.accInfo?.Role || evcReservation?.accInfo?.Role;
      
      // Determine next status based on role:
      // STUDENT -> Completed
      // MSME -> Pending Payment
      const nextStatus = accountRole === 'MSME' ? 'Pending Payment' : 'Completed';
      
      console.log('Account role:', accountRole);
      console.log('Next status:', nextStatus);

      // Handle utilReq reservations (MSME)
      if (utilReservation) {
        // For MSME: Survey completion -> Pending Payment
        return prisma.utilReq.update({
          where: {
            id: parseInt(reservationId)
          },
          data: {
            Status: 'Pending Payment', // MSME always goes to Pending Payment
            // Store the survey data
            ...(surveyData?.preliminary && {
              PreliminarySurvey: {
                create: {
                  userRole: 'MSME', // Explicitly set to MSME since this is utilReq
                  age: parsedAge,
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
      }

      // Handle EVC reservations (STUDENT)
      if (evcReservation) {
        // For STUDENT: Survey completion -> Completed
        return prisma.eVCReservation.update({
          where: {
            id: parseInt(reservationId)
          },
          data: {
            EVCStatus: 'Completed' // STUDENT always goes to Completed
          }
        });
      }
    });

    // Determine response message based on the final status
    const finalStatus = updatedReservation.Status || updatedReservation.EVCStatus;
    const responseMessage = finalStatus === 'Pending Payment'
      ? "Survey completed successfully. Your reservation is now pending payment."
      : "Survey completed successfully. Your service has been marked as completed.";

    return NextResponse.json({
      success: true,
      message: responseMessage,
      data: {
        id: updatedReservation.id,
        Status: finalStatus,
        nextStep: finalStatus === 'Pending Payment' 
          ? "Please proceed to payment to complete your transaction."
          : "Your transaction has been completed."
      }
    });

  } catch (error) {
    console.error('[COMPLETE_SURVEY_POST]', error);
    
    // Check for specific error types to give better feedback
    if (error instanceof Error && error.message === 'Reservation not found or not in ongoing status') {
      return new NextResponse(error.message, { status: 404 });
    }
    
    return new NextResponse("Internal Error", { status: 500 });
  }
}