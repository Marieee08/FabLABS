// src\app\api\blocked-dates\route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const blockedDates = await prisma.blockedDate.findMany();
    return NextResponse.json(blockedDates);
  } catch (error) {
    console.error('Error fetching dates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blocked dates' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { date } = await request.json();
    const blockedDate = await prisma.blockedDate.create({
      data: {
        date: new Date(date),
      },
    });
    return NextResponse.json(blockedDate, { status: 201 });
  } catch (error) {
    console.error('Error creating date:', error);
    return NextResponse.json(
      { error: 'Failed to block date' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { date } = await request.json();
    await prisma.blockedDate.delete({
      where: {
        date: new Date(date),
      },
    });
    return NextResponse.json({ message: 'Date unblocked successfully' });
  } catch (error) {
    console.error('Error deleting date:', error);
    return NextResponse.json(
      { error: 'Failed to unblock date' },
      { status: 500 }
    );
  }
}