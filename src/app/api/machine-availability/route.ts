// src/app/api/machine-availability/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { serviceId, date, startTime, endTime } = await request.json();
    
    if (!serviceId || !date || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Convert string dates to Date objects
    const startDateTime = new Date(date);
    const endDateTime = new Date(date);
    
    // Parse time strings (format: "HH:MM AM/PM")
    const parseTimeString = (timeStr: { split: (arg0: string) => [any, any]; }) => {
      const [timePart, period] = timeStr.split(' ');
      let [hours, minutes] = timePart.split(':').map(Number);
      
      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      
      return { hours, minutes };
    };
    
    const startTimeParts = parseTimeString(startTime);
    const endTimeParts = parseTimeString(endTime);
    
    startDateTime.setHours(startTimeParts.hours, startTimeParts.minutes, 0, 0);
    endDateTime.setHours(endTimeParts.hours, endTimeParts.minutes, 0, 0);

    // Get machines associated with this service
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        Machines: {
          include: {
            machine: true
          }
        }
      }
    });

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      );
    }

    // Get machines for this service
    const machines = service.Machines.map(ms => ms.machine);
    
    // Count total available machines
    const totalMachines = machines.filter(m => m.isAvailable).length;
    
    if (totalMachines === 0) {
      return NextResponse.json({ 
        available: false,
        message: 'No machines available for this service' 
      });
    }

    // Count booked machines for the requested time slot
    const bookedMachines = await prisma.utilReq.count({
      where: {
        Status: { in: ['Approved', 'Ongoing'] },
        UserServices: {
          some: {
            ServiceAvail: service.Service
          }
        },
        UtilTimes: {
          some: {
            AND: [
              {
                StartTime: {
                  lte: endDateTime
                }
              },
              {
                EndTime: {
                  gte: startDateTime
                }
              }
            ]
          }
        }
      }
    });

    const availableMachines = totalMachines - bookedMachines;
    
    return NextResponse.json({
      available: availableMachines > 0,
      availableMachines,
      totalMachines,
      bookedMachines
    });
  } catch (error) {
    console.error('Error checking machine availability:', error);
    return NextResponse.json(
      { error: 'Failed to check machine availability' },
      { status: 500 }
    );
  }
}