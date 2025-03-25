// /api/survey/paid-reservations

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';
import { Decimal } from '@prisma/client/runtime/library';

// Cache results for 1 minute to prevent multiple identical API calls in short periods
const CACHE_DURATION = 60 * 1000; // 1 minute in milliseconds
let cachedData: { id: number; Status: string; RequestDate: string; TotalAmntDue: Decimal | null; BulkofCommodity: string | null; ReceiptNumber: string | null; PaymentDate: string | null; UserServices: { id: string; ServiceAvail: string; EquipmentAvail: string; CostsAvail: Decimal | null; MinsAvail: Decimal | null; }[]; UserTools: { id: string; ToolUser: string; ToolQuantity: number; }[]; UtilTimes: { id: number; DayNum: number | null; StartTime: string | null; EndTime: string | null; }[]; accInfo: { Name: string; email: string; }; }[] | null = null;
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

    // Use a more focused select to reduce data transferred
    const reservations = await prisma.utilReq.findMany({
      where: {
        Status: 'Paid'
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
          }
        }
      },
      orderBy: {
        RequestDate: 'desc',
      },
      // Limit to a reasonable number of results
      take: 100,
    });

    // Transform the data to match the DetailedReservation interface
    const formattedReservations = reservations.map((reservation) => ({
      id: reservation.id,
      Status: reservation.Status,
      RequestDate: reservation.RequestDate?.toISOString() || '',
      TotalAmntDue: reservation.TotalAmntDue,
      BulkofCommodity: reservation.BulkofCommodity,
      ReceiptNumber: reservation.ReceiptNumber,
      PaymentDate: reservation.PaymentDate?.toISOString() || null,
      UserServices: reservation.UserServices.map(service => ({
        id: service.id,
        ServiceAvail: service.ServiceAvail,
        EquipmentAvail: service.EquipmentAvail,
        CostsAvail: service.CostsAvail,
        MinsAvail: service.MinsAvail,
      })),
      UserTools: reservation.UserTools.map(tool => ({
        id: tool.id,
        ToolUser: tool.ToolUser,
        ToolQuantity: tool.ToolQuantity,
      })),
      UtilTimes: reservation.UtilTimes.map(time => ({
        id: time.id,
        DayNum: time.DayNum,
        StartTime: time.StartTime?.toISOString() || null,
        EndTime: time.EndTime?.toISOString() || null,
      })),
      accInfo: {
        Name: reservation.accInfo?.Name || '',
        email: reservation.accInfo?.email || '',
      }
    }));

    // Update cache
    cachedData = formattedReservations;
    cacheTimestamp = now;

    return NextResponse.json(formattedReservations, {
      headers: {
        'Cache-Control': 'private, max-age=60',
      },
    });

  } catch (error) {
    console.error('[PAID_RESERVATIONS_GET]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}