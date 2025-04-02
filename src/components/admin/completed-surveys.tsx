// src/components/admin/completed-surveys.tsx

import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

// Types for survey data
interface SurveyResponse {
  id: string;
  reservationId: number;
  submittedAt: string;
  customerName: string;
  serviceAvailed: string[];
  preliminary: {
    clientType: string;
    sex: string;
    age: string;
    region: string;
    office: string;
    CC1: string;
    CC2: string;
    CC3: string;
  };
  customer: Record<string, string>;
  employee: Record<string, string>;
}

// Mapping for survey questions
const SURVEY_QUESTIONS = {
  customer: [
    "SQD0. I am satisfied with the services that I availed.",
    "SQD1. I spent reasonable amount of time for my transaction.",
    "SQD2. The office followed the transaction's requirements and steps based on the information provided.",
    "SQD3. The steps (including payment) I needed to do for my transaction were easy and simple.",
    "SQD4. I easily found information about my transaction from the office's website.",
    "SQD5. I paid a reasonable amount of fees for my transaction. (If service was free, mark the N/A column)",
    "SQD6. I am confident my transaction was secure.",
    "SQD7. The office's support was available, and (if asked questions) support was quick to respond.",
    "SQD8. I got what I needed from the government office, or (if denied) denial of request was sufficiently explained to me."
  ],
  employee: [
    "Technical know-how on the given tasks at hand assigned (technical skills)",
    "Attitude in working with a team (teamwork)",
    "Works to full potential",
    "Quality of work",
    "Communication",
    "Independent work",
    "Takes initiative",
    "Productivity and creativity",
    "Honesty and integrity",
    "Punctuality and attendance",
    "SSF Personnel management and assistance while you are using the services of the SSF/ Client relations",
    "SSF personnel's professionalism and aptitude",
    "The facility's responsiveness in processing your request",
    "Cleanliness and orderliness of the facility",
    "Rate (charge) of the services of the SSF",
    "Performance (efficiency and quality of products produced) of the machineries and equipment",
    "Quality of the tools used"
  ]
};

// Define the Rating components with appropriate colors based on rating values
const RatingBadge = memo(({ rating }: { rating: string }) => {
  let color = "bg-gray-100 text-gray-800";

  if (rating === "Strongly Agree" || rating === "Excellent") {
    color = "bg-green-100 text-green-800";
  } else if (rating === "Agree" || rating === "Good") {
    color = "bg-blue-100 text-blue-800";
  } else if (rating === "Neutral" || rating === "Fair") {
    color = "bg-yellow-100 text-yellow-800";
  } else if (rating === "Disagree" || rating === "Poor") {
    color = "bg-red-100 text-red-800";
  } else if (rating === "Strongly Disagree") {
    color = "bg-red-200 text-red-900";
  } else if (rating === "N/A") {
    color = "bg-gray-100 text-gray-600";
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {rating}
    </span>
  );
});

RatingBadge.displayName = 'RatingBadge';

const CompletedSurveysPage = () => {
  const [surveys, setSurveys] = useState<SurveyResponse[]>([]);
  const [filteredSurveys, setFilteredSurveys] = useState<SurveyResponse[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<SurveyResponse | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch completed surveys
  useEffect(() => {
    const fetchCompletedSurveys = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/survey/completed');
        
        if (!response.ok) {
          throw new Error('Failed to fetch completed surveys');
        }
        
        const data = await response.json();
        setSurveys(data);
        setFilteredSurveys(data);
      } catch (error) {
        console.error('Error fetching completed surveys:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompletedSurveys();
  }, []);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    
    const filtered = surveys.filter(survey => 
      survey.customerName.toLowerCase().includes(query) || 
      survey.serviceAvailed.some(service => service.toLowerCase().includes(query))
    );
    
    setFilteredSurveys(filtered);
  }, [surveys]);

  // Handle view survey details
  const handleViewSurveyDetails = useCallback((survey: SurveyResponse) => {
    setSelectedSurvey(survey);
    setIsDetailModalOpen(true);
  }, []);

  return (
    <Card className="mt-8 border shadow-md">
      <CardHeader className="bg-[#143370] text-white rounded-t-lg">
        <CardTitle className="text-2xl font-semibold">Completed Surveys</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search by name or service..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="pl-10 border-gray-300"
            />
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : filteredSurveys.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg">No completed surveys found.</p>
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-semibold">Customer</TableHead>
                  <TableHead className="font-semibold">Service Availed</TableHead>
                  <TableHead className="font-semibold">Client Type</TableHead>
                  <TableHead className="font-semibold">Region</TableHead>
                  <TableHead className="font-semibold">Submitted</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSurveys.map((survey) => (
                  <TableRow key={survey.id}>
                    <TableCell className="font-medium">{survey.customerName}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {survey.serviceAvailed.map((service, idx) => (
                          <Badge key={idx} variant="outline" className="bg-blue-50">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{survey.preliminary.clientType}</TableCell>
                    <TableCell>{survey.preliminary.region.split(' - ')[0]}</TableCell>
                    <TableCell>{new Date(survey.submittedAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                        onClick={() => handleViewSurveyDetails(survey)}
                      >
                        <Eye size={16} className="mr-1" /> Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Survey Details Modal */}
      {selectedSurvey && (
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold">Survey Response Details</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4 mt-2">
              {/* Customer Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Customer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Name</p>
                    <p className="font-medium">{selectedSurvey.customerName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Services</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedSurvey.serviceAvailed.map((service, idx) => (
                        <Badge key={idx} variant="outline" className="bg-blue-50">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Client Type</p>
                    <p>{selectedSurvey.preliminary.clientType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Demographics</p>
                    <p>{selectedSurvey.preliminary.sex}, {selectedSurvey.preliminary.age} years old</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Region</p>
                    <p>{selectedSurvey.preliminary.region}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Office</p>
                    <p>{selectedSurvey.preliminary.office}</p>
                  </div>
                </div>
              </div>
              
              {/* Citizen's Charter Questions */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Citizen's Charter Awareness</h3>
                <div className="space-y-2">
                  <div>
                    <p className="text-sm text-gray-500">CC1: Awareness of Citizen's Charter</p>
                    <p>{selectedSurvey.preliminary.CC1}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">CC2: Visibility of Citizen's Charter</p>
                    <p>{selectedSurvey.preliminary.CC2}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">CC3: Helpfulness of Citizen's Charter</p>
                    <p>{selectedSurvey.preliminary.CC3}</p>
                  </div>
                </div>
              </div>
              
              <Separator />
              
              {/* Customer Survey Responses */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Customer Satisfaction Responses</h3>
                <div className="space-y-3">
                  {SURVEY_QUESTIONS.customer.map((question, index) => {
                    const key = `SQD${index}`;
                    const response = selectedSurvey.customer[key];
                    
                    return (
                      <div key={key} className="bg-white p-3 rounded-lg border">
                        <p className="text-sm mb-2">{question}</p>
                        <RatingBadge rating={response} />
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <Separator />
              
              {/* Employee Evaluation Responses */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Employee Evaluation Responses</h3>
                <div className="space-y-3">
                  {SURVEY_QUESTIONS.employee.map((question, index) => {
                    const key = `E${index + 1}`;
                    const response = selectedSurvey.employee[key];
                    
                    return (
                      <div key={key} className="bg-white p-3 rounded-lg border">
                        <p className="text-sm mb-2">{question}</p>
                        <RatingBadge rating={response} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
};

export default CompletedSurveysPage;