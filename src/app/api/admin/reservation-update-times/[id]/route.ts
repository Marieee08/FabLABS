// src/app/api/admin/reservation-update-times/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface UtilTime {
  id: number;
  DayNum: number | null;
  StartTime: string | null;
  EndTime: string | null;
  DateStatus?: string | null;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    const { utilTimes, totalAmount } = await req.json();

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid reservation ID" },
        { status: 400 }
      );
    }

    // Update all time slots
    for (const time of utilTimes) {
      await prisma.utilTime.update({
        where: { id: time.id },
        data: {
          StartTime: time.StartTime ? new Date(time.StartTime) : null,
          EndTime: time.EndTime ? new Date(time.EndTime) : null,
          DateStatus: time.DateStatus
        }
      });
    }

    // Fetch the updated time slots to calculate the total duration
    const updatedTimeSlots = await prisma.utilTime.findMany({
      where: { utilReqId: id }
    });

    // Calculate the total duration in minutes
    let totalDurationMinutes = 0;
    for (const slot of updatedTimeSlots) {
      if (slot.StartTime && slot.EndTime && slot.DateStatus !== 'Cancelled') {
        // Calculate the time difference in milliseconds
        const diffMs = slot.EndTime.getTime() - slot.StartTime.getTime();
        
        // Convert milliseconds to minutes
        const diffMinutes = Math.round(diffMs / (1000 * 60));
        
        // Add to total duration
        totalDurationMinutes += diffMinutes;
      }
    }

    console.log(`Raw calculated duration: ${totalDurationMinutes} minutes`);

    // Get all services for this reservation with their service details
    const userServices = await prisma.userService.findMany({
      where: {
        utilReqId: id
      }
    });
    
    // Fetch all service definitions to get the hourly rates
    const services = await prisma.service.findMany();
    
    // Create a map of service name to hourly rate
    const hourlyRates = new Map();
    services.forEach(service => {
      if (service.Costs) {
        hourlyRates.set(service.Service, parseFloat(service.Costs.toString()));
      }
    });
    
    console.log("Service rates map:", Object.fromEntries(hourlyRates));
    
    // Calculate new total cost
    let newTotalCost = 0;
    
    for (const userService of userServices) {
      // Update the minutes field with the exact duration
      await prisma.userService.update({
        where: { id: userService.id },
        data: { 
          MinsAvail: totalDurationMinutes > 0 ? totalDurationMinutes : null
        }
      });
      
      // Get the service name
      const serviceName = userService.ServiceAvail;
      console.log(`Processing service: ${serviceName}`);
      
      // Get the hourly rate for this service
      const hourlyRate = hourlyRates.get(serviceName);
      console.log(`Found hourly rate: ${hourlyRate}`);
      
      if (hourlyRate) {
        // Calculate total hours, properly rounded up to the next full hour
        const rawHours = totalDurationMinutes / 60;
        
        // Use Math.ceil to properly round up to the next whole hour
        // This ensures any partial hour is counted as a full hour
        const billingHours = Math.ceil(rawHours);
        
        // Multiply the hourly rate by the ceiling hours
        const newCost = hourlyRate * billingHours;
        
        console.log(`Service ${userService.id} (${serviceName}): 
          - Raw duration: ${totalDurationMinutes} minutes
          - Raw hours: ${rawHours.toFixed(2)} hours
          - Billed as: ${billingHours} full hours
          - Hourly rate: ₱${hourlyRate}
          - Final cost: ₱${newCost.toFixed(2)}`);
        
        await prisma.userService.update({
          where: { id: userService.id },
          data: { 
            CostsAvail: newCost > 0 ? newCost : null
          }
        });
        
        newTotalCost += newCost;
      } else {
        console.log(`Warning: Could not find hourly rate for service "${serviceName}"`);
        // If we can't find a rate, maintain the existing cost
        if (userService.CostsAvail) {
          newTotalCost += parseFloat(userService.CostsAvail.toString());
        }
      }
    }

    console.log(`New total cost for reservation: ₱${newTotalCost.toFixed(2)}`);
    
    // Update the reservation total amount
    await prisma.utilReq.update({
      where: { id },
      data: { TotalAmntDue: newTotalCost > 0 ? newTotalCost : totalAmount }
    });

    // Fetch the updated reservation
    const updatedReservation = await prisma.utilReq.findUnique({
      where: { id },
      include: {
        accInfo: {
          include: {
            ClientInfo: true,
            BusinessInfo: true,
          },
        },
        UserServices: true,
        UserTools: true,
        UtilTimes: true,
        MachineUtilizations: {
          include: {
            OperatingTimes: true,
            DownTimes: true,
            RepairChecks: true,
          }
        },
      },
    });

    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error("Error updating time slots:", error);
    return NextResponse.json(
      { error: "Failed to update time slots" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}