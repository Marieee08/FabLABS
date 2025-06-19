// /api/survey/ongoing-reservations

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { Decimal } from '@prisma/client/runtime/library';

// Cache results for 1 minute to prevent multiple identical API calls in short periods
const CACHE_DURATION = 60 * 1000; // 1 minute in milliseconds
let cachedData: any[] | null = null;
let cacheTimestamp = 0;

export async function GET() {
  try {
    const { userId } = await auth();

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

    // Fetch both utilization requests and EVC reservations in parallel
    const [utilReservations, evcReservations] = await Promise.all([
      // Fetch utilization requests with 'Ongoing' status
      prisma.utilReq.findMany({
        where: {
          Status: 'Ongoing'
        },
        select: {
          id: true,
          Status: true,
          RequestDate: true,
          TotalAmntDue: true,
          BulkofCommodity: true,
          ReceiptNumber: true,
          PaymentDate: true,
          UserServices: {
            select: {
              id: true,
              ServiceAvail: true,
              EquipmentAvail: true,
              CostsAvail: true,
              MinsAvail: true,
            }
          },
          UserTools: {
            select: {
              id: true,
              ToolUser: true,
              ToolQuantity: true,
            }
          },
          UtilTimes: {
            select: {
              id: true,
              DayNum: true,
              StartTime: true,
              EndTime: true,
            }
          },
          accInfo: {
            select: {
              Name: true,
              email: true,
              Role: true,
            }
          }
        },
        orderBy: {
          RequestDate: 'desc',
        },
        take: 100,
      }),

      // Fetch EVC reservations with 'Ongoing' status
      prisma.eVCReservation.findMany({
        where: {
          EVCStatus: 'Ongoing'
        },
        select: {
          id: true,
          EVCStatus: true,
          DateRequested: true,
          Teacher: true,
          Subject: true,
          Topic: true,
          LvlSec: true,
          NoofStudents: true,
          UtilTimes: {
            select: {
              id: true,
              DayNum: true,
              StartTime: true,
              EndTime: true,
            }
          },
          accInfo: {
            select: {
              Name: true,
              email: true,
              Role: true,
            }
          },
          EVCStudents: {
            select: {
              id: true,
              Students: true,
            }
          },
          NeededMaterials: {
            select: {
              id: true,
              Item: true,
              ItemQty: true,
              Description: true,
            }
          }
        },
        orderBy: {
          DateRequested: 'desc',
        },
        take: 100,
      })
    ]);

    // Transform utilization reservations to match the expected format
    const formattedUtilReservations = utilReservations.map((reservation: any) => ({
      id: reservation.id,
      Status: reservation.Status,
      RequestDate: reservation.RequestDate?.toISOString() || '',
      TotalAmntDue: reservation.TotalAmntDue,
      BulkofCommodity: reservation.BulkofCommodity,
      ReceiptNumber: reservation.ReceiptNumber,
      PaymentDate: reservation.PaymentDate?.toISOString() || null,
      UserServices: reservation.UserServices.map((service: any) => ({
        id: service.id,
        ServiceAvail: service.ServiceAvail,
        EquipmentAvail: service.EquipmentAvail,
        CostsAvail: service.CostsAvail,
        MinsAvail: service.MinsAvail,
      })),
      UserTools: reservation.UserTools.map((tool: any) => ({
        id: tool.id,
        ToolUser: tool.ToolUser,
        ToolQuantity: tool.ToolQuantity,
      })),
      UtilTimes: reservation.UtilTimes.map((time: any) => ({
        id: time.id,
        DayNum: time.DayNum,
        StartTime: time.StartTime?.toISOString() || null,
        EndTime: time.EndTime?.toISOString() || null,
      })),
      accInfo: {
        Name: reservation.accInfo?.Name || '',
        email: reservation.accInfo?.email || '',
        Role: reservation.accInfo?.Role || 'MSME',
      },
      // Mark as utilization type for identification
      reservationType: 'utilization'
    }));

    // Transform EVC reservations to match the expected format
    const formattedEvcReservations = evcReservations.map((reservation: any) => ({
      id: reservation.id,
      Status: reservation.EVCStatus, // Map EVCStatus to Status
      RequestDate: reservation.DateRequested?.toISOString() || '',
      TotalAmntDue: null, // EVC reservations typically don't have costs
      BulkofCommodity: null,
      ReceiptNumber: null,
      PaymentDate: null,
      // Transform EVC data to match UserServices format for consistency
      UserServices: [{
        id: `evc-service-${reservation.id}`,
        ServiceAvail: 'Fabrication Laboratory Services',
        EquipmentAvail: 'Laboratory Facilities',
        CostsAvail: null,
        MinsAvail: null,
      }],
      UserTools: [], // EVC typically doesn't use tools in the same way
      UtilTimes: reservation.UtilTimes.map((time: any) => ({
        id: time.id,
        DayNum: time.DayNum,
        StartTime: time.StartTime?.toISOString() || null,
        EndTime: time.EndTime?.toISOString() || null,
      })),
      accInfo: {
        Name: reservation.accInfo?.Name || reservation.Teacher || '',
        email: reservation.accInfo?.email || '',
        Role: reservation.accInfo?.Role || 'STUDENT',
      },
      // EVC-specific data
      evcData: {
        Teacher: reservation.Teacher,
        Subject: reservation.Subject,
        Topic: reservation.Topic,
        LvlSec: reservation.LvlSec,
        NoofStudents: reservation.NoofStudents,
        Students: reservation.EVCStudents.map((student: any) => student.Students),
        Materials: reservation.NeededMaterials.map((material: any) => ({
          Item: material.Item,
          Qty: material.ItemQty,
          Description: material.Description
        }))
      },
      // Mark as EVC type for identification
      reservationType: 'evc'
    }));

    // Combine both types of reservations and sort by date
    const allReservations = [...formattedUtilReservations, ...formattedEvcReservations]
      .sort((a, b) => new Date(b.RequestDate).getTime() - new Date(a.RequestDate).getTime());

    // Update cache
    cachedData = allReservations;
    cacheTimestamp = now;

    return NextResponse.json(allReservations, {
      headers: {
        'Cache-Control': 'private, max-age=60',
      },
    });
    

  } catch (error) {
    console.error('[ONGOING_RESERVATIONS_GET]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}