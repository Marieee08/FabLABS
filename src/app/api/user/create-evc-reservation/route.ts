// /api/user/create-evc-reservation

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Create a single instance for better connection management
const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // Get auth data synchronously - no need for await here
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    
    // Validate required data early to fail fast
    if (!data.UtilTimes?.length) {
      return NextResponse.json(
        { error: 'At least one date and time must be selected' },
        { status: 400 }
      );
    }

    // Check if the user account exists - use findUnique for better performance
    const userAccount = await prisma.accInfo.findUnique({
      where: { clerkId: userId },
      select: { id: true } // Only select what we need - improves query speed
    });

    if (!userAccount) {
      return NextResponse.json(
        { error: 'User account not found' },
        { status: 404 }
      );
    }

    // Prepare all structures before database access for better execution planning
    const evcReservationData = {
      ControlNo: data.ControlNo || null,
      LvlSec: data.LvlSec || null,
      NoofStudents: data.NoofStudents || 0,
      Subject: data.Subject || null,
      Teacher: data.Teacher || null,
      TeacherEmail: data.TeacherEmail || null, 
      Topic: data.Topic || null,
      SchoolYear: data.SchoolYear || null,
      EVCStatus: data.EVCStatus || "Pending Teacher Approval",
      DateRequested: new Date(),
      accInfoId: userAccount.id
    };

    // Process UtilTimes data once
    const utilTimesData = data.UtilTimes.map((time: any, index: number) => ({
      DayNum: time.DayNum || index + 1,
      StartTime: time.StartTime ? new Date(time.StartTime) : null,
      EndTime: time.EndTime ? new Date(time.EndTime) : null
    }));

    // Process StudentData once 
    const studentsData = (data.EVCStudents?.length > 0) 
      ? data.EVCStudents.map((student: any) => ({
          Students: student.Students || ''
        }))
      : [];

    // Process MaterialsData once
    const materialsData = (data.NeededMaterials?.length > 0) 
      ? data.NeededMaterials.map((material: any) => ({
          Item: material.Item || '',
          ItemQty: material.ItemQty || 0,
          Description: material.Description || ''
        }))
      : [];

    // Use transaction to ensure all operations succeed or fail together
    // This improves data consistency and performance
    const result = await prisma.$transaction(async (tx) => {
      // Create the main reservation with relations in a single operation
      const evcReservation = await tx.eVCReservation.create({
        data: {
          ...evcReservationData,
          
          // Create all related records nested in one call
          // This reduces round trips to the database
          UtilTimes: { 
            create: utilTimesData 
          },
          
          // Only create if we have data
          ...(studentsData.length > 0 && {
            EVCStudents: {
              create: studentsData
            }
          }),
          
          ...(materialsData.length > 0 && {
            NeededMaterials: {
              create: materialsData
            }
          })
        },
        // Only select what we need for the response
        select: {
          id: true,
          EVCStatus: true,
          DateRequested: true
        }
      });

      return evcReservation;
    });

    // Return minimal response with only what the client needs
    return NextResponse.json({
      success: true,
      message: 'EVC reservation created successfully',
      id: result.id,
      status: result.EVCStatus,
      dateRequested: result.DateRequested
    });
    
  } catch (error: any) {
    console.error('Error creating EVC reservation:', error);
    
    // Structured error handling with useful debug info
    const errorMessage = error?.message || 'Unknown error';
    const errorDetails = error?.meta?.cause || error?.code || errorMessage;
    
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