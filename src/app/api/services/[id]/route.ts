// app/api/services/[id]/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { Decimal, PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

function validateServiceData(data: any) {
  const errors = [];
  
  if (!data.Service || typeof data.Service !== 'string') {
    errors.push('Service name is required and must be a string');
  }
  
  if (data.Icon !== null && data.Icon !== undefined && typeof data.Icon !== 'string') {
    errors.push('Icon must be a string if provided');
  }
  
  if (!data.Info || typeof data.Info !== 'string') {
    errors.push('Info is required and must be a string');
  }
  
  if (data.Costs !== null && data.Costs !== undefined) {
    const cost = Number(data.Costs);
    if (isNaN(cost)) {
      errors.push('Costs must be a valid number if provided');
    }
  }
  
  if (!data.Per || typeof data.Per !== 'string') {
    errors.push('Per is required and must be a string');
  }
  
  return errors;
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await req.json();
    console.log('Update request body:', body);
    console.log('Service ID:', params.id);
    
    const validationErrors = validateServiceData(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { errors: validationErrors },
        { status: 400 }
      );
    }

    let costsValue = null;
    if (body.Costs !== null && body.Costs !== undefined && body.Costs !== '') {
      try {
        costsValue = new Decimal(body.Costs);
      } catch (decimalError) {
        return NextResponse.json(
          { error: 'Invalid cost value' },
          { status: 400 }
        );
      }
    }
    
    const serviceData = {
      Service: body.Service,
      Icon: body.Icon || null,
      Info: body.Info || null,
      Costs: costsValue,
      Per: body.Per || null
    };

    console.log('Updating service with data:', serviceData);
    
    const service = await prisma.service.update({
      where: { id: params.id },
      data: serviceData,
      include: {
        Machines: {
          include: {
            machine: true
          }
        }
      }
    });
    
    return NextResponse.json(service);
  } catch (error: unknown) {
    console.error('Error updating service:', error);
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Service not found' },
          { status: 404 }
        );
      }
    }
    return NextResponse.json(
      { 
        error: 'Failed to update service',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    
    // First delete all related MachineService records
    await prisma.machineService.deleteMany({
      where: { serviceId: params.id }
    });
    
    // Then delete the service
    const service = await prisma.service.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json(service);
  } catch (error: unknown) {
    console.error('Error deleting service:', error);
    if (error instanceof PrismaClientKnownRequestError) {
      if (error.code === 'P2025') {
        return NextResponse.json(
          { error: 'Service not found' },
          { status: 404 }
        );
      }
    }
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    );
  }
}