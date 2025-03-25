// /api/user/update-info/route.ts

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

    const { type, data } = await request.json();

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

    let result;

    // Handle different types of updates
    switch (type) {
      case 'personal':
        // Process personal information
        result = await prisma.clientInfo.upsert({
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
        break;
        
      case 'business':
        // Process business information
        const isNotBusinessOwner = !!data.isNotBusinessOwner;
        let businessData;
        
        if (isNotBusinessOwner) {
          // Set all fields to "Not applicable" if not a business owner
          businessData = {
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
          // Normal processing
          businessData = {
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
        
        result = await prisma.businessInfo.upsert({
          where: {
            accInfoId: userAccount.id,
          },
          update: businessData,
          create: {
            accInfoId: userAccount.id,
            ...businessData
          },
        });
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid update type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      data: result,
      message: `${type.charAt(0).toUpperCase() + type.slice(1)} information updated successfully`
    });

  } catch (error) {
    console.error('Error in update info API:', error);
    return NextResponse.json(
      { error: 'Failed to update information' },
      { status: 500 }
    );
  }
}