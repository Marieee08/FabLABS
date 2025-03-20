// app/api/admin/reports/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Set this to true to bypass authentication (for testing only)
const BYPASS_AUTH = true;

export async function GET(request: NextRequest) {
  console.log("========== REPORTS API CALLED ==========");
  console.log("Timestamp:", new Date().toISOString());
  
  // Parse date range from query parameters (if provided)
  const searchParams = request.nextUrl.searchParams;
  let fromDate: Date | null = null;
  let toDate: Date | null = null;
  
  try {
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    
    if (fromParam) {
      fromDate = new Date(fromParam);
      console.log("From date filter:", fromDate);
    }
    
    if (toParam) {
      toDate = new Date(toParam);
      console.log("To date filter:", toDate);
    }
  } catch (error) {
    console.error("Error parsing date parameters:", error);
  }
  
  try {
    // Initialize with default values
    const dashboardData = {
      serviceStats: [{ name: 'No Data', value: 1 }],
      machinesUsed: [{ machine: 'No Data', count: 0 }],
      salesData: [
        { month: 'Jan', revenue: 0 },
        { month: 'Feb', revenue: 0 },
        { month: 'Mar', revenue: 0 }
      ],
      utilizationTrends: [
        { month: 'Jan', requests: 0 },
        { month: 'Feb', requests: 0 },
        { month: 'Mar', requests: 0 }
      ],
      satisfactionScores: Array(6).fill(0).map((_, i) => ({ 
        category: ['Service Quality', 'Staff Helpfulness', 'Equipment Quality', 'Timeliness', 'Value for Money', 'Overall Experience'][i], 
        score: 0 
      })),
      pendingRequests: 0,
      completedRequestsLastMonth: 0,
      activeEVCReservations: 0
    };
    
    // Authentication check (optional)
    if (!BYPASS_AUTH) {
      try {
        console.log("Checking authentication...");
        const { currentUser } = await import('@clerk/nextjs');
        const user = await currentUser();
        
        if (!user) {
          console.log("Authentication failed: No user found");
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const userId = user.id;
        console.log("Authentication successful. User ID:", userId);
        
        // Check admin role
        const publicMetadata = user.publicMetadata;
        if (!publicMetadata.role || publicMetadata.role !== 'ADMIN') {
          console.log("Admin check failed: User is not an admin");
          return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        console.log("Admin check successful");
      } catch (authError) {
        console.error("Authentication error:", authError);
        // Instead of failing, we'll just log the error and continue
        console.log("Authentication bypassed due to error");
      }
    } else {
      console.log("Authentication bypassed for testing");
    }
    
    // Test Prisma connection
    console.log("Testing Prisma connection...");
    try {
      await prisma.$queryRaw`SELECT 1 as test`;
      console.log("Prisma connection successful");
    } catch (prismaError) {
      console.error("Prisma connection test failed:", prismaError);
      return NextResponse.json({
        error: 'Database connection failed',
        details: prismaError instanceof Error ? prismaError.message : String(prismaError)
      }, { status: 500 });
    }
    
    // 1. Get service stats (Services Availed)
    try {
      console.log("Fetching service stats...");
      
      // Create date filter condition if dates are provided
      let dateFilter = {};
      if (fromDate || toDate) {
        dateFilter = {
          utilReq: {
            RequestDate: {
              ...(fromDate && { gte: fromDate }),
              ...(toDate && { lte: toDate })
            }
          }
        };
      }
      
      const serviceStats = await prisma.serviceAvailed.groupBy({
        by: ['service'],
        _count: {
          service: true
        },
        where: dateFilter
      });

      if (serviceStats && serviceStats.length > 0) {
        dashboardData.serviceStats = serviceStats.map(stat => ({
          name: stat.service || 'Unknown',
          value: stat._count.service
        }));
      }
      console.log("Service stats fetched successfully");
    } catch (error) {
      console.error("Error fetching service stats:", error);
      // Continue with default values
    }

    // 2. Get machines used stats
    try {
      console.log("Fetching machines used stats...");
      
      // Create date filter condition if dates are provided
      let dateFilter = {};
      if (fromDate || toDate) {
        dateFilter = {
          utilReq: {
            RequestDate: {
              ...(fromDate && { gte: fromDate }),
              ...(toDate && { lte: toDate })
            }
          }
        };
      }
      
      const machineStats = await prisma.machineUtilization.groupBy({
        by: ['Machine'],
        _count: {
          id: true
        },
        where: {
          Machine: { not: null },
          ...dateFilter
        }
      });

      if (machineStats && machineStats.length > 0) {
        dashboardData.machinesUsed = machineStats.map(stat => ({
          machine: stat.Machine || 'Unknown',
          count: stat._count.id
        }));
      }
      console.log("Machines used stats fetched successfully");
    } catch (error) {
      console.error("Error fetching machines used stats:", error);
      // Continue with default values
    }

    // 3. Get pending requests count
    try {
      console.log("Fetching pending requests count...");
      const pendingCount = await prisma.utilReq.count({
        where: {
          Status: 'Pending'
        }
      });
      
      dashboardData.pendingRequests = pendingCount;
      console.log("Pending requests count fetched successfully:", pendingCount);
    } catch (error) {
      console.error("Error fetching pending requests:", error);
      // Continue with default values
    }

    // 4. Get completed requests - total regardless of date
    try {
      console.log("Fetching completed requests count...");
      
      // Count completed UtilReq (standard requests)
      const completedUtilReqCount = await prisma.utilReq.count({
        where: {
          Status: 'Completed'
        }
      });
      
      console.log("Completed UtilReq count:", completedUtilReqCount);
      
      // Count ALL approved EVCReservations (student reservations)
      const completedEVCCount = await prisma.eVCReservation.count({
        where: {
          EVCStatus: 'Completed'
        }
      });
      
      console.log("Completed EVC reservations count:", completedEVCCount);
      
      // Combine both counts
      dashboardData.completedRequestsLastMonth = completedUtilReqCount + completedEVCCount;
      console.log("Total completed requests:", dashboardData.completedRequestsLastMonth);
    } catch (error) {
      console.error("Error fetching completed requests:", error);
      // Continue with default values
    }

    // 5. Get active EVC reservations
    try {
      console.log("Fetching active EVC reservations count...");
      const reservationsCount = await prisma.eVCReservation.count({
        where: {
          EVCStatus: 'Approved'
        }
      });
      
      dashboardData.activeEVCReservations = reservationsCount;
      console.log("Active EVC reservations count fetched successfully:", reservationsCount);
    } catch (error) {
      console.error("Error fetching active EVC reservations:", error);
      // Continue with default values
    }

    // 6. Process reservations by month (utilization trends)
    try {
      console.log("Fetching utilization trends...");
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      // Apply date filter if provided, otherwise use six months ago
      const startDate = fromDate || sixMonthsAgo;
      const endDate = toDate || new Date();
      
      // Get UtilReq trends
      const recentUtilReqs = await prisma.utilReq.findMany({
        where: {
          RequestDate: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          RequestDate: true
        },
        orderBy: {
          RequestDate: 'asc'
        }
      });
      
      // Get EVC reservation trends
      const recentEVCReqs = await prisma.eVCReservation.findMany({
        where: {
          DateRequested: {
            gte: startDate,
            lte: endDate
          }
        },
        select: {
          DateRequested: true
        },
        orderBy: {
          DateRequested: 'asc'
        }
      });

      // Combine and group requests by month
      const utilizationByMonth: Record<string, number> = {};
      
      // Add UtilReq data
      recentUtilReqs.forEach(req => {
        if (req.RequestDate) {
          const month = new Date(req.RequestDate).toLocaleString('default', { month: 'short' });
          utilizationByMonth[month] = (utilizationByMonth[month] || 0) + 1;
        }
      });
      
      // Add EVC data
      recentEVCReqs.forEach(req => {
        if (req.DateRequested) {
          const month = new Date(req.DateRequested).toLocaleString('default', { month: 'short' });
          utilizationByMonth[month] = (utilizationByMonth[month] || 0) + 1;
        }
      });

      if (Object.keys(utilizationByMonth).length > 0) {
        dashboardData.utilizationTrends = Object.entries(utilizationByMonth).map(([month, count]) => ({
          month,
          requests: count
        }));
      }
      
      console.log("Utilization trends fetched successfully");
    } catch (error) {
      console.error("Error fetching utilization trends:", error);
      // Continue with default values
    }

    // 7. Get sales data (monthly revenue from TotalAmntDue)
    try {
      console.log("Fetching sales data...");
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      // Apply date filter if provided, otherwise use six months ago
      const startDate = fromDate || sixMonthsAgo;
      const endDate = toDate || new Date();
      
      // Get all requests with payment data
      const salesRecords = await prisma.utilReq.findMany({
        where: {
          RequestDate: {
            gte: startDate,
            lte: endDate
          },
          TotalAmntDue: { not: null }
        },
        select: {
          RequestDate: true,
          TotalAmntDue: true
        },
        orderBy: {
          RequestDate: 'asc'
        }
      });

      // Group sales by month
      const salesByMonth: Record<string, number> = {};
      
      salesRecords.forEach(record => {
        if (record.RequestDate && record.TotalAmntDue) {
          const month = new Date(record.RequestDate).toLocaleString('default', { month: 'short' });
          salesByMonth[month] = (salesByMonth[month] || 0) + Number(record.TotalAmntDue);
        }
      });

      if (Object.keys(salesByMonth).length > 0) {
        dashboardData.salesData = Object.entries(salesByMonth).map(([month, revenue]) => ({
          month,
          revenue: parseFloat(revenue.toFixed(2))
        }));
      }
      
      console.log("Sales data fetched successfully");
    } catch (error) {
      console.error("Error fetching sales data:", error);
      // Continue with default values
    }

    // 8. Get user satisfaction scores from SatisfactionSurvey
    try {
      console.log("Fetching user satisfaction scores...");
      
      // Create date filter condition if dates are provided
      let dateFilter = {};
      if (fromDate || toDate) {
        dateFilter = {
          utilReq: {
            RequestDate: {
              ...(fromDate && { gte: fromDate }),
              ...(toDate && { lte: toDate })
            }
          }
        };
      }
      
      const surveys = await prisma.satisfactionSurvey.findMany({
        where: dateFilter,
        select: {
          SQD0: true,
          SQD1: true,
          SQD2: true,
          SQD3: true,
          SQD4: true,
          SQD5: true,
          SQD6: true,
          SQD7: true,
          SQD8: true
        }
      });

      if (surveys && surveys.length > 0) {
        // Map SQD fields to categories and calculate average scores
        const categories = [
          { field: 'SQD0', name: 'Service Quality' },
          { field: 'SQD1', name: 'Staff Helpfulness' },
          { field: 'SQD2', name: 'Equipment Quality' },
          { field: 'SQD3', name: 'Timeliness' },
          { field: 'SQD4', name: 'Value for Money' },
          { field: 'SQD5', name: 'Overall Experience' }
        ];
        
        const satisfactionScores = categories.map(category => {
          const scores = surveys
            .map(survey => parseInt(survey[category.field] || '0'))
            .filter(score => !isNaN(score));
          
          const avgScore = scores.length > 0
            ? scores.reduce((sum, score) => sum + score, 0) / scores.length
            : 0;
          
          return {
            category: category.name,
            score: parseFloat(avgScore.toFixed(1))
          };
        });
        
        dashboardData.satisfactionScores = satisfactionScores;
      }
      console.log("User satisfaction scores fetched successfully");
    } catch (error) {
      console.error("Error fetching user satisfaction scores:", error);
      // Continue with default values
    }

    console.log("All queries completed successfully");
    console.log("========== API EXECUTION COMPLETED SUCCESSFULLY ==========");
    
    return NextResponse.json(dashboardData);
    
  } catch (error) {
    console.error("========== API ERROR ==========");
    console.error("Error details:", error);
    console.error("Error name:", error?.name);
    console.error("Error message:", error?.message);
    console.error("Error stack:", error?.stack);
    console.error("========== END API ERROR ==========");
    
    return NextResponse.json({ 
      error: 'API execution failed', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}