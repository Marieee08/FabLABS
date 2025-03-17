"use client";

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
import {
  MoreVertical,
  Edit,
  Trash2,
  Wrench,
  Plus,
  Minus,
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
import { Label } from '@/components/ui/label';

interface Tool {
  id: string;
  Tool: string;
  Quantity: number;
}

interface ToolFormData {
  Tool: string;
  Quantity: number;
}

const AdminTools = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<Tool | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchTools();
  }, []);

  const fetchTools = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/tools');
      if (!response.ok) {
        throw new Error('Failed to fetch tools');
      }
      const data = await response.json();
      setTools(data);
    } catch (error) {
      console.error('Error fetching tools:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch tools');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (formData: ToolFormData) => {
    setIsLoading(true);
    setError(null);
    try {
      const payload = {
        Tool: formData.Tool.trim(),
        Quantity: formData.Quantity,
      };

      // Validation
      if (!payload.Tool) throw new Error('Tool name is required');
      if (payload.Quantity < 1) throw new Error('Quantity must be at least 1');

      const endpoint = editingTool ? `/api/tools/${editingTool.id}` : '/api/tools';
      const method = editingTool ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        if (responseData.errors) {
          throw new Error(responseData.errors.join(', '));
        }
        throw new Error(responseData.error || 'Failed to save tool');
      }
      
      await fetchTools();
      setIsDialogOpen(false);
      setEditingTool(null);
    } catch (error) {
      console.error('Error saving tool:', error);
      setError(error instanceof Error ? error.message : 'Failed to save tool');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTool = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this tool?')) return;
    
    try {
      const response = await fetch(`/api/tools/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete tool');
      }
      
      await fetchTools();
      setOpenMenuId(null);
    } catch (error) {
      console.error('Error deleting tool:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete tool');
    }
  };

  const ToolForm = ({ onSubmit }: { onSubmit: (data: ToolFormData) => void }) => {
    const [formData, setFormData] = useState<ToolFormData>({
      Tool: editingTool?.Tool || '',
      Quantity: editingTool?.Quantity || 1,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      if (name === 'Quantity') {
        setFormData(prev => ({ ...prev, [name]: Math.max(1, parseInt(value) || 1) }));
      } else {
        setFormData(prev => ({ ...prev, [name]: value }));
      }
    };

    const adjustQuantity = (amount: number) => {
      setFormData(prev => ({
        ...prev,
        Quantity: Math.max(1, prev.Quantity + amount)
      }));
    };

    const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleFormSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="Tool">Tool Name *</Label>
            <Input
              id="Tool"
              name="Tool"
              value={formData.Tool}
              onChange={handleChange}
              placeholder="Enter tool name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="Quantity">Quantity *</Label>
            <div className="flex items-center space-x-2">
              <Button 
                type="button"
                variant="outline"
                size="icon"
                onClick={() => adjustQuantity(-1)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                id="Quantity"
                name="Quantity"
                type="number"
                value={formData.Quantity}
                onChange={handleChange}
                className="w-20 text-center"
                min="1"
                required
              />
              <Button 
                type="button"
                variant="outline"
                size="icon"
                onClick={() => adjustQuantity(1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setIsDialogOpen(false);
                setEditingTool(null);
                setError(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : editingTool ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </div>
      </form>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-[#143370]">Tools</h2>
        <Button 
          onClick={() => {
            setEditingTool(null);
            setError(null);
            setIsDialogOpen(true);
          }}
          className="bg-[#143370] hover:bg-[#0d2451] text-white"
        >
          Add New Tool
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#143370]"></div>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tool</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tools.length > 0 ? (
              tools.map((tool) => (
                <TableRow key={tool.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      {tool.Tool}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {tool.Quantity}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu
                      open={openMenuId === tool.id}
                      onOpenChange={(open) => {
                        setOpenMenuId(open ? tool.id : null);
                      }}
                    >
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingTool(tool);
                            setError(null);
                            setIsDialogOpen(true);
                            setOpenMenuId(null);
                          }}
                          className="cursor-pointer"
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteTool(tool.id)}
                          className="cursor-pointer text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6">
                  No tools available. Add your first tool to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTool ? 'Edit Tool' : 'Create New Tool'}
            </DialogTitle>
          </DialogHeader>
          <ToolForm onSubmit={handleSubmit} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTools;