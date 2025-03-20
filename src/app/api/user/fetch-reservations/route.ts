// src\app\api\user\fetch-reservations\route.ts
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

    // Get all reservations for this user
    const reservations = await prisma.utilReq.findMany({
      where: {
        accInfoId: userAccount.id,
      },
      include: {
        UserServices: true,
        UtilTimes: true,
        UserTools: true,
        MachineUtilizations: true, // Include machine utilizations
        accInfo: {
          select: {
            Name: true,
            email: true,
          },
        },
      },
      orderBy: {
        RequestDate: 'desc',
      },
    });

    return NextResponse.json(reservations);
  } catch (error) {
    console.error('Failed to fetch reservations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reservations' },
      { status: 500 }
    );
  }
}