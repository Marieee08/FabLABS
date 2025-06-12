// File: /app/api/user/user-management/delete/[id]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { clerkClient } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Read userId from request body to maintain compatibility
  const body = await request.json();
  const { userId } = body;

  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  try {
    console.log(`API: Deleting user with ID: ${userId}`);
    
    // Find the account in your database
    const account = await prisma.accInfo.findUnique({
      where: { clerkId: userId },
      include: {
        BusinessInfo: true,
        ClientInfo: true,
        EVCReservations: true,
        UtilReqs: true,
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Delete related records
    await prisma.$transaction(async (tx: any) => {
      // Delete BusinessInfo if exists
      if (account.BusinessInfo) {
        await tx.businessInfo.delete({
          where: { id: account.BusinessInfo.id },
        });
      }
      
      // Delete ClientInfo if exists
      if (account.ClientInfo) {
        await tx.clientInfo.delete({
          where: { id: account.ClientInfo.id },
        });
      }
      
      // Handle EVCReservations
      for (const reservation of account.EVCReservations) {
        await tx.eVCReservation.delete({
          where: { id: reservation.id },
        });
      }
      
      // Handle UtilReqs
      for (const utilReq of account.UtilReqs) {
        await tx.utilReq.delete({
          where: { id: utilReq.id },
        });
      }
      
      // Delete the main account record
      await tx.accInfo.delete({
        where: { id: account.id },
      });
    });
    
    // Delete from Clerk
    try {
      await clerkClient.users.deleteUser(userId);
    } catch (clerkError) {
      console.error('Error deleting user from Clerk:', clerkError);
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Account successfully deleted' 
    });
  } catch (error) {
    console.error('Error in delete user handler:', error);
    return NextResponse.json({ 
      error: 'An error occurred while deleting the account',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}