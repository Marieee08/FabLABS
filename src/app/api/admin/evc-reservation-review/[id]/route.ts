// /app/api/admin/evc-reservation-review/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
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

    // Use EVCReservation with capital "EVC" to match your schema
    const reservation = await prisma.EVCReservation.findUnique({
      where: { id },
      include: {
        accInfo: true,
        EVCStudents: true,
        NeededMaterials: true,
        UtilTimes: true,
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: "EVC reservation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(reservation);
  } catch (error) {
    console.error("Error fetching EVC reservation details:", error);
    return NextResponse.json(
      { error: "Failed to fetch EVC reservation details", message: String(error) },
      { status: 500 }
    );
  }
}