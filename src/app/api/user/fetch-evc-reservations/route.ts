// /api/user/fetch-evc-reservations

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const { userId } = auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's accInfo id
    const userAccount = await prisma.accInfo.findFirst({
      where: {
        clerkId: userId,
      },
    });

    if (!userAccount) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    // Get all EVC reservations for this user
    const evcReservations = await prisma.eVCReservation.findMany({
      where: {
        accInfoId: userAccount.id,
      },
      include: {
        UtilTimes: true,
        EVCStudents: true,
        NeededMaterials: true,
        accInfo: {
          select: {
            Name: true,
            email: true,
            Role: true,
          },
        },
      },
      orderBy: {
        DateRequested: 'desc',
      },
    });

    return NextResponse.json(evcReservations);
  } catch (error) {
    console.error('Failed to fetch EVC reservations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch EVC reservations' },
      { status: 500 }
    );
  }
}