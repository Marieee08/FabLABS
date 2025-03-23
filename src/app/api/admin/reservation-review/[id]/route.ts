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

// PATCH handler for updating equipment and comments
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const url = new URL(req.url);
    const resourceType = url.searchParams.get('type');
    const data = await req.json();

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid reservation ID" },
        { status: 400 }
      );
    }

    // Update equipment for a service
    if (resourceType === 'equipment') {
      const { serviceId, equipment, cost } = data;
      
      await prisma.userService.update({
        where: {
          id: serviceId
        },
        data: {
          EquipmentAvail: equipment,
          CostsAvail: cost !== undefined ? parseFloat(cost) : undefined
        }
      });
    } 
    // Update comments
    else if (resourceType === 'comments') {
      const { comments, totalAmount } = data;
      
      await prisma.utilReq.update({
        where: { id },
        data: { 
          Comments: comments,
          TotalAmntDue: totalAmount !== undefined ? totalAmount : undefined
        }
      });
    }
    // Unknown resource type
    else {
      return NextResponse.json(
        { error: "Invalid resource type" },
        { status: 400 }
      );
    }

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
    console.error("Error updating resource:", error);
    return NextResponse.json(
      { error: "Failed to update resource" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT handler for updating reservation status
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