// src\app\api\admin\machine-utilization\[id]\route.ts
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server';

// Initialize Prisma client
const prisma = new PrismaClient()

// Interfaces remain the same as in the original file
interface OperatingTime {
  id?: number;
  OTDate: string | null;
  OTTypeofProducts: string | null;
  OTStartTime: string | null;
  OTEndTime: string | null;
  OTMachineOp: string | null;
  machineUtilId?: number | null;
  isNew?: boolean;
}

interface DownTime {
  id?: number;
  DTDate: string | null;
  DTTypeofProducts: string | null;
  DTTime: number | null;
  Cause: string | null;
  DTMachineOp: string | null;
  machineUtilId?: number | null;
  isNew?: boolean;
}

interface RepairCheck {
  id?: number;
  RepairDate: string | null;
  Service: string | null;
  Duration: number | null;
  RepairReason: string | null;
  PartsReplaced: string | null;
  RPPersonnel: string | null;
  machineUtilId?: number | null;
  isNew?: boolean;
}

interface MachineUtilization {
  id?: number;
  Machine: string | null;
  ReviewedBy: string | null;
  MachineApproval: boolean | null;
  DateReviewed: string | null;
  ServiceName: string | null;
  utilReqId?: number | null;
  OperatingTimes: OperatingTime[];
  DownTimes: DownTime[];
  RepairChecks: RepairCheck[];
}

// Validation function
function validateMachineUtilization(data: MachineUtilization[]): boolean {
  if (!Array.isArray(data)) return false;
  
  return data.every(item => {
    // Basic validation for required fields
    if (!item.Machine || !item.ServiceName) return false;
    
    // Validate nested arrays
    if (!Array.isArray(item.OperatingTimes) || 
        !Array.isArray(item.DownTimes) || 
        !Array.isArray(item.RepairChecks)) return false;
    
    return true;
  });
}

// GET handler
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Validate ID
    if (!id) {
      return NextResponse.json(
        { error: 'Invalid or missing reservation ID' }, 
        { status: 400 }
      );
    }
    
    // Convert id to number
    const utilReqId = parseInt(id);
    
    // Retrieve stored data
    const storedData = await prisma.machineUtilization.findMany({
      where: { utilReqId },
      include: {
        OperatingTimes: true,
        DownTimes: true,
        RepairChecks: true
      }
    });
    
    return NextResponse.json(storedData, { status: 200 });
  } catch (error) {
    console.error('Error fetching machine utilization:', error);
    return NextResponse.json(
      { error: 'Failed to fetch machine utilization data' }, 
      { status: 500 }
    );
  }
}

// POST handler
export async function POST(
    request: Request,
    { params }: { params: { id: string } }
  ) {
    try {
      const id = params.id;
      
      // Validate ID
      if (!id) {
        return NextResponse.json(
          { error: 'Invalid or missing reservation ID' }, 
          { status: 400 }
        );
      }
      
      // Convert id to number
      const utilReqId = parseInt(id);
      
      // Parse incoming data
      const data = await request.json() as MachineUtilization[];
      
      // Validate data structure
      if (!validateMachineUtilization(data)) {
        return NextResponse.json(
          { error: 'Invalid machine utilization data structure' }, 
          { status: 400 }
        );
      }
      
      // Log the incoming data for debugging
      console.log('Incoming data:', JSON.stringify(data, null, 2));
      
      // If we receive an empty array, delete existing records for this utilReqId
      if (data.length === 0) {
        await prisma.machineUtilization.deleteMany({
          where: { utilReqId }
        });
        return NextResponse.json([], { status: 200 });
      }
      
      // Process and merge incoming data
      const processedData = await Promise.all(data.map(async (incomingMachineUtil) => {
        try {
          // Check if this machine utilization already exists
          let existingMachineUtil = null;
          if (incomingMachineUtil.id) {
            existingMachineUtil = await prisma.machineUtilization.findUnique({
              where: { id: incomingMachineUtil.id },
              include: {
                OperatingTimes: true,
                DownTimes: true,
                RepairChecks: true
              }
            });
          }
          
          let machineUtilResult;
          
          // If exists, update; if not, create new
          if (existingMachineUtil) {
            // Update existing machine utilization
            machineUtilResult = await prisma.machineUtilization.update({
                where: { id: existingMachineUtil.id },
                data: {
                  Machine: incomingMachineUtil.Machine,
                  ReviwedBy: incomingMachineUtil.ReviewedBy, // Use the misspelled field name from schema
                  MachineApproval: incomingMachineUtil.MachineApproval,
                  DateReviewed: incomingMachineUtil.DateReviewed,
                  ServiceName: incomingMachineUtil.ServiceName,
                  utilReqId: utilReqId
                },
                include: {
                  OperatingTimes: true,
                  DownTimes: true,
                  RepairChecks: true
                }
              });
          } else {
            // Create new machine utilization
            machineUtilResult = await prisma.machineUtilization.create({
                data: {
                  Machine: incomingMachineUtil.Machine,
                  ReviwedBy: incomingMachineUtil.ReviewedBy, // Use the misspelled field name from schema  
                  MachineApproval: incomingMachineUtil.MachineApproval,
                  DateReviewed: incomingMachineUtil.DateReviewed,
                  ServiceName: incomingMachineUtil.ServiceName,
                  utilReqId: utilReqId
                },
                include: {
                  OperatingTimes: true,
                  DownTimes: true,
                  RepairChecks: true
                }
              });
          }
          
          // Process Operating Times
          // Delete any existing operating times not in the incoming data
          if (existingMachineUtil) {
            const incomingOTIds = incomingMachineUtil.OperatingTimes
              .filter(ot => ot.id)
              .map(ot => ot.id as number);
            
            await prisma.operatingTime.deleteMany({
              where: {
                machineUtilId: machineUtilResult.id,
                id: { notIn: incomingOTIds.length > 0 ? incomingOTIds : [-1] }
              }
            });
          }
          
          // Create or update operating times
          const operatingTimePromises = incomingMachineUtil.OperatingTimes.map(async (ot) => {
            if (ot.id && !ot.isNew) {
              // Update existing record
              return prisma.operatingTime.update({
                where: { id: ot.id },
                data: {
                  OTDate: ot.OTDate,
                  OTTypeofProducts: ot.OTTypeofProducts,
                  OTStartTime: ot.OTStartTime,
                  OTEndTime: ot.OTEndTime,
                  OTMachineOp: ot.OTMachineOp,
                  machineUtilId: machineUtilResult.id
                }
              });
            } else {
              // Create new record
              return prisma.operatingTime.create({
                data: {
                  OTDate: ot.OTDate,
                  OTTypeofProducts: ot.OTTypeofProducts,
                  OTStartTime: ot.OTStartTime,
                  OTEndTime: ot.OTEndTime,
                  OTMachineOp: ot.OTMachineOp,
                  machineUtilId: machineUtilResult.id
                }
              });
            }
          });
          
          // Process Down Times
          // Delete any existing down times not in the incoming data
          if (existingMachineUtil) {
            const incomingDTIds = incomingMachineUtil.DownTimes
              .filter(dt => dt.id)
              .map(dt => dt.id as number);
            
            await prisma.downTime.deleteMany({
              where: {
                machineUtilId: machineUtilResult.id,
                id: { notIn: incomingDTIds.length > 0 ? incomingDTIds : [-1] }
              }
            });
          }
          
          // Create or update down times
          const downTimePromises = incomingMachineUtil.DownTimes.map(async (dt) => {
            if (dt.id && !dt.isNew) {
              // Update existing record
              return prisma.downTime.update({
                where: { id: dt.id },
                data: {
                  DTDate: dt.DTDate,
                  DTTypeofProducts: dt.DTTypeofProducts,
                  DTTime: dt.DTTime,
                  Cause: dt.Cause,
                  DTMachineOp: dt.DTMachineOp,
                  machineUtilId: machineUtilResult.id
                }
              });
            } else {
              // Create new record
              return prisma.downTime.create({
                data: {
                  DTDate: dt.DTDate,
                  DTTypeofProducts: dt.DTTypeofProducts,
                  DTTime: dt.DTTime,
                  Cause: dt.Cause,
                  DTMachineOp: dt.DTMachineOp,
                  machineUtilId: machineUtilResult.id
                }
              });
            }
          });
          
          // Process Repair Checks
          // Delete any existing repair checks not in the incoming data
          if (existingMachineUtil) {
            const incomingRCIds = incomingMachineUtil.RepairChecks
              .filter(rc => rc.id)
              .map(rc => rc.id as number);
            
            await prisma.repairCheck.deleteMany({
              where: {
                machineUtilId: machineUtilResult.id,
                id: { notIn: incomingRCIds.length > 0 ? incomingRCIds : [-1] }
              }
            });
          }
          
          // Create or update repair checks
          const repairCheckPromises = incomingMachineUtil.RepairChecks.map(async (rc) => {
            if (rc.id && !rc.isNew) {
              // Update existing record
              return prisma.repairCheck.update({
                where: { id: rc.id },
                data: {
                  RepairDate: rc.RepairDate,
                  Service: rc.Service,
                  Duration: rc.Duration,
                  RepairReason: rc.RepairReason,
                  PartsReplaced: rc.PartsReplaced,
                  RPPersonnel: rc.RPPersonnel,
                  machineUtilId: machineUtilResult.id
                }
              });
            } else {
              // Create new record
              return prisma.repairCheck.create({
                data: {
                  RepairDate: rc.RepairDate,
                  Service: rc.Service,
                  Duration: rc.Duration,
                  RepairReason: rc.RepairReason,
                  PartsReplaced: rc.PartsReplaced,
                  RPPersonnel: rc.RPPersonnel,
                  machineUtilId: machineUtilResult.id
                }
              });
            }
          });
          
          // Wait for all database operations to complete
          await Promise.all([
            ...operatingTimePromises,
            ...downTimePromises,
            ...repairCheckPromises
          ]);
          
          // Fetch the updated record with all related data
          return prisma.machineUtilization.findUnique({
            where: { id: machineUtilResult.id },
            include: {
              OperatingTimes: true,
              DownTimes: true,
              RepairChecks: true
            }
          });
        } catch (processingError) {
          console.error('Error processing individual machine utilization:', processingError);
          throw processingError; // Re-throw to be caught by outer catch block
        }
      }));
      
      return NextResponse.json(processedData, { status: 200 });
    } catch (error) {
      console.error('Full error details:', error);
      
      // More detailed error response
      return NextResponse.json(
        { 
          error: 'Failed to save machine utilization data',
          details: error instanceof Error ? error.message : String(error)
        }, 
        { status: 500 }
      );
    }
  }

// DELETE handler
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    // Validate ID
    if (!id) {
      return NextResponse.json(
        { error: 'Invalid or missing reservation ID' }, 
        { status: 400 }
      );
    }
    
    // Convert id to number
    const utilReqId = parseInt(id);
    
    // Remove data for this ID
    await prisma.machineUtilization.deleteMany({
      where: { utilReqId }
    });
    
    return NextResponse.json(
      { message: 'Machine utilization data cleared successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error clearing machine utilization data:', error);
    return NextResponse.json(
      { error: 'Failed to clear machine utilization data' }, 
      { status: 500 }
    );
  }
}

// Ensure Prisma connection is closed when the route is done
export async function POST_HANDLER_CLEANUP() {
  await prisma.$disconnect();
}