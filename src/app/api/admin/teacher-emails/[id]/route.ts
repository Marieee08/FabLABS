// app/api/admin/teacher-emails/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = auth();
  
  // Check if user is authenticated
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Await the params Promise
  const { id } = await params;
  
  // Verify admin
  const user = await prisma.accInfo.findUnique({
    where: { clerkId: userId },
    select: { Role: true }
  });
  
  if (!user || user.Role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  try {
    const deletedEmail = await prisma.teacherEmail.delete({
      where: { id }
    });
    
    return NextResponse.json(deletedEmail);
  } catch (error) {
    console.error('Error deleting teacher email:', error);
    return NextResponse.json(
      { error: 'Failed to delete teacher email' },
      { status: 500 }
    );
  }
}