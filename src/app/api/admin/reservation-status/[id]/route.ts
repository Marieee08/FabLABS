import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const { status } = await req.json();

    // Get current reservation to check valid transitions
    const currentReservation = await prisma.utilReq.findUnique({
      where: { id },
      select: { Status: true }
    });

    if (!currentReservation) {
      return NextResponse.json(
        { error: 'Reservation not found' },
        { status: 404 }
      );
    }

    // Validate status transitions
    const validTransitions = {
      'Pending': ['Approved', 'Cancelled'],
      'Approved': ['Ongoing', 'Cancelled'],
      'Ongoing': ['Pending payment', 'Cancelled'],
      'Pending payment': ['Cancelled', 'Paid'],
      'Paid': ["Completed"]
    };

    const allowedStatuses = validTransitions[currentReservation.Status as keyof typeof validTransitions];
    
    if (!allowedStatuses?.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status transition from ${currentReservation.Status} to ${status}` },
        { status: 400 }
      );
    }

    // Update reservation status
    const updatedReservation = await prisma.utilReq.update({
      where: {
        id: id,
      },
      data: {
        Status: status,
        DateofProcessing: new Date(),
      },
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
    console.error('Error updating reservation status:', error);
    return NextResponse.json(
      { error: 'Failed to update reservation status' },
      { status: 500 }
    );
  }
}