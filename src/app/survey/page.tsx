// /survey/page.tsx

"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from '@/components/ui/use-toast';

interface UserService {
  id: string;
  ServiceAvail: string;
  EquipmentAvail: string;
}

interface DetailedReservation {
  id: number;
  Status: string;
  RequestDate: string;
  TotalAmntDue: number | null;
  UserServices: UserService[];
  accInfo: {
    Name: string;
  };
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Paid':
      return 'bg-purple-100 text-purple-800';
    case 'Completed':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

// Add this near the getStatusColor function (around line 30)
const formatCurrency = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined) return '0.00';
  
  // Convert to number if it's a string
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Check if it's a valid number after conversion
  if (typeof numericAmount !== 'number' || isNaN(numericAmount)) return '0.00';
  
  return numericAmount.toFixed(2);
};

const SimpleSurveyDashboard = () => {
  const router = useRouter();
  const [reservations, setReservations] = useState<DetailedReservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<DetailedReservation | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReservations = async () => {
      try {
        // Fetch only paid reservations
        const response = await fetch('/api/survey/paid-reservations');
        
        if (!response.ok) {
          throw new Error('Failed to fetch reservations');
        }
        
        const data = await response.json();
        setReservations(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching reservations:', error);
        // For demo purposes, we'll create some sample data if the API fails
        setReservations([
          {
            id: 1001,
            Status: 'Paid',
            RequestDate: '2025-03-01T10:00:00Z',
            TotalAmntDue: 1500.00,
            UserServices: [
              {
                id: 's1',
                ServiceAvail: '3D Printing',
                EquipmentAvail: 'Prusa i3 MK3'
              }
            ],
            accInfo: {
              Name: 'John Smith'
            }
          },
          {
            id: 1002,
            Status: 'Paid',
            RequestDate: '2025-03-03T15:30:00Z',
            TotalAmntDue: 2200.00,
            UserServices: [
              {
                id: 's2',
                ServiceAvail: 'Laser Cutting',
                EquipmentAvail: 'Epilog Fusion Pro'
              },
              {
                id: 's3',
                ServiceAvail: 'CNC Milling',
                EquipmentAvail: 'Shapeoko 4'
              }
            ],
            accInfo: {
              Name: 'Maria Garcia'
            }
          }
        ]);
        setIsLoading(false);
      }
    };

    fetchReservations();
  }, []);

  const handleViewDetails = (reservation: DetailedReservation) => {
    setSelectedReservation(reservation);
    setIsReviewModalOpen(true);
  };

  const handleStartSurvey = (reservationId: number) => {
    // Navigate to the survey questionnaire with the reservation ID
    router.push(`/survey/questionnaire?reservationId=${reservationId}`);
  };

  // For simpler implementation, you could use this function to immediately mark as completed
  const handleQuickComplete = async (reservationId: number) => {
    try {
      const response = await fetch('/api/survey/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          reservationId,
          // Skip the survey data if you're implementing the simpler approach
          skipSurvey: true
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to complete survey');
      }
      
      // Remove this reservation from the local state
      setReservations(reservations.filter(res => res.id !== reservationId));
      
      // Show success message
      toast({
        title: "Success",
        description: "Survey marked as completed.",
      });
    } catch (error) {
      console.error('Error completing survey:', error);
      toast({
        title: "Error",
        description: "Failed to complete the survey.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <Card className="border-none shadow-md">
          <CardHeader className="bg-[#143370] text-white rounded-t-lg">
            <CardTitle className="text-2xl font-semibold">Available Surveys</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-gray-600 mb-6">
              The following services are ready for your feedback. Please select a service to begin the survey.
            </p>
            
            {reservations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg">No pending surveys available at this time.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reservations.map((reservation) => (
                  <div 
                    key={reservation.id} 
                    className="bg-white rounded-lg shadow p-4 border border-gray-100 hover:border-blue-200 transition-all"
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h3 className="font-semibold text-lg">{reservation.UserServices?.map(s => s.ServiceAvail).join(', ') || 'No services'}</h3>
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          <span className="text-gray-600 text-sm">
                            {reservation.RequestDate ? new Date(reservation.RequestDate).toLocaleDateString() : 'No date'}
                          </span>
                          <span className="text-gray-600 text-sm">•</span>
                          <span className="text-gray-600 text-sm">{reservation.accInfo.Name}</span>
                          <span className={`text-sm px-2 py-0.5 rounded-full ${getStatusColor(reservation.Status)}`}>
                            {reservation.Status}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-3 w-full md:w-auto">
                        <Button 
                          variant="outline" 
                          className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 flex-1 md:flex-none"
                          onClick={() => handleViewDetails(reservation)}
                        >
                          View Details
                        </Button>
                        <Button 
                          className="bg-blue-600 text-white hover:bg-blue-700 flex-1 md:flex-none"
                          onClick={() => handleStartSurvey(reservation.id)}
                        >
                          Start Survey
                        </Button>
                        
                        {/* Uncomment this if you want the simpler approach */}
                        {/* 
                        <Button 
                          className="bg-green-600 text-white hover:bg-green-700 flex-1 md:flex-none"
                          onClick={() => handleQuickComplete(reservation.id)}
                        >
                          Mark Completed
                        </Button>
                        */}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Modal */}
        <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Reservation Details</DialogTitle>
            </DialogHeader>
            
            {selectedReservation && (
              <div className="space-y-4 mt-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Customer</h3>
                  <p className="mt-1 text-gray-900">{selectedReservation.accInfo.Name}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Date</h3>
                  <p className="mt-1 text-gray-900">{new Date(selectedReservation.RequestDate).toLocaleDateString()}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Services</h3>
                  <ul className="mt-1 space-y-1">
                    {selectedReservation.UserServices?.map((service, index) => (
                      <li key={index} className="text-gray-900">
                        {service.ServiceAvail} ({service.EquipmentAvail})
                      </li>
                    )) || <li className="text-gray-500">No services</li>}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Total Amount</h3>
                  <p className="mt-1 text-gray-900">₱{formatCurrency(selectedReservation.TotalAmntDue)}</p>
                </div>
                
                <Separator />
                
                <div className="flex justify-end">
                  <Button 
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={() => {
                      setIsReviewModalOpen(false);
                      handleStartSurvey(selectedReservation.id);
                    }}
                  >
                    Proceed to Survey
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SimpleSurveyDashboard;