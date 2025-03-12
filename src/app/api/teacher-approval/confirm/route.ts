
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const token = url.searchParams.get('token');
    const id = url.searchParams.get('id');

    if (!token || !id) {
      return NextResponse.json(
        { error: 'Missing token or reservation ID' },
        { status: 400 }
      );
    }

    // Verify the token
    const payload = verifyToken(token);
    if (!payload || payload.id !== id || payload.type !== 'teacher_approval') {
      return NextResponse.redirect(new URL('/approval-error', request.url));
    }

    // Update the reservation status
    await prisma.labReservation.update({
      where: { id: parseInt(id) },
      data: { Status: 'Pending' },
    });

    // Redirect to a confirmation page
    return NextResponse.redirect(new URL('/approval-success', request.url));
  } catch (error) {
    console.error('Approval confirmation error:', error);
    return NextResponse.redirect(new URL('/approval-error', request.url));
  }
}