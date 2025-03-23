// app/api/admin/reports/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
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
    
    // Fetch data from database
    const [
      pendingRequests,
      completedRequests,
      activeEVCReservations,
      servicesData,
      utilizationData,
      userRoleDistribution,
      satisfactionScores,
      machineDowntime,
      repairsByType,
      machinesUsedData
    ] = await Promise.all([
      // Pending requests count
      prisma.utilReq.count({
        where: {
          Status: 'Pending',
          RequestDate: {
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
      
      // Utilization trends - Get request counts by month
      prisma.utilReq.findMany({
        where: {
          RequestDate: {
            gte: fromDate,
            lte: toDate
          }
        },
        select: {
          RequestDate: true
        },
        orderBy: {
          RequestDate: 'asc'
        }
      }),
      
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
            gte: fromDate,
            lte: toDate
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
            gte: fromDate,
            lte: toDate
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
    
    // Process the utilization trends data
    const monthCounts = {};
    utilizationData.forEach(req => {
      const monthYear = format(req.RequestDate, 'MMM yyyy');
      monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1;
    });
    
    const utilizationTrends = Object.entries(monthCounts).map(([month, count]) => ({
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
      name: role.Role,
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
    const satisfactionAverages = {};
    sqdFields.forEach(field => {
      const validScores = satisfactionScores
        .map(survey => survey[field])
        .filter(score => score !== null && score !== undefined)
        .map(score => parseInt(score));
      
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
    const machineDowntimeSummary = {};
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
    
    // Prepare mock sales data (replace with real data when available)
    const salesData = [
      { month: 'Jan', revenue: 4500 },
      { month: 'Feb', revenue: 5200 },
      { month: 'Mar', revenue: 4800 },
      { month: 'Apr', revenue: 6000 },
      { month: 'May', revenue: 5700 },
      { month: 'Jun', revenue: 6200 }
    ];
    
    // Return the final data structure
    return NextResponse.json({
      pendingRequests,
      completedRequestsLastMonth: completedRequests,
      activeEVCReservations,
      serviceStats,
      utilizationTrends,
      userRoleDistribution: userRoles,
      satisfactionScores: satisfactionScoresFormatted,
      machineDowntime: machineDowntimeFormatted,
      repairsByType: repairsByTypeFormatted,
      machinesUsed,
      salesData,
      machineAvailability: { 
        available: 15, 
        unavailable: 3 
      } // Replace with real data when available
    });
    
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}