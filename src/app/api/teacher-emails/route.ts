// app/api/admin/teacher-emails/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: Request) {
  const { userId } = auth();
  
  // Verify admin
  const user = await prisma.accInfo.findUnique({
    where: { clerkId: userId },
    select: { Role: true }
  });
  
  if (!user || user.Role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  const { email } = await request.json();
  
  const teacherEmail = await prisma.teacherEmail.create({
    data: { email }
  });
  
  return NextResponse.json(teacherEmail, { status: 201 });
}

export async function GET() {
  const teacherEmails = await prisma.teacherEmail.findMany();
  return NextResponse.json(teacherEmails);
}