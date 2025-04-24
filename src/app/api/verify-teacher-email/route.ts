// app/api/verify-teacher-email/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { verified: false, message: 'Email is required' },
        { status: 400 }
      );
    }
    
    // Check if email is registered in TeacherEmail table
    const teacherEmail = await prisma.teacherEmail.findUnique({
      where: { email }
    });
    
    return NextResponse.json({
      verified: !!teacherEmail,
      message: teacherEmail 
        ? 'Email verified' 
        : 'Email not registered as a teacher email'
    });
  } catch (error) {
    console.error('Error verifying teacher email:', error);
    return NextResponse.json(
      { 
        verified: false, 
        message: 'Server error verifying email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}