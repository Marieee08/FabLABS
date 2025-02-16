// app/api/machines/[id]/route.ts

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { promises as fs } from 'fs';
import path from 'path';

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  if (!params.id) {
    console.error('No machine ID provided');
    return NextResponse.json({ error: 'Machine ID is required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    console.log(`Updating machine ${params.id} with body:`, JSON.stringify(body, null, 2));

    // Validate input
    if (!body.Machine?.trim() || !body.Desc?.trim()) {
      console.error('Validation failed:', { Machine: body.Machine, Desc: body.Desc });
      return NextResponse.json({ error: 'Machine name and description are required' }, { status: 400 });
    }

    // Check if machine exists first
    const existingMachine = await prisma.machine.findUnique({
      where: { id: params.id }
    });

    if (!existingMachine) {
      console.error(`Machine ${params.id} not found`);
      return NextResponse.json({ error: 'Machine not found' }, { status: 404 });
    }

    try {
      // Update machine without transaction first
      const updatedMachine = await prisma.machine.update({
        where: { id: params.id },
        data: {
          Machine: body.Machine.trim(),
          Image: body.Image || '',
          Desc: body.Desc.trim(),
          Link: body.Link || null,
          isAvailable: body.isAvailable ?? true,
        },
      });

      console.log('Machine updated successfully:', updatedMachine);

      // Delete existing services
      await prisma.service.deleteMany({
        where: { machineId: params.id }
      });

      console.log('Existing services deleted');

      // Add new services
      if (body.Services?.length > 0) {
        const newServices = await prisma.service.createMany({
          data: body.Services
            .filter((service: any) => service.Service?.trim() && service.Costs != null)
            .map((service: any) => ({
              Service: service.Service.trim(),
              Costs: new Prisma.Decimal(service.Costs),
              machineId: params.id
            }))
        });
        console.log('New services created:', newServices);
      }

      // Fetch final result
      const finalMachine = await prisma.machine.findUnique({
        where: { id: params.id },
        include: { Services: true }
      });

      console.log('Final machine state:', finalMachine);

      return NextResponse.json(finalMachine);

    } catch (dbError) {
      console.error('Database operation failed:', dbError);
      throw dbError; // Re-throw to be caught by outer try-catch
    }

  } catch (error) {
    console.error('Machine Update Error:', error);
    // Ensure we always return a valid JSON response
    return NextResponse.json({
      error: 'Failed to update machine',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// In your AdminServices.tsx component, update the handleSubmit function:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    let imageUrl = formData.Image;
    if (imageFile) {
      const uploadedImageUrl = await handleImageUpload();
      if (!uploadedImageUrl) {
        throw new Error('Failed to upload image');
      }
      imageUrl = uploadedImageUrl;
    }

    const machinePayload = {
      Machine: formData.Machine?.trim(),
      Image: imageUrl,
      Desc: formData.Desc?.trim(),
      Instructions: formData.Instructions?.trim() || null,
      Link: formData.Link?.trim() || null,
      isAvailable: formData.isAvailable ?? true,
      Services: formData.Services?.filter(service => 
        service.Service && service.Service.trim() !== ''
      ).map(service => ({
        Service: service.Service.trim(),
        Costs: parseFloat(service.Costs.toString()) || 0
      }))
    };

    console.log('Sending payload:', machinePayload);

    const response = await fetch(
      editingMachine 
        ? `/api/machines/${editingMachine.id}`
        : '/api/machines',
      {
        method: editingMachine ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(machinePayload)
      }
    );

    const responseText = await response.text();
    console.log('Raw response:', responseText);

    if (!responseText) {
      throw new Error('Empty response received from server');
    }

    let savedMachine;
    try {
      savedMachine = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse response:', responseText);
      throw new Error('Invalid response format from server');
    }

    if (!response.ok) {
      throw new Error(savedMachine.error || 'Failed to save machine');
    }

    setMachines(prevMachines => {
      if (editingMachine) {
        return prevMachines.map(m => m.id === savedMachine.id ? savedMachine : m);
      }
      return [...prevMachines, savedMachine];
    });

    closeModal();
  } catch (error) {
    console.error('Save error:', error);
    alert(error instanceof Error ? error.message : 'Failed to save machine');
  }
};

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();

    const updatedMachine = await prisma.machine.update({
      where: { id: params.id },
      data: { isAvailable: body.isAvailable }
    });

    return NextResponse.json(updatedMachine);
  } catch (error) {
    const err = error as Error;
    console.error('Server error:', err.message);
    return NextResponse.json(
      { error: 'Failed to update machine' }, 
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const machine = await prisma.machine.findUnique({
      where: { id: params.id }
    });

    if (!machine) {
      return NextResponse.json(
        { error: 'Machine not found' },
        { status: 404 }
      );
    }

    console.log('Machine Image Path:', machine.Image);
    console.log('Current Working Directory:', process.cwd());

    if (machine.Image) {
      try {
        const imagePath = machine.Image.startsWith('/') 
          ? machine.Image.slice(1)
          : machine.Image;
        
        const fullImagePath = path.join(process.cwd(), 'public', imagePath);

        console.log('Full Image Path:', fullImagePath);

        try {
          await fs.access(fullImagePath);
          await fs.unlink(fullImagePath);
          console.log(`Deleted image: ${fullImagePath}`);
        } catch (fileError) {
          const fsError = fileError as NodeJS.ErrnoException;
          console.warn('Could not delete image:', {
            path: fullImagePath,
            code: fsError.code,
            message: fsError.message
          });
        }
      } catch (pathError) {
        const error = pathError as Error;
        console.error('Error processing image path:', error.message);
      }
    }

    const deletedMachine = await prisma.machine.delete({
      where: {
        id: params.id
      }
    });

    return NextResponse.json(deletedMachine, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    const err = error as Error;
    console.error('Server error details:', err.message);
    return NextResponse.json(
      { 
        error: 'Failed to delete machine', 
        details: err.message
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}