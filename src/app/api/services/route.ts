import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function validateServiceData(data: any) {
  const errors = [];
  
  if (!data.Service || typeof data.Service !== 'string') {
    errors.push('Service name is required and must be a string');
  }
  
  if (data.Icon !== null && data.Icon !== undefined && typeof data.Icon !== 'string') {
    errors.push('Icon must be a string if provided');
  }
  
  if (data.Info !== null && data.Info !== undefined && typeof data.Info !== 'string') {
    errors.push('Info must be a string if provided');
  }
  
  if (data.Costs !== null && data.Costs !== undefined && typeof Number(data.Costs) !== 'number') {
    errors.push('Costs must be a number if provided');
  }
  
  if (data.Per !== null && data.Per !== undefined && typeof data.Per !== 'string') {
    errors.push('Per must be a string if provided');
  }
  
  return errors;
}

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      include: {
        Machines: {
          include: {
            machine: true
          }
        }
      }
    });
    
    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate request body
    const validationErrors = validateServiceData(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { errors: validationErrors },
        { status: 400 }
      );
    }
    
    const service = await prisma.service.create({
      data: {
        Service: body.Service,
        Icon: body.Icon || null,
        Info: body.Info || null,
        Costs: body.Costs ? Number(body.Costs) : null,
        Per: body.Per || null
      },
      include: {
        Machines: {
          include: {
            machine: true
          }
        }
      }
    });
    
    return NextResponse.json(service);
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const machineId = searchParams.get('machineId');

    if (!machineId) {
      return NextResponse.json(
        { error: 'Machine ID is required' }, 
        { status: 400 }
      );
    }

    const deleteResult = await prisma.service.deleteMany({
      where: { machineId: machineId }
    });

    console.log('Deleted services:', deleteResult);

    return NextResponse.json(deleteResult, { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Service Deletion Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete services',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}