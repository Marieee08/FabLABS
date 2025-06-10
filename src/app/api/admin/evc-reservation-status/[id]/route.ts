// src/app/api/admin/evc-reservation-status/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params since it's now a Promise
    const { id: paramId } = await params;
    console.log("API request received for ID:", paramId);
    const id = parseInt(paramId);

    if (isNaN(id)) {
      console.error("Invalid ID:", paramId);
      return NextResponse.json(
        { error: "Invalid reservation ID" },
        { status: 400 }
      );
    }

    // Get the request body
    const body = await request.json();
    console.log("Request body:", body);
    
    const { status, adminName } = body;

    // Basic validation
    if (!status) {
      console.error("Missing status in request");
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Check if status is valid
    const validStatuses = [
      'Pending Teacher Approval', 
      'Pending Admin Approval', 
      'Approved', 
      'Ongoing', 
      'Completed', 
      'Rejected', 
      'Cancelled'
    ];
    
    if (!validStatuses.includes(status)) {
      console.error("Invalid status:", status);
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Get the current date for approval/rejection timestamp
    const currentDate = new Date();

    // Build the update object based on status
    const updateData: any = { EVCStatus: status };

    // Add admin name and timestamp for specific status changes
    if (status === 'Approved') {
      updateData.ApprovedBy = adminName || 'Admin';
    } else if (status === 'Ongoing') {
      updateData.ReceivedBy = adminName || 'Admin';
      updateData.ReceivedDate = currentDate;
    } else if (status === 'Completed') {
      updateData.InspectedBy = adminName || 'Admin';
      updateData.InspectedDate = currentDate;
    }

    console.log("Updating reservation with data:", updateData);

    // Update the reservation
    const updatedReservation = await prisma.eVCReservation.update({
      where: { id },
      data: updateData,
      include: {
        accInfo: {
          select: {
            Name: true,
            email: true,
            Role: true,
          },
        },
        EVCStudents: true,
        NeededMaterials: true,
        UtilTimes: true,
      },
    });

    console.log("Reservation updated successfully:", updatedReservation.id);
    
    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error("Error updating EVC reservation status:", error);
    return NextResponse.json(
      { error: "Failed to update reservation status", message: String(error) },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}