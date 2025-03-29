// src/app/api/user/create-reservation/route.ts

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Create a single PrismaClient instance and reuse it
const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // 1. Authentication Check
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 2. Parse incoming request data
    const data = await request.json();
    console.log("API received data:", JSON.stringify(data, null, 2));
    
    // 3. Validate basic requirements
    if (!data.days?.length) {
      return NextResponse.json(
        { error: 'At least one day must be selected' },
        { status: 400 }
      );
    }

    // 4. Find the user's account in the database
    const userAccount = await prisma.accInfo.findUnique({
      where: { clerkId: userId },
      select: { id: true }
    });

    if (!userAccount) {
      return NextResponse.json(
        { error: 'User account not found' },
        { status: 404 }
      );
    }

    // 5. Process total cost
    const totalAmountDue = typeof data.totalCost === 'number' 
      ? data.totalCost 
      : parseFloat(data.totalCost || '0') || 0;

    // 6. Normalize selected services
    const selectedServices = Array.isArray(data.ProductsManufactured) 
      ? data.ProductsManufactured 
      : [data.ProductsManufactured].filter(Boolean);
    
    // 7. Prepare machine numbers and service links
    const serviceMachineNumbers = data.serviceMachineNumbers || {};
    const serviceLinks = data.serviceLinks || {};
    
    // 8. Fetch service details from database
    const servicesWithDetails = await prisma.service.findMany({
      where: {
        Service: {
          in: selectedServices
        }
      },
      select: {
        id: true,
        Service: true,
        Machines: {
          select: {
            machine: {
              select: {
                id: true,
                Machine: true
              }
            }
          }
        }
      }
    });

    // 9. Prepare machine utilizations
    const machinesToCreate = [];
    const serviceMachinesMap = new Map();

    servicesWithDetails.forEach(service => {
      const machineNames = service.Machines.map(machineService => machineService.machine.Machine);
      serviceMachinesMap.set(service.Service, machineNames);
      
      // Determine machine quantity
      const machineQuantity = serviceMachineNumbers[service.Service] || 
                             (service.Machines.length === 1 ? 1 : 0);
      
      // Create machine utilization entries
      for (let i = 0; i < Math.min(machineQuantity, service.Machines.length); i++) {
        machinesToCreate.push({
          Machine: service.Machines[i]?.machine.Machine || service.Machines[0]?.machine.Machine,
          MachineApproval: false,
          DateReviewed: null,
          ServiceName: service.Service
        });
      }
    });

    // 10. Process user tools
    let userTools = [];
    try {
      if (data.Tools) {
        const toolsData = typeof data.Tools === 'string' ? JSON.parse(data.Tools) : data.Tools;
        userTools = Array.isArray(toolsData) ? toolsData.map(tool => ({
          ToolUser: tool.Tool,
          ToolQuantity: parseInt(tool.Quantity) || 1
        })) : [];
      }
    } catch (e) {
      console.warn('Error parsing tools data:', e);
    }
    
    // 11. Process time slots
    const utilTimes = data.days.map((day, index) => {
      const dateValue = typeof day.date === 'string' ? new Date(day.date) : day.date;
      
      if (!(dateValue instanceof Date) || isNaN(dateValue.getTime())) {
        console.error('Invalid date value:', day.date);
        return {
          DayNum: index + 1,
          StartTime: null,
          EndTime: null
        };
      }
      
      const startTime = parseTimeString(day.startTime, dateValue);
      const endTime = parseTimeString(day.endTime, dateValue);
      
      return {
        DayNum: index + 1,
        StartTime: startTime,
        EndTime: endTime,
        DateStatus: "Ongoing"
      };
    });
    
    // 12. Calculate total minutes
    const totalMinutes = utilTimes.reduce((total, time) => {
      if (time.StartTime && time.EndTime) {
        const diffMs = time.EndTime.getTime() - time.StartTime.getTime();
        const diffMinutes = diffMs / (1000 * 60);
        return total + (diffMinutes > 0 ? diffMinutes : 0);
      }
      return total;
    }, 0);

    // 13. Process user services
    const userServices = selectedServices.flatMap(service => {
      const machines = serviceMachinesMap.get(service) || [];
      const serviceLink = serviceLinks[service] || '';
      
      // Get machine quantity
      const machineQuantity = serviceMachineNumbers[service] || 
                             (machines.length > 0 ? 1 : null);
      
      // Find service cost
      let serviceCost = 0;
      if (data.groupedServiceData && data.groupedServiceData[service]) {
        serviceCost = data.groupedServiceData[service].totalServiceCost || 0;
      } else if (data.serviceCostDetails) {
        const costDetail = data.serviceCostDetails.find(d => d.serviceName === service);
        if (costDetail) serviceCost = costDetail.totalCost || 0;
      }
      
      // Create service entries
      return Array.from({length: machineQuantity || 0}, (_, index) => ({
        ServiceAvail: service,
        EquipmentAvail: machines.length === 1 ? machines[0] : 'Not Specified',
        CostsAvail: serviceCost / (machineQuantity || 1),
        MinsAvail: totalMinutes,
        Files: serviceLink
      }));
    });

    // 14. Process service availed
    const serviceAvailed = selectedServices.map(service => ({
      service
    }));

    // 15. Create reservation in a transaction
    const utilReq = await prisma.$transaction(async (tx) => {
      return tx.utilReq.create({
        data: {
          Status: "Pending Admin Approval",
          RequestDate: new Date(),
          BulkofCommodity: data.BulkofCommodity || 'Not Specified',
          accInfoId: userAccount.id,
          TotalAmntDue: totalAmountDue,
          Remarks: data.Remarks || '',
          
          UserTools: { 
            create: userTools.length > 0 ? userTools : undefined 
          },
          UserServices: { 
            create: userServices 
          },
          UtilTimes: { 
            create: utilTimes.filter(time => time.StartTime && time.EndTime)
          },
          ServiceAvailed: { 
            create: serviceAvailed 
          },
          MachineUtilizations: { 
            create: machinesToCreate.length > 0 ? machinesToCreate : undefined
          }
        },
        select: {
          id: true,
          Status: true,
          RequestDate: true
        }
      });
    });

    // 16. Return successful response
    return NextResponse.json({
      success: true,
      message: 'Reservation created successfully',
      id: utilReq.id
    });
    
  } catch (error) {
    // 17. Error handling
    console.error('Error creating reservation:', error);
    
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      name: error instanceof Error ? error.name : 'UnknownError',
      stack: error instanceof Error ? error.stack : undefined
    };

    // Special handling for Prisma errors
    if (error instanceof Error && error.name === 'PrismaClientKnownRequestError') {
      errorDetails.code = (error as any).code;
      errorDetails.meta = (error as any).meta;
    }

    return NextResponse.json(
      { 
        error: 'Failed to create reservation', 
        details: errorDetails
      },
      { status: 500 }
    );
  }
}

// Helper function to properly parse time strings like "09:00 AM"
function parseTimeString(timeString: string, baseDate: Date): Date | null {
  if (!timeString || typeof timeString !== 'string') {
    return null;
  }
  
  try {
    // Clone the base date to avoid modifying it
    const resultDate = new Date(baseDate);
    
    // Handle time format like "09:00 AM"
    const timeRegex = /^(\d+):(\d+)\s+(AM|PM)$/;
    const matches = timeString.match(timeRegex);
    
    if (!matches) {
      console.warn(`Time string '${timeString}' doesn't match expected format`);
      return null;
    }
    
    let [_, hours, minutes, period] = matches;
    let hour = parseInt(hours, 10);
    
    // Convert to 24-hour format
    if (period === 'PM' && hour !== 12) hour += 12;
    if (period === 'AM' && hour === 12) hour = 0;
    
    resultDate.setHours(hour, parseInt(minutes, 10), 0, 0);
    
    // Validate the resulting date
    if (isNaN(resultDate.getTime())) {
      console.warn('Resulting date is invalid after parsing time');
      return null;
    }
    
    return resultDate;
  } catch (error) {
    console.error('Error parsing time string:', error);
    return null;
  }
}