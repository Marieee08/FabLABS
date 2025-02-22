// app/api/reservations/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Fetch all reservations with related account info and services
    const reservations = await prisma.utilReq.findMany({
      include: {
        accInfo: true,
        UserServices: {
          select: {
            ServiceAvail: true,
            CostsAvail: true,
            MinsAvail: true
          }
        },
        UtilTimes: true,
      },
      orderBy: {
        RequestDate: 'desc',
      },
    });

    // Transform the data and use the stored TotalAmntDue
    const formattedReservations = reservations.map((reservation) => {
      return {
        id: reservation.id.toString(),
        date: reservation.RequestDate?.toISOString() || '',
        name: reservation.accInfo?.Name || '',
        email: reservation.accInfo?.email || '',
        status: reservation.Status,
        role: reservation.accInfo?.Role || '',
        service: reservation.UserServices.map(s => s.ServiceAvail).join(', ') || '',
        // Use the stored TotalAmntDue directly
        totalAmount: Number(reservation.TotalAmntDue) || 0,
      };
    });

    return NextResponse.json(formattedReservations);
  } catch (error) {
    console.error('[RESERVATIONS_GET]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}