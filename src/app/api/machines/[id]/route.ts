import { NextResponse } from 'next/server';
import { Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function validateMachineData(data: any) {
  const errors = [];
  
  if (!data.Machine || typeof data.Machine !== 'string') {
    errors.push('Machine name is required and must be a string');
  }
  
  if (!data.Desc || typeof data.Desc !== 'string') {
    errors.push('Description is required and must be a string');
  }
  
  if (!data.Image || typeof data.Image !== 'string') {
    errors.push('Image URL is required and must be a string');
  }

  if (data.Link !== null && data.Link !== undefined && typeof data.Link !== 'string') {
    errors.push('Link must be a string if provided');
  }

  if (data.Instructions !== null && data.Instructions !== undefined && typeof data.Instructions !== 'string') {
    errors.push('Instructions must be a string if provided');
  }

  if (!Array.isArray(data.serviceIds)) {
    errors.push('serviceIds must be an array');
  }
  
  return errors;
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    console.log('Update request body:', body);
    console.log('Machine ID:', params.id);
    
    const validationErrors = validateMachineData(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { errors: validationErrors },
        { status: 400 }
      );
    }

    // First, update the machine details
    const machineData = {
      Machine: body.Machine,
      Image: body.Image,
      Desc: body.Desc,
      Instructions: body.Instructions || null,
      Link: body.Link || null,
      isAvailable: body.isAvailable ?? true,
    };

    // Start a transaction to handle both machine update and services update
    const updatedMachine = await prisma.$transaction(async (tx) => {
      // Update the machine
      const machine = await tx.machine.update({
        where: { id: params.id },
        data: machineData,
      });

      // Delete existing service relationships
      await tx.machineService.deleteMany({
        where: { machineId: params.id }
      });

      // Create new service relationships
      if (body.serviceIds && body.serviceIds.length > 0) {
        await tx.machineService.createMany({
          data: body.serviceIds.map((serviceId: string) => ({
            machineId: params.id,
            serviceId: serviceId
          }))
        });
      }

      // Fetch the updated machine with services
      return await tx.machine.findUnique({
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

    if (!updatedMachine) {
      return NextResponse.json(
        { error: 'Machine not found' },
        { status: 404 }
      );
    }

    // Transform the response to match the expected format
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
    console.error('Error updating machine:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Machine not found' },
          { status: 404 }
        );
      }
    }
    return NextResponse.json(
      { 
        error: 'Failed to update machine',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
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
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // First, delete all related machine services
    await prisma.machineService.deleteMany({
      where: { machineId: params.id }
    });
    
    // Then delete the machine
    const machine = await prisma.machine.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json(machine);
  } catch (error) {
    console.error('Error deleting machine:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Machine not found' },
          { status: 404 }
        );
      }
    }
    return NextResponse.json(
      { error: 'Failed to delete machine' },
      { status: 500 }
    );
  }
}