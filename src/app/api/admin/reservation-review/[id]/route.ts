// src\app\api\admin\reservation-review\[id]\route.ts

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
        MachineUtilizations: {
          include: {
            OperatingTimes: true,
            DownTimes: true,
            RepairChecks: true,
          }
        },
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
      
      // Update the existing UserService
      await prisma.userService.update({
        where: {
          id: serviceId
        },
        data: {
          EquipmentAvail: equipment,
          CostsAvail: cost !== undefined ? parseFloat(cost) : undefined
        }
      });
      
      // Machine utilization creation is removed from here
      // Now it will only be created during the approval process
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
        MachineUtilizations: {
          include: {
            OperatingTimes: true,
            DownTimes: true,
            RepairChecks: true,
          }
        },
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

// POST handler for creating new UserService records
export async function POST(
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

    // Create new UserService
    if (resourceType === 'service') {
      const { serviceAvail, equipment, cost, mins } = data;
      
      // Create new UserService record
      const newService = await prisma.userService.create({
        data: {
          ServiceAvail: serviceAvail,
          EquipmentAvail: equipment,
          CostsAvail: cost !== undefined ? parseFloat(cost) : null,
          MinsAvail: mins !== undefined ? parseFloat(mins) : null,
          utilReq: {
            connect: {
              id: id
            }
          }
        }
      });
      
      // Machine utilization creation is removed from here
      // Now it will only be created during the approval process
      
      return NextResponse.json(newService);
    }
    // Unknown resource type
    else {
      return NextResponse.json(
        { error: "Invalid resource type" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error creating resource:", error);
    return NextResponse.json(
      { error: "Failed to create resource" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE handler for removing UserService records
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const url = new URL(req.url);
    const resourceType = url.searchParams.get('type');
    const serviceId = url.searchParams.get('serviceId');

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid reservation ID" },
        { status: 400 }
      );
    }

    // Delete UserService
    if (resourceType === 'service' && serviceId) {
      // Delete the UserService
      await prisma.userService.delete({
        where: {
          id: serviceId
        }
      });
      
      return NextResponse.json({ success: true });
    }
    // Unknown resource type
    else {
      return NextResponse.json(
        { error: "Invalid resource type or missing serviceId" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error deleting resource:", error);
    return NextResponse.json(
      { error: "Failed to delete resource" },
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
        MachineUtilizations: {
          include: {
            OperatingTimes: true,
            DownTimes: true,
            RepairChecks: true,
          }
        },
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