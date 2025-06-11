// api/tools/[id]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    const tools = await prisma.tool.findMany({
      take: limit,
      skip: offset
    });

    return NextResponse.json(tools);
  } catch (error) {
    console.error('Error fetching tools:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch tools', 
        details: error instanceof Error ? error.message : String(error)
      }, 
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const data = await request.json();
    const { Tool, Quantity } = data;

    const tool = await prisma.tool.update({
      where: {
        id: id,
      },
      data: {
        Tool,
        Quantity: parseInt(Quantity),
      },
    });

    return NextResponse.json(tool);
  } catch (error) {
    console.error('Error updating tool:', error);
    return NextResponse.json({ error: 'Failed to update tool' }, { status: 500 });
  }
}

// DELETE /api/tools/[id] - Delete a tool
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.tool.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({ message: 'Tool deleted successfully' });
  } catch (error) {
    console.error('Error deleting tool:', error);
    return NextResponse.json({ error: 'Failed to delete tool' }, { status: 500 });
  }
}