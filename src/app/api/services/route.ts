// app/api/services/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

// Validation function
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
  
  if (data.Costs !== null && data.Costs !== undefined) {
    const cost = Number(data.Costs);
    if (isNaN(cost)) {
      errors.push('Costs must be a valid number if provided');
    }
  }
  
  if (data.Per !== null && data.Per !== undefined && typeof data.Per !== 'string') {
    errors.push('Per must be a string if provided');
  }
  
  return errors;
}

// GET handler
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

// POST handler
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    console.log('Received body:', body);
    
    const validationErrors = validateServiceData(body);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        { errors: validationErrors },
        { status: 400 }
      );
    }

    // Handle Costs conversion
    let costsValue = null;
    if (body.Costs !== null && body.Costs !== undefined && body.Costs !== '') {
      try {
        costsValue = new Prisma.Decimal(body.Costs);
      } catch (error) {
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

    console.log('Creating service with data:', serviceData);
    
    const service = await prisma.service.create({
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
  } catch (error) {
    console.error('Server error creating service:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create service',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}