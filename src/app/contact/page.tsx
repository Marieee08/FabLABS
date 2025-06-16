'use client';

import Navbar from '@/components/custom/navbar';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Contact() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle page loading state
  useEffect(() => {
    // Check for success/error params
    if (searchParams.get('success') === 'true') {
      setSubmitStatus('success');
    } else if (searchParams.get('error') === 'true') {
      setSubmitStatus('error');
    }
  }, [searchParams]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');

    const formData = new FormData(event.currentTarget);
    const name = formData.get('name') as string;
    const email = formData.get('email') as string;
    const message = formData.get('message') as string;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, message }),
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      // Show success state
      setSubmitStatus('success');
      
      // Clear form
      (event.target as HTMLFormElement).reset();
      
      // Redirect after showing success message
      setTimeout(() => {
        router.push('/contact?success=true');
      }, 2000);
      
    } catch (error) {
      console.error('Error sending email:', error);
      setSubmitStatus('error');
      
      // Redirect after showing error message
      setTimeout(() => {
        router.push('/contact?error=true');
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f1f1f8] pt-24">
      <Navbar />

      <section>
        <div className="container mx-auto px-5 py-24">
          <div className="mb-12 flex w-full flex-col text-center">
            <h1 className="title-font mb-4 text-2xl font-medium text-gray-800 sm:text-3xl">Contact Us</h1>
            <p className="mx-auto text-base leading-relaxed lg:w-2/3">Feel free to reach out to us! Whether you have a question,
              feedback, or a collaboration proposal, we&apos;d love to hear from you.
            </p>
          </div>

          {/* Status Messages */}
          {submitStatus === 'success' && (
            <div className="mx-auto md:w-2/3 lg:w-1/2 mb-6">
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Message sent successfully! We&apos;ll get back to you soon.</span>
              </div>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="mx-auto md:w-2/3 lg:w-1/2 mb-6">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center space-x-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>Failed to send message. Please try again.</span>
              </div>
            </div>
          )}

          <div className="mx-auto md:w-2/3 lg:w-1/2">
            <form onSubmit={handleSubmit} className="-m-2 flex flex-wrap">
              <div className="w-1/2 p-2">
                <div className="relative">
                  <input 
                    type="text" 
                    id="name" 
                    name="name" 
                    required
                    disabled={isSubmitting}
                    className="peer w-full rounded border border-gray-700 bg-gray-500 bg-opacity-40 py-1 px-3 text-base leading-8 text-gray-800 placeholder-transparent outline-none transition-colors duration-200 ease-in-out focus:border-indigo-500 focus:bg-gray-100 focus:ring-2 focus:ring-blue-900 disabled:opacity-50 disabled:cursor-not-allowed" 
                    placeholder="Name" 
                  />
                  <label htmlFor="name" className="absolute left-3 -top-6 bg-transparent text-sm leading-7 text-blue-900 transition-all peer-placeholder-shown:left-3 peer-placeholder-shown:top-2 peer-placeholder-shown:bg-currentColor peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:left-3 peer-focus:-top-6 peer-focus:text-sm peer-focus:text-blue-500">Name</label>
                </div>
              </div>
              <div className="w-1/2 p-2">
                <div className="relative">
                  <input 
                    type="email" 
                    id="email" 
                    name="email" 
                    required
                    disabled={isSubmitting}
                    className="peer w-full rounded border border-gray-700 bg-gray-500 bg-opacity-40 py-1 px-3 text-base leading-8 text-gray-800 placeholder-transparent outline-none transition-colors duration-200 ease-in-out focus:border-indigo-500 focus:bg-gray-100 focus:ring-2 focus:ring-blue-900 disabled:opacity-50 disabled:cursor-not-allowed" 
                    placeholder="Email" 
                  />
                  <label htmlFor="email" className="absolute left-3 -top-6 bg-transparent text-sm leading-7 text-blue-900 transition-all peer-placeholder-shown:left-3 peer-placeholder-shown:top-2 peer-placeholder-shown:bg-currentColor peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:left-3 peer-focus:-top-6 peer-focus:text-sm peer-focus:text-blue-500">Email</label>
                </div>
              </div>
              <div className="mt-4 w-full p-2">
                <div className="relative">
                  <textarea 
                    id="message" 
                    name="message" 
                    required
                    disabled={isSubmitting}
                    className="peer h-32 w-full resize-none rounded border border-gray-700 bg-gray-500 bg-opacity-40 py-1 px-3 text-base leading-6 text-gray-900 placeholder-transparent outline-none transition-colors duration-200 ease-in-out focus:border-indigo-500 focus:bg-gray-100 focus:ring-2 focus:ring-blue-900 disabled:opacity-50 disabled:cursor-not-allowed" 
                    placeholder="Message"
                  ></textarea>
                  <label htmlFor="message" className="absolute left-3 -top-6 bg-transparent text-sm leading-7 text-blue-900 transition-all peer-placeholder-shown:left-3 peer-placeholder-shown:top-2 peer-placeholder-shown:currentColor peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:left-3 peer-focus:-top-6 peer-focus:text-sm peer-focus:text-blue-500">Message</label>
                </div>
              </div>
              <div className="w-full p-2">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="mx-auto flex items-center justify-center rounded border-0 bg-[#10539b] py-2 px-8 text-lg text-white hover:bg-blue-600 focus:outline-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]"
                >
                  {isSubmitting ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Sending...</span>
                    </div>
                  ) : (
                    'Submit'
                  )}
                </button>
              </div>

              <div className="mt-8 w-full border-t border-gray-800 p-2 pt-8 text-center">
                <a className="text-indigo-400">fablab@evc.pshs.edu.ph</a>
                <p className="my-5 leading-normal">Ground Floor of Crest Building, PSHS-EVC <br />Pawing, Palo, Leyte, 6501, Philippines</p>
                <span className="inline-flex">
                  <a 
                    href="https://www.facebook.com/fablabeasternvisayas" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-blue-600 transition-colors"
                  >
                    <svg fill="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-5 w-5" viewBox="0 0 24 24">
                      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path>
                    </svg>
                  </a>
                </span>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}