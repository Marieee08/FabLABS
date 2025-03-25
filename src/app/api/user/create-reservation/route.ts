// src/app/api/user/create-reservation/route.ts - Updated handler with better error handling

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Create a single PrismaClient instance and reuse it
const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // Check authentication first to fail fast
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const data = await request.json();
    console.log("API received data:", JSON.stringify(data, null, 2));
    
    // Validate required data - fail fast before expensive DB operations
    if (!data.days?.length) {
      return NextResponse.json(
        { error: 'At least one day must be selected' },
        { status: 400 }
      );
    }

    // Fetch user data
    const userAccount = await prisma.accInfo.findUnique({
      where: { clerkId: userId },
      select: { id: true } // Only select what we need
    });

    if (!userAccount) {
      return NextResponse.json(
        { error: 'User account not found' },
        { status: 404 }
      );
    }

    // Parse the total cost
    const totalAmountDue = parseFloat(data.totalCost) || 0;

    // Normalize selected services
    const selectedServices = Array.isArray(data.ProductsManufactured) 
      ? data.ProductsManufactured 
      : [data.ProductsManufactured].filter(Boolean);
    
    // Optimize DB query to fetch only what we need
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
    
    // Prepare data for creation - move processing out of the DB operation
    const machinesToCreate: { Machine: string; MachineApproval: boolean; DateReviewed: null; ServiceName: string; }[] = [];
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

    // Process service links
    const serviceLinks = data.serviceLinks || {};
    
    // Extract service costs
    const serviceCosts = {};
    
    // Get service costs from the data
    if (data.groupedServiceData) {
      Object.entries(data.groupedServiceData).forEach(([service, serviceData]) => {
        // @ts-ignore
        serviceCosts[service] = serviceData.totalServiceCost || 0;
      });
    } else if (data.serviceCostDetails && Array.isArray(data.serviceCostDetails)) {
      data.serviceCostDetails.forEach(detail => {
        if (detail.serviceName && typeof detail.totalCost === 'number') {
          serviceCosts[detail.serviceName] = detail.totalCost;
        }
      });
    }
    
    // Process tools
    let userTools: { ToolUser: any; ToolQuantity: number; }[] = [];
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
      // Continue without tools if there's an error
    }

    // Process times
    const utilTimes = data.days.map((day, index) => {
      const startTime = day.startTime ? new Date(day.startTime) : 
                       combineDateAndTime(day.date, day.startTime);
      
      const endTime = day.endTime ? new Date(day.endTime) : 
                     combineDateAndTime(day.date, day.endTime);
                     
      return {
        DayNum: index + 1,
        StartTime: startTime,
        EndTime: endTime,
      };
    });

    // Process user services
    const userServices = selectedServices.map(service => {
      const machines = serviceMachinesMap.get(service) || [];
      const serviceLink = serviceLinks[service] || '';
      const serviceCost = serviceCosts[service] || 0;
      
      return {
        ServiceAvail: service,
        EquipmentAvail: machines.length === 1 ? machines[0] : null,
        CostsAvail: serviceCost,
        MinsAvail: calculateTotalMinutes(data.days),
        Files: serviceLink
      };
    });

    // Process service availed
    const serviceAvailed = selectedServices.map(service => ({
      service
    }));

    // Create the reservation in a single transaction
    const utilReq = await prisma.$transaction(async (tx) => {
      return tx.utilReq.create({
        data: {
          Status: "Pending Admin Approval",
          RequestDate: new Date(),
          BulkofCommodity: data.BulkofCommodity,
          accInfoId: userAccount.id,
          TotalAmntDue: totalAmountDue,
          Remarks: data.Remarks || '',
          
          // Create all related records
          UserTools: { create: userTools },
          UserServices: { create: userServices },
          UtilTimes: { create: utilTimes },
          ServiceAvailed: { create: serviceAvailed },
          MachineUtilizations: { create: machinesToCreate }
        },
        // Only select what we need for the response
        select: {
          id: true,
          Status: true,
          RequestDate: true
        }
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Reservation created successfully',
      id: utilReq.id
    });
    
  } catch (error) {
    console.error('Error creating reservation:', error);
    return NextResponse.json(
      { error: 'Failed to create reservation', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper functions

function combineDateAndTime(date: string | number | Date, time: string) {
  if (!time) return new Date(date);
  
  const baseDate = new Date(date);
  
  if (typeof time !== 'string') return baseDate;
  
  // Handle format like "09:00 AM"
  const timeRegex = /^(\d+):(\d+)\s+(AM|PM)$/;
  const matches = time.match(timeRegex);
  
  if (!matches) return baseDate;
  
  let [, hours, minutes, period] = matches;
  let hour = parseInt(hours, 10);
  
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  
  baseDate.setHours(hour, parseInt(minutes, 10), 0, 0);
  return baseDate;
}

function calculateTotalMinutes(days: any) {
  let totalMinutes = 0;
  
  for (const day of days) {
    if (!day.startTime || !day.endTime) continue;
    
    const start = new Date(day.startTime);
    const end = new Date(day.endTime);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      // Try to parse startTime and endTime as string formats
      if (typeof day.startTime === 'string' && typeof day.endTime === 'string') {
        // Handle format like "09:00 AM"
        const timeRegex = /^(\d+):(\d+)\s+(AM|PM)$/;
        const startMatches = day.startTime.match(timeRegex);
        const endMatches = day.endTime.match(timeRegex);
        
        if (startMatches && endMatches) {
          let [, startHours, startMinutes, startPeriod] = startMatches;
          let [, endHours, endMinutes, endPeriod] = endMatches;
          
          let startHour = parseInt(startHours, 10);
          let endHour = parseInt(endHours, 10);
          
          if (startPeriod === 'PM' && startHour !== 12) startHour += 12;
          if (startPeriod === 'AM' && startHour === 12) startHour = 0;
          
          if (endPeriod === 'PM' && endHour !== 12) endHour += 12;
          if (endPeriod === 'AM' && endHour === 12) endHour = 0;
          
          const startTimeMinutes = startHour * 60 + parseInt(startMinutes, 10);
          const endTimeMinutes = endHour * 60 + parseInt(endMinutes, 10);
          
          if (endTimeMinutes > startTimeMinutes) {
            totalMinutes += endTimeMinutes - startTimeMinutes;
          }
        }
      }
      continue;
    }
    
    // Calculate difference in minutes
    const diffMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    
    if (diffMinutes > 0) {
      totalMinutes += diffMinutes;
    }
  }
  
  return totalMinutes;
}