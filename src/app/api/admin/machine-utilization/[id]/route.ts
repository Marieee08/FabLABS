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

// Helper function to remove non-schema properties
function cleanObject(obj: any): any {
  // Create a copy to avoid modifying the original
  const result = {...obj};
  
  // Remove properties not in the schema
  delete result.isNew;
  
  // Return the cleaned object
  return result;
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
      const utilReqId = parseInt(id, 10);
      
      // Validate conversion
      if (isNaN(utilReqId)) {
        return NextResponse.json(
          { error: 'Invalid reservation ID format' }, 
          { status: 400 }
        );
      }
      
      // Parse incoming data
      const data = await request.json();
      
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
      
      // Modified processedData in the POST method to better handle date formatting
// For src\app\api\admin\machine-utilization\[id]\route.ts

// Process and store machine utilization data with better date handling
const processedData = await Promise.all(data.map(async (incomingMachineUtil) => {
  // Start a transaction to ensure data consistency
  return prisma.$transaction(async (tx) => {
    let machineUtilResult;
    
    // Check if we have a valid ID for update
    if (incomingMachineUtil.id) {
      // Update existing record
      machineUtilResult = await tx.machineUtilization.update({
        where: { 
          id: incomingMachineUtil.id
        },
        data: {
          Machine: incomingMachineUtil.Machine,
          ReviwedBy: incomingMachineUtil.ReviwedBy || incomingMachineUtil.ReviewedBy,
          MachineApproval: null,
          DateReviewed: incomingMachineUtil.DateReviewed,
          ServiceName: incomingMachineUtil.ServiceName,
          utilReqId: utilReqId
        }
      });
    } else {
      // Create new record
      machineUtilResult = await tx.machineUtilization.create({
        data: {
          Machine: incomingMachineUtil.Machine,
          ReviwedBy: incomingMachineUtil.ReviwedBy || incomingMachineUtil.ReviewedBy,
          MachineApproval: null,
          DateReviewed: incomingMachineUtil.DateReviewed,
          ServiceName: incomingMachineUtil.ServiceName,
          utilReqId: utilReqId
        }
      });
    }

    // Delete existing related records
    await Promise.all([
      tx.operatingTime.deleteMany({
        where: { machineUtilId: machineUtilResult.id }
      }),
      tx.downTime.deleteMany({
        where: { machineUtilId: machineUtilResult.id }
      }),
      tx.repairCheck.deleteMany({
        where: { machineUtilId: machineUtilResult.id }
      })
    ]);

    // Process the operating times with better date handling
    const processedOperatingTimes = incomingMachineUtil.OperatingTimes.map(ot => {
      const cleanData = cleanObject(ot);
      
      // Format dates correctly for the database
      let processedData = { ...cleanData };
      
      // Handle OTDate - make sure it's in correct format
      if (processedData.OTDate) {
        // If it's already a Date object or ISO string, use it
        // Otherwise, create a new Date
        try {
          processedData.OTDate = new Date(processedData.OTDate);
        } catch (e) {
          console.error("Error formatting OTDate:", e);
          // If conversion fails, set to null
          processedData.OTDate = null;
        }
      }
      
      // Handle OTStartTime - make sure it's in correct format
      if (processedData.OTStartTime) {
        try {
          processedData.OTStartTime = new Date(processedData.OTStartTime);
        } catch (e) {
          console.error("Error formatting OTStartTime:", e);
          processedData.OTStartTime = null;
        }
      }
      
      // Handle OTEndTime - make sure it's in correct format
      if (processedData.OTEndTime) {
        try {
          processedData.OTEndTime = new Date(processedData.OTEndTime);
        } catch (e) {
          console.error("Error formatting OTEndTime:", e);
          processedData.OTEndTime = null;
        }
      }
      
      return processedData;
    });

    // Process the down times
    const processedDownTimes = incomingMachineUtil.DownTimes.map(dt => {
      const cleanData = cleanObject(dt);
      
      // Format dates correctly for the database
      let processedData = { ...cleanData };
      
      // Handle DTDate - make sure it's in correct format
      if (processedData.DTDate) {
        try {
          processedData.DTDate = new Date(processedData.DTDate);
        } catch (e) {
          console.error("Error formatting DTDate:", e);
          processedData.DTDate = null;
        }
      }
      
      return processedData;
    });

    // Process the repair checks
    const processedRepairChecks = incomingMachineUtil.RepairChecks.map(rc => {
      const cleanData = cleanObject(rc);
      
      // Format dates correctly for the database
      let processedData = { ...cleanData };
      
      // Handle RepairDate - make sure it's in correct format
      if (processedData.RepairDate) {
        try {
          processedData.RepairDate = new Date(processedData.RepairDate);
        } catch (e) {
          console.error("Error formatting RepairDate:", e);
          processedData.RepairDate = null;
        }
      }
      
      return processedData;
    });

    // Create new related records
    await Promise.all([
      // Operating Times 
      ...processedOperatingTimes.map(ot => 
        tx.operatingTime.create({
          data: {
            ...ot,
            machineUtilId: machineUtilResult.id
          }
        })
      ),
      // Down Times
      ...processedDownTimes.map(dt => 
        tx.downTime.create({
          data: {
            ...dt,
            machineUtilId: machineUtilResult.id
          }
        })
      ),
      // Repair Checks
      ...processedRepairChecks.map(rc => 
        tx.repairCheck.create({
          data: {
            ...rc,
            machineUtilId: machineUtilResult.id
          }
        })
      )
    ]);

    // Return the full record
    return tx.machineUtilization.findUnique({
      where: { id: machineUtilResult.id },
      include: {
        OperatingTimes: true,
        DownTimes: true,
        RepairChecks: true
      }
    });
  });
}));
  
      // Return the processed data
      return NextResponse.json(processedData, { status: 200 });
  
    } catch (error) {
      console.error('Error processing machine utilization:', error);
      return NextResponse.json(
        { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }, 
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