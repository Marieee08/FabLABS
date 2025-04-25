// app/api/auth/new-user/route.ts
import { NextResponse } from 'next/server';
import { currentUser, auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
// app/api/auth/new-user/route.ts
export async function GET() {
  const { userId } = auth();
  if (!userId) return new NextResponse('Unauthorized', { status: 401 });

  const user = await currentUser();
  if (!user) return new NextResponse('User not found', { status: 404 });

  try {
    const email = user.emailAddresses[0].emailAddress;
    
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
    
    // Create or update user
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

    return new NextResponse(null, {
      status: 302,A
      headers: { Location: redirectPath },
    });
  } catch (error) {
    console.error('Database error:', error);
    return new NextResponse('Database error', { status: 500 });
  }
}