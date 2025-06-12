// src\app\api\machines\route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.Machine?.trim() || !body.Desc?.trim()) {
      return NextResponse.json(
        { error: 'Machine name and description are required' },
        { status: 400 }
      );
    }

    // Validate Number field if provided
    if (body.Number !== undefined && body.Number !== null) {
      if (typeof body.Number !== 'number' || isNaN(body.Number) || body.Number < 0) {
        return NextResponse.json(
          { error: 'Number of machines must be a positive number if provided' },
          { status: 400 }
        );
      }
    }

    // Create the machine and its service relationships in a transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Create the machine
      const machine = await tx.machine.create({
        data: {
          Machine: body.Machine.trim(),
          Image: body.Image || '',
          Desc: body.Desc.trim(),
          Number: body.Number !== undefined ? body.Number : null, // Handle Number field
          Instructions: body.Instructions?.trim() || null,
          Link: body.Link?.trim() || null,
          isAvailable: body.isAvailable ?? true,
        },
      });

      // Create service relationships if serviceIds are provided
      if (body.serviceIds?.length > 0) {
        await tx.machineService.createMany({
          data: body.serviceIds.map((serviceId: string) => ({
            machineId: machine.id,
            serviceId: serviceId
          }))
        });
      }

      // Return the complete machine with services
      return tx.machine.findUnique({
        where: { id: machine.id },
        include: {
          Services: {
            include: {
              service: true
            }
          }
        }
      });
    });

    // Transform the response
    const transformedMachine = result ? {
      ...result,
      Services: result.Services.map((ms: any) => ({
        id: ms.service.id,
        Service: ms.service.Service,
        Costs: ms.service.Costs,
        Icon: ms.service.Icon,
        Info: ms.service.Info,
        Per: ms.service.Per
      }))
    } : null;

    return NextResponse.json(transformedMachine, { status: 201 });
  } catch (error) {
    console.error('Machine Creation Error:', error);
    return NextResponse.json(
      { error: 'Failed to create machine' },
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
        Services: {
          include: {
            service: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the response to match the expected format
    const transformedMachines = machines.map((machine: any) => ({
      ...machine,
      Services: machine.Services.map((ms: any) => ({
        id: ms.service.id,
        Service: ms.service.Service,
        Costs: ms.service.Costs,
        Icon: ms.service.Icon,
        Info: ms.service.Info,
        Per: ms.service.Per
      }))
    }));

    return NextResponse.json(transformedMachines);
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