// app/api/admin/teacher-emails/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = auth();
  
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
      where: { id: params.id }
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