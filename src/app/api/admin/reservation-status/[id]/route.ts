import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("API request received for ID:", params.id);
    const id = parseInt(params.id);

    if (isNaN(id)) {
      console.error("Invalid ID:", params.id);
      return NextResponse.json(
        { error: "Invalid reservation ID" },
        { status: 400 }
      );
    }

    // Get the request body
    const body = await req.json();
    console.log("Request body:", body);
    
    const { status } = body;

    // Basic validation
    if (!status) {
      console.error("Missing status in request");
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Check if status is valid
    const validStatuses = ['Pending Teacher Approval', 'Pending', 'Approved', 'Ongoing', 'Completed', 'Rejected', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      console.error("Invalid status:", status);
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData = {
      EVCStatus: status,
    };

    // Add ApprovedBy field when status is 'Approved'
    if (status === 'Approved') {
      updateData.ApprovedBy = "Admin"; // Use a default name for now
    }

    console.log("Updating reservation with data:", updateData);

    // Update the reservation
    const updatedReservation = await prisma.EVCReservation.update({
      where: { id },
      data: updateData,
    });

    console.log("Reservation updated successfully:", updatedReservation.id);
    
    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error("Error updating EVC reservation status:", error);
    return NextResponse.json(
      { error: "Failed to update reservation status", message: String(error) },
      { status: 500 }
    );
  }
}