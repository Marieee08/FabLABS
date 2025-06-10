// src/app/api/admin/teacher-emails/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  _: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    
    await prisma.teacherEmail.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting teacher email:', error);
    return NextResponse.json(
      { error: 'Failed to delete teacher email' },
      { status: 500 }
    );
  }
}