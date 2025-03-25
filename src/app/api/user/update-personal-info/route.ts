// /api/user/update-personal-info/route.ts

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const processField = (value: any) => {
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  return value;
};

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();

    const userAccount = await prisma.accInfo.findFirst({
      where: {
        clerkId: userId,
      },
    });

    if (!userAccount) {
      return NextResponse.json(
        { error: 'User account not found' },
        { status: 404 }
      );
    }

    const updatedClient = await prisma.clientInfo.upsert({
      where: {
        accInfoId: userAccount.id,
      },
      update: {
        ContactNum: processField(data.ContactNum),
        Address: processField(data.Address),
        City: processField(data.City),
        Province: processField(data.Province),
        Zipcode: data.Zipcode ? parseInt(data.Zipcode.toString()) : null,
      },
      create: {
        accInfoId: userAccount.id,
        ContactNum: processField(data.ContactNum),
        Address: processField(data.Address),
        City: processField(data.City),
        Province: processField(data.Province),
        Zipcode: data.Zipcode ? parseInt(data.Zipcode.toString()) : null,
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedClient,
      message: 'Personal information updated successfully'
    });

  } catch (error) {
    console.error('Error in update personal info API:', error);
    return NextResponse.json(
      { error: 'Failed to update personal information' },
      { status: 500 }
    );
  }
}