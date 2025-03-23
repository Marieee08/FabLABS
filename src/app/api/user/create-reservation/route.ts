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
    console.log("Creating reservation with data:", { 
      services: data.ProductsManufactured,
      hasServiceLinks: !!data.serviceLinks,
      serviceLinksKeys: data.serviceLinks ? Object.keys(data.serviceLinks) : [],
      hasRemarks: !!data.Remarks
    });
    
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
    
    // Fetch the machines associated with these services and their costs
    const servicesWithDetails = await prisma.service.findMany({
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
    console.log(`Found ${servicesWithDetails.length} services with their machines`);
    
    // Create an array to hold machines for services that have EXACTLY ONE machine
    const machinesToCreate = [];
    
    // Create a map to store machines for each service
    const serviceMachinesMap = new Map();

    // For each service, find all the associated machines
    servicesWithDetails.forEach(service => {
      console.log(`Service: ${service.Service} has ${service.Machines.length} machines`);
      
      // Store machine names for this service
      const machineNames = service.Machines.map(machineService => machineService.machine.Machine);
      serviceMachinesMap.set(service.Service, machineNames);
      
      // ONLY add machine if service has EXACTLY ONE machine
      if (service.Machines.length === 1) {
        machinesToCreate.push({
          Machine: service.Machines[0].machine.Machine,
          MachineApproval: false,
          DateReviewed: null,
          ServiceName: service.Service
        });
      }
      // If service has multiple machines, we don't add any machine entries
    });

    console.log(`Total machines to create: ${machinesToCreate.length}`);

    // Get service links from the form data (if any)
    const serviceLinks = data.serviceLinks || {};
    console.log("Service links:", Object.keys(serviceLinks).map(service => 
      `${service}: ${serviceLinks[service] ? 'Provided' : 'Not provided'}`
    ));

    // Get service-specific costs from data
    const serviceCostsFromClient = extractServiceCostsFromFormData(data);
    console.log("Service costs:", serviceCostsFromClient);

    // Process remarks
    const remarks = data.Remarks || '';

    // Create the reservation with all related records
    const utilReq = await prisma.utilReq.create({
      data: {
        Status: "Pending",
        RequestDate: new Date(),
        BulkofCommodity: data.BulkofCommodity,
        accInfoId: userAccount.id,
        TotalAmntDue: totalAmountDue,
        Remarks: remarks, // Add remarks to the main reservation data
        
        // Create UserTools entries
        UserTools: {
          create: parseToolString(data.Tools).map(tool => ({
            ToolUser: tool.Tool,
            ToolQuantity: tool.Quantity
          }))
        },

        // Create UserService entries with costs and associated links
        UserServices: {
          create: selectedServices.map((service: string) => {
            // Get machines for this service
            const machines = serviceMachinesMap.get(service) || [];
            
            // Get link for this service (if any)
            const serviceLink = serviceLinks[service] || '';
            
            // Get the actual cost for this service (or a reasonable default)
            const serviceCost = serviceCostsFromClient[service] || 0;
            
            return {
              ServiceAvail: service,
              // For services with multiple machines, we'll store the info but no machine will be selected
              EquipmentAvail: machines.length === 1 ? machines[0] : null,
              CostsAvail: serviceCost, // Use the actual cost for this service
              MinsAvail: calculateTotalMinutes(data.days),
              Files: serviceLink // Store link in the Files field (repurposing it for links)
            };
          })
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
        
        // Create MachineUtilization entries ONLY for services with exactly one machine
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

    console.log(`Created reservation with ID ${utilReq.id}`);

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

// Extract service costs from the form data
function extractServiceCostsFromFormData(data: any) {
  // Create an object to hold the cost for each service
  const serviceCosts: { [key: string]: number } = {};
  
  // Check if groupedServiceData exists in data
  if (data.groupedServiceData) {
    // If groupedServiceData is available, extract costs directly
    Object.keys(data.groupedServiceData).forEach((service) => {
      serviceCosts[service] = data.groupedServiceData[service].totalServiceCost || 0;
    });
  } else {
    // Fallback: Calculate costs based on the frontend logic
    // This assumes the frontend's calculation method is also available here
    const selectedServices = Array.isArray(data.ProductsManufactured) 
      ? data.ProductsManufactured 
      : [data.ProductsManufactured].filter(Boolean);
    
    // If we have serviceCostDetails, use those
    if (data.serviceCostDetails && Array.isArray(data.serviceCostDetails)) {
      data.serviceCostDetails.forEach((detail: any) => {
        if (detail.serviceName && typeof detail.totalCost === 'number') {
          serviceCosts[detail.serviceName] = detail.totalCost;
        }
      });
    } else {
      // If we don't have detailed costs, divide evenly (as before, but only as fallback)
      const costPerService = data.totalCost / selectedServices.length;
      selectedServices.forEach((service: string) => {
        serviceCosts[service] = costPerService;
      });
    }
  }
  
  return serviceCosts;
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