// /components/auth/role-guard/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Loader } from 'lucide-react';

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
  const [isLoading, setIsLoading] = useState(true);
  const [loadingText, setLoadingText] = useState("Checking authorization...");
  const [loadingProgress, setLoadingProgress] = useState(0);

  useEffect(() => {
    let isActive = true;
    const loadingInterval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 90) return prev;
        return prev + 10;
      });
    }, 300);

    async function checkRole() {
      if (!userId) {
        setLoadingText("Redirecting to login...");
        setLoadingProgress(100);
        setTimeout(() => {
          router.push('/');
        }, 700); // Small delay for smooth transition
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
          setLoadingText("Verifying your access...");
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
          setLoadingText(`Redirecting to ${role.toLowerCase()} dashboard...`);
          setLoadingProgress(100);
          
          setTimeout(() => {
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
              case 'TEACHER':
                router.push('/teacher-dashboard');
                break;
              default:
                router.push('/');
                break;
            }
          }, 700); // Small delay for smooth transition
          return;
        }
        
        if (isActive) {
          setLoadingText("Access granted, loading page...");
          setLoadingProgress(100);
          setTimeout(() => {
            setIsAuthorized(true);
            setIsLoading(false);
          }, 700); // Small delay for smooth transition
        }
      } catch (error) {
        console.error('Error checking role:', error);
        if (isActive) {
          setLoadingText("Something went wrong, redirecting...");
          setLoadingProgress(100);
          setTimeout(() => {
            router.push('/');
          }, 700);
        }
      }
    }

    checkRole();

    return () => {
      isActive = false;
      clearInterval(loadingInterval);
    };
  }, [userId, router, allowedRoles]);

  // Show loading screen while checking authorization
  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center">
        <div className="flex flex-col items-center max-w-md mx-auto p-6">
          <Loader className="h-12 w-12 animate-spin text-blue-600 mb-4" />
          <p className="text-blue-600 font-medium text-lg mb-4">{loadingText}</p>
          
          {/* Progress bar */}
          <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-600 transition-all duration-300 ease-out"
              style={{ width: `${loadingProgress}%` }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
