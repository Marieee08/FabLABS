import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    if (!params.id) {
      return new NextResponse(
        JSON.stringify({ error: 'Machine ID is required' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.Machine?.trim() || !body.Desc?.trim()) {
      return new NextResponse(
        JSON.stringify({ error: 'Machine name and description are required' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Update machine and its service relationships in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the machine
      const updatedMachine = await tx.machine.update({
        where: { id: params.id },
        data: {
          Machine: body.Machine.trim(),
          Image: body.Image || '',
          Desc: body.Desc.trim(),
          Instructions: body.Instructions?.trim() || null,
          Link: body.Link?.trim() || null,
          isAvailable: body.isAvailable ?? true,
        },
      });

      // Delete existing service relationships
      await tx.machineService.deleteMany({
        where: { machineId: params.id }
      });

      // Create new service relationships
      if (body.serviceIds?.length > 0) {
        await tx.machineService.createMany({
          data: body.serviceIds.map((serviceId: string) => ({
            machineId: updatedMachine.id,
            serviceId: serviceId
          }))
        });
      }

      // Fetch the updated machine with services
      const machineWithServices = await tx.machine.findUnique({
        where: { id: updatedMachine.id },
        include: {
          Services: {
            include: {
              service: true
            }
          }
        }
      });

      if (!machineWithServices) {
        throw new Error('Failed to fetch updated machine');
      }

      return {
        ...machineWithServices,
        Services: machineWithServices.Services.map(ms => ({
          id: ms.service.id,
          Service: ms.service.Service,
          Costs: ms.service.Costs,
          Icon: ms.service.Icon,
          Info: ms.service.Info,
          Per: ms.service.Per
        }))
      };
    });

    return new NextResponse(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Machine Update Error:', error);
    return new NextResponse(
      JSON.stringify({ 
        error: 'Failed to update machine',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();

    const updatedMachine = await prisma.machine.update({
      where: { id: params.id },
      data: { isAvailable: body.isAvailable },
      include: {
        Services: {
          include: {
            service: true
          }
        }
      }
    });

    // Transform the response
    const transformedMachine = {
      ...updatedMachine,
      Services: updatedMachine.Services.map(ms => ({
        id: ms.service.id,
        Service: ms.service.Service,
        Costs: ms.service.Costs,
        Icon: ms.service.Icon,
        Info: ms.service.Info,
        Per: ms.service.Per
      }))
    };

    return NextResponse.json(transformedMachine);
  } catch (error) {
    console.error('Machine Update Error:', error);
    return NextResponse.json(
      { error: 'Failed to update machine availability' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Delete in a transaction to ensure all related records are removed
    const result = await prisma.$transaction(async (tx) => {
      // Delete machine-service relationships first
      await tx.machineService.deleteMany({
        where: { machineId: params.id }
      });

      // Then delete the machine
      return tx.machine.delete({
        where: { id: params.id },
        include: {
          Services: {
            include: {
              service: true
            }
          }
        }
      });
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Machine Deletion Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete machine' },
      { status: 500 }
    );
  }
}