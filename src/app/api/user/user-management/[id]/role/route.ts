// File: /app/api/user/user-management/[id]/role/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const clerkId = params.id;
  
  try {
    const data = await request.json();
    const { role } = data;
    
    if (!role) {
      return NextResponse.json(
        { error: 'Role is required' },
        { status: 400 }
      );
    }
    
    // Update the user's role
    const updatedUser = await prisma.accInfo.update({
      where: { clerkId },
      data: { Role: role },
      select: {
        id: true,
        clerkId: true,
        Name: true,
        email: true,
        Role: true
      }
    });
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'Failed to update user role' },
      { status: 500 }
    );
  }
}