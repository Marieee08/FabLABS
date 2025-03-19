// /api/user/update-info/route.ts

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { routeModule } from 'next/dist/build/templates/pages';

const processField = (value: any) => {
  if (value === '' || value === null || value === undefined) {
    return "Not applicable";
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

    if (type === 'business') {
      // Handle isNotBusinessOwner flag separately
      if (typeof data.isNotBusinessOwner === 'boolean') {
        const updatedBusiness = await prisma.businessInfo.upsert({
          where: {
            accInfoId: userAccount.id,
          },
          update: {
            isNotBusinessOwner: data.isNotBusinessOwner,
            ...(data.isNotBusinessOwner ? {
              // When checking the box, set everything to "Not applicable"
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
            } : {
              // When unchecking the box, reset everything to null
              CompanyName: null,
              BusinessOwner: null,
              BusinessPermitNum: null,
              TINNum: null,
              CompanyIDNum: null,
              CompanyEmail: null,
              ContactPerson: null,
              Designation: null,
              CompanyAddress: null,
              CompanyCity: null,
              CompanyProvince: null,
              CompanyZipcode: null,
              CompanyPhoneNum: null,
              CompanyMobileNum: null,
              Manufactured: null,
              ProductionFrequency: null,
              Bulk: null
            })
          },
          create: {
            accInfoId: userAccount.id,
            isNotBusinessOwner: data.isNotBusinessOwner,
            CompanyName: data.isNotBusinessOwner ? "Not applicable" : null,
            BusinessOwner: data.isNotBusinessOwner ? "Not applicable" : null,
            BusinessPermitNum: data.isNotBusinessOwner ? "Not applicable" : null,
            TINNum: data.isNotBusinessOwner ? "Not applicable" : null,
            CompanyIDNum: data.isNotBusinessOwner ? "Not applicable" : null,
            CompanyEmail: data.isNotBusinessOwner ? "Not applicable" : null,
            ContactPerson: data.isNotBusinessOwner ? "Not applicable" : null,
            Designation: data.isNotBusinessOwner ? "Not applicable" : null,
            CompanyAddress: data.isNotBusinessOwner ? "Not applicable" : null,
            CompanyCity: data.isNotBusinessOwner ? "Not applicable" : null,
            CompanyProvince: data.isNotBusinessOwner ? "Not applicable" : null,
            CompanyZipcode: null,
            CompanyPhoneNum: data.isNotBusinessOwner ? "Not applicable" : null,
            CompanyMobileNum: data.isNotBusinessOwner ? "Not applicable" : null,
            Manufactured: data.isNotBusinessOwner ? "Not applicable" : null,
            ProductionFrequency: data.isNotBusinessOwner ? "Not applicable" : null,
            Bulk: data.isNotBusinessOwner ? "Not applicable" : null,
          },
        });
      
        return NextResponse.json({
          success: true,
          data: updatedBusiness,
          message: 'Business owner status updated successfully'
        });
      }

      const updatedBusiness = await prisma.businessInfo.upsert({
        where: {
          accInfoId: userAccount.id,
        },
        update: {
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
          Bulk: processField(data.Bulk),
          isNotBusinessOwner: data.isNotBusinessOwner ?? false,
        },
        create: {
          accInfoId: userAccount.id,
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
          Bulk: processField(data.Bulk),
          isNotBusinessOwner: data.isNotBusinessOwner ?? false,
        },
      });

      return NextResponse.json({
        success: true,
        data: updatedBusiness,
        message: 'Business information updated successfully'
      });
    } else if (type === 'personal') {
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
    }

    return NextResponse.json(
      { error: 'Invalid update type' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error in update-info API:', error);
    return NextResponse.json(
      { error: 'Failed to update information' },
      { status: 500 }
    );
  }
}