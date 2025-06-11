// app/api/auth/new-user/route.ts
import { NextResponse } from 'next/server';
import { currentUser, auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma'; // Use your existing prisma instance

export async function GET() {
  try {
    // Fix 1: Await auth() for Next.js 15 compatibility
    const { userId } = await auth();
    if (!userId) return new NextResponse('Unauthorized', { status: 401 });

    // Fix 2: Await currentUser() for Next.js 15 compatibility  
    const user = await currentUser();
    if (!user) return new NextResponse('User not found', { status: 404 });

    const email = user.emailAddresses[0].emailAddress;
    
    // Fix 3: Check if user already exists to avoid duplicate creation
    const existingUser = await prisma.accInfo.findFirst({
      where: {
        OR: [
          { clerkId: userId },
          { email: email }
        ]
      }
    });
    
    if (existingUser) {
      // User already exists, just redirect
      let redirectPath = '/user-dashboard';
      if (existingUser.Role === 'STAFF') redirectPath = '/staff-dashboard';
      else if (existingUser.Role === 'STUDENT') redirectPath = '/student-dashboard';
      
      return NextResponse.redirect(new URL(redirectPath, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
    }
    
    // Check if this is a registered teacher email
    const teacherEmail = await prisma.teacherEmail.findUnique({
      where: { email }
    });
    
    // Determine role based on email
    let userRole = 'MSME';
    if (teacherEmail) {
      userRole = 'STAFF';
      // Mark as verified
      await prisma.teacherEmail.update({
        where: { email },
        data: { verified: true }
      });
    } else if (email.endsWith('@evc.pshs.edu.ph')) {
      userRole = 'STUDENT';
    }
    
    // Create user (only if they don't exist)
    const dbUser = await prisma.accInfo.create({ 
      data: {
        clerkId: userId,
        Name: `${user.firstName} ${user.lastName}`, 
        email,
        Role: userRole,
      },
    });

    // Redirect based on role
    let redirectPath = '/user-dashboard';
    if (userRole === 'STAFF') redirectPath = '/staff-dashboard';
    else if (userRole === 'STUDENT') redirectPath = '/student-dashboard';

    return NextResponse.redirect(new URL(redirectPath, process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'));
    
  } catch (error) {
    console.error('Database error details:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new NextResponse(`Database error: ${errorMessage}`, { status: 500 });
  }
}