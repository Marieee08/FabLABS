// /api/user/create-evc-reservation/route.ts

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    
    // Validate required data
    if (!data.UtilTimes?.length) {
      return NextResponse.json(
        { error: 'At least one date and time must be selected' },
        { status: 400 }
      );
    }

    // Check if the user account exists and get their role
    const userAccount = await prisma.accInfo.findUnique({
      where: { clerkId: userId },
      select: { id: true, Role: true }
    });

    if (!userAccount) {
      return NextResponse.json(
        { error: 'User account not found' },
        { status: 404 }
      );
    }

    // Determine initial status based on user role
    let initialStatus: string;
    if (userAccount.Role === 'STUDENT') {
      initialStatus = "Pending Teacher Approval";
    } else if (userAccount.Role === 'STAFF') {
      initialStatus = "Pending Admin Approval"; // Skip teacher approval for staff
    } else {
      return NextResponse.json(
        { error: 'Invalid user role for EVC reservations' },
        { status: 403 }
      );
    }

    // Prepare EVC reservation data with conditional fields
    const evcReservationData = {
      ControlNo: data.ControlNo || null,
      LvlSec: userAccount.Role === 'STUDENT' ? (data.LvlSec || null) : 'N/A',
      NoofStudents: userAccount.Role === 'STUDENT' ? (data.NoofStudents || 0) : 0,
      Subject: userAccount.Role === 'STUDENT' ? (data.Subject || null) : 'N/A',
      Teacher: userAccount.Role === 'STUDENT' ? (data.Teacher || null) : 'N/A',
      TeacherEmail: userAccount.Role === 'STUDENT' ? (data.TeacherEmail || null) : 'N/A',
      Topic: userAccount.Role === 'STUDENT' ? (data.Topic || null) : 'N/A',
      SchoolYear: userAccount.Role === 'STUDENT' ? (data.SchoolYear || null) : null,
      EVCStatus: initialStatus,
      DateRequested: new Date(),
      accInfoId: userAccount.id
    };

    // Process UtilTimes data
    const utilTimesData = data.UtilTimes.map((time: any, index: number) => ({
      DayNum: time.DayNum || index + 1,
      StartTime: time.StartTime ? new Date(time.StartTime) : null,
      EndTime: time.EndTime ? new Date(time.EndTime) : null
    }));

    // Process StudentData (only for students)
    const studentsData = (userAccount.Role === 'STUDENT' && data.EVCStudents?.length > 0) 
      ? data.EVCStudents.map((student: any) => ({
          Students: student.Students || ''
        }))
      : [];

    // Process MaterialsData (for both students and staff)
    const materialsData = (data.NeededMaterials?.length > 0) 
      ? data.NeededMaterials.map((material: any) => ({
          Item: material.Item || '',
          ItemQty: material.ItemQty || 0,
          Description: material.Description || ''
        }))
      : [];

    // Use transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx: any) => {
      const evcReservation = await tx.eVCReservation.create({
        data: {
          ...evcReservationData,
          
          UtilTimes: { 
            create: utilTimesData 
          },
          
          // Only create student records for students
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
        select: {
          id: true,
          EVCStatus: true,
          DateRequested: true
        }
      });

      return evcReservation;
    });

    return NextResponse.json({
      success: true,
      message: 'Reservation created successfully',
      id: result.id,
      status: result.EVCStatus,
      dateRequested: result.DateRequested,
      userRole: userAccount.Role
    });
    
  } catch (error: any) {
    console.error('Error creating EVC reservation:', error);
    
    const errorMessage = error?.message || 'Unknown error';
    const errorDetails = error?.meta?.cause || error?.code || errorMessage;
    
    return NextResponse.json(
      { 
        error: 'Failed to create reservation', 
        details: errorDetails,
        message: errorMessage
      },
      { status: 500 }
    );
  }
}