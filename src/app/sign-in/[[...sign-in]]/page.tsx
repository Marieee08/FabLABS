"use client";

import { useEffect, useState } from "react";
import { SignIn, useUser, useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Loader } from "lucide-react";

export default function Page() {
    const { user, isLoaded } = useUser();
    const { isSignedIn } = useAuth();
    const router = useRouter();
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [showTransition, setShowTransition] = useState(false);

    // Handle sign-in state transitions
    useEffect(() => {
        // When a user signs in, immediately show the transition screen
        if (isSignedIn && !showTransition) {
            setShowTransition(true);
        }
    }, [isSignedIn, showTransition]);

    useEffect(() => {
        const checkUserRole = async () => {
            if (!isLoaded || !user) return;

            setIsRedirecting(true);
            try {
                // Add a small delay to ensure the transition animation is visible
                await new Promise(resolve => setTimeout(resolve, 800));
                
                // Fetch user role from your API
                const response = await fetch('/api/auth/check-roles');
                if (!response.ok) {
                    throw new Error('Failed to fetch role');
                }
                
                const data = await response.json();
                const userRole = data.role;

                // Add another small delay before redirecting
                await new Promise(resolve => setTimeout(resolve, 500));

                // Redirect based on role
                if (userRole === "SURVEY") {
                    router.push('/survey');
                } else if (userRole === "ADMIN") {
                    router.push('/admin-dashboard');
                } else if (userRole === "STUDENT") {
                    router.push('/student-dashboard');
                } else if (userRole === "CASHIER") {
                    router.push('/cashier-dashboard');
                } else {
                    router.push('/user-dashboard');
                }
            } catch (error) {
                console.error("Error checking user role:", error);
                setIsRedirecting(false);
                setShowTransition(false);
            }
        };

        checkUserRole();
    }, [user, isLoaded, router]);

    return (
        <>
            {/* Full-screen transition overlay */}
            {showTransition && (
                <div className="fixed inset-0 bg-[#0b1d41] bg-opacity-95 z-50 flex flex-col items-center justify-center transition-opacity duration-500">
                    <Image src="/images/logos/SSF-logo.png" alt="FabLAB Logo" width={72} height={72} className="mb-6 animate-pulse" />
                    <h2 className="text-2xl font-qanelas3 text-white mb-4">Welcome to FabLAB</h2>
                    <div className="relative w-64 h-4 bg-[#1c2a52] rounded-full overflow-hidden">
                        <div className="absolute top-0 left-0 h-full bg-[#1c62b5] rounded-full animate-[progressBar_2s_ease-in-out_infinite]"></div>
                    </div>
                    <p className="mt-4 text-blue-200 font-poppins1">Preparing your dashboard...</p>
                </div>
            )}

            <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
                {/* Left Side - Background & Logo */}
                <div className="w-full md:w-1/2 bg-[#0b1d41] flex flex-col justify-center items-center p-8 relative">
                    <div className="absolute top-8 left-8 flex items-center">
                        <Image src="/images/logos/SSF-logo.png" alt="FabLAB Logo" width={48} height={48} />
                        <span className="ml-4 text-white text-2xl font-qanelas4">FABLAB</span>
                    </div>
                    
                    <div className="text-center max-w-md">
                        <h1 className="text-3xl md:text-4xl font-qanelas3 text-white mb-6">Welcome Back!</h1>
                        <p className="text-blue-200 mb-8 font-poppins1">Sign in to access the FabLAB services and manage your reservations</p>
                        
                        <div className="hidden md:block">
                            <Image 
                                src="/images/elements/landingelement.gif" 
                                alt="FabLAB Services" 
                                width={400} 
                                height={300} 
                                className="mx-auto mt-8"
                            />
                        </div>
                    </div>
                </div>
                
                {/* Right Side - Sign In */}
                <div className="w-full md:w-1/2 flex justify-center items-center p-4 md:p-8">
                    {isRedirecting ? (
                        <div className="flex flex-col items-center justify-center">
                            <Loader className="h-12 w-12 animate-spin text-blue-600 mb-4" />
                            <p className="text-lg font-medium text-gray-700">Redirecting to dashboard...</p>
                        </div>
                    ) : (
                        <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-md">
                            <SignIn 
                                routing="path" 
                                path="/sign-in" 
                                redirectUrl="/" 
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Add animation keyframes for progress bar */}
            <style jsx global>{`
                @keyframes progressBar {
                    0% { width: 0%; }
                    50% { width: 70%; }
                    70% { width: 80%; }
                    90% { width: 90%; }
                    100% { width: 98%; }
                }
            `}</style>
        </>
    );
}