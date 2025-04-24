// 3. Create DELETE endpoint: src/app/api/admin/teacher-emails/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  await prisma.teacherEmail.delete({
    where: { id: params.id }
  });
  return NextResponse.json({ success: true });
}

