import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    console.log('Raw request body:', JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.Machine?.trim()) {
      return NextResponse.json(
        { error: 'Machine name is required' }, 
        { status: 400 }
      );
    }

    if (!body.Desc?.trim()) {
      return NextResponse.json(
        { error: 'Machine description is required' }, 
        { status: 400 }
      );
    }

    // Create the machine first
    const newMachine = await prisma.machine.create({
      data: {
        Machine: body.Machine.trim(),
        Image: body.Image || '',
        Desc: body.Desc.trim(),
        Link: body.Link?.trim() || null,
        isAvailable: body.isAvailable ?? true,
      },
    });

    // Then create services if they exist
    if (body.Services && body.Services.length > 0) {
      const servicesPromises = body.Services
        .filter((service: any) => service.Service?.trim() && service.Costs != null)
        .map((service: any) => 
          prisma.service.create({
            data: {
              Service: service.Service.trim(),
              Costs: new Prisma.Decimal(service.Costs),
              machineId: newMachine.id
            }
          })
        );

      await Promise.all(servicesPromises);
    }

    // Fetch the complete machine with services
    const completeNewMachine = await prisma.machine.findUnique({
      where: { id: newMachine.id },
      include: { Services: true }
    });

    return NextResponse.json(completeNewMachine, { 
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Machine Creation Error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Prisma Error Details:', {
        code: error.code,
        message: error.message,
        meta: error.meta
      });
    }
    return NextResponse.json(
      { 
        error: 'Failed to create machine',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const includeServices = searchParams.get('includeServices') === 'true';

  try {
    const machines = await prisma.machine.findMany({
      include: {
        Services: includeServices
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(machines, { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Machines Fetch Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch machines' }, 
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

    const deletedMachine = await prisma.machine.delete({
      where: { id: machineId },
      include: {
        Services: true
      }
    });

    return NextResponse.json(deletedMachine, { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Machine Deletion Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to delete machine',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}