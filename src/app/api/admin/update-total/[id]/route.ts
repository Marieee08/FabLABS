// src/app/api/admin/update-total/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: "Invalid reservation ID" },
        { status: 400 }
      );
    }

    // First check if the request body can be parsed
    let totalAmount;
    try {
      const body = await req.json();
      totalAmount = body.totalAmount;
      console.log("Received request body:", body);
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Validate the total amount
    if (totalAmount === undefined || totalAmount === null) {
      return NextResponse.json(
        { error: "Total amount is required" },
        { status: 400 }
      );
    }

    // Convert the total amount to a number if it's a string
    let processedAmount: number;
    if (typeof totalAmount === 'string') {
      processedAmount = parseFloat(totalAmount);
      if (isNaN(processedAmount)) {
        return NextResponse.json(
          { error: "Invalid total amount value" },
          { status: 400 }
        );
      }
    } else if (typeof totalAmount === 'number') {
      processedAmount = totalAmount;
    } else {
      return NextResponse.json(
        { error: `Total amount must be a number or numeric string, received ${typeof totalAmount}` },
        { status: 400 }
      );
    }

    console.log(`Updating reservation ${id} with total amount: ${processedAmount}`);

    // Check if the reservation exists before updating
    const existingReservation = await prisma.utilReq.findUnique({
      where: { id }
    });

    if (!existingReservation) {
      return NextResponse.json(
        { error: `Reservation with ID ${id} not found` },
        { status: 404 }
      );
    }

    // Update the total amount
    const updatedReservation = await prisma.utilReq.update({
      where: { id },
      data: { 
        TotalAmntDue: processedAmount
      }
    });

    console.log(`Updated reservation total amount: ${updatedReservation.TotalAmntDue}`);

    return NextResponse.json({
      success: true,
      updatedTotal: processedAmount,
      message: `Total amount updated successfully to ${processedAmount}`
    });
  } catch (error) {
    console.error("Error updating total amount:", error);
    return NextResponse.json(
      { error: `Failed to update total amount: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}