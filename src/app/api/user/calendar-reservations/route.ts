// /api/user/calendar-reservations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Fetch all utilization and EVC reservations with extensive logging
    const [utilReservations, evcReservations] = await Promise.all([
      prisma.utilReq.findMany({
        include: {
          MachineUtilizations: true,
          UserServices: true,
          UtilTimes: true,
          // Include this to see full context
          accInfo: {
            select: {
              Name: true,
              Role: true
            }
          }
        }
      }),
      prisma.eVCReservation.findMany({
        include: {
          NeededMaterials: true,
          UtilTimes: true,
          accInfo: {
            select: {
              Name: true,
              Role: true
            }
          }
        }
      })
    ]);

    // Logging for debugging
    console.log('UTIL RESERVATIONS DETAILS:', JSON.stringify(utilReservations.map(ur => ({
      id: ur.id,
      status: ur.Status,
      userRole: ur.accInfo?.Role,
      userName: ur.accInfo?.Name,
      machineUtils: ur.MachineUtilizations.map(mu => mu.Machine),
      userServices: ur.UserServices.map(us => us.EquipmentAvail)
    })), null, 2));

    console.log('EVC RESERVATIONS DETAILS:', JSON.stringify(evcReservations.map(er => ({
      id: er.id,
      status: er.EVCStatus,
      userRole: er.accInfo?.Role,
      userName: er.accInfo?.Name,
      neededMaterials: er.NeededMaterials.map(nm => nm.Item)
    })), null, 2));

    // Transform reservations (similar to previous implementation)
    const formattedUtilReservations = utilReservations.map((reservation) => {
      // Combine machine sources
      const machinesFromUtils = reservation.MachineUtilizations
        .filter(mu => mu.Machine && mu.Machine !== 'Not Specified')
        .map(mu => mu.Machine);
      
      const machinesFromServices = reservation.UserServices
        .filter(us => us.EquipmentAvail && us.EquipmentAvail !== 'Not Specified')
        .map(us => us.EquipmentAvail);

      const allMachines = [...new Set([...machinesFromUtils, ...machinesFromServices])];

      const firstTime = reservation.UtilTimes.length > 0 ? reservation.UtilTimes[0] : null;
      const date = firstTime && firstTime.StartTime 
        ? new Date(firstTime.StartTime).toISOString() 
        : reservation.RequestDate.toISOString();

      const timeSlots = reservation.UtilTimes.map(time => ({
        id: time.id,
        dayNum: time.DayNum,
        startTime: time.StartTime ? new Date(time.StartTime).toISOString() : null,
        endTime: time.EndTime ? new Date(time.EndTime).toISOString() : null,
        duration: time.StartTime && time.EndTime 
          ? (new Date(time.EndTime).getTime() - new Date(time.StartTime).getTime()) / (1000 * 60)
          : null
      }));

      return {
        id: reservation.id.toString(),
        date: date,
        status: reservation.Status,
        machines: allMachines.length > 0 ? allMachines : ["Not specified"],
        type: 'utilization',
        timeSlots: timeSlots,
        userRole: reservation.accInfo?.Role,
        userName: reservation.accInfo?.Name
      };
    });

    const formattedEVCReservations = evcReservations.map((reservation) => {
      const machines = reservation.NeededMaterials
        .filter(material => material.Item && material.Item !== "Not Specified")
        .map(material => material.Item);

      const firstTime = reservation.UtilTimes.length > 0 ? reservation.UtilTimes[0] : null;
      const date = firstTime && firstTime.StartTime 
        ? new Date(firstTime.StartTime).toISOString() 
        : reservation.DateRequested
          ? reservation.DateRequested.toISOString() 
          : new Date().toISOString();

      const timeSlots = reservation.UtilTimes.map(time => ({
        id: time.id,
        dayNum: time.DayNum,
        startTime: time.StartTime ? new Date(time.StartTime).toISOString() : null,
        endTime: time.EndTime ? new Date(time.EndTime).toISOString() : null,
        duration: time.StartTime && time.EndTime 
          ? (new Date(time.EndTime).getTime() - new Date(time.StartTime).getTime()) / (1000 * 60)
          : null
      }));

      return {
        id: `evc-${reservation.id}`,
        date: date,
        status: reservation.EVCStatus,
        machines: machines.length > 0 ? machines : ["Not specified"],
        type: 'evc',
        timeSlots: timeSlots,
        userRole: reservation.accInfo?.Role,
        userName: reservation.accInfo?.Name
      };
    });

    const allReservations = [
      ...formattedUtilReservations, 
      ...formattedEVCReservations
    ];

    return NextResponse.json(allReservations);
  } catch (error) {
    console.error("Error fetching calendar reservations:", error);
    return NextResponse.json(
      { error: "Failed to fetch calendar reservations" },
      { status: 500 }
    );
  }
}