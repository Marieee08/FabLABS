import type { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Extract the service ID from the query
  const { id } = req.query;

  // Ensure id is a string
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid service ID' });
  }

  // Handle different HTTP methods
  switch (req.method) {
    case 'PUT':
      return await updateService(req, res, id);
    case 'DELETE':
      return await deleteService(req, res, id);
    default:
      // Explicitly set allowed methods
      res.setHeader('Allow', ['PUT', 'DELETE']);
      return res.status(405).json({ 
        error: `Method ${req.method} Not Allowed`,
        allowedMethods: ['PUT', 'DELETE']
      });
  }
}

// UPDATE a service
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
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
    
    const service = await prisma.service.update({
      where: { id: params.id },
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
    console.error('Error updating service:', error);
    return NextResponse.json(
      { error: 'Failed to update service' },
      { status: 500 }
    );
  }
}

// DELETE a service
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // First delete all related MachineService records
    await prisma.machineService.deleteMany({
      where: { serviceId: params.id }
    });
    
    // Then delete the service
    await prisma.service.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json(
      { message: 'Service deleted successfully' }
    );
  } catch (error) {
    console.error('Error deleting service:', error);
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    );
  }
}