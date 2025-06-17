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
import Navbar from '@/components/custom/navbar';

// Badge component (inline definition since it might not exist in your UI library)
const Badge = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${className || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
    {children}
  </span>
);

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
    Role: string; // Added Role to the interface
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
            <div className="flex gap-2 items-center flex-wrap">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-3 w-1 bg-gray-200 rounded-full"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-3 w-1 bg-gray-200 rounded-full"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
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
  onStartSurvey: (id: number, role: string) => void 
}) => {
  // Memoize functions to prevent re-rendering
  const handleViewDetails = useCallback(() => {
    onViewDetails(reservation);
  }, [reservation, onViewDetails]);

  const handleStartSurvey = useCallback(() => {
    onStartSurvey(reservation.id, reservation.accInfo.Role);
  }, [reservation.id, reservation.accInfo.Role, onStartSurvey]);

  const statusColor = getStatusColor(reservation.Status);
  const roleColor = getRoleColor(reservation.accInfo.Role);

  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-100 hover:border-blue-200 transition-all">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-lg">{reservation.accInfo.Name}</h3>
            <Badge className={`text-xs ${roleColor}`}>
              {reservation.accInfo.Role}
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-gray-600 text-sm">
              {reservation.UserServices?.map(s => s.ServiceAvail).join(', ') || 'No services'}
            </span>
            <span className="text-gray-400 text-sm">•</span>
            <span className="text-gray-600 text-sm">
              {reservation.RequestDate ? new Date(reservation.RequestDate).toLocaleDateString() : 'No date'}
            </span>
            <span className="text-gray-400 text-sm">•</span>
            <Badge className={`text-xs ${statusColor}`}>
              {reservation.Status}
            </Badge>
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
      return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Completed':
      return 'bg-green-100 text-green-800 border-green-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getRoleColor = (role: string) => {
  switch (role) {
    case 'STAFF':
      return 'bg-purple-100 text-purple-800 border-purple-200';
    case 'MSME':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'STUDENT':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'ADMIN':
      return 'bg-red-100 text-red-800 border-red-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const handleStartSurvey = useCallback((reservationId: number, userRole: string) => {
    // Route based on user role
    if (userRole === 'STAFF') {
      router.push(`/survey/internal-survey?reservationId=${reservationId}`);
    } else {
      router.push(`/survey/questionnaire?reservationId=${reservationId}`);
    }
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
      handleStartSurvey(selectedReservation.id, selectedReservation.accInfo.Role);
    }
  }, [selectedReservation, handleStartSurvey]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="py-8 pt-28 px-4">
        <div className="max-w-6xl mx-auto">
          <Card className="border-none shadow-md">
          <CardHeader className="bg-[#143370] text-white rounded-t-lg">
            <CardTitle className="text-2xl font-semibold">Available Surveys</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {!isLoading && (
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  The following ongoing services are ready for your feedback. Please select a service to begin the survey.
                </p>
                <div className="text-sm text-gray-500">
                  <p><strong>Note:</strong> Survey type will be determined based on your role:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li><Badge className="bg-purple-100 text-purple-800 border-purple-200 text-xs">STAFF</Badge> - Internal Survey</li>
                    <li><Badge className="bg-orange-100 text-orange-800 border-orange-200 text-xs">MSME</Badge>, <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">STUDENT</Badge> - Standard Questionnaire</li>
                  </ul>
                </div>
              </div>
            )}
            
            {isLoading ? (
              <div className="space-y-6">
                <div className="text-center py-4">
                  <div className="inline-flex items-center gap-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <p className="text-gray-600 text-lg">Loading available surveys...</p>
                  </div>
                </div>
                <LoadingSkeleton />
              </div>
            ) : reservations.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-4">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No ongoing surveys available</h3>
                <p className="text-gray-500">There are currently no ongoing services ready for feedback.</p>
                <p className="text-gray-400 text-sm mt-2">Check back later or contact support if you believe this is an error.</p>
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
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-gray-900">{selectedReservation.accInfo.Name}</p>
                    <Badge className={`text-xs ${getRoleColor(selectedReservation.accInfo.Role)}`}>
                      {selectedReservation.accInfo.Role}
                    </Badge>
                  </div>
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

                <div>
                  <h3 className="text-sm font-medium text-gray-500">Survey Type</h3>
                  <p className="mt-1 text-gray-900">
                    {selectedReservation.accInfo.Role === 'STAFF' 
                      ? 'Internal Survey (Staff)' 
                      : 'Standard Questionnaire'}
                  </p>
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
    </div>
  );
};

export default SurveyDashboard;