import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET handler for fetching reservation details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid reservation ID" },
        { status: 400 }
      );
    }

    const reservation = await prisma.utilReq.findUnique({
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

    if (!reservation) {
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(reservation);
  } catch (error) {
    console.error("Error fetching reservation details:", error);
    return NextResponse.json(
      { error: "Failed to fetch reservation details" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PATCH handler for updating equipment
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const { serviceId, equipment } = await req.json();

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid reservation ID" },
        { status: 400 }
      );
    }

    // Update the equipment for the specific service
    await prisma.userService.update({
      where: {
        id: serviceId
      },
      data: {
        EquipmentAvail: equipment
      }
    });

    // Fetch updated reservation
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
    console.error("Error updating equipment:", error);
    return NextResponse.json(
      { error: "Failed to update equipment" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT handler for updating status
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const { status } = await req.json();

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid reservation ID" },
        { status: 400 }
      );
    }

    const updatedReservation = await prisma.utilReq.update({
      where: { id },
      data: { Status: status },
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
    console.error("Error updating reservation status:", error);
    return NextResponse.json(
      { error: "Failed to update reservation status" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}