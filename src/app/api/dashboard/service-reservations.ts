// pages/api/dashboard/service-reservations.ts
import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { getAuth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { userId } = getAuth(req);

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Aggregate services from UserService and EVCReservation
    const serviceReservations = await prisma.userService.groupBy({
      by: ['ServiceAvail'],
      _count: {
        ServiceAvail: true
      },
      orderBy: {
        _count: {
          ServiceAvail: 'desc'
        }
      }
    });

    res.status(200).json(serviceReservations);
  } catch (error) {
    console.error('Error fetching service reservations:', error);
    res.status(500).json({ error: 'Failed to fetch service reservations' });
  }
}