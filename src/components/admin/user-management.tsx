import React, { useState, useEffect } from 'react';
import { MoreVertical, Edit, Trash2, Mail } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import EditRoleModal from '@/components/admin-functions/admin-role';
import DeleteConfirmationModal from '@/components/admin-functions/delete-confirmation-modal';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
  type: 'all' | 'msme' | 'student' | 'admin' | 'cashier';
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Fetch users data from the AccInfo table
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        console.log('Fetching users from API...');
        const response = await fetch('/api/user/user-management');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`Failed to fetch users: ${errorData.error || response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Users data received:', data);
        
        if (!Array.isArray(data)) {
          throw new Error('API did not return an array as expected');
        }
        
        // Transform the data to match the component's interface
        const transformedUsers = data.map((user) => ({
          id: user.clerkId,
          name: user.Name,
          email: user.email,
          role: user.Role.toUpperCase(),
          permissions: generatePermissions(user.Role),
          type: mapRoleToType(user.Role)
        }));
        
        console.log('Transformed users:', transformedUsers);
        setUsers(transformedUsers);
        
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load users. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
  
    fetchUsers();
  }, [toast]);

  // Generate permissions array based on role
  const generatePermissions = (role: string): string[] => {
    switch (role.toLowerCase()) {
      case 'admin':
        return ['USER', 'STUDENT', 'ADMIN'];
      case 'msme':
        return ['USER', 'STUDENT'];
      case 'student':
        return ['STUDENT'];
      case 'cashier':
        return ['STUDENT', 'CASHIER'];
      default:
        return ['USER'];
    }
  };

  // Map the Role field from AccInfo to the type used for filtering
  const mapRoleToType = (role: string): 'all' | 'msme' | 'student' | 'admin' | 'cashier' => {
    switch (role.toLowerCase()) {
      case 'msme':
        return 'msme';
      case 'student':
        return 'student';
      case 'admin':
        return 'admin';
      case 'cashier':
        return 'cashier';
      default:
        return 'all';
    }
  };

  const getPermissionColor = (permission: string) => {
    const colors = {
      STUDENT: 'bg-blue-100 text-blue-800',
      USER: 'bg-green-100 text-green-800',
      ADMIN: 'bg-purple-100 text-purple-800',
      CASHIER: 'bg-yellow-100 text-yellow-800'
    };
    return colors[permission as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getRoleColor = (role: string) => {
    const colors = {
      MSME: 'bg-green-100 text-green-800',
      STUDENT: 'bg-blue-100 text-blue-800',
      ADMIN: 'bg-purple-100 text-purple-800',
      CASHIER: 'bg-yellow-100 text-yellow-800'
    };
    return colors[role.toUpperCase() as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleEditPermissions = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setEditModalOpen(true);
    }
  };

  const handleInitiateDelete = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setDeleteModalOpen(true);
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedUser) return;
    
    try {
      setLoading(true);
      
      console.log(`Deleting user with ID: ${selectedUser.id}`);
      
      // Use the new endpoint with POST and pass the userId in the body
      const response = await fetch('/api/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: selectedUser.id }),
      });
      
      console.log(`Delete response status: ${response.status}`);
      console.log(`Delete response status text: ${response.statusText}`);
      
      if (!response.ok) {
        let errorMessage = response.statusText;
        
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        
        throw new Error(`Failed to delete account: ${errorMessage}`);
      }
      
      // Remove user from the local state
      setUsers(users.filter(user => user.id !== selectedUser.id));
      
      toast({
        title: 'Success',
        description: `${selectedUser.name}'s account has been deleted successfully`,
      });
      
      // Close the modal
      setDeleteModalOpen(false);
      setSelectedUser(null);
      
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to delete account. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleContact = (userId: string, email: string) => {
    // Open default email client
    window.location.href = `mailto:${email}`;
  };

  const UserTable = ({ users }: { users: User[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Permissions</TableHead>
          <TableHead className="w-24">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-4">
              No users found
            </TableCell>
          </TableRow>
        ) : (
          users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}
                >
                  {user.role}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex gap-2 flex-wrap">
                  {user.permissions.map((permission, index) => (
                    <span
                      key={index}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getPermissionColor(permission)}`}
                    >
                      {permission}
                    </span>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger className="p-2 hover:bg-gray-100 rounded-full">
                    <MoreVertical className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleEditPermissions(user.id)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Role
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleInitiateDelete(user.id)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Account
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleContact(user.id, user.email)}>
                      <Mail className="mr-2 h-4 w-4" />
                      Contact
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  if (loading) {
    return <div className="p-4 text-center">Loading users...</div>;
  }

  const handleSaveRole = async (userId: string, newRole: string) => {
    try {
      const upperCaseRole = newRole.toUpperCase();
      
      const response = await fetch(`/api/user/user-management/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: upperCaseRole }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update role');
      }
      
      const updatedUser = await response.json();
      
      setUsers(users.map(user => {
        if (user.id === userId) {
          return {
            ...user,
            role: updatedUser.Role.toUpperCase(),
            permissions: generatePermissions(updatedUser.Role),
            type: mapRoleToType(updatedUser.Role)
          };
        }
        return user;
      }));
      
      toast({
        title: 'Success',
        description: 'User role updated successfully',
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role. Please try again.',
        variant: 'destructive',
      });
      throw error;
    }
  };
  
  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="all">ALL</TabsTrigger>
          <TabsTrigger value="msme">MSME</TabsTrigger>
          <TabsTrigger value="student">STUDENT</TabsTrigger>
          <TabsTrigger value="admin">ADMIN</TabsTrigger>
          <TabsTrigger value="cashier">CASHIER</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <UserTable users={users} />
        </TabsContent>
        <TabsContent value="msme">
          <UserTable users={users.filter(user => user.type === 'msme')} />
        </TabsContent>
        <TabsContent value="student">
          <UserTable users={users.filter(user => user.type === 'student')} />
        </TabsContent>
        <TabsContent value="admin">
          <UserTable users={users.filter(user => user.type === 'admin')} />
        </TabsContent>
        <TabsContent value="cashier">
          <UserTable users={users.filter(user => user.type === 'cashier')} />
        </TabsContent>
      </Tabs>
      
      {selectedUser && (
        <>
          <EditRoleModal
            isOpen={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedUser(null);
            }}
            userId={selectedUser.id}
            currentRole={selectedUser.role}
            onSave={handleSaveRole}
          />
          
          <DeleteConfirmationModal
            isOpen={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setSelectedUser(null);
            }}
            onConfirm={handleDeleteAccount}
            userName={selectedUser.name}
          />
        </>
      )}
    </div>
  );
};

export default UserManagement;