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
        { error: "Invalid reservation ID" },
        { status: 400 }
      );
    }

    const { status, adminName } = await req.json();

    // Basic validation
    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Check if status is valid
    const validStatuses = ['Pending Teacher Approval', 'Pending', 'Approved', 'Ongoing', 'Completed', 'Rejected', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {
      EVCStatus: status,
    };

    // Add ApprovedBy field when status is 'Approved'
    if (status === 'Approved' && adminName) {
      updateData.ApprovedBy = adminName;
    }

    // Update the reservation
    const updatedReservation = await prisma.EVCReservation.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error("Error updating EVC reservation status:", error);
    return NextResponse.json(
      { error: "Failed to update reservation status", message: String(error) },
      { status: 500 }
    );
  }
}