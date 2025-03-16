// /api/admin/reservations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Fetch UtilReq (utilization reservations)
    const utilReservations = await prisma.utilReq.findMany({
      include: {
        accInfo: {
          include: {
            ClientInfo: true,
            BusinessInfo: true,
          },
        },
        UserServices: true,
        UtilTimes: true,
      },
      orderBy: {
        RequestDate: 'desc',
      },
    });

    // Fetch EVCReservation (educational visit center reservations)
    const evcReservations = await prisma.eVCReservation.findMany({
      include: {
        accInfo: true,
        UtilTimes: true,
      },
      orderBy: {
        DateRequested: 'desc',
      },
    });

    // Transform UtilReq data into the expected format
    const formattedUtilReservations = utilReservations.map((reservation) => {
      // Get the first service name for display
      const serviceName = reservation.UserServices.length > 0 
        ? reservation.UserServices[0].ServiceAvail 
        : "No service";
      
      // Determine the date from UtilTimes if available, otherwise use RequestDate
      const firstTime = reservation.UtilTimes.length > 0 ? reservation.UtilTimes[0] : null;
      const date = firstTime && firstTime.StartTime 
        ? new Date(firstTime.StartTime).toISOString() 
        : reservation.RequestDate.toISOString();

      return {
        id: reservation.id.toString(),
        date: date,
        name: reservation.accInfo?.Name || "Unknown",
        email: reservation.accInfo?.email || "Unknown",
        status: reservation.Status,
        role: reservation.accInfo?.Role || "MSME",
        service: serviceName,
        totalAmount: reservation.TotalAmntDue ? Number(reservation.TotalAmntDue) : null,
        type: 'utilization'
      };
    });

    // Transform EVCReservation data into the expected format
    const formattedEVCReservations = evcReservations.map((reservation) => {
      // Determine the date from UtilTimes if available, otherwise use DateRequested
      const firstTime = reservation.UtilTimes.length > 0 ? reservation.UtilTimes[0] : null;
      const date = firstTime && firstTime.StartTime 
        ? new Date(firstTime.StartTime).toISOString() 
        : reservation.DateRequested 
          ? reservation.DateRequested.toISOString() 
          : new Date().toISOString();

      return {
        id: `evc-${reservation.id}`, // Prefixing with 'evc-' to distinguish from utilization reservations
        date: date,
        name: reservation.accInfo?.Name || reservation.Teacher || "Unknown",
        email: reservation.accInfo?.email || reservation.TeacherEmail || "Unknown",
        status: reservation.EVCStatus,
        role: reservation.accInfo?.Role || "Student",
        service: "Laboratory Reservation",
        totalAmount: null, // EVC doesn't have a total amount
        type: 'evc'
      };
    });

    // Combine and sort all reservations by date (newest first)
    const allReservations = [...formattedUtilReservations, ...formattedEVCReservations]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(allReservations);
  } catch (error) {
    console.error("Error fetching reservations:", error);
    return NextResponse.json(
      { error: "Failed to fetch reservations" },
      { status: 500 }
    );
  }
}