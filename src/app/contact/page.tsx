// /contact/page.tsx

'use client';

import { useState } from 'react';
import Navbar from '@/components/custom/navbar';

// Define type for submit status
type SubmitStatusType = 'success' | 'error' | null;

export default function Contact() {
    const [studentName, setStudentName] = useState('');
    const [studentEmail, setStudentEmail] = useState('');
    const [studentGrade, setStudentGrade] = useState('');
    const [teacherEmail, setTeacherEmail] = useState('');
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<SubmitStatusType>(null);

    // Update this in your Contact component's handleSubmit function

const handleSubmit = async (e: { preventDefault: () => void; }) => {
  e.preventDefault();
  setIsSubmitting(true);
  
  try {
    const response = await fetch('/api/teacher-confirm-test', {  // Updated endpoint
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        studentName, 
        studentEmail, 
        studentGrade,
        teacherEmail, 
        message 
      }),
    });
    
    if (response.ok) {
      setSubmitStatus('success');
      setStudentName('');
      setStudentEmail('');
      setStudentGrade('');
      setTeacherEmail('');
      setMessage('');
    } else {
      setSubmitStatus('error');
    }
  } catch (error) {
    console.error('Error sending email:', error);
    setSubmitStatus('error');
  } finally {
    setIsSubmitting(false);
  }
};

    return (
      <main className="min-h-screen bg-[#f1f1f8] pt-24">
        
        <Navbar />
  
        <section>
          <div className="container mx-auto px-5 py-24">
          
            <div className="mb-12 flex w-full flex-col text-center">
              <h1 className="title-font mb-4 text-2xl font-medium text-gray-800 sm:text-3xl">Contact Us</h1>
              <p className="mx-auto text-base leading-relaxed lg:w-2/3">
                Please provide your information and your teacher's email so we can better assist you.
              </p>
            </div>

            <div className="mx-auto md:w-2/3 lg:w-1/2">
              <form onSubmit={handleSubmit} className="-m-2 flex flex-wrap">
                
                {/* Student Information Section */}
                <div className="w-full p-2 mb-4">
                  <h2 className="text-lg font-medium text-gray-800 mb-3">Student Information</h2>
                </div>

                <div className="w-1/2 p-2">
                  <div className="relative">
                    <input 
                      type="text" 
                      id="studentName" 
                      name="studentName" 
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      required
                      className="peer w-full rounded border border-gray-700 bg-gray-500 bg-opacity-40 py-1 px-3 text-base leading-8 text-gray-800 placeholder-transparent outline-none transition-colors duration-200 ease-in-out focus:border-indigo-500 focus:bg-gray-100 focus:ring-2 focus:ring-blue-900" 
                      placeholder="Student Name" 
                    />
                    <label className="absolute left-3 -top-6 bg-transparent text-sm leading-7 text-blue-900 transition-all peer-placeholder-shown:left-3 peer-placeholder-shown:top-2 peer-placeholder-shown:bg-currentColor peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:left-3 peer-focus:-top-6 peer-focus:text-sm peer-focus:text-blue-500">Student Name</label>
                  </div>
                </div>

             
                <div className="w-1/2 p-2">
                  <div className="relative">
                    <input 
                      type="email" 
                      id="studentEmail" 
                      name="studentEmail" 
                      value={studentEmail}
                      onChange={(e) => setStudentEmail(e.target.value)}
                      required
                      className="peer w-full rounded border border-gray-700 bg-gray-500 bg-opacity-40 py-1 px-3 text-base leading-8 text-gray-800 placeholder-transparent outline-none transition-colors duration-200 ease-in-out focus:border-indigo-500 focus:bg-gray-100 focus:ring-2 focus:ring-blue-900" 
                      placeholder="Student Email" 
                    />
                    <label className="absolute left-3 -top-6 bg-transparent text-sm leading-7 text-blue-900 transition-all peer-placeholder-shown:left-3 peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:left-3 peer-focus:-top-6 peer-focus:text-sm peer-focus:text-blue-500">Student Email</label>
                  </div>
                </div>

                <div className="w-full p-2">
                  <div className="relative">
                    <input 
                      type="text" 
                      id="studentGrade" 
                      name="studentGrade" 
                      value={studentGrade}
                      onChange={(e) => setStudentGrade(e.target.value)}
                      required
                      className="peer w-full rounded border border-gray-700 bg-gray-500 bg-opacity-40 py-1 px-3 text-base leading-8 text-gray-800 placeholder-transparent outline-none transition-colors duration-200 ease-in-out focus:border-indigo-500 focus:bg-gray-100 focus:ring-2 focus:ring-blue-900" 
                      placeholder="Grade Level & Section" 
                    />
                    <label className="absolute left-3 -top-6 bg-transparent text-sm leading-7 text-blue-900 transition-all peer-placeholder-shown:left-3 peer-placeholder-shown:top-2 peer-placeholder-shown:bg-currentColor peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:left-3 peer-focus:-top-6 peer-focus:text-sm peer-focus:text-blue-500">Grade Level & Section</label>
                  </div>
                </div>

                {/* Teacher Information Section */}
                <div className="w-full p-2 mb-2 mt-4">
                  <h2 className="text-lg font-medium text-gray-800 mb-3">Teacher Information</h2>
                </div>

              <div className="w-full p-2">
                <div className="relative">
                  <input 
                    type="email" 
                    id="teacherEmail" 
                    name="teacherEmail" 
                    value={teacherEmail}
                    onChange={(e) => setTeacherEmail(e.target.value)}
                    required
                    className="peer w-full rounded border border-gray-700 bg-gray-500 bg-opacity-40 py-1 px-3 text-base leading-8 text-gray-800 placeholder-transparent outline-none transition-colors duration-200 ease-in-out focus:border-indigo-500 focus:bg-gray-100 focus:ring-2 focus:ring-blue-900" 
                    placeholder="Teacher's Email" 
                  />
                  <label className="absolute left-3 -top-6 bg-transparent text-sm leading-7 text-blue-900 transition-all peer-placeholder-shown:left-3 peer-placeholder-shown:top-2 peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:left-3 peer-focus:-top-6 peer-focus:text-sm peer-focus:text-blue-500">Teacher's Email</label>
                </div>
              </div>

                {/* Message Section */}
                <div className="w-full p-2 mb-2 mt-4">
                  <h2 className="text-lg font-medium text-gray-800 mb-3">Message</h2>
                </div>

                <div className="w-full p-2">
                  <div className="relative">
                    <textarea 
                      id="message" 
                      name="message" 
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      className="peer h-32 w-full resize-none rounded border border-gray-700 bg-gray-500 bg-opacity-40 py-1 px-3 text-base leading-6 text-gray-900 placeholder-transparent outline-none transition-colors duration-200 ease-in-out focus:border-indigo-500 focus:bg-gray-100 focus:ring-2 focus:ring-blue-900" 
                      placeholder="Message"
                    ></textarea>
                    <label className="absolute left-3 -top-6 bg-transparent text-sm leading-7 text-blue-900 transition-all peer-placeholder-shown:left-3 peer-placeholder-shown:top-2 peer-placeholder-shown:currentColor peer-placeholder-shown:text-base peer-placeholder-shown:text-gray-500 peer-focus:left-3 peer-focus:-top-6 peer-focus:text-sm peer-focus:text-blue-500">Message</label>
                  </div>
                </div>

                <div className="w-full p-2 mt-4">
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className={`mx-auto flex items-center justify-center rounded border-0 bg-[#10539b] py-2 px-8 text-lg text-white hover:bg-blue-600 focus:outline-none transition-all duration-300 ${isSubmitting ? 'opacity-90' : ''}`}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="relative flex h-5 w-5 mr-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-300 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-5 w-5 bg-sky-400"></span>
                        </span>
                        <span className="inline-block mr-1">Sending</span>
                        <span className="inline-flex items-baseline">
                          <span className="dot-animation">.</span>
                          <span className="dot-animation animation-delay-200">.</span>
                          <span className="dot-animation animation-delay-400">.</span>
                        </span>
                      </>
                    ) : 'Submit'}
                  </button>
                </div>

                {submitStatus === 'success' && (
                  <div className="w-full p-2">
                    <p className="text-center text-green-600">Message sent successfully!</p>
                  </div>
                )}
                
                {submitStatus === 'error' && (
                  <div className="w-full p-2">
                    <p className="text-center text-red-600">Failed to send message. Please try again.</p>
                  </div>
                )}

                <div className="mt-8 w-full border-t border-gray-800 p-2 pt-8 text-center">
                  <a className="text-indigo-400">ctapales@evc.pshs.edu.ph</a>
                  <p className="my-5 leading-normal">Ground Floor of Crest Building, PSHS-EVC <br />Pawing, Palo, Leyte, 6501, Philippines</p>
                  <span className="inline-flex">
                    <a className="text-gray-500">
                      <svg fill="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-5 w-5" viewBox="0 0 24 24">
                        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path>
                      </svg>
                    </a>
                    <a className="ml-4 text-gray-500">
                      <svg fill="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-5 w-5" viewBox="0 0 24 24">
                        <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path>
                      </svg>
                    </a>
                    <a className="ml-4 text-gray-500">
                      <svg fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-5 w-5" viewBox="0 0 24 24">
                        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"></rect>
                        <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37zm1.5-4.87h.01"></path>
                      </svg>
                    </a>
                    <a className="ml-4 text-gray-500">
                      <svg fill="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" className="h-5 w-5" viewBox="0 0 24 24">
                        <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"></path>
                      </svg>
                    </a>
                  </span>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* Add this CSS for the dot animation */}
        <style jsx>{`
          .dot-animation {
            animation: dotAnimation 1.4s infinite;
            opacity: 0;
          }
          
          .animation-delay-200 {
            animation-delay: 0.2s;
          }
          
          .animation-delay-400 {
            animation-delay: 0.4s;
          }
          
          @keyframes dotAnimation {
            0% { opacity: 0; }
            50% { opacity: 1; }
            100% { opacity: 0; }
          }
        `}</style>
      </main>
    );
  }