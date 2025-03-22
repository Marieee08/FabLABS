// src/app/api/admin/evc-reservation-status/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    const { status, adminName } = await request.json();

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Get the current date for approval/rejection timestamp
    const currentDate = new Date();

    // Build the update object based on status
    const updateData: any = { EVCStatus: status };

    // Add admin name and timestamp for specific status changes
    if (status === 'Approved') {
      updateData.ApprovedBy = adminName;
    } else if (status === 'Ongoing') {
      updateData.ReceivedBy = adminName;
      updateData.ReceivedDate = currentDate;
    } else if (status === 'Completed') {
      updateData.InspectedBy = adminName;
      updateData.InspectedDate = currentDate;
    }

    // Update the reservation in the database
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

    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error('Error updating EVC reservation status:', error);
    return NextResponse.json(
      { error: 'Failed to update reservation status' },
      { status: 500 }
    );
  }
}