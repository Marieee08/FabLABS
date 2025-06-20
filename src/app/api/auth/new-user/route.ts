// app/api/auth/new-user/route.ts
import { NextResponse } from 'next/server';
import { currentUser, auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
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
    
    // Get the correct base URL from various sources
    const getBaseUrl = () => {
      // Try to get from headers first (forwarded from proxy/browser)
      const host = request.headers.get('host');
      const protocol = request.headers.get('x-forwarded-proto') || 'http';
      const referer = request.headers.get('referer');
      
      // If we have a referer, use its origin
      if (referer) {
        try {
          return new URL(referer).origin;
        } catch (e) {
          // Fall through to other methods
        }
      }
      
      // If host is available and not localhost, use it
      if (host && !host.startsWith('localhost')) {
        return ${protocol}://${host};
      }
      
      // Fall back to environment variable or localhost
      return process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';
    };
    
    const baseUrl = getBaseUrl();
    console.log('Redirecting to:', baseUrl); // Debug log
    
    if (existingUser) {
      // User already exists, just redirect
      let redirectPath = '/user-dashboard';
      if (existingUser.Role === 'STAFF') redirectPath = '/staff-dashboard';
      else if (existingUser.Role === 'STUDENT') redirectPath = '/student-dashboard';
      
      return NextResponse.redirect(new URL(redirectPath, baseUrl));
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
        Name: ${user.firstName} ${user.lastName}, 
        email,
        Role: userRole,
      },
    });

    // Redirect based on role using the correct base URL
    let redirectPath = '/user-dashboard';
    if (userRole === 'STAFF') redirectPath = '/staff-dashboard';
    else if (userRole === 'STUDENT') redirectPath = '/student-dashboard';

    return NextResponse.redirect(new URL(redirectPath, baseUrl));
    
  } catch (error) {
    console.error('Database error details:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new NextResponse(Database error: ${errorMessage}, { status: 500 });
  }
}