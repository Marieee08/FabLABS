import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import * as LucideIcons from 'lucide-react';
import {
  MoreVertical,
  Edit,
  Trash2,
  CircleDollarSign,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Machine {
  id: string;
  Machine: string;
}

interface Service {
  id: string;
  Service: string;
  Icon: string | null;
  Info: string;
  Costs: number | null;
  Per: string;
  Machines: {
    machine: Machine;
  }[];
}

interface ServiceFormData {
  Service: string;
  Icon: string;
  Info: string;
  Costs: string;
  Per: string;
}

const AdminServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/services');
      const data = await response.json();
      setServices(data);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const handleSubmit = async (formData: ServiceFormData) => {
    setIsLoading(true);
    try {
      const payload = {
        Service: formData.Service,
        Icon: formData.Icon || null,
        Info: formData.Info,
        Costs: formData.Costs ? parseFloat(formData.Costs) : null,
        Per: formData.Per,
      };

      console.log('Submitting data:', payload); // Debug log

      const endpoint = editingService ? `/api/services/${editingService.id}` : '/api/services';
      const method = editingService ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('Server response:', responseData); // Debug log
        throw new Error(responseData.message || 'Failed to save service');
      }
      
      await fetchServices();
      setIsDialogOpen(false);
      setEditingService(null);
    } catch (error) {
      console.error('Error saving service:', error);
      // You might want to show this error to the user via a toast notification
      alert(error instanceof Error ? error.message : 'Failed to save service');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;
    
    try {
      const response = await fetch(`/api/services/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete service');
      
      await fetchServices();
    } catch (error) {
      console.error('Error deleting service:', error);
    }
  };

  const ServiceForm = ({ onSubmit }: { onSubmit: (data: ServiceFormData) => void }) => {
    const [formData, setFormData] = useState<ServiceFormData>({
      Service: editingService?.Service || '',
      Icon: editingService?.Icon || '',
      Info: editingService?.Info || '',
      Costs: editingService?.Costs?.toString() || '',
      Per: editingService?.Per || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleFormSubmit} className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="Service">Service Name *</Label>
            <Input
              id="Service"
              name="Service"
              value={formData.Service}
              onChange={handleChange}
              placeholder="Enter service name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="Icon">Icon Name</Label>
            <Input
              id="Icon"
              name="Icon"
              value={formData.Icon}
              onChange={handleChange}
              placeholder="Enter icon name from Lucide (e.g., 'wrench')"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="Info">Information *</Label>
            <Textarea
              id="Info"
              name="Info"
              value={formData.Info}
              onChange={handleChange}
              placeholder="Enter service information"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="Costs">Cost</Label>
            <Input
              id="Costs"
              name="Costs"
              type="number"
              value={formData.Costs}
              onChange={handleChange}
              placeholder="Enter cost"
              step="0.01"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="Per">Per (Unit) *</Label>
            <Input
              id="Per"
              name="Per"
              value={formData.Per}
              onChange={handleChange}
              placeholder="Enter unit (e.g., 'hour', 'session')"
              required
            />
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsDialogOpen(false);
                setEditingService(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : editingService ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </div>
      </form>
    );
  };

  const DynamicIcon = ({ iconName }: { iconName: string | null }) => {
    if (!iconName) return null;
    
    // Convert icon name to match Lucide's naming convention
    // e.g., "wrench" becomes "Wrench"
    const formattedIconName = iconName.charAt(0).toUpperCase() + iconName.slice(1);
    const IconComponent = (LucideIcons as any)[formattedIconName];
    
    if (!IconComponent) {
      console.warn(`Icon "${iconName}" not found`);
      return null;
    }
    
    return <IconComponent className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#143370]">Services</h2>
        <Button 
          onClick={() => {
            setEditingService(null);
            setIsDialogOpen(true);
          }}
          className="bg-[#143370] hover:bg-[#0d2451] text-white"
        >
          Add New Service
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Service</TableHead>
            <TableHead>Information</TableHead>
            <TableHead>Cost</TableHead>
            <TableHead>Associated Machines</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.map((service) => (
            <TableRow key={service.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <DynamicIcon iconName={service.Icon} />
                  {service.Service}
                </div>
              </TableCell>
              <TableCell className="max-w-md truncate">{service.Info}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <CircleDollarSign className="h-4 w-4" />
                  {service.Costs ? (
                    <span>
                      ₱{service.Costs.toLocaleString()} / {service.Per}
                    </span>
                  ) : (
                    '-'
                  )}
                </div>
              </TableCell>
              <TableCell>
                {service.Machines?.map(m => m.machine.Machine).join(', ') || '-'}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setEditingService(service);
                        setIsDialogOpen(true);
                      }}
                      className="cursor-pointer"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteService(service.id)}
                      className="cursor-pointer text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingService ? 'Edit Service' : 'Create New Service'}
            </DialogTitle>
          </DialogHeader>
          <ServiceForm onSubmit={handleSubmit} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminServices;