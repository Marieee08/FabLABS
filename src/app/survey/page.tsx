// /survey/page.tsx

"use client";

import React, { useState, useEffect, useCallback, memo } from 'react';
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

// Loading skeleton component
const LoadingSkeleton = memo(() => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-white rounded-lg shadow p-4 border border-gray-100 animate-pulse">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex-1">
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="flex gap-2 items-center">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-3 w-1 bg-gray-200 rounded-full"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-6 bg-gray-200 rounded-full w-16"></div>
            </div>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <div className="h-10 bg-gray-200 rounded flex-1 md:w-24"></div>
            <div className="h-10 bg-gray-200 rounded flex-1 md:w-24"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
));

LoadingSkeleton.displayName = 'LoadingSkeleton';

// Memoized components to prevent unnecessary re-renders
const ReservationCard = memo(({ 
  reservation, 
  onViewDetails, 
  onStartSurvey 
}: { 
  reservation: DetailedReservation, 
  onViewDetails: (res: DetailedReservation) => void, 
  onStartSurvey: (id: number) => void 
}) => {
  // Memoize functions to prevent re-rendering
  const handleViewDetails = useCallback(() => {
    onViewDetails(reservation);
  }, [reservation, onViewDetails]);

  const handleStartSurvey = useCallback(() => {
    onStartSurvey(reservation.id);
  }, [reservation.id, onStartSurvey]);

  const statusColor = getStatusColor(reservation.Status);

  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-100 hover:border-blue-200 transition-all">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="font-semibold text-lg">{reservation.UserServices?.map(s => s.ServiceAvail).join(', ') || 'No services'}</h3>
          <div className="flex flex-wrap gap-2 mt-1.5">
            <span className="text-gray-600 text-sm">
              {reservation.RequestDate ? new Date(reservation.RequestDate).toLocaleDateString() : 'No date'}
            </span>
            <span className="text-gray-600 text-sm">•</span>
            <span className="text-gray-600 text-sm">{reservation.accInfo.Name}</span>
            <span className={`text-sm px-2 py-0.5 rounded-full ${statusColor}`}>
              {reservation.Status}
            </span>
          </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-700 flex-1 md:flex-none"
            onClick={handleViewDetails}
          >
            View Details
          </Button>
          <Button 
            className="bg-blue-600 text-white hover:bg-blue-700 flex-1 md:flex-none"
            onClick={handleStartSurvey}
          >
            Start Survey
          </Button>
        </div>
      </div>
    </div>
  );
});

ReservationCard.displayName = 'ReservationCard';

// Extracted pure functions
const getStatusColor = (status: string) => {
  switch (status) {
    case 'Ongoing':
      return 'bg-blue-100 text-blue-800';
    case 'Completed':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatCurrency = (amount: number | string | null | undefined): string => {
  if (amount === null || amount === undefined) return '0.00';
  
  // Convert to number if it's a string
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Check if it's a valid number after conversion
  if (typeof numericAmount !== 'number' || isNaN(numericAmount)) return '0.00';
  
  return numericAmount.toFixed(2);
};

const SurveyDashboard = () => {
  const router = useRouter();
  const [reservations, setReservations] = useState<DetailedReservation[]>([]);
  const [selectedReservation, setSelectedReservation] = useState<DetailedReservation | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Use useCallback to memoize functions
  const handleViewDetails = useCallback((reservation: DetailedReservation) => {
    setSelectedReservation(reservation);
    setIsReviewModalOpen(true);
  }, []);

  const handleStartSurvey = useCallback((reservationId: number) => {
    router.push(`/survey/questionnaire?reservationId=${reservationId}`);
  }, [router]);

  // Fetch data once on component mount
  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchReservations = async () => {
      try {
        const response = await fetch('/api/survey/ongoing-reservations', {
          signal: abortController.signal
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch reservations');
        }
        
        const data = await response.json();
        setReservations(data);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('Error fetching reservations:', error);
          toast({
            title: "Error",
            description: "Failed to load reservations. Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchReservations();
    
    // Cleanup function to cancel fetch if component unmounts
    return () => {
      abortController.abort();
    };
  }, []);

  const handleProceedToSurvey = useCallback(() => {
    if (selectedReservation) {
      setIsReviewModalOpen(false);
      handleStartSurvey(selectedReservation.id);
    }
  }, [selectedReservation, handleStartSurvey]);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <Card className="border-none shadow-md">
          <CardHeader className="bg-[#143370] text-white rounded-t-lg">
            <CardTitle className="text-2xl font-semibold">Available Surveys</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <p className="text-gray-600 mb-6">
              The following ongoing services are ready for your feedback. Please select a service to begin the survey.
            </p>
            
            {isLoading ? (
              <LoadingSkeleton />
            ) : reservations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg">No ongoing surveys available at this time.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reservations.map((reservation) => (
                  <ReservationCard
                    key={reservation.id}
                    reservation={reservation}
                    onViewDetails={handleViewDetails}
                    onStartSurvey={handleStartSurvey}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Modal */}
        {selectedReservation && (
          <Dialog open={isReviewModalOpen} onOpenChange={setIsReviewModalOpen}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold">Reservation Details</DialogTitle>
              </DialogHeader>
              
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
                    onClick={handleProceedToSurvey}
                  >
                    Proceed to Survey
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default SurveyDashboard;