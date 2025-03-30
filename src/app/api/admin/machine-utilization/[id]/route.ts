// src\app\api\admin\machine-utilization\[id]\route.ts
import { PrismaClient } from '@prisma/client'
import { NextResponse } from 'next/server';

// Initialize Prisma client
const prisma = new PrismaClient()

// Interfaces for machine utilization data
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
  ReviwedBy: string | null; // Note the spelling - this is correct according to schema
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

    // Format the dates consistently before returning
    const formattedData = storedData.map(util => ({
      ...util,
      DateReviewed: util.DateReviewed ? util.DateReviewed.toISOString() : null,
      OperatingTimes: util.OperatingTimes.map(ot => ({
        ...ot,
        // Format all dates consistently to ISO strings
        OTDate: ot.OTDate ? ot.OTDate.toISOString() : null,
        OTStartTime: ot.OTStartTime ? ot.OTStartTime.toISOString() : null,
        OTEndTime: ot.OTEndTime ? ot.OTEndTime.toISOString() : null
      })),
      DownTimes: util.DownTimes.map(dt => ({
        ...dt,
        DTDate: dt.DTDate ? dt.DTDate.toISOString() : null
      })),
      RepairChecks: util.RepairChecks.map(rc => ({
        ...rc,
        RepairDate: rc.RepairDate ? rc.RepairDate.toISOString() : null
      }))
    }));
    
    return NextResponse.json(formattedData, { status: 200 });
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
    
    // Process and store machine utilization data with better date handling
    const processedData = await Promise.all(data.map(async (incomingMachineUtil) => {
      // Start a transaction to ensure data consistency
      return prisma.$transaction(async (tx) => {
        let machineUtilResult;
        
        // IMPORTANT: Use the correct field name: ReviwedBy (not ReviewedBy)
        const reviewerValue = incomingMachineUtil.ReviewedBy || incomingMachineUtil.ReviwedBy || 'Admin';
        
        // Check if we have a valid ID for update
        if (incomingMachineUtil.id) {
          // Update existing record - with fixed field name ReviwedBy
          machineUtilResult = await tx.machineUtilization.update({
            where: { 
              id: incomingMachineUtil.id
            },
            data: {
              Machine: incomingMachineUtil.Machine,
              ReviwedBy: reviewerValue, // Use the correct field as per schema
              MachineApproval: incomingMachineUtil.MachineApproval === true ? true : false,
              DateReviewed: incomingMachineUtil.DateReviewed,
              ServiceName: incomingMachineUtil.ServiceName,
              utilReqId: utilReqId
            }
          });
        } else {
          // Create new record - with fixed field name ReviwedBy
          machineUtilResult = await tx.machineUtilization.create({
            data: {
              Machine: incomingMachineUtil.Machine,
              ReviwedBy: reviewerValue, // Use the correct field as per schema
              MachineApproval: incomingMachineUtil.MachineApproval === true ? true : false,
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

        // Process operating times with better date handling
        const processedOperatingTimes = incomingMachineUtil.OperatingTimes.map(ot => {
          const cleanData = cleanObject(ot);
          
          // Format dates correctly for the database
          let processedData = { ...cleanData };
          
          // Handle OTDate - ensure it's a valid Date object
          if (processedData.OTDate) {
            try {
              processedData.OTDate = new Date(processedData.OTDate);
              // Verify it's a valid date
              if (isNaN(processedData.OTDate.getTime())) {
                console.error("Invalid date for OTDate:", processedData.OTDate);
                processedData.OTDate = null;
              }
            } catch (e) {
              console.error("Error formatting OTDate:", e);
              processedData.OTDate = null;
            }
          }
          
          // Handle OTStartTime - ensure it's a valid Date object
          if (processedData.OTStartTime) {
            try {
              processedData.OTStartTime = new Date(processedData.OTStartTime);
              // Verify it's a valid date
              if (isNaN(processedData.OTStartTime.getTime())) {
                console.error("Invalid date for OTStartTime:", processedData.OTStartTime);
                processedData.OTStartTime = null;
              }
            } catch (e) {
              console.error("Error formatting OTStartTime:", e);
              processedData.OTStartTime = null;
            }
          }
          
          // Handle OTEndTime - ensure it's a valid Date object
          if (processedData.OTEndTime) {
            try {
              processedData.OTEndTime = new Date(processedData.OTEndTime);
              // Verify it's a valid date
              if (isNaN(processedData.OTEndTime.getTime())) {
                console.error("Invalid date for OTEndTime:", processedData.OTEndTime);
                processedData.OTEndTime = null;
              }
            } catch (e) {
              console.error("Error formatting OTEndTime:", e);
              processedData.OTEndTime = null;
            }
          }
          
          return processedData;
        });

        // Process down times with better date handling
        const processedDownTimes = incomingMachineUtil.DownTimes.map(dt => {
          const cleanData = cleanObject(dt);
          
          // Format dates correctly for the database
          let processedData = { ...cleanData };
          
          // Handle DTDate - ensure it's a valid Date object
          if (processedData.DTDate) {
            try {
              processedData.DTDate = new Date(processedData.DTDate);
              // Verify it's a valid date
              if (isNaN(processedData.DTDate.getTime())) {
                console.error("Invalid date for DTDate:", processedData.DTDate);
                processedData.DTDate = null;
              }
            } catch (e) {
              console.error("Error formatting DTDate:", e);
              processedData.DTDate = null;
            }
          }
          
          return processedData;
        });

        // Process repair checks with better date handling
        const processedRepairChecks = incomingMachineUtil.RepairChecks.map(rc => {
          const cleanData = cleanObject(rc);
          
          // Format dates correctly for the database
          let processedData = { ...cleanData };
          
          // Handle RepairDate - ensure it's a valid Date object
          if (processedData.RepairDate) {
            try {
              processedData.RepairDate = new Date(processedData.RepairDate);
              // Verify it's a valid date
              if (isNaN(processedData.RepairDate.getTime())) {
                console.error("Invalid date for RepairDate:", processedData.RepairDate);
                processedData.RepairDate = null;
              }
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

        // Return the full record with consistent ISO date formatting
        const updatedRecord = await tx.machineUtilization.findUnique({
          where: { id: machineUtilResult.id },
          include: {
            OperatingTimes: true,
            DownTimes: true,
            RepairChecks: true
          }
        });

        return {
          ...updatedRecord,
          DateReviewed: updatedRecord.DateReviewed ? updatedRecord.DateReviewed.toISOString() : null,
          OperatingTimes: updatedRecord.OperatingTimes.map(ot => ({
            ...ot,
            OTDate: ot.OTDate ? ot.OTDate.toISOString() : null,
            OTStartTime: ot.OTStartTime ? ot.OTStartTime.toISOString() : null,
            OTEndTime: ot.OTEndTime ? ot.OTEndTime.toISOString() : null
          })),
          DownTimes: updatedRecord.DownTimes.map(dt => ({
            ...dt,
            DTDate: dt.DTDate ? dt.DTDate.toISOString() : null
          })),
          RepairChecks: updatedRecord.RepairChecks.map(rc => ({
            ...rc,
            RepairDate: rc.RepairDate ? rc.RepairDate.toISOString() : null
          }))
        };
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

// DELETE handler remains the same
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    
    if (!id) {
      return NextResponse.json(
        { error: 'Invalid or missing reservation ID' }, 
        { status: 400 }
      );
    }
    
    const utilReqId = parseInt(id);
    
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