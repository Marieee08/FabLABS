import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Info, Link as LinkIcon } from 'lucide-react';

interface Service {
  id: string;
  Service: string;
  Info?: string | null;
  Machines?: { 
    machine: { 
      id: string;
      Machine: string;
      Number?: number;
    } 
  }[];
}

export interface ServiceSelectionData {
  serviceId: string;
  serviceName: string;
  googleDriveLink: string;
  requiresFiles: boolean;
}

interface ServiceSelectionProps {
  onSelection: (data: ServiceSelectionData) => void;
  initialSelection?: ServiceSelectionData;
}

// List of services that require file assessment
const FILE_REQUIRING_SERVICES = [
  '3D Printing',
  'Laser Cutting',
  'CNC Machining',
  'PCB Manufacturing'
];

/**
 * Component for selecting a service and providing Google Drive link when needed
 */
const ServiceSelection: React.FC<ServiceSelectionProps> = ({ 
  onSelection,
  initialSelection
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [selectedService, setSelectedService] = useState<string>(initialSelection?.serviceId || "");
  const [driveLink, setDriveLink] = useState<string>(initialSelection?.googleDriveLink || "");
  
  // Fetch available services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('/api/services');
        if (!response.ok) {
          throw new Error('Failed to fetch services');
        }
        const data = await response.json();
        setServices(data);
        setIsLoading(false);
      } catch (err) {
        console.error('Services fetch error:', err);
        setError('Failed to load services. Please try again.');
        setIsLoading(false);
      }
    };

    fetchServices();
  }, []);
  
  // Update parent component when selection changes
  useEffect(() => {
    if (selectedService) {
      const service = services.find(s => s.id === selectedService);
      if (service) {
        const requiresFiles = FILE_REQUIRING_SERVICES.includes(service.Service);
        
        onSelection({
          serviceId: service.id,
          serviceName: service.Service,
          googleDriveLink: driveLink,
          requiresFiles
        });
      }
    }
  }, [selectedService, driveLink, services, onSelection]);
  
  // Get the current service object
  const currentService = services.find(s => s.id === selectedService);
  
  // Determine if the selected service requires file upload
  const requiresFileUpload = currentService 
    ? FILE_REQUIRING_SERVICES.includes(currentService.Service)
    : false;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl">Select Service</CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center p-6">
            <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            <span className="ml-2 text-gray-500">Loading services...</span>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="service-select">Service Type</Label>
              <Select
                value={selectedService}
                onValueChange={setSelectedService}
              >
                <SelectTrigger id="service-select">
                  <SelectValue placeholder="Select a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map(service => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.Service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {currentService && (
              <div className="rounded-md bg-blue-50 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <Info className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      Service Information
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>{currentService.Info || `Information about ${currentService.Service}.`}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Google Drive Link Field */}
            <div className="space-y-2">
              <div className="flex items-center">
                <LinkIcon className="h-4 w-4 mr-2 text-blue-600" />
                <Label htmlFor="drive-link">Google Drive Link</Label>
                {requiresFileUpload && (
                  <span className="ml-2 text-red-500 text-xs">*Required</span>
                )}
              </div>
              
              <Input
                id="drive-link"
                placeholder="https://drive.google.com/..."
                value={driveLink}
                onChange={(e) => setDriveLink(e.target.value)}
                className={requiresFileUpload && !driveLink ? "border-red-300" : ""}
              />
              
              {requiresFileUpload && !driveLink && (
                <p className="text-sm text-red-500">
                  A Google Drive link is required for this service
                </p>
              )}
            </div>
            
            {/* Important Notice about File Requirements */}
            <Alert variant={requiresFileUpload ? "warning" : "default"} className="mt-4">
              <AlertTriangle className="h-4 w-4 mr-2" />
              <AlertDescription>
                <strong>Important:</strong> For services that require file assessment (3D Printing, Laser Cutting, 
                CNC Machining, PCB Manufacturing), you <strong>must</strong> provide a Google Drive link containing 
                your project files. Files are necessary for evaluation and fabrication.
              </AlertDescription>
            </Alert>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ServiceSelection;