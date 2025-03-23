// src/app/api/admin/direct-admin/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log(`Direct admin lookup called with ID: ${params.id}`);
  
  try {
    const id = parseInt(params.id);
    
    if (isNaN(id)) {
      console.error(`Invalid ID format: ${params.id}`);
      return NextResponse.json({ error: 'Invalid ID format' }, { status: 400 });
    }

    // Find the admin by ID directly
    const admin = await prisma.accInfo.findUnique({
      where: { id },
      select: {
        id: true,
        Name: true,
        email: true,
        Role: true
      }
    });

    if (!admin) {
      console.error(`Admin not found for ID: ${id}`);
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    console.log(`Admin found:`, admin);
    return NextResponse.json({
      id: admin.id,
      name: admin.Name,
      email: admin.email,
      role: admin.Role
    });
    
  } catch (error) {
    console.error('Error fetching direct admin details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch admin details' },
      { status: 500 }
    );
  }
}