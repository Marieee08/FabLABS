// /api/user/update-business-info/route.ts

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
    const isNotBusinessOwner = !!data.isNotBusinessOwner;

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

    // Prepare data based on isNotBusinessOwner flag
    let updateData;
    
    if (isNotBusinessOwner) {
      // If user is not a business owner, set all fields to "Not applicable"
      updateData = {
        isNotBusinessOwner: true,
        CompanyName: "Not applicable",
        BusinessOwner: "Not applicable",
        BusinessPermitNum: "Not applicable",
        TINNum: "Not applicable",
        CompanyIDNum: "Not applicable",
        CompanyEmail: "Not applicable",
        ContactPerson: "Not applicable",
        Designation: "Not applicable",
        CompanyAddress: "Not applicable",
        CompanyCity: "Not applicable",
        CompanyProvince: "Not applicable",
        CompanyZipcode: null,
        CompanyPhoneNum: "Not applicable",
        CompanyMobileNum: "Not applicable",
        Manufactured: "Not applicable",
        ProductionFrequency: "Not applicable",
        Bulk: "Not applicable"
      };
    } else {
      // Normal business info processing
      updateData = {
        isNotBusinessOwner: false,
        CompanyName: processField(data.CompanyName),
        BusinessOwner: processField(data.BusinessOwner),
        BusinessPermitNum: processField(data.BusinessPermitNum),
        TINNum: processField(data.TINNum),
        CompanyIDNum: processField(data.CompanyIDNum),
        CompanyEmail: processField(data.CompanyEmail),
        ContactPerson: processField(data.ContactPerson),
        Designation: processField(data.Designation),
        CompanyAddress: processField(data.CompanyAddress),
        CompanyCity: processField(data.CompanyCity),
        CompanyProvince: processField(data.CompanyProvince),
        CompanyZipcode: data.CompanyZipcode ? parseInt(data.CompanyZipcode.toString()) : null,
        CompanyPhoneNum: processField(data.CompanyPhoneNum),
        CompanyMobileNum: processField(data.CompanyMobileNum),
        Manufactured: processField(data.Manufactured),
        ProductionFrequency: processField(data.ProductionFrequency),
        Bulk: processField(data.Bulk)
      };
    }

    const updatedBusiness = await prisma.businessInfo.upsert({
      where: {
        accInfoId: userAccount.id,
      },
      update: updateData,
      create: {
        accInfoId: userAccount.id,
        ...updateData
      },
    });

    return NextResponse.json({
      success: true,
      data: updatedBusiness,
      message: 'Business information updated successfully'
    });

  } catch (error) {
    console.error('Error in update business info API:', error);
    return NextResponse.json(
      { error: 'Failed to update business information' },
      { status: 500 }
    );
  }
}