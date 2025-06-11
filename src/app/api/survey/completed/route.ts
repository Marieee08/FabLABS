// /api/survey/completed/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

// Define the type for the formatted survey data
type FormattedSurvey = {
  id: string;
  reservationId: number;
  submittedAt: string;
  customerName: string;
  serviceAvailed: string[];
  preliminary: {
    clientType: string;
    sex: string;
    age: string;
    region: string;
    office: string;
    CC1: string;
    CC2: string;
    CC3: string;
  };
  customer: {
    SQD0: string;
    SQD1: string;
    SQD2: string;
    SQD3: string;
    SQD4: string;
    SQD5: string;
    SQD6: string;
    SQD7: string;
    SQD8: string;
  };
  employee: {
    E1: string;
    E2: string;
    E3: string;
    E4: string;
    E5: string;
    E6: string;
    E7: string;
    E8: string;
    E9: string;
    E10: string;
    E11: string;
    E12: string;
    E13: string;
    E14: string;
    E15: string;
    E16: string;
    E17: string;
  };
};

// Cache results for 1 minute to prevent multiple identical API calls in short periods
const CACHE_DURATION = 60 * 1000; // 1 minute in milliseconds
let cachedData: FormattedSurvey[] | null = null;
let cacheTimestamp = 0;

export async function GET() {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if we have cached data and if it's still valid
    const now = Date.now();
    if (cachedData && now - cacheTimestamp < CACHE_DURATION) {
      return NextResponse.json(cachedData, {
        headers: {
          'Cache-Control': 'private, max-age=60',
        },
      });
    }

    // Find reservations with 'Completed' status
    const completedReservations = await prisma.utilReq.findMany({
      where: {
        Status: 'Completed'
      },
      select: {
        id: true,
        RequestDate: true,
        PreliminarySurvey: {
          select: {
            id: true,
            clientType: true,
            sex: true,
            age: true,
            region: true,
            office: true,
            CC1: true,
            CC2: true,
            CC3: true,
          }
        },
        CustomerFeedback: {
          select: {
            id: true,
            SQD0: true,
            SQD1: true,
            SQD2: true,
            SQD3: true,
            SQD4: true,
            SQD5: true,
            SQD6: true,
            SQD7: true,
            SQD8: true,
          }
        },
        EmployeeEvaluation: {
          select: {
            id: true,
            E1: true,
            E2: true,
            E3: true,
            E4: true,
            E5: true,
            E6: true,
            E7: true,
            E8: true,
            E9: true,
            E10: true,
            E11: true,
            E12: true,
            E13: true,
            E14: true,
            E15: true,
            E16: true,
            E17: true,
          }
        },
        ServiceAvailed: {
          select: {
            service: true,
          }
        },
        accInfo: {
          select: {
            Name: true,
          }
        }
      },
      orderBy: {
        RequestDate: 'desc',
      },
    });

    // Transform the data to match the expected format in the CompletedSurveysPage component
    const formattedSurveys: FormattedSurvey[] = completedReservations.map((reservation) => ({
      id: `survey-${reservation.id}`,
      reservationId: reservation.id,
      submittedAt: reservation.RequestDate?.toISOString() || new Date().toISOString(),
      customerName: reservation.accInfo?.Name || 'Unknown',
      serviceAvailed: reservation.ServiceAvailed.map(s => s.service),
      preliminary: {
        clientType: reservation.PreliminarySurvey?.clientType || 'Not specified',
        sex: reservation.PreliminarySurvey?.sex || 'Not specified',
        age: reservation.PreliminarySurvey?.age?.toString() || 'Not specified',
        region: reservation.PreliminarySurvey?.region || 'Not specified',
        office: reservation.PreliminarySurvey?.office || 'Not specified',
        CC1: reservation.PreliminarySurvey?.CC1 || 'Not specified',
        CC2: reservation.PreliminarySurvey?.CC2 || 'Not specified',
        CC3: reservation.PreliminarySurvey?.CC3 || 'Not specified',
      },
      customer: {
        SQD0: reservation.CustomerFeedback?.SQD0 || 'N/A',
        SQD1: reservation.CustomerFeedback?.SQD1 || 'N/A',
        SQD2: reservation.CustomerFeedback?.SQD2 || 'N/A',
        SQD3: reservation.CustomerFeedback?.SQD3 || 'N/A',
        SQD4: reservation.CustomerFeedback?.SQD4 || 'N/A',
        SQD5: reservation.CustomerFeedback?.SQD5 || 'N/A',
        SQD6: reservation.CustomerFeedback?.SQD6 || 'N/A',
        SQD7: reservation.CustomerFeedback?.SQD7 || 'N/A',
        SQD8: reservation.CustomerFeedback?.SQD8 || 'N/A',
      },
      employee: {
        E1: reservation.EmployeeEvaluation?.E1 || 'N/A',
        E2: reservation.EmployeeEvaluation?.E2 || 'N/A',
        E3: reservation.EmployeeEvaluation?.E3 || 'N/A',
        E4: reservation.EmployeeEvaluation?.E4 || 'N/A',
        E5: reservation.EmployeeEvaluation?.E5 || 'N/A',
        E6: reservation.EmployeeEvaluation?.E6 || 'N/A',
        E7: reservation.EmployeeEvaluation?.E7 || 'N/A',
        E8: reservation.EmployeeEvaluation?.E8 || 'N/A',
        E9: reservation.EmployeeEvaluation?.E9 || 'N/A',
        E10: reservation.EmployeeEvaluation?.E10 || 'N/A',
        E11: reservation.EmployeeEvaluation?.E11 || 'N/A',
        E12: reservation.EmployeeEvaluation?.E12 || 'N/A',
        E13: reservation.EmployeeEvaluation?.E13 || 'N/A',
        E14: reservation.EmployeeEvaluation?.E14 || 'N/A',
        E15: reservation.EmployeeEvaluation?.E15 || 'N/A',
        E16: reservation.EmployeeEvaluation?.E16 || 'N/A',
        E17: reservation.EmployeeEvaluation?.E17 || 'N/A',
      }
    }));

    // Update cache
    cachedData = formattedSurveys;
    cacheTimestamp = now;

    return NextResponse.json(formattedSurveys, {
      headers: {
        'Cache-Control': 'private, max-age=60',
      },
    });

  } catch (error) {
    console.error('[COMPLETED_SURVEYS_GET]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}