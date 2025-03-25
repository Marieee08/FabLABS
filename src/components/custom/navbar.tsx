"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, Loader } from 'lucide-react';
import { ClerkProvider, SignUpButton, SignedIn, SignedOut, UserButton, useUser } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';

const Navbar = () => {
  const [bgColor, setBgColor] = useState('transparent');
  const [textColor, setTextColor] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const userRole = user?.publicMetadata?.role || "USER";
  
  useEffect(() => { 
    const handleScroll = () => { 
      if (window.scrollY > 50) { 
        setBgColor('white'); 
      } else { 
        setBgColor('transparent'); 
      } 
    }; 
    
    window.addEventListener('scroll', handleScroll); 
    return () => window.removeEventListener('scroll', handleScroll); 
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (pathname === '/services') {
        if (window.scrollY > 50) {
          setBgColor('white');
          setTextColor('black');
        } else {
          setBgColor('transparent');
          setTextColor('white');
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  useEffect(() => {
    if (isLoaded && user) {
      const path = window.location.pathname;
      if (path.includes('/admin-dashboard') && userRole !== 'ADMIN') {
        router.push('/user-dashboard');
      }
    }
  }, [isLoaded, user, userRole, router]);

  // Set up loading state for navigation
  useEffect(() => {
    const handleStart = () => setIsLoading(true);
    const handleComplete = () => setIsLoading(false);

    router.events?.on('routeChangeStart', handleStart);
    router.events?.on('routeChangeComplete', handleComplete);
    router.events?.on('routeChangeError', handleComplete);

    return () => {
      router.events?.off('routeChangeStart', handleStart);
      router.events?.off('routeChangeComplete', handleComplete);
      router.events?.off('routeChangeError', handleComplete);
    };
  }, [router]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleNavigation = (href: string) => {
    setIsLoading(true);
    router.push(href);
  };

  const linkClassName = `font-qanelas1 px-4 py-2 rounded-full hover:bg-[#d5d7e2] transition duration-300 ${
    pathname === '/services' ? 'text-white hover:text-black' : 'text-black'
  }`;

  return (
    <>
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-white bg-opacity-70 z-50 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <Loader className="h-8 w-8 animate-spin text-blue-600" />
            <p className="mt-2 text-sm font-medium text-blue-600">Loading...</p>
          </div>
        </div>
      )}

      <nav
        className={`py-4 fixed w-full top-0 z-40 transition duration-300 ease-in-out`}
        style={{ backgroundColor: bgColor}}
      >
        <div className="flex justify-between items-center px-4 md:px-10">
          <div className="flex items-center space-x-4">
            <Image src="/images/logos/SSF-logo.png" alt="SSF Logo" width={40} height={40} />
            <Link href="/" style={{color: textColor}} onClick={() => handleNavigation('/')} className={pathname === '/services' ? "text-white text-2xl font-qanelas4" : "text-[#0b1d41] text-2xl font-qanelas4"}>FABLABS</Link>
          </div>

          <button 
            className={`md:hidden ${pathname === '/services' ? "text-white" : "text-[#0e4579]"}`}
            onClick={toggleMenu}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2">
            <div className="flex space-x-6 lg:space-x-10">
              <a 
                href="/" 
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation('/');
                }} 
                className={linkClassName} 
                style={{color: textColor}}
              >
                Home
              </a>
              
              <SignedIn>
                <a 
                  href="/user-dashboard" 
                  onClick={(e) => {
                    e.preventDefault();
                    handleNavigation('/user-dashboard');
                  }} 
                  style={{color: textColor}} 
                  className={linkClassName}
                >
                  Dashboard
                </a>
              </SignedIn>
              
              <a 
                href="/services" 
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation('/services');
                }} 
                className={linkClassName} 
                style={{color: textColor}}
              >
                Services
              </a>
              <a 
                href="/contact" 
                onClick={(e) => {
                  e.preventDefault();
                  handleNavigation('/contact');
                }} 
                className={linkClassName} 
                style={{color: textColor}}
              >
                Contact
              </a>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-4 mr-8">
            <div className="flex items-center gap-3 2xsm:gap-7">
            <SignedOut>
            <SignUpButton mode='modal'>
              <button 
                style={{color: bgColor === 'transparent' ? 'white' : '#143370'}} 
                className="bg-[#193d83] hover:bg-[#2f61c2] text-white font-qanelas1 font-medium py-2 px-6 rounded-full transition duration-300 shadow-sm hover:shadow-md flex items-center justify-center"
              >
                Sign Up
              </button>
            </SignUpButton>
          </SignedOut>
              <SignedIn>
                <UserButton showName />
              </SignedIn>
            </div>
          </div>
        </div>

        <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'} bg-white shadow-lg`}>
          <div className="px-4 pt-2 pb-3 space-y-1">
            <a 
              href="/" 
              onClick={(e) => {
                e.preventDefault();
                handleNavigation('/');
                setIsMenuOpen(false);
              }} 
              className="block font-qanelas1 text-black px-4 py-2 rounded-full hover:bg-[#d5d7e2] transition duration-300"
            >
              Home
            </a>
            <a 
              href="/user-dashboard" 
              onClick={(e) => {
                e.preventDefault();
                handleNavigation('/user-dashboard');
                setIsMenuOpen(false);
              }} 
              className="block font-qanelas1 text-black px-4 py-2 rounded-full hover:bg-[#d5d7e2] transition duration-300"
            >
              Dashboard
            </a>
            <a 
              href="/services" 
              onClick={(e) => {
                e.preventDefault();
                handleNavigation('/services');
                setIsMenuOpen(false);
              }} 
              className="block font-qanelas1 text-black px-4 py-2 rounded-full hover:bg-[#d5d7e2] transition duration-300"
            >
              Services
            </a>
            <a 
              href="/contact" 
              onClick={(e) => {
                e.preventDefault();
                handleNavigation('/contact');
                setIsMenuOpen(false);
              }} 
              className="block font-qanelas1 text-black px-4 py-2 rounded-full hover:bg-[#d5d7e2] transition duration-300"
            >
              Contact
            </a>
          </div>
          
          <div className="px-4 py-3 border-t border-gray-200">
            <div className="flex items-center">
              <span className="h-10 w-10 rounded-full bg-gray-300"></span>
              <div className="ml-3">
                <span className="block text-sm font-medium text-black">Leila Sabando</span>
                <span className="block text-xs text-gray-500">Student</span>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;