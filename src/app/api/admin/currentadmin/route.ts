// src/app/api/admin/currentadmin/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  console.log("Current admin API called");
  
  try {
    // Get the current user's ID from auth
    const { userId } = await auth();
    console.log("Auth userId:", userId);
    
    if (!userId) {
      console.log("No authenticated user found");
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Find the user in the database using clerkId
    console.log("Looking up user with clerkId:", userId);
    const user = await prisma.accInfo.findUnique({
      where: {
        clerkId: userId
      },
      select: {
        id: true,
        Name: true,
        email: true,
        Role: true
      }
    });
    
    console.log("Database lookup result:", user);
    
    if (!user) {
      console.log("User not found in database");
      return NextResponse.json({ error: 'User not found in database' }, { status: 404 });
    }
    
    return NextResponse.json({
      id: user.id,
      name: user.Name,
      email: user.email,
      role: user.Role
    });
    
  } catch (error) {
    console.error('Error in currentadmin API:', error);
    return NextResponse.json({ 
      error: 'Database error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}