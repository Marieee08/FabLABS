// app/api/services/route.ts
import { NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';

// Initialize Prisma client - moved outside function to avoid multiple instances
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

export async function GET() {
  try {
    // Fetch services with complete machine data including Number field
    // When returning service data, ensure machine.isAvailable is included in the response
    const services = await prisma.service.findMany({
      include: {
        Machines: {
          include: {
            machine: {
              select: {
                id: true,
                Machine: true,
                Number: true,
                isAvailable: true  // Make sure this field is included
              }
            }
          }
        }
      }
    });

    // Return the response with proper headers
    return NextResponse.json(services, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, max-age=0'
      }
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    
    // Determine if this is a Prisma error or something else
    let errorMessage = 'Failed to fetch services';
    let statusCode = 500;
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Handle specific Prisma errors
      if (error.code === 'P2002') {
        errorMessage = 'A service with that name already exists';
        statusCode = 409;
      } else if (error.code === 'P2001') {
        errorMessage = 'The requested record does not exist';
        statusCode = 404;
      }
    } else if (error instanceof Prisma.PrismaClientInitializationError) {
      errorMessage = 'Database connection failed';
      statusCode = 503;
    }
    
    return NextResponse.json({ error: errorMessage, details: error instanceof Error ? error.message : 'Unknown error' }, {
      status: statusCode
    });
  }
}

// POST handler
export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const validationErrors = validateServiceData(body);
    if (validationErrors.length > 0) {
      return NextResponse.json({ errors: validationErrors }, {
        status: 400
      });
    }

    // Handle Costs conversion
    let costsValue = null;
    if (body.Costs !== null && body.Costs !== undefined && body.Costs !== '') {
      try {
        costsValue = new Prisma.Decimal(body.Costs);
      } catch (error) {
        return NextResponse.json({ error: 'Invalid cost value' }, {
          status: 400
        });
      }
    }
    
    const serviceData = {
      Service: body.Service,
      Icon: body.Icon || null,
      Info: body.Info || null,
      Costs: costsValue,
      Per: body.Per || null
    };
    
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
    
    return NextResponse.json(service, {
      status: 201
    });
  } catch (error) {
    console.error('Server error creating service:', error);
    
    // Handle specific Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return NextResponse.json({ error: 'A service with that name already exists' }, {
          status: 409
        });
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to create service',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, {
      status: 500
    });
  }
}

// Add a HEAD request handler for preflight checks
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });
}