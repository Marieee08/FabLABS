// Can be deleted upon final
// run: npx tsx prisma/migrate-machine-services.ts

import { PrismaClient } from '@prisma/client';

async function migrate() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Starting migration to add ServiceName to MachineUtilization records...');
    
    // Get all UtilReqs with MachineUtilizations and UserServices
    const utilReqs = await prisma.utilReq.findMany({
      include: {
        MachineUtilizations: true,
        UserServices: true
      }
    });
    
    console.log(`Found ${utilReqs.length} UtilReqs to process`);
    
    let updatedCount = 0;
    let skippedCount = 0;
    
    // Process each UtilReq
    for (const utilReq of utilReqs) {
      if (!utilReq.MachineUtilizations.length) {
        skippedCount++;
        continue;
      }
      
      console.log(`Processing UtilReq #${utilReq.id} with ${utilReq.MachineUtilizations.length} machine utilizations`);
      
      // If there's only one service, assign all machines to that service
      if (utilReq.UserServices.length === 1) {
        const serviceName = utilReq.UserServices[0].ServiceAvail;
        
        // Update all machine utilizations for this request
        for (const machine of utilReq.MachineUtilizations) {
          await prisma.machineUtilization.update({
            where: { id: machine.id },
            data: { ServiceName: serviceName }
          });
        }
        
        console.log(`Updated ${utilReq.MachineUtilizations.length} machines to service: ${serviceName}`);
        updatedCount += utilReq.MachineUtilizations.length;
      } 
      // For multiple services, we need to check which machine belongs to which service
      else if (utilReq.UserServices.length > 1) {
        console.log(`UtilReq #${utilReq.id} has multiple services (${utilReq.UserServices.length}), fetching service-machine mappings`);
        
        // Get all services and their machines
        const services = await prisma.service.findMany({
          where: {
            Service: {
              in: utilReq.UserServices.map((s: { ServiceAvail: string }) => s.ServiceAvail)
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
        
        console.log(`Found ${services.length} services with their machines`);
        
        // For each machine utilization, try to find which service it belongs to
        for (const machine of utilReq.MachineUtilizations) {
          let matched = false;
          
          // Find the service this machine belongs to
          for (const service of services) {
            const matchingMachine = service.Machines.find(
              (m: { machine: { Machine: string } }) => m.machine.Machine === machine.Machine
            );
            
            if (matchingMachine) {
              await prisma.machineUtilization.update({
                where: { id: machine.id },
                data: { ServiceName: service.Service }
              });
              
              console.log(`Assigned machine ${machine.Machine} to service ${service.Service}`);
              updatedCount++;
              matched = true;
              break;
            }
          }
          
          if (!matched) {
            console.log(`Could not find matching service for machine ${machine.Machine}, using first service as fallback`);
            
            // If no match found, assign to the first service as a fallback
            if (utilReq.UserServices.length > 0) {
              await prisma.machineUtilization.update({
                where: { id: machine.id },
                data: { ServiceName: utilReq.UserServices[0].ServiceAvail }
              });
              updatedCount++;
            }
          }
        }
      }
    }
    
    console.log('Migration completed successfully');
    console.log(`Updated ${updatedCount} machine utilization records`);
    console.log(`Skipped ${skippedCount} utilReqs with no machine utilizations`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrate()
  .then(() => console.log('Migration script execution completed'))
  .catch(err => console.error('Error in migration script:', err));