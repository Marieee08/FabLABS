// /api/cashier/confirm-payment/[id]/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await the params Promise
    const { id: paramId } = await params;
    const id = parseInt(paramId);
    const { receiptNumber } = await req.json();

    // Validate input
    if (!receiptNumber) {
      return NextResponse.json(
        { error: "Receipt number is required" },
        { status: 400 }
      );
    }

    // Update reservation with payment details
    const updatedReservation = await prisma.utilReq.update({
      where: {
        id: id,
      },
      data: {
        Status: "Completed",
        ReceiptNumber: receiptNumber,
        PaymentDate: new Date(), // Automatically set to current date
      },
      include: {
        accInfo: {
          select: {
            Name: true,
            email: true,
          },
        },
        UserServices: true,
        UserTools: true,
        UtilTimes: true,
      },
    });

    return NextResponse.json(updatedReservation);
  } catch (error) {
    console.error("Error confirming payment:", error);
    return NextResponse.json(
      { error: "Failed to confirm payment" },
      { status: 500 }
    );
  }
}