"use client";

import { SignUp, useAuth } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Page() {
    const { isSignedIn } = useAuth();
    const router = useRouter();
    const [showTransition, setShowTransition] = useState(false);
    
    // Monitor sign-up state
    useEffect(() => {
        // When user signs up successfully, show transition screen
        if (isSignedIn && !showTransition) {
            setShowTransition(true);
            
            // Add delay before redirecting to ensure transition is visible
            const redirectTimer = setTimeout(() => {
                router.push('/user-dashboard');
            }, 2500);
            
            return () => clearTimeout(redirectTimer);
        }
    }, [isSignedIn, showTransition, router]);
    return (
        <>
            {/* Full-screen transition overlay - shows after successful sign-up */}
            {showTransition && (
                <div className="fixed inset-0 bg-[#0b1d41] bg-opacity-95 z-50 flex flex-col items-center justify-center transition-opacity duration-500">
                    <Image src="/images/logos/SSF-logo.png" alt="FabLAB Logo" width={72} height={72} className="mb-6 animate-pulse" />
                    <h2 className="text-2xl font-qanelas3 text-white mb-4">Welcome to FabLAB</h2>
                    <div className="flex items-center gap-2 mb-4">
                        <svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52" width="52" height="52">
                            <circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none" stroke="#4BB543" strokeWidth="2" />
                            <path className="checkmark__check" fill="none" stroke="#fff" strokeWidth="3" d="M14.1 27.2l7.1 7.2 16.7-16.8" strokeDasharray="48" strokeDashoffset="48" />
                        </svg>
                        <span className="text-white font-poppins1 text-xl">Account Created!</span>
                    </div>
                    <div className="relative w-64 h-4 bg-[#1c2a52] rounded-full overflow-hidden">
                        <div className="absolute top-0 left-0 h-full bg-[#1c62b5] rounded-full animate-[progressBar_2s_ease-in-out_forwards]"></div>
                    </div>
                    <p className="mt-4 text-blue-200 font-poppins1">Setting up your dashboard...</p>
                </div>
            )}

            <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
                {/* Left Side - Background & Info */}
                <div className="w-full md:w-1/2 bg-[#0b1d41] flex flex-col justify-center items-center p-8 relative">
                    <div className="absolute top-8 left-8 flex items-center">
                        <Image src="/images/logos/SSF-logo.png" alt="FabLAB Logo" width={48} height={48} />
                        <span className="ml-4 text-white text-2xl font-qanelas4">FABLAB</span>
                    </div>
                    
                    <div className="text-center max-w-md">
                        <h1 className="text-3xl md:text-4xl font-qanelas3 text-white mb-6">Join FabLAB Today</h1>
                        <p className="text-blue-200 mb-8 font-poppins1">Create an account to access our services and bring your ideas to life</p>
                        
                        <div className="space-y-6 mt-8">
                            <div className="flex items-center p-4 bg-[#1c2a52] rounded-lg">
                                <div className="bg-blue-500 p-2 rounded-full mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-white text-left">Book lab equipment & services</p>
                            </div>
                            
                            <div className="flex items-center p-4 bg-[#1c2a52] rounded-lg">
                                <div className="bg-blue-500 p-2 rounded-full mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-white text-left">Track your reservations</p>
                            </div>
                            
                            <div className="flex items-center p-4 bg-[#1c2a52] rounded-lg">
                                <div className="bg-blue-500 p-2 rounded-full mr-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-white text-left">Get support from our team</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-8 text-center">
                        <p className="text-blue-200 font-poppins1">Already have an account?</p>
                        <Link href="/sign-in" className="mt-2 inline-block font-qanelas2 text-white border border-white px-6 py-2 rounded-full hover:bg-white hover:text-[#0b1d41] transition duration-300">
                            Sign In
                        </Link>
                    </div>
                </div>
                
                {/* Right Side - Sign Up Form */}
                <div className="w-full md:w-1/2 flex justify-center items-center p-4 md:p-8">
                    <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-md">
                        <SignUp 
                            routing="path" 
                            path="/sign-up" 
                            redirectUrl="/"
                            appearance={{
                                layout: {
                                    socialButtonsPlacement: "top",
                                    socialButtonsVariant: "blockButton",
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
            
            {/* Add animation keyframes */}
            <style jsx global>{`
                @keyframes progressBar {
                    0% { width: 0%; }
                    20% { width: 30%; }
                    50% { width: 60%; }
                    70% { width: 80%; }
                    100% { width: 100%; }
                }
                
                .checkmark__circle {
                    stroke-dasharray: 166;
                    stroke-dashoffset: 166;
                    animation: stroke 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
                }
                
                .checkmark__check {
                    animation: check 0.3s 0.6s cubic-bezier(0.65, 0, 0.45, 1) forwards;
                }
                
                @keyframes stroke {
                    100% {
                        stroke-dashoffset: 0;
                    }
                }
                
                @keyframes check {
                    100% {
                        stroke-dashoffset: 0;
                    }
                }
            `}</style>
        </>
    );
}