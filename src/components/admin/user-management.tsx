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
import ContactModal from '@/components/admin-functions/admin-contact';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  type: 'all' | 'msme' | 'student' | 'admin' | 'cashier';
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
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

  const getRoleColor = (role: string) => {
    const colors = {
      MSME: 'bg-green-100 text-green-800',
      STUDENT: 'bg-blue-100 text-blue-800',
      ADMIN: 'bg-purple-100 text-purple-800',
      CASHIER: 'bg-yellow-100 text-yellow-800'
    };
    return colors[role.toUpperCase() as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleInitiateDelete = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setDeleteModalOpen(true);
    }
  };

  const handleContact = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setSelectedUser(user);
      setContactModalOpen(true);
    }
  };

  const handleDeleteAccount = async () => {
    if (!selectedUser) return;
    
    try {
      setLoading(true);
      
      console.log(`Deleting user with ID: ${selectedUser.id}`);
      
      // Use the new endpoint with POST and pass the userId in the body
      const response = await fetch('/api/user/delete-user', {
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

  const UserTable = ({ users }: { users: User[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="w-24">Action</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.length === 0 ? (
          <TableRow>
            <TableCell colSpan={4} className="text-center py-4">
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
                <DropdownMenu>
                  <DropdownMenuTrigger className="p-2 hover:bg-gray-100 rounded-full">
                    <MoreVertical className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem 
                      onClick={() => handleInitiateDelete(user.id)}
                      className="text-red-600 focus:text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Account
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleContact(user.id)}>
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
          <DeleteConfirmationModal
            isOpen={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setSelectedUser(null);
            }}
            onConfirm={handleDeleteAccount}
            userName={selectedUser.name}
          />
          
          <ContactModal
            isOpen={contactModalOpen}
            onClose={() => {
              setContactModalOpen(false);
              setSelectedUser(null);
            }}
            userName={selectedUser.name}
            userEmail={selectedUser.email}
          />
        </>
      )}
    </div>
  );
};

export default UserManagement;