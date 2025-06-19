// /api/survey/submit-internal/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// Helper function to validate required fields in the survey data
function validateInternalSurveyData(surveyData: { 
  preliminary: { 
    clientType: any; 
    sex: any; 
    age: any; 
    officeAvailed: any; // Changed from 'office' to 'officeAvailed'
    serviceAvailed: any[];
    CC1: any; 
  }; 
  customer: {}; 
}) {
  console.log('Validating survey data:', JSON.stringify(surveyData, null, 2));
  
  if (!surveyData) {
    console.log('No survey data provided');
    return false;
  }
  
  // Validate preliminary data
  if (!surveyData.preliminary) {
    console.log('No preliminary data');
    return false;
  }

  const { preliminary } = surveyData;
  
  // Check required fields (removed region and office checks, updated office field name)
  if (!preliminary.clientType) {
    console.log('Missing clientType');
    return false;
  }
  
  if (!preliminary.sex) {
    console.log('Missing sex');
    return false;
  }
  
  if (!preliminary.age) {
    console.log('Missing age');
    return false;
  }
  
  if (!preliminary.officeAvailed) { // Changed from 'office' to 'officeAvailed'
    console.log('Missing officeAvailed');
    return false;
  }
  
  if (!preliminary.serviceAvailed || !Array.isArray(preliminary.serviceAvailed) || preliminary.serviceAvailed.length === 0) {
    console.log('Missing or invalid serviceAvailed');
    return false;
  }
  
  if (!preliminary.CC1) {
    console.log('Missing CC1');
    return false;
  }
  
  // Validate customer feedback data (at least basic check)
  if (!surveyData.customer || Object.keys(surveyData.customer).length === 0) {
    console.log('Missing or empty customer data');
    return false;
  }
  
  console.log('Validation passed');
  return true;
}

export async function POST(request: Request) {
  try {
    const { userId } = await auth(); // Fixed: Added await

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Parse request data
    const body = await request.json();
    const { reservationId, surveyData } = body;

    console.log('Received submission:', { reservationId, surveyData });

    // Validation checks
    if (!reservationId) {
      console.log('Missing reservationId');
      return new NextResponse("Reservation ID is required", { status: 400 });
    }
    
    if (!validateInternalSurveyData(surveyData)) {
      console.log('Survey data validation failed');
      return new NextResponse("Invalid survey data format", { status: 400 });
    }

    // Parse numeric values safely
    const parsedAge = surveyData.preliminary.age ? parseInt(surveyData.preliminary.age) : 0;
    
    // Use Prisma transactions to ensure atomicity
    const updatedReservation = await prisma.$transaction(async (prisma: any) => {
      // Check both utilReq and evcReservation tables (same as main submit API)
      const [utilReservation, evcReservation] = await Promise.all([
        prisma.utilReq.findFirst({
          where: {
            id: parseInt(reservationId),
            Status: 'Ongoing'
          },
          select: { id: true }
        }),
        prisma.eVCReservation.findFirst({
          where: {
            id: parseInt(reservationId),
            EVCStatus: 'Ongoing'
          },
          select: { id: true }
        })
      ]);

      console.log('Found utilReservation:', utilReservation);
      console.log('Found evcReservation:', evcReservation);

      if (!utilReservation && !evcReservation) {
        throw new Error('Reservation not found or not in ongoing status');
      }

      // Handle utilReq reservations
      if (utilReservation) {
        return prisma.utilReq.update({
          where: {
            id: parseInt(reservationId)
          },
          data: {
            Status: 'Completed',
            // Store the survey data
            ...(surveyData?.preliminary && {
              PreliminarySurvey: {
                create: {
                  userRole: 'STAFF', // Set to STAFF for internal surveys
                  age: parsedAge,
                  sex: surveyData.preliminary.sex || '',
                  CC1: surveyData.preliminary.CC1,
                  CC2: surveyData.preliminary.CC2,
                  CC3: surveyData.preliminary.CC3,
                  clientType: surveyData.preliminary.clientType,
                  region: 'VIII', // Set default region for internal surveys
                  office: surveyData.preliminary.officeAvailed, // Map officeAvailed to office
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
            // Note: Internal surveys don't have employee evaluation
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

      // Handle EVC reservations - just update status for now
      // Note: EVC surveys aren't fully implemented in schema for internal surveys
      if (evcReservation) {
        return prisma.eVCReservation.update({
          where: {
            id: parseInt(reservationId)
          },
          data: {
            EVCStatus: 'Completed'
          }
        });
      }
    });

    console.log('Survey submitted successfully');

    return NextResponse.json({
      success: true,
      message: "Internal survey completed successfully",
      data: {
        id: updatedReservation.id,
        Status: updatedReservation.Status || updatedReservation.EVCStatus
      }
    });

  } catch (error) {
    console.error('[INTERNAL_SURVEY_POST]', error);
    
    // Check for specific error types to give better feedback
    if (error instanceof Error && error.message === 'Reservation not found or not in ongoing status') {
      return new NextResponse(error.message, { status: 404 });
    }
    
    return new NextResponse(`Internal Error: ${error instanceof Error ? error.message : 'Unknown error'}`, { status: 500 });
  }
}