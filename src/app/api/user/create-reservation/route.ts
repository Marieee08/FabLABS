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
    if (!data.days?.length) {
      return NextResponse.json(
        { error: 'At least one day must be selected' },
        { status: 400 }
      );
    }

    const userAccount = await prisma.accInfo.findFirst({
      where: { clerkId: userId },
    });

    if (!userAccount) {
      return NextResponse.json(
        { error: 'User account not found' },
        { status: 404 }
      );
    }

    // Calculate total amount due from the services data
    let totalAmountDue = 0;
    if (data.totalCost) {
      totalAmountDue = parseFloat(data.totalCost);
    }

    // Create the reservation with all related records
    const utilReq = await prisma.utilReq.create({
      data: {
        Status: "Pending",
        RequestDate: new Date(),
        BulkofCommodity: data.BulkofCommodity,
        accInfoId: userAccount.id,
        TotalAmntDue: totalAmountDue, // Add the total amount due
        
        // Create UserTools entries
        UserTools: {
          create: parseToolString(data.Tools).map(tool => ({
            ToolUser: tool.Tool,
            ToolQuantity: tool.Quantity
          }))
        },

        // Create UserService entries
        UserServices: {
          create: Array.isArray(data.ProductsManufactured) 
            ? data.ProductsManufactured.map((service: any) => ({
                ServiceAvail: service,
                EquipmentAvail: data.Equipment || 'Not Specified',
                CostsAvail: totalAmountDue / (Array.isArray(data.ProductsManufactured) ? data.ProductsManufactured.length : 1), // Distribute cost across services
                MinsAvail: calculateTotalMinutes(data.days) // Calculate total minutes for the service
              }))
            : [{
                ServiceAvail: data.ProductsManufactured,
                EquipmentAvail: data.Equipment || 'Not Specified',
                CostsAvail: totalAmountDue,
                MinsAvail: calculateTotalMinutes(data.days)
              }]
        },

        // Create UtilTime entries
        UtilTimes: {
          create: data.days.map((day: any, index: number) => ({
            DayNum: index + 1,
            StartTime: combineDateAndTime(day.date, day.startTime),
            EndTime: combineDateAndTime(day.date, day.endTime),
          }))
        }
      },
      include: {
        UserTools: true,
        UserServices: true,
        UtilTimes: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Reservation created successfully',
      utilReq
    });
    
  } catch (error) {
    console.error('Error creating reservation:', error);
    return NextResponse.json(
      { error: 'Failed to create reservation' },
      { status: 500 }
    );
  }
}

function combineDateAndTime(date: string | Date, time: string | null): Date {
  const baseDate = new Date(date);
  if (!time) return baseDate;
  
  const [timeStr, period] = time.split(' ');
  const [hours, minutes] = timeStr.split(':');
  let hour = parseInt(hours);
  
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  
  baseDate.setHours(hour, parseInt(minutes), 0, 0);
  return baseDate;
}

function parseToolString(toolString: string): Array<{ Tool: string; Quantity: number }> {
  if (!toolString || toolString === 'NOT APPLICABLE') return [];
  try {
    return JSON.parse(toolString);
  } catch {
    return [];
  }
}

function calculateTotalMinutes(days: Array<{ startTime: string | null; endTime: string | null }>): number {
  let totalMinutes = 0;
  
  days.forEach(day => {
    if (!day.startTime || !day.endTime) return;
    
    const start = parseTimeString(day.startTime);
    const end = parseTimeString(day.endTime);
    
    if (start && end) {
      const diffInMinutes = (end.getTime() - start.getTime()) / 1000 / 60;
      if (diffInMinutes > 0) {
        totalMinutes += diffInMinutes;
      }
    }
  });
  
  return totalMinutes;
}

function parseTimeString(timeStr: string): Date | null {
  try {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    const date = new Date();
    
    let hour = hours;
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    
    date.setHours(hour, minutes, 0, 0);
    return date;
  } catch {
    return null;
  }
}