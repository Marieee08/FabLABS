// 2. Create the API route: src/app/api/admin/teacher-emails/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function GET() {
  const teacherEmails = await prisma.teacherEmail.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json(teacherEmails);
}

export async function POST(request: Request) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  const { email } = await request.json();
  const teacherEmail = await prisma.teacherEmail.create({
    data: { email }
  });
  return NextResponse.json(teacherEmail);
}