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

    // Fetch all UtilReq reservations
    const utilReservations = await prisma.utilReq.findMany({
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

    // Fetch all EVC reservations
    const evcReservations = await prisma.eVCReservation.findMany({
      include: {
        accInfo: true,
        UtilTimes: true,
      },
      orderBy: {
        DateRequested: 'desc',
      },
    });

    // Transform UtilReq reservations
    const formattedUtilReservations = utilReservations.map((reservation) => {
      return {
        id: reservation.id.toString(),
        date: reservation.RequestDate?.toISOString() || '',
        name: reservation.accInfo?.Name || '',
        email: reservation.accInfo?.email || '',
        status: reservation.Status,
        role: reservation.accInfo?.Role || '',
        service: reservation.UserServices.map(s => s.ServiceAvail).join(', ') || '',
        totalAmount: Number(reservation.TotalAmntDue) || 0,
        type: 'utilization', // Add type to distinguish between different reservations
      };
    });

    // Transform EVC reservations
    const formattedEvcReservations = evcReservations.map((reservation) => {
      return {
        id: `evc-${reservation.id.toString()}`, // Prefix to distinguish from UtilReq IDs
        date: reservation.DateRequested?.toISOString() || '',
        name: reservation.accInfo?.Name || '',
        email: reservation.accInfo?.email || '',
        status: reservation.EVCStatus,
        role: reservation.accInfo?.Role || '',
        service: `Lab Reservation - ${reservation.Subject || ''}`, // Construct service name from EVC data
        totalAmount: 0, // EVC reservations don't have a total amount based on schema
        type: 'evc', // Add type to distinguish between different reservations
        lvlSec: reservation.LvlSec, // Adding EVC-specific fields
        noOfStudents: reservation.NoofStudents,
        subject: reservation.Subject,
        teacher: reservation.Teacher,
        topic: reservation.Topic,
      };
    });

    // Combine both types of reservations
    const allReservations = [...formattedUtilReservations, ...formattedEvcReservations];
    
    // Sort by date (newest first)
    allReservations.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    return NextResponse.json(allReservations);
  } catch (error) {
    console.error('[RESERVATIONS_GET]', error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}