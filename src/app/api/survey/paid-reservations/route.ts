import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch reservations that are paid
    const reservations = await prisma.utilReq.findMany({
      where: {
        Status: 'Paid'
      },
      include: {
        accInfo: {
          select: {
            Name: true,
            email: true,
          }
        },
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
        }
      },
      orderBy: {
        RequestDate: 'desc',
      },
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

    return NextResponse.json(formattedReservations);

  } catch (error) {
    console.error('[PAID_RESERVATIONS_GET]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}