// app/api/account/[userId]/route.ts
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    const accInfo = await prisma.accInfo.findFirst({
      where: {
        clerkId: userId
      },
      include: {
        ClientInfo: true,
        BusinessInfo: true
      }
    });

    if (!accInfo) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    return NextResponse.json(accInfo);
  } catch (error) {
    console.error('Error fetching account data:', error);
    return NextResponse.json(
      { error: "Error fetching account data" }, 
      { status: 500 }
    );
  }
}