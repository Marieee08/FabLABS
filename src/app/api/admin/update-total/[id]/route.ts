// src/app/api/admin/reservation-update-times/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface UpdateTimesBody {
  utilTimes: Array<{
    id: number;
    DayNum: number | null;
    StartTime: string | null;
    EndTime: string | null;
    DateStatus?: string | null;
  }>;
  totalAmount: number;
  downtimeDetails?: {
    totalDowntimeMinutes: number;
    totalDeduction: number;
  };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reservationId = parseInt(params.id);

    if (isNaN(reservationId)) {
      return NextResponse.json(
        { error: "Invalid reservation ID" },
        { status: 400 }
      );
    }

    // Parse the request body
    const body: UpdateTimesBody = await req.json();
    console.log("Received update times request:", body);

    // Check if the reservation exists
    const existingReservation = await prisma.utilReq.findUnique({
      where: { id: reservationId },
      include: {
        UtilTimes: true,
        Comments: true
      }
    });

    if (!existingReservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    // Validate the request body
    if (!body.utilTimes || !Array.isArray(body.utilTimes)) {
      return NextResponse.json(
        { error: "Invalid utilTimes array" },
        { status: 400 }
      );
    }

    if (body.totalAmount === undefined || body.totalAmount === null) {
      return NextResponse.json(
        { error: "Total amount is required" },
        { status: 400 }
      );
    }

    // Process downtime information
    let comments = existingReservation.Comments || "";
    
    // Add downtime information to comments if present
    if (body.downtimeDetails && body.downtimeDetails.totalDowntimeMinutes > 0) {
      const downtimeNote = `[${new Date().toISOString().split('T')[0]}] Downtime adjustment: ${body.downtimeDetails.totalDowntimeMinutes} minutes resulted in ₱${body.downtimeDetails.totalDeduction.toFixed(2)} deduction.`;
      
      comments = comments ? `${comments}\n\n${downtimeNote}` : downtimeNote;
    }

    // Execute transaction to update both times and total amount
    const result = await prisma.$transaction(async (tx) => {
      // Update each util time
      const timeUpdatePromises = body.utilTimes.map(async (time) => {
        return tx.utilTime.update({
          where: { id: time.id },
          data: {
            StartTime: time.StartTime ? new Date(time.StartTime) : null,
            EndTime: time.EndTime ? new Date(time.EndTime) : null,
            DateStatus: time.DateStatus || "Ongoing",
            DayNum: time.DayNum
          }
        });
      });

      // Wait for all time updates to complete
      const updatedTimes = await Promise.all(timeUpdatePromises);

      // Update the total amount and comments
      const updatedReservation = await tx.utilReq.update({
        where: { id: reservationId },
        data: {
          TotalAmntDue: body.totalAmount,
          Comments: comments
        },
        include: {
          UtilTimes: true
        }
      });

      return updatedReservation;
    });

    // Return success response
    return NextResponse.json({
      success: true,
      message: "Times and total amount updated successfully",
      ...result
    });
  } catch (error) {
    console.error("Error updating reservation times:", error);
    return NextResponse.json(
      {
        error: "Failed to update reservation times",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}