// File: /app/api/user/user-management/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET handler for fetching all users
export async function GET() {
  try {
    const users = await prisma.accInfo.findMany({
      select: {
        id: true,
        clerkId: true,
        Name: true,
        email: true,
        Role: true
      }
    });
    
    return NextResponse.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}