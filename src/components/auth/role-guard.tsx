'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

// Define the structure of our cache
type RoleCache = {
  role: string;
  timestamp: number;
};

const CACHE_DURATION = 30 * 60 * 1000;  // 30 minutes

// Create a variable to store our cache
let roleCache: RoleCache | null = null;

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const router = useRouter();
  const { userId } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    async function checkRole() {
      if (!userId) {
        router.push('/');
        return;
      }

      try {
        let role: string;

        // Check if cache exists and is still valid
        if (roleCache && (Date.now() - roleCache.timestamp) < CACHE_DURATION) {
          console.log('Using cached role:', roleCache.role);
          role = roleCache.role;
        } else {
          console.log('Fetching fresh role from API');
          const response = await fetch('/api/auth/check-roles');
          const data = await response.json();
          role = data.role;

          // Save to cache
          roleCache = {
            role,
            timestamp: Date.now()
          };
        }

        // If user isn't authorized for this page, redirect to their appropriate dashboard
        if (!allowedRoles.includes(role)) {
          switch (role) {
            case 'MSME':
              router.push('/user-dashboard');
              break;
            case 'SURVEY':
            router.push('/survey');
            break;
            case 'STUDENT':
              router.push('/student-dashboard');
              break;
            case 'ADMIN':
              router.push('/admin-dashboard');
              break;
            case 'CASHIER':
              router.push('/cashier-dashboard');
              break;
            default:
              router.push('/');
              break;
          }
          return;
        }
        setIsAuthorized(true);
      } catch (error) {
        console.error('Error checking role:', error);
        router.push('/');
      }
    }

    checkRole();
  }, [userId, router, allowedRoles]);

  // Show loading screen while checking authorization
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-600">Checking authorization...</p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}