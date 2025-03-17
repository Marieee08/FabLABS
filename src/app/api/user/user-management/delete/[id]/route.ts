// pages/api/user/user-management/delete/[id]/route.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { clerkClient } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
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
      return res.status(404).json({ error: 'Account not found' });
    }

    // Delete related records
    await prisma.$transaction(async (tx) => {
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
    
    return res.status(200).json({ success: true, message: 'Account successfully deleted' });
  } catch (error) {
    console.error('Error in delete user handler:', error);
    return res.status(500).json({ 
      error: 'An error occurred while deleting the account',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}