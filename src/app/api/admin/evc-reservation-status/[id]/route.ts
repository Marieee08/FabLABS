// /app/api/admin/evc-reservation-status/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid EVC reservation ID" },
        { status: 400 }
      );
    }

    const { status } = await req.json();

    // Use EVCReservation with capital "EVC" to match your schema
    const updatedReservation = await prisma.EVCReservation.update({
      where: { id },
      data: { EVCStatus: status },
    });

    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error("Error updating EVC reservation status:", error);
    return NextResponse.json(
      { error: "Failed to update EVC reservation status", message: String(error) },
      { status: 500 }
    );
  }
}