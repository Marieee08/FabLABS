"use client";

import { useEffect } from "react";
import { SignIn, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export default function Page() {
    const { user, isLoaded } = useUser();
    const router = useRouter();

    useEffect(() => {
        const checkUserRole = async () => {
            if (!isLoaded || !user) return;

            try {
                // Fetch user role from your API
                const response = await fetch('/api/auth/check-roles');
                if (!response.ok) {
                    throw new Error('Failed to fetch role');
                }
                
                const data = await response.json();
                const userRole = data.role;

                // Redirect based on role
                if (userRole === "SURVEY") {
                    router.push('/survey');
                } else if (userRole === "ADMIN") {
                    router.push('/admin-dashboard');
                } else {
                    router.push('/user-dashboard');
                }
            } catch (error) {
                console.error("Error checking user role:", error);
            }
        };

        checkUserRole();
    }, [user, isLoaded, router]);

    return (
        <div className="flex justify-center items-center min-h-screen bg-gray-50">
            <div className="w-full max-w-md">
                <SignIn routing="path" path="/sign-in" redirectUrl="/" />
            </div>
        </div>
    );
}