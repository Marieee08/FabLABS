// /api/user/calendar-reservations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Fetch UtilReq (utilization reservations)
    const utilReservations = await prisma.utilReq.findMany({
      select: {
        id: true,
        Status: true,
        RequestDate: true,
        MachineUtilizations: {
          select: {
            id: true,
            Machine: true,
            ServiceName: true
          }
        },
        UserServices: {
          select: {
            id: true,
            EquipmentAvail: true,
            ServiceAvail: true
          }
        },
        UtilTimes: {
          select: {
            id: true,
            DayNum: true,
            StartTime: true,
            EndTime: true
          }
        }
      },
    });

    console.log("Raw utilization data:", JSON.stringify(utilReservations, null, 2));

    // Transform UtilReq data into the expected format (without personal information)
    const formattedUtilReservations = utilReservations.map((reservation) => {
      // Get all machine names from UserServices
      const userServiceMachines = reservation.UserServices
        .filter(service => service.EquipmentAvail && service.EquipmentAvail !== "Not Specified")
        .map(service => service.EquipmentAvail);

      // Get all machine names from MachineUtilizations
      const machineUtilMachines = reservation.MachineUtilizations
        ?.filter(machine => machine.Machine && machine.Machine !== "Not Specified")
        .map(machine => machine.Machine) || [];

      // Combine all machine names and remove duplicates
      const allMachines = [...new Set([...userServiceMachines, ...machineUtilMachines])];

      // Format machines for display
      const machines = allMachines.length > 0 
        ? allMachines 
        : ["Not specified"];

      // Determine the date from UtilTimes if available, otherwise use RequestDate
      const firstTime = reservation.UtilTimes.length > 0 ? reservation.UtilTimes[0] : null;
      const date = firstTime && firstTime.StartTime 
        ? new Date(firstTime.StartTime).toISOString() 
        : reservation.RequestDate.toISOString();

      // Format all time slots
      const timeSlots = reservation.UtilTimes.map(time => ({
        id: time.id,
        dayNum: time.DayNum,
        startTime: time.StartTime ? new Date(time.StartTime).toISOString() : null,
        endTime: time.EndTime ? new Date(time.EndTime).toISOString() : null,
        duration: time.StartTime && time.EndTime 
          ? (new Date(time.EndTime).getTime() - new Date(time.StartTime).getTime()) / (1000 * 60) // duration in minutes
          : null
      }));

      return {
        id: reservation.id.toString(),
        date: date,
        status: reservation.Status,
        machines: machines, // Array of machines
        type: 'utilization',
        timeSlots: timeSlots
      };
    });

    // Debugging
    console.log("Formatted reservation data:", JSON.stringify(formattedUtilReservations, null, 2));

    return NextResponse.json(formattedUtilReservations);
  } catch (error) {
    console.error("Error fetching calendar reservations:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar reservations" },
      { status: 500 }
    );
  }
}