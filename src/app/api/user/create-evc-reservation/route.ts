// /api/user/create-evc-reservation

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    console.log('Received data:', data);
    
    // Validate required data
    if (!data.UtilTimes?.length) {
      return NextResponse.json(
        { error: 'At least one date and time must be selected' },
        { status: 400 }
      );
    }

    // Check if the user account exists
    const userAccount = await prisma.accInfo.findFirst({
      where: { clerkId: userId },
    });

    if (!userAccount) {
      return NextResponse.json(
        { error: 'User account not found' },
        { status: 404 }
      );
    }

    // Create the EVC reservation first
    const evcReservation = await prisma.eVCReservation.create({
      data: {
        ControlNo: data.ControlNo || null,
        LvlSec: data.LvlSec || null,
        NoofStudents: data.NoofStudents || 0,
        Subject: data.Subject || null,
        Teacher: data.Teacher || null,
        TeacherEmail: data.TeacherEmail || null, 
        Topic: data.Topic || null,
        SchoolYear: data.SchoolYear || null,
        EVCStatus: "Pending",
        DateRequested: new Date(),
        
        // Link to the user account
        accInfo: {
          connect: { id: userAccount.id }
        }
      }
    });

    // Create EVCStudent entries if provided
    if (data.EVCStudents?.length > 0) {
      await prisma.eVCStudent.createMany({
        data: data.EVCStudents.map((student: any) => ({
          Students: student.Students || '',
          evcId: evcReservation.id
        }))
      });
    }
    
    // Create NeededMaterial entries if provided
    if (data.NeededMaterials?.length > 0) {
      await prisma.neededMaterial.createMany({
        data: data.NeededMaterials.map((material: any) => ({
          Item: material.Item || '',
          ItemQty: material.ItemQty || 0,
          Description: material.Description || '',
          evcId: evcReservation.id
        }))
      });
    }

    // Create the UtilTime entries
    if (data.UtilTimes?.length > 0) {
      await prisma.utilTime.createMany({
        data: data.UtilTimes.map((time: any, index: number) => ({
          DayNum: time.DayNum || index + 1,
          StartTime: time.StartTime ? new Date(time.StartTime) : null,
          EndTime: time.EndTime ? new Date(time.EndTime) : null,
          evcId: evcReservation.id
        }))
      });
    }

    // Fetch the complete reservation with related data
    const completeReservation = await prisma.eVCReservation.findUnique({
      where: { id: evcReservation.id },
      include: {
        UtilTimes: true,
        NeededMaterials: true,
        EVCStudents: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'EVC reservation created successfully',
      reservation: completeReservation
    });
  } catch (error: any) {
    console.error('Error creating EVC reservation:', error);
    
    // Provide detailed error information for debugging
    const errorMessage = error?.message || 'Unknown error';
    let errorDetails = errorMessage;
    
    if (error?.meta?.cause) {
      errorDetails = error.meta.cause;
    } else if (error?.code) {
      errorDetails = `Error code: ${error.code}`;
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to create EVC reservation', 
        details: errorDetails,
        message: errorMessage
      },
      { status: 500 }
    );
  }
}