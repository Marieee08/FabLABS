import React, { useState, useEffect } from 'react';
import { Trash2, Plus, Mail, Check, X, RefreshCw } from 'lucide-react';

interface TeacherEmail {
  id: string;
  email: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function TeacherEmailManager() {
  const [emails, setEmails] = useState<TeacherEmail[]>([]);
  const [newEmail, setNewEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Fetch teacher emails
  const fetchEmails = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/teacher-emails');
      if (!response.ok) throw new Error('Failed to fetch emails');
      const data = await response.json();
      setEmails(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, []);

  // Add new teacher email
  const addEmail = async () => {
    if (!newEmail || !newEmail.includes('@') || !newEmail.includes('.')) {
      setError('Please enter a valid email');
      return;
    }
    
    try {
      const response = await fetch('/api/admin/teacher-emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail })
      });
      
      if (!response.ok) throw new Error('Failed to add email');
      
      fetchEmails();
      setNewEmail('');
    } catch (err: any) {
      setError(err.message || 'Failed to add email');
    }
  };

  // Delete teacher email
  const deleteEmail = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/teacher-emails/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete email');
      
      fetchEmails();
    } catch (err: any) {
      setError(err.message || 'Failed to delete email');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4">Manage Teacher Emails</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded mb-4 flex justify-between">
          <span>{error}</span>
          <button onClick={() => setError('')}><X className="h-4 w-4" /></button>
        </div>
      )}
      
      <div className="flex space-x-2 mb-6">
        <div className="relative flex-grow">
          <Mail className="h-4 w-4 text-gray-400 absolute top-3 left-3" />
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="pl-10 w-full p-2 border border-gray-300 rounded"
            placeholder="teacher@evc.pshs.edu.ph"
          />
        </div>
        <button
          onClick={addEmail}
          className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 flex items-center"
        >
          <Plus className="h-4 w-4 mr-1" /> Add
        </button>
      </div>
      
      <div className="border rounded overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Added On</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button onClick={fetchEmails} className="hover:text-blue-500">
                  <RefreshCw className="h-4 w-4" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : emails.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  No teacher emails added yet
                </td>
              </tr>
            ) : (
              emails.map((email) => (
                <tr key={email.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {email.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {email.verified ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Check className="h-3 w-3 mr-1" /> Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Pending
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(email.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => deleteEmail(email.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}