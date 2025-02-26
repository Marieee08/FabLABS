// File: /app/api/user/user-management/[id]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// DELETE handler for deleting a user
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const clerkId = params.id;

  try {
    // Find the user first to get the accInfoId
    const user = await prisma.accInfo.findUnique({
      where: { clerkId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Start a transaction to delete related records
    await prisma.$transaction(async (tx) => {
      // Delete ClientInfo if exists
      await tx.clientInfo.deleteMany({
        where: { accInfoId: user.id }
      });

      // Delete BusinessInfo if exists
      await tx.businessInfo.deleteMany({
        where: { accInfoId: user.id }
      });

      // Handle UtilReq foreign key constraints
      const utilReqs = await tx.utilReq.findMany({
        where: { accInfoId: user.id }
      });

      for (const req of utilReqs) {
        // Delete related CustomerFeedback records
        await tx.customerFeedback.deleteMany({
          where: { utilReqId: req.id }
        });

        // Delete related EmployeeEvaluation records
        await tx.employeeEvaluation.deleteMany({
          where: { utilReqId: req.id }
        });

        // Delete related ClientSatisfaction records
        await tx.clientSatisfaction.deleteMany({
          where: { utilReqId: req.id }
        });

        // Delete related CitizenSatisfaction records
        await tx.citizenSatisfaction.deleteMany({
          where: { utilReqId: req.id }
        });

        // Delete related JobandPayment records
        await tx.jobandPayment.deleteMany({
          where: { utilReqId: req.id }
        });

        // Delete related MachineUtilization records
        const machineUtils = await tx.machineUtilization.findMany({
          where: { utilReqId: req.id }
        });

        for (const mu of machineUtils) {
          // Delete related OperatingTime records
          await tx.operatingTime.deleteMany({
            where: { machineUtilId: mu.id }
          });

          // Delete related DownTime records
          await tx.downTime.deleteMany({
            where: { machineUtilId: mu.id }
          });

          // Delete related RepairCheck records
          await tx.repairCheck.deleteMany({
            where: { machineUtilId: mu.id }
          });
        }

        await tx.machineUtilization.deleteMany({
          where: { utilReqId: req.id }
        });

        // Delete related UserTool records
        await tx.userTool.deleteMany({
          where: { utilReqId: req.id }
        });

        // Delete related UserService records
        await tx.userService.deleteMany({
          where: { utilReqId: req.id }
        });

        // Delete related UtilTime records
        await tx.utilTime.deleteMany({
          where: { utilReqId: req.id }
        });
      }

      // Delete UtilReq records
      await tx.utilReq.deleteMany({
        where: { accInfoId: user.id }
      });

      // Handle EVCReservation foreign key constraints
      const evcReservations = await tx.eVCReservation.findMany({
        where: { accInfoId: user.id }
      });

      for (const res of evcReservations) {
        // Delete related LabDate records
        await tx.labDate.deleteMany({
          where: { evcId: res.id }
        });

        // Delete related EVCStudent records
        await tx.eVCStudent.deleteMany({
          where: { evcId: res.id }
        });

        // Delete related NeededMaterial records
        await tx.neededMaterial.deleteMany({
          where: { evcId: res.id }
        });
      }

      // Delete EVCReservation records
      await tx.eVCReservation.deleteMany({
        where: { accInfoId: user.id }
      });

      // Finally, delete the AccInfo record
      await tx.accInfo.delete({
        where: { id: user.id }
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}