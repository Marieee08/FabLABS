// src/components/admin-reports/report-generator-dialog.tsx
import React, { useState } from 'react';
import { format } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { FileIcon, Settings, Loader2 } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent } from '@/components/ui/card';

import { generateDashboardReport, DashboardReportData } from '@/components/admin-functions/pdf/dashboard-report-pdf';

interface ReportGeneratorDialogProps {
  dashboardData: any;
  dateRange: DateRange | undefined;
  buttonClassName?: string;
}

const ReportGeneratorDialog: React.FC<ReportGeneratorDialogProps> = ({
  dashboardData,
  dateRange,
  buttonClassName
}) => {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reportTitle, setReportTitle] = useState("FABRICATION LABORATORY DASHBOARD REPORT");
  const [reportSubtitle, setReportSubtitle] = useState("Performance Analytics & Statistics");
  
  // Report content options
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeMachineStats, setIncludeMachineStats] = useState(true);
  const [includeReservationStats, setIncludeReservationStats] = useState(true);
  const [includeUserStats, setIncludeUserStats] = useState(true);
  const [includeTables, setIncludeTables] = useState(true);
  const [showCosts, setShowCosts] = useState(true);
  const [includeLogo, setIncludeLogo] = useState(true);
  
  // Report format options
  const [paperSize, setPaperSize] = useState('a4');
  const [orientation, setOrientation] = useState('portrait');
  
  const handleGenerateReport = async () => {
    if (!dateRange?.from || !dateRange?.to) {
      alert('Please select a date range for the report.');
      return;
    }
    
    setGenerating(true);
    
    try {
      // Prepare mock data for now - in a real app, this would come from dashboardData
      // This would be replaced with actual data from your API/state
      const reportData: DashboardReportData = {
        reportDate: new Date(),
        dateRange: {
          from: dateRange.from,
          to: dateRange.to || dateRange.from,
        },
        pendingRequests: dashboardData?.pendingRequests || 0,
        completedRequests: dashboardData?.completedRequestsLastMonth || 0,
        activeReservations: dashboardData?.activeEVCReservations || 0,
        totalRevenue: dashboardData?.totalRevenue || 5280.00,
        machineUsage: [
          {
            machineName: 'Laser Cutter',
            totalHours: 78.5,
            utilization: 74.2,
            maintenanceCount: 2,
            downtimeHours: 8.5
          },
          {
            machineName: '3D Printer',
            totalHours: 105.2,
            utilization: 68.5,
            maintenanceCount: 3,
            downtimeHours: 12.0
          },
          {
            machineName: 'CNC Machine',
            totalHours: 45.0,
            utilization: 52.3,
            maintenanceCount: 1,
            downtimeHours: 4.5
          }
        ],
        services: [
          {
            serviceName: '3D Printing',
            count: 48,
            revenue: 2250.00,
            mostPopularMachine: '3D Printer XYZ'
          },
          {
            serviceName: 'Laser Cutting',
            count: 35,
            revenue: 1750.00,
            mostPopularMachine: 'Laser Cutter 5000'
          },
          {
            serviceName: 'CNC Milling',
            count: 22,
            revenue: 1280.00,
            mostPopularMachine: 'CNC Mill Pro'
          }
        ],
        userStats: [
          {
            userRole: 'Student',
            count: 85,
            reservationsCount: 62,
            averageSessionDuration: 2.3
          },
          {
            userRole: 'MSME',
            count: 24,
            reservationsCount: 38,
            averageSessionDuration: 3.1
          },
          {
            userRole: 'Faculty',
            count: 12,
            reservationsCount: 5,
            averageSessionDuration: 1.8
          }
        ],
        reservationStats: [
          {
            status: 'Completed',
            count: 82,
            percentageOfTotal: 65.6
          },
          {
            status: 'Pending',
            count: 28,
            percentageOfTotal: 22.4
          },
          {
            status: 'Cancelled',
            count: 5,
            percentageOfTotal: 4.0
          },
          {
            status: 'In Progress',
            count: 10,
            percentageOfTotal: 8.0
          }
        ]
      };
      
      // Generate the PDF report
      await generateDashboardReport(reportData, {
        title: reportTitle,
        subtitle: reportSubtitle,
        dateRange: {
          from: dateRange.from,
          to: dateRange.to || dateRange.from,
        },
        includeCharts,
        includeMachineStats,
        includeReservationStats,
        includeUserStats,
        includeTables,
        showCosts,
        logo: includeLogo
      });
      
      // Close the dialog after successful generation
      setOpen(false);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('An error occurred while generating the report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };
  
  return (
    <>
      <Button 
        onClick={() => setOpen(true)}
        className={buttonClassName || "bg-[#143370] hover:bg-[#0d2555] text-white"}
      >
        <FileIcon className="mr-2 h-4 w-4" />
        Generate Report
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Generate Dashboard Report</DialogTitle>
            <DialogDescription>
              Configure your report settings and content before generation.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="content" className="w-full mt-4">
            <TabsList className="grid grid-cols-2">
              <TabsTrigger value="content">Report Content</TabsTrigger>
              <TabsTrigger value="format">Report Format</TabsTrigger>
            </TabsList>
            
            <TabsContent value="content" className="pt-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="reportTitle">Report Title</Label>
                  <Input
                    id="reportTitle"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="reportSubtitle">Report Subtitle</Label>
                  <Input
                    id="reportSubtitle"
                    value={reportSubtitle}
                    onChange={(e) => setReportSubtitle(e.target.value)}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label>Date Range</Label>
                  <div className="p-2 border rounded-md bg-gray-50">
                    <p className="text-sm">
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            From <span className="font-medium">{format(dateRange.from, 'PPP')}</span> to{' '}
                            <span className="font-medium">{format(dateRange.to, 'PPP')}</span>
                          </>
                        ) : (
                          <span className="font-medium">{format(dateRange.from, 'PPP')}</span>
                        )
                      ) : (
                        <span className="text-red-500">Please select a date range to generate a report</span>
                      )}
                    </p>
                  </div>
                </div>
                
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-sm font-medium mb-3">Include in Report:</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="includeCharts" 
                          checked={includeCharts}
                          onCheckedChange={(checked) => setIncludeCharts(!!checked)}
                        />
                        <Label htmlFor="includeCharts">Charts & Graphs</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="includeMachineStats" 
                          checked={includeMachineStats}
                          onCheckedChange={(checked) => setIncludeMachineStats(!!checked)}
                        />
                        <Label htmlFor="includeMachineStats">Machine Stats</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="includeReservationStats" 
                          checked={includeReservationStats}
                          onCheckedChange={(checked) => setIncludeReservationStats(!!checked)}
                        />
                        <Label htmlFor="includeReservationStats">Reservation Stats</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="includeUserStats" 
                          checked={includeUserStats}
                          onCheckedChange={(checked) => setIncludeUserStats(!!checked)}
                        />
                        <Label htmlFor="includeUserStats">User Statistics</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="includeTables" 
                          checked={includeTables}
                          onCheckedChange={(checked) => setIncludeTables(!!checked)}
                        />
                        <Label htmlFor="includeTables">Detailed Tables</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="showCosts" 
                          checked={showCosts}
                          onCheckedChange={(checked) => setShowCosts(!!checked)}
                        />
                        <Label htmlFor="showCosts">Financial Data</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="includeLogo" 
                          checked={includeLogo}
                          onCheckedChange={(checked) => setIncludeLogo(!!checked)}
                        />
                        <Label htmlFor="includeLogo">Include Logo</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="format" className="pt-4">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="paperSize">Paper Size</Label>
                  <select
                    id="paperSize"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={paperSize}
                    onChange={(e) => setPaperSize(e.target.value)}
                  >
                    <option value="a4">A4</option>
                    <option value="letter">Letter</option>
                    <option value="legal">Legal</option>
                  </select>
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="orientation">Orientation</Label>
                  <select
                    id="orientation"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={orientation}
                    onChange={(e) => setOrientation(e.target.value)}
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>
                
                <div className="p-4 border rounded-md bg-white">
                  <h4 className="text-sm font-semibold mb-2">Report Preview</h4>
                  <div className={`flex justify-center ${orientation === 'portrait' ? 'h-40' : 'h-32'}`}>
                    <div 
                      className={`bg-[#f5f5f5] border border-gray-300 shadow-sm flex flex-col ${
                        orientation === 'portrait' ? 'w-28 h-40' : 'w-40 h-28'
                      }`}
                    >
                      {includeLogo && (
                        <div className="bg-[#e0e0e0] h-4 mx-2 mt-2 rounded-sm"></div>
                      )}
                      <div className="bg-[#e0e0e0] h-2 mx-2 mt-2 rounded-sm"></div>
                      <div className="bg-[#e0e0e0] h-2 w-16 mx-auto mt-1 rounded-sm"></div>
                      <div className="bg-[#e0e0e0] h-1 mx-2 mt-2 rounded-sm"></div>
                      {includeMachineStats && (
                        <div className="bg-[#e0e0e0] h-4 mx-2 mt-2 rounded-sm"></div>
                      )}
                      {includeReservationStats && (
                        <div className="bg-[#e0e0e0] h-4 mx-2 mt-2 rounded-sm"></div>
                      )}
                      {includeUserStats && (
                        <div className="bg-[#e0e0e0] h-4 mx-2 mt-2 rounded-sm"></div>
                      )}
                      <div className="bg-[#e0e0e0] h-1 mx-2 mt-auto mb-2 rounded-sm"></div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleGenerateReport} 
              disabled={generating || !dateRange?.from}
              className="bg-[#143370] hover:bg-[#0d2555] text-white"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileIcon className="mr-2 h-4 w-4" />
                  Generate PDF
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReportGeneratorDialog;