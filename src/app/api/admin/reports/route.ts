// app/api/admin/reports/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseISO, isValid, format, startOfDay, endOfDay } from 'date-fns';

export async function GET(request: NextRequest) {
  try {
    // Parse date parameters
    const searchParams = request.nextUrl.searchParams;
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    
    // Default to last 30 days if not provided
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    
    // Validate and parse date parameters
    let fromDate = thirtyDaysAgo;
    let toDate = today;
    
    if (fromParam) {
      const parsedFrom = parseISO(fromParam);
      if (isValid(parsedFrom)) {
        fromDate = startOfDay(parsedFrom);
      }
    }
    
    if (toParam) {
      const parsedTo = parseISO(toParam);
      if (isValid(parsedTo)) {
        toDate = endOfDay(parsedTo);
      }
    }
    
    // Fetch various data points in parallel
    const [
      pendingUtilRequests,
      pendingTeacherApprovals,
      pendingAdminApprovals,
      completedRequests,
      activeEVCReservations,
      servicesData,
      utilizationTrends,
      userRoleDistribution,
      satisfactionScores,
      machineDowntime,
      repairsByType,
      machinesUsedData
    ] = await Promise.all([
      // Regular pending requests
      prisma.utilReq.count({
        where: {
          Status: 'Pending Admin Approval',
          RequestDate: {
            gte: fromDate,
            lte: toDate
          }
        }
      }),
      
      // Pending EVC Teacher approvals
      prisma.eVCReservation.count({
        where: {
          EVCStatus: 'Pending Teacher Approval',
          DateRequested: {
            gte: fromDate,
            lte: toDate
          }
        }
      }),
      
      // Pending EVC Admin approvals
      prisma.eVCReservation.count({
        where: {
          EVCStatus: 'Pending Admin Approval',
          DateRequested: {
            gte: fromDate,
            lte: toDate
          }
        }
      }),
      
      // Completed requests count
      prisma.utilReq.count({
        where: {
          Status: 'Completed',
          RequestDate: {
            gte: fromDate,
            lte: toDate
          }
        }
      }),
      
      // Active EVC reservations
      prisma.eVCReservation.count({
        where: {
          EVCStatus: 'Approved',
          DateRequested: {
            gte: fromDate,
            lte: toDate
          }
        }
      }),
      
      // Services data
      prisma.serviceAvailed.groupBy({
        by: ['service'],
        _count: {
          service: true
        },
        where: {
          utilReq: {
            RequestDate: {
              gte: fromDate,
              lte: toDate
            }
          }
        }
      }),
      
      // Get ALL reservations for trends (not just completed ones)
      prisma.$transaction([
        // Utilization requests for trends
        prisma.utilReq.findMany({
          where: {
            RequestDate: {
              gte: fromDate,
              lte: toDate
            }
          },
          select: {
            RequestDate: true,
            Status: true
          },
          orderBy: {
            RequestDate: 'asc'
          }
        }),
        
        // EVC reservations for trends
        prisma.eVCReservation.findMany({
          where: {
            DateRequested: {
              gte: fromDate,
              lte: toDate
            }
          },
          select: {
            DateRequested: true,
            EVCStatus: true
          },
          orderBy: {
            DateRequested: 'asc'
          }
        })
      ]),
      
      // User role distribution
      prisma.accInfo.groupBy({
        by: ['Role'],
        _count: {
          id: true
        }
      }),
      
      // Satisfaction scores
      prisma.satisfactionSurvey.findMany({
        where: {
          createdAt: {
            gte: fromDate,
            lte: toDate
          }
        },
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
      }),
      
      // Machine downtime
      prisma.downTime.findMany({
        where: {
          DTDate: {
            gte: fromDate.toISOString(),
            lte: toDate.toISOString()
          }
        },
        select: {
          DTTime: true,
          machineUtil: {
            select: {
              Machine: true
            }
          }
        }
      }),
      
      // Repairs by type
      prisma.repairCheck.groupBy({
        by: ['Service'],
        _count: {
          id: true
        },
        where: {
          RepairDate: {
            gte: fromDate.toISOString(),
            lte: toDate.toISOString()
          }
        }
      }),
      
      // Machines used
      prisma.machineUtilization.groupBy({
        by: ['Machine'],
        _count: {
          id: true
        },
        where: {
          utilReq: {
            RequestDate: {
              gte: fromDate,
              lte: toDate
            }
          }
        }
      })
    ]);
    
    // Combine all pending requests
    const pendingRequests = pendingUtilRequests + pendingTeacherApprovals + pendingAdminApprovals;
    
    // Process the utilization trends data (combine both types of reservations)
    const [utilRequests, evcRequests] = utilizationTrends;
    
    // Group by month for both types - Fixed type definition
    const monthCounts: Record<string, number> = {};
    
    // Process util requests
    utilRequests.forEach(req => {
      if (req.RequestDate) {
        const monthYear = format(req.RequestDate, 'MMM yyyy');
        if (!monthCounts[monthYear]) {
          monthCounts[monthYear] = 0;
        }
        monthCounts[monthYear] += 1;
      }
    });
    
    // Process EVC requests
    evcRequests.forEach(req => {
      if (req.DateRequested) {
        const monthYear = format(req.DateRequested, 'MMM yyyy');
        if (!monthCounts[monthYear]) {
          monthCounts[monthYear] = 0;
        }
        monthCounts[monthYear] += 1;
      }
    });
    
    const utilizationTrendsData = Object.entries(monthCounts).map(([month, count]) => ({
      month,
      requests: count
    })).sort((a, b) => {
      // Sort by date (assuming month format is "MMM yyyy")
      const dateA = new Date(a.month);
      const dateB = new Date(b.month);
      return dateA.getTime() - dateB.getTime();
    });
    
    // Process service stats
    const serviceStats = servicesData.map(service => ({
      name: service.service,
      value: service._count.service
    }));
    
    // Process user role distribution
    const userRoles = userRoleDistribution.map(role => ({
      name: role.Role || 'Unknown',
      value: role._count.id
    }));
    
    // Process satisfaction scores
    const sqdFields = ['SQD0', 'SQD1', 'SQD2', 'SQD3', 'SQD4', 'SQD5', 'SQD6', 'SQD7', 'SQD8'];
    const sqdLabels = [
      'Service Quality', 
      'Staff Knowledge',
      'Responsiveness',
      'Timeliness',
      'Equipment Quality',
      'Process Efficiency',
      'Communication',
      'Value for Money',
      'Overall Experience'
    ];
    
    // Calculate average scores
    const satisfactionAverages: Record<string, number> = {};
    sqdFields.forEach(field => {
      const validScores = satisfactionScores
        .map(survey => survey[field as keyof typeof survey])
        .filter(score => score !== null && score !== undefined)
        .map(score => parseInt(score as string));
      
      const average = validScores.length > 0 
        ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length 
        : 0;
      
      satisfactionAverages[field] = Number(average.toFixed(1));
    });
    
    // Format satisfaction data for chart
    const satisfactionScoresFormatted = sqdFields.map((field, index) => ({
      category: sqdLabels[index],
      score: satisfactionAverages[field]
    }));
    
    // Process machine downtime
    const machineDowntimeSummary: Record<string, number> = {};
    machineDowntime.forEach(record => {
      const machineName = record.machineUtil?.Machine || 'Unknown';
      machineDowntimeSummary[machineName] = (machineDowntimeSummary[machineName] || 0) + (record.DTTime || 0);
    });
    
    const machineDowntimeFormatted = Object.entries(machineDowntimeSummary).map(([machine, downtime]) => ({
      machine,
      downtime
    }));
    
    // Process repairs by type
    const repairsByTypeFormatted = repairsByType.map(repair => ({
      type: repair.Service || 'Unknown',
      count: repair._count.id
    }));
    
    // Process machines used
    const machinesUsed = machinesUsedData.map(machine => ({
      machine: machine.Machine || 'Unknown',
      count: machine._count.id
    })).sort((a, b) => b.count - a.count);
    
    // Return the final data structure
    return NextResponse.json({
      pendingRequests,
      pendingTeacherApprovals,
      pendingAdminApprovals,
      completedRequestsLastMonth: completedRequests,
      activeEVCReservations,
      serviceStats,
      utilizationTrends: utilizationTrendsData,
      userRoleDistribution: userRoles,
      satisfactionScores: satisfactionScoresFormatted,
      machineDowntime: machineDowntimeFormatted,
      repairsByType: repairsByTypeFormatted,
      machinesUsed,
      machineAvailability: { 
        available: 15, 
        unavailable: 3,
        percentageAvailable: ((15 / (15 + 3)) * 100).toFixed(2)
      }
    });
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}