// /survey/questionnaire/page.tsx


"use client";

import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';

const ThankYouPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 py-12 flex justify-center items-center">
      <Card className="w-full max-w-xl mx-auto bg-white border border-[#5e86ca] rounded-2xl shadow-lg">
        <CardHeader className="space-y-2 flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <CardTitle className="text-3xl font-qanelas2 text-[#0e4579]">
            Thank You!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center pb-8">
          <p className="text-gray-600 mb-8">
            Your feedback has been successfully submitted. We appreciate your time and input to help us improve our services.
          </p>
          
          <Button 
            onClick={() => router.push('/survey')} 
            className="bg-[#193d83] text-white hover:bg-[#2f61c2] font-qanelas1 px-6"
          >
            Return to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ThankYouPage;