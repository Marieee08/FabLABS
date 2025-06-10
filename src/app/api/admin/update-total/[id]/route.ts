import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Interface for the payload sent from CostBreakdown component
interface UpdateTotalBody {
  totalAmount: string;
  services?: Array<{
    id: string;
    minutes: string | null;
  }>;
  // Keep original fields for backward compatibility
  utilTimes?: Array<{
    id: number;
    DayNum: number | null;
    StartTime: string | null;
    EndTime: string | null;
    DateStatus?: string | null;
  }>;
  downtimeDetails?: {
    totalDowntimeMinutes: number;
    totalDeduction: number;
  };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Await the params Promise
  const { id } = await params;
  
  console.log("Update total handler called for ID:", id);
  
  try {
    const reservationId = parseInt(id);

    if (isNaN(reservationId)) {
      console.error("Invalid reservation ID:", id);
      return NextResponse.json(
        { error: "Invalid reservation ID" },
        { status: 400 }
      );
    }

    // Parse the request body
    let body: UpdateTotalBody;
    try {
      const text = await req.text();
      console.log("Raw request body:", text);
      body = JSON.parse(text);
    } catch (parseError) {
      console.error("Error parsing request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request body", details: parseError instanceof Error ? parseError.message : "Unknown parse error" },
        { status: 400 }
      );
    }
    
    console.log("Parsed update request:", body);

    if (!body.totalAmount) {
      console.error("Missing totalAmount in request");
      return NextResponse.json(
        { error: "totalAmount is required" },
        { status: 400 }
      );
    }

    // Check if the reservation exists
    console.log("Checking if reservation exists:", reservationId);
    const existingReservation = await prisma.utilReq.findUnique({
      where: { id: reservationId },
      include: {
        UtilTimes: true,
        UserServices: true
      }
    });

    if (!existingReservation) {
      console.error("Reservation not found:", reservationId);
      return NextResponse.json(
        { error: "Reservation not found" },
        { status: 404 }
      );
    }
    
    console.log("Found reservation:", existingReservation.id);

    // Get existing comments
    let comments = existingReservation.Comments || "";
    
    // Process downtime information if provided
    if (body.downtimeDetails && body.downtimeDetails.totalDowntimeMinutes > 0) {
      const downtimeNote = `[${new Date().toISOString().split('T')[0]}] Downtime adjustment: ${body.downtimeDetails.totalDowntimeMinutes} minutes resulted in ₱${body.downtimeDetails.totalDeduction.toFixed(2)} deduction.`;
      comments = comments ? `${comments}\n\n${downtimeNote}` : downtimeNote;
    }

    console.log("Starting database updates...");
    
    // Update total amount first (without transaction to simplify)
    console.log("Updating total amount to:", body.totalAmount);
    await prisma.utilReq.update({
      where: { id: reservationId },
      data: {
        TotalAmntDue: body.totalAmount,
        Comments: comments
      }
    });
    
    console.log("Total amount updated successfully");

    // Update service minutes if provided
    if (body.services && body.services.length > 0) {
      console.log("Updating service minutes:", body.services);
      
      for (const service of body.services) {
        try {
          // Converting the minutes string to a number (or null if not provided)
          const minutes = service.minutes ? parseFloat(service.minutes) : null;
          
          console.log(`Updating service ${service.id} with minutes:`, minutes);
          
          await prisma.userService.update({
            where: { id: service.id },
            data: {
              MinsAvail: minutes
            }
          });
          
          console.log(`Service ${service.id} updated successfully`);
        } catch (serviceError) {
          console.error(`Error updating service ${service.id}:`, serviceError);
          // Continue with other services even if one fails
        }
      }
    }
    
    // Handle the original utilTimes update if present (for backward compatibility)
    if (body.utilTimes && body.utilTimes.length > 0) {
      console.log("Updating util times:", body.utilTimes);
      
      for (const time of body.utilTimes) {
        try {
          await prisma.utilTime.update({
            where: { id: time.id },
            data: {
              StartTime: time.StartTime ? new Date(time.StartTime) : null,
              EndTime: time.EndTime ? new Date(time.EndTime) : null,
              DateStatus: time.DateStatus || "Ongoing",
              DayNum: time.DayNum
            }
          });
        } catch (timeError) {
          console.error(`Error updating time ${time.id}:`, timeError);
          // Continue with other times even if one fails
        }
      }
    }

    // Get updated reservation to return
    const updatedReservation = await prisma.utilReq.findUnique({
      where: { id: reservationId },
      include: {
        UtilTimes: true,
        UserServices: true
      }
    });

    console.log("All updates completed successfully");
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: "Total amount and service minutes updated successfully",
      data: updatedReservation
    });
  } catch (error) {
    console.error("Error updating reservation:", error);
    return NextResponse.json(
      {
        error: "Failed to update reservation",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}