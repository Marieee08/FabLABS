// src/app/api/user/create-reservation/route.ts

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Create a single PrismaClient instance and reuse it
const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // IMPORTANT: Use await with auth() to fix the headers error
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    console.log("API received data:", JSON.stringify(data, null, 2));
    
    // Validate required data
    if (!data.days?.length) {
      return NextResponse.json(
        { error: 'At least one day must be selected' },
        { status: 400 }
      );
    }

    // Fetch user data
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

    // Parse the total cost (safely)
    const totalAmountDue = typeof data.totalCost === 'number' 
      ? data.totalCost 
      : parseFloat(data.totalCost || '0') || 0;

    // Normalize selected services
    const selectedServices = Array.isArray(data.ProductsManufactured) 
      ? data.ProductsManufactured 
      : [data.ProductsManufactured].filter(Boolean);
    
    // Fetch service details
    const servicesWithDetails = await prisma.service.findMany({
      where: {
        Service: {
          in: selectedServices
        }
      },
      select: {
        Service: true,
        Machines: {
          select: {
            machine: {
              select: {
                Machine: true
              }
            }
          }
        }
      }
    });
    
    // Prepare machine utilizations data
    const machinesToCreate: any[] | undefined = [];
    const serviceMachinesMap = new Map();

    servicesWithDetails.forEach(service => {
      const machineNames = service.Machines.map(machineService => machineService.machine.Machine);
      serviceMachinesMap.set(service.Service, machineNames);
      
      if (service.Machines.length === 1) {
        machinesToCreate.push({
          Machine: service.Machines[0].machine.Machine,
          MachineApproval: false,
          DateReviewed: null,
          ServiceName: service.Service
        });
      }
    });

    // Process tools - parse JSON if needed
    let userTools: string | any[] | undefined = [];
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

    // Process service links
    const serviceLinks = data.serviceLinks || {};
    
    // Process time slots - FIX DATE PARSING ISSUE
    const utilTimes = data.days.map((day, index) => {
      // Get the base date (handle both string and Date objects)
      const dateValue = typeof day.date === 'string' ? new Date(day.date) : day.date;
      
      if (!(dateValue instanceof Date) || isNaN(dateValue.getTime())) {
        console.error('Invalid date value:', day.date);
        return {
          DayNum: index + 1,
          StartTime: null,
          EndTime: null
        };
      }
      
      // Create proper Date objects for start and end times
      const startTime = parseTimeString(day.startTime, dateValue);
      const endTime = parseTimeString(day.endTime, dateValue);
      
      return {
        DayNum: index + 1,
        StartTime: startTime,
        EndTime: endTime
      };
    });
    
    // Calculate total minutes for all valid time slots
    const totalMinutes = utilTimes.reduce((total, time) => {
      if (time.StartTime && time.EndTime) {
        const diffMs = time.EndTime.getTime() - time.StartTime.getTime();
        const diffMinutes = diffMs / (1000 * 60);
        return total + (diffMinutes > 0 ? diffMinutes : 0);
      }
      return total;
    }, 0);

    // Process user services
    const userServices = selectedServices.map((service: string | number) => {
      const machines = serviceMachinesMap.get(service) || [];
      const serviceLink = serviceLinks[service] || '';
      
      // Find cost for this service from provided data
      let serviceCost = 0;
      if (data.groupedServiceData && data.groupedServiceData[service]) {
        serviceCost = data.groupedServiceData[service].totalServiceCost || 0;
      } else if (data.serviceCostDetails) {
        const costDetail = data.serviceCostDetails.find(d => d.serviceName === service);
        if (costDetail) serviceCost = costDetail.totalCost || 0;
      }
      
      return {
        ServiceAvail: service,
        EquipmentAvail: machines.length === 1 ? machines[0] : 'Not Specified',
        CostsAvail: serviceCost,
        MinsAvail: totalMinutes,
        Files: serviceLink
      };
    });

    // Process service availed
    const serviceAvailed = selectedServices.map((service: any) => ({
      service
    }));

    // Add this validation before creating the reservation
const validateMachineAvailability = async (services: any, days: any) => {
  // For each service and time slot, check if machines are available
  for (const service of services) {
    for (const day of days) {
      if (!day.startTime || !day.endTime) continue;
      
      const startDateTime = new Date(day.date);
      const endDateTime = new Date(day.date);
      
      // Parse time strings
      const parseTimeString = (timeStr) => {
        const [timePart, period] = timeStr.split(' ');
        let [hours, minutes] = timePart.split(':').map(Number);
        
        if (period === 'PM' && hours !== 12) {
          hours += 12;
        } else if (period === 'AM' && hours === 12) {
          hours = 0;
        }
        
        return { hours, minutes };
      };
      
      const startTimeParts = parseTimeString(day.startTime);
      const endTimeParts = parseTimeString(day.endTime);
      
      startDateTime.setHours(startTimeParts.hours, startTimeParts.minutes, 0, 0);
      endDateTime.setHours(endTimeParts.hours, endTimeParts.minutes, 0, 0);

      // Get service details
      const serviceObj = await prisma.service.findFirst({
        where: { Service: service },
        include: {
          Machines: {
            include: {
              machine: true
            }
          }
        }
      });
      
      if (!serviceObj) continue;
      
      // Count available machines
      const machines = serviceObj.Machines.map(ms => ms.machine);
      const totalMachines = machines.filter(m => m.isAvailable).length;
      
      // Count booked machines for this time slot
      const bookedMachines = await prisma.utilReq.count({
        where: {
          Status: { in: ['Approved', 'Ongoing'] },
          UserServices: {
            some: {
              ServiceAvail: service
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
      
      if (bookedMachines >= totalMachines) {
        return false; // No machines available
      }
    }
  }
  
  return true; // All slots have availability
};



    // Create the reservation in a transaction
    const utilReq = await prisma.$transaction(async (tx) => {
      return tx.utilReq.create({
        data: {
          Status: "Pending Admin Approval",
          RequestDate: new Date(),
          BulkofCommodity: data.BulkofCommodity || 'Not Specified',
          accInfoId: userAccount.id,
          TotalAmntDue: totalAmountDue,
          Remarks: data.Remarks || '',
          
          // Create all related records
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

    console.log("Reservation created successfully:", utilReq);
    
    return NextResponse.json({
      success: true,
      message: 'Reservation created successfully',
      id: utilReq.id
    });
    
  } catch (error) {
    console.error('Error creating reservation:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create reservation', 
        details: error instanceof Error ? error.message : 'Unknown error'
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