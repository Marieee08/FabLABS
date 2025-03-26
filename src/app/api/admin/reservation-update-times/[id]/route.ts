// src/app/api/admin/reservation-update-times/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface UtilTime {
  id: number;
  DayNum: number | null;
  StartTime: string | null;
  EndTime: string | null;
}

// PATCH handler for updating reservation times and total cost
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const { utilTimes, totalAmount } = await req.json();

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid reservation ID" },
        { status: 400 }
      );
    }

    // First, check if this reservation is in Ongoing status
    const reservation = await prisma.utilReq.findUnique({
      where: { id },
      select: { Status: true }
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    if (reservation.Status !== 'Ongoing') {
      return NextResponse.json(
        { error: "Only ongoing reservations can have their times updated" },
        { status: 400 }
      );
    }

    // Update total amount first
    await prisma.utilReq.update({
      where: { id },
      data: { 
        TotalAmntDue: typeof totalAmount === 'number' ? totalAmount : parseFloat(totalAmount)
      }
    });

    // Update each time entry
    for (const time of utilTimes) {
      await prisma.utilTime.update({
        where: { id: time.id },
        data: {
          StartTime: time.StartTime ? new Date(time.StartTime) : null,
          EndTime: time.EndTime ? new Date(time.EndTime) : null
        }
      });
    }

    // Fetch updated reservation with times
    const updatedReservation = await prisma.utilReq.findUnique({
      where: { id },
      include: {
        accInfo: {
          include: {
            ClientInfo: true,
            BusinessInfo: true,
          },
        },
        UserServices: true,
        UserTools: true,
        UtilTimes: true,
      },
    });

    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error("Error updating reservation times:", error);
    return NextResponse.json(
      { error: "Failed to update reservation times", details: String(error) },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}