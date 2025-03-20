// src\app\api\user\create-reservation\route.ts
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

    // Parse the total cost from the request data
    const totalAmountDue = parseFloat(data.totalCost) || 0;

    // Get the services selected by the user
    const selectedServices = Array.isArray(data.ProductsManufactured) 
      ? data.ProductsManufactured 
      : [data.ProductsManufactured].filter(Boolean);
      
    console.log('Selected services:', selectedServices);
    
    // Fetch the machines associated with these services
    const serviceWithMachines = await prisma.service.findMany({
      where: {
        Service: {
          in: selectedServices
        }
      },
      include: {
        Machines: {
          include: {
            machine: true
          }
        }
      }
    });
    
    // Log for debugging
    console.log(`Found ${serviceWithMachines.length} services with their machines`);
    
    // Create an array to hold all machines for each service
    const machinesToCreate = [];
    
    // Create a map to store machines for each service
    const serviceMachinesMap = new Map();

    // For each service, find all the associated machines
    serviceWithMachines.forEach(service => {
      console.log(`Service: ${service.Service} has ${service.Machines.length} machines`);
      
      // Store machine names for this service
      const machineNames = service.Machines.map(machineService => machineService.machine.Machine);
      serviceMachinesMap.set(service.Service, machineNames);
      
      // Add each machine for this service to our array
      service.Machines.forEach(machineService => {
        machinesToCreate.push({
          Machine: machineService.machine.Machine,
          MachineApproval: false,
          DateReviewed: null,
          ServiceName: service.Service
        });
      });
    });

    console.log(`Total machines to create: ${machinesToCreate.length}`);

    // Create the reservation with all related records
    const utilReq = await prisma.utilReq.create({
      data: {
        Status: "Pending",
        RequestDate: new Date(),
        BulkofCommodity: data.BulkofCommodity,
        accInfoId: userAccount.id,
        TotalAmntDue: totalAmountDue,
        
        // Create UserTools entries
        UserTools: {
          create: parseToolString(data.Tools).map(tool => ({
            ToolUser: tool.Tool,
            ToolQuantity: tool.Quantity
          }))
        },

        // Create UserService entries with associated machines
        UserServices: {
          create: Array.isArray(data.ProductsManufactured) 
            ? data.ProductsManufactured.map((service: string) => {
                // Get machines for this service
                const machines = serviceMachinesMap.get(service) || [];
                return {
                  ServiceAvail: service,
                  // Store the machines associated with this service as a comma-separated string
                  EquipmentAvail: machines.length > 0 ? machines.join(', ') : 'No associated machines',
                  CostsAvail: totalAmountDue / data.ProductsManufactured.length, // Distribute cost evenly
                  MinsAvail: calculateTotalMinutes(data.days)
                };
              })
            : [{
                ServiceAvail: data.ProductsManufactured,
                // For a single service, get its machines
                EquipmentAvail: serviceMachinesMap.get(data.ProductsManufactured)?.join(', ') || 'No associated machines',
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
        },
        
        // Create ServiceAvailed entries for each selected service
        ServiceAvailed: {
          create: selectedServices.map((service: string) => ({
            service
          }))
        },
        
        // Create MachineUtilization entries for all machines associated with selected services
        MachineUtilizations: {
          create: machinesToCreate
        }
      },
      include: {
        UserTools: true,
        UserServices: true,
        UtilTimes: true,
        MachineUtilizations: true,
        ServiceAvailed: true
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