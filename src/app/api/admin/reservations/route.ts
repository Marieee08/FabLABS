// /api/admin/reservations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Fetch UtilReq (utilization reservations)
    const utilReservations = await prisma.utilReq.findMany({
      include: {
        accInfo: {
          include: {
            ClientInfo: true,
            BusinessInfo: true,
          },
        },
        UserServices: true,
        UtilTimes: {
          select: {
            id: true,
            DayNum: true,
            StartTime: true,
            EndTime: true
          }
        },
        MachineUtilizations: {
          select: {
            id: true,
            Machine: true,
            ServiceName: true
          }
        }
      },
      orderBy: {
        RequestDate: 'desc',
      },
    });

    // Transform UtilReq data into the expected format
    const formattedUtilReservations = utilReservations.map((reservation: any) => {
      // Get all service names
      const serviceNames = reservation.UserServices.map((service: any) => service.ServiceAvail);
      const serviceName = serviceNames.length > 0 
        ? serviceNames.join(", ")
        : "No service";
      
      // Get all machine names from UserServices
      const userServiceMachines = reservation.UserServices
        .filter((service: any) => service.EquipmentAvail && service.EquipmentAvail !== "Not Specified")
        .map((service: any) => service.EquipmentAvail);
      
      // Get all machine names from MachineUtilizations
      const machineUtilMachines = reservation.MachineUtilizations
        ?.filter((machine: any) => machine.Machine && machine.Machine !== "Not Specified")
        .map((machine: any) => machine.Machine) || [];
      
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
      const timeSlots = reservation.UtilTimes.map((time: any) => ({
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
        name: reservation.accInfo?.Name || "Unknown",
        email: reservation.accInfo?.email || "Unknown",
        status: reservation.Status,
        role: reservation.accInfo?.Role || "MSME",
        service: serviceName,
        machines: machines, // Array of machines
        totalAmount: reservation.TotalAmntDue ? Number(reservation.TotalAmntDue) : null,
        type: 'utilization',
        timeSlots: timeSlots,
        totalScheduledTime: timeSlots.reduce((total: any, slot: any) => 
          total + (slot.duration || 0), 0)
      };
    });

    // Fetch EVCReservation (educational visit center reservations)
    const evcReservations = await prisma.eVCReservation.findMany({
      include: {
        accInfo: true,
        UtilTimes: {
          select: {
            id: true,
            DayNum: true,
            StartTime: true,
            EndTime: true
          }
        },
      },
      orderBy: {
        DateRequested: 'desc',
      },
    });

    // Transform EVCReservation data into the expected format
    const formattedEVCReservations = evcReservations.map((reservation: any) => {
      // Determine the date from UtilTimes if available, otherwise use DateRequested
      const firstTime = reservation.UtilTimes.length > 0 ? reservation.UtilTimes[0] : null;
      const date = firstTime && firstTime.StartTime 
        ? new Date(firstTime.StartTime).toISOString() 
        : reservation.DateRequested 
          ? reservation.DateRequested.toISOString() 
          : new Date().toISOString();

      // Format all time slots
      const timeSlots = reservation.UtilTimes.map((time: any) => ({
        id: time.id,
        dayNum: time.DayNum,
        startTime: time.StartTime ? new Date(time.StartTime).toISOString() : null,
        endTime: time.EndTime ? new Date(time.EndTime).toISOString() : null,
        duration: time.StartTime && time.EndTime 
          ? (new Date(time.EndTime).getTime() - new Date(time.StartTime).getTime()) / (1000 * 60) // duration in minutes
          : null
      }));

      return {
        id: `evc-${reservation.id}`,
        date: date,
        name: reservation.accInfo?.Name || reservation.Teacher || "Unknown",
        email: reservation.accInfo?.email || reservation.TeacherEmail || "Unknown",
        status: reservation.EVCStatus,
        role: reservation.accInfo?.Role || "Student",
        service: "Laboratory Reservation",
        machines: ["EVC Lab"], // Default machine for EVC as array
        totalAmount: null,
        type: 'evc',
        timeSlots: timeSlots,
        totalScheduledTime: timeSlots.reduce((total: any, slot: any) => 
          total + (slot.duration || 0), 0)
      };
    });

    // Combine and sort all reservations by date (newest first)
    const allReservations = [...formattedUtilReservations, ...formattedEVCReservations]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json(allReservations);
  } catch (error) {
    console.error("Error fetching reservations:", error);
    return NextResponse.json(
      { error: "Failed to fetch reservations" },
      { status: 500 }
    );
  }
}