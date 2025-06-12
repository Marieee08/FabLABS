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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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
    const formattedData = storedData.map((util: any) => ({
      ...util,
      DateReviewed: util.DateReviewed ? util.DateReviewed.toISOString() : null,
      OperatingTimes: util.OperatingTimes.map((ot: any) => ({
        ...ot,
        // Format all dates consistently to ISO strings
        OTDate: ot.OTDate ? ot.OTDate.toISOString() : null,
        OTStartTime: ot.OTStartTime ? ot.OTStartTime.toISOString() : null,
        OTEndTime: ot.OTEndTime ? ot.OTEndTime.toISOString() : null
      })),
      DownTimes: util.DownTimes.map((dt: any) => ({
        ...dt,
        DTDate: dt.DTDate ? dt.DTDate.toISOString() : null
      })),
      RepairChecks: util.RepairChecks.map((rc: any) => ({
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
  } finally {
    // Ensure Prisma connection is properly handled
    await prisma.$disconnect();
  }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
  ) {
    try {
      const { id } = await params;
      
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
      
      // Process and store machine utilization data
      const processedData = await Promise.all(data.map(async (incomingMachineUtil: { id: any; Machine: any; ReviwedBy: any; ReviewedBy: any; DateReviewed: any; ServiceName: any; OperatingTimes: any[]; DownTimes: any[]; RepairChecks: any[]; }) => {
        // Start a transaction to ensure data consistency
        return prisma.$transaction(async (tx: any) => {
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
  
          // Deduplication function
          const deduplicate = (items: any[], getSignature: (item: any) => string) => {
            const uniqueItems = [];
            const signatures = new Set();
  
            for (const item of items) {
              const signature = getSignature(item);
              
              if (!signatures.has(signature)) {
                signatures.add(signature);
                uniqueItems.push(item);
              }
            }
  
            return uniqueItems;
          };
  
          // Deduplicate and create Operating Times
          const uniqueOperatingTimes = deduplicate(
            incomingMachineUtil.OperatingTimes, 
            (ot) => JSON.stringify({
              OTDate: ot.OTDate,
              OTTypeofProducts: ot.OTTypeofProducts,
              OTStartTime: ot.OTStartTime,
              OTEndTime: ot.OTEndTime,
              OTMachineOp: ot.OTMachineOp
            })
          );
  
          // Deduplicate and create Down Times
          const uniqueDownTimes = deduplicate(
            incomingMachineUtil.DownTimes,
            (dt) => JSON.stringify({
              DTDate: dt.DTDate,
              DTTypeofProducts: dt.DTTypeofProducts,
              DTTime: dt.DTTime,
              Cause: dt.Cause,
              DTMachineOp: dt.DTMachineOp
            })
          );
  
          // Deduplicate and create Repair Checks
          const uniqueRepairChecks = deduplicate(
            incomingMachineUtil.RepairChecks,
            (rc) => JSON.stringify({
              RepairDate: rc.RepairDate,
              Service: rc.Service,
              Duration: rc.Duration,
              RepairReason: rc.RepairReason,
              PartsReplaced: rc.PartsReplaced,
              RPPersonnel: rc.RPPersonnel
            })
          );
  
          // Get any auto-generated times from utilTime table
          const utilTimes = await tx.utilTime.findMany({
            where: { utilReqId: utilReqId }
          });
          
          // Convert utilTimes to operatingTimes format
          const autoGeneratedTimes = utilTimes.map((utilTime: any) => ({
            OTDate: utilTime.StartTime,
            OTStartTime: utilTime.StartTime,
            OTEndTime: utilTime.EndTime,
            OTTypeofProducts: null, 
            OTMachineOp: null
          }));
          
          // Determine which operating times to use based on the situation
          let finalOperatingTimes;
          
          if (incomingMachineUtil.id) {
            // CASE 1: This is an UPDATE to an existing record
            // Use only the times provided by the user - no auto-merging
            finalOperatingTimes = uniqueOperatingTimes;
          } else {
            // CASE 2: This is a NEW machine utilization record
            if (uniqueOperatingTimes.length > 0) {
              // User has already specified operating times, use those
              finalOperatingTimes = uniqueOperatingTimes;
            } else {
              // No user-defined times, use the auto-generated ones
              finalOperatingTimes = autoGeneratedTimes;
            }
          }
          
          // Create all the related records
          await Promise.all([
            // Operating Times - Use finalOperatingTimes instead of mergedOperatingTimes
            ...finalOperatingTimes.map((ot: any) => {
              const cleanData = cleanObject(ot);
              return tx.operatingTime.create({
                data: {
                  ...cleanData,
                  machineUtilId: machineUtilResult.id
                }
              });
            }),
            
            // Down Times - Remove isNew flag before saving
            ...uniqueDownTimes.map(dt => {
              const cleanData = cleanObject(dt);
              return tx.downTime.create({
                data: {
                  ...cleanData,
                  machineUtilId: machineUtilResult.id
                }
              });
            }),
            
            // Repair Checks - Remove isNew flag before saving
            ...uniqueRepairChecks.map(rc => {
              const cleanData = cleanObject(rc);
              return tx.repairCheck.create({
                data: {
                  ...cleanData,
                  machineUtilId: machineUtilResult.id
                }
              });
            })
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
    } finally {
      // Ensure Prisma connection is properly handled
      await prisma.$disconnect();
    }
  }

// DELETE handler
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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
  } finally {
    // Ensure Prisma connection is properly handled
    await prisma.$disconnect();
  }
}