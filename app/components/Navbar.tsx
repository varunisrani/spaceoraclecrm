'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  // Effect for navbar scroll state
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 dark:bg-[#0d1615]/90 backdrop-blur-md shadow-md' : 'bg-transparent'}`}>
      <nav className="premium-container py-4">
        <div className="flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="relative h-10 w-10">
              <div className="absolute inset-0 rounded-full bg-[#1a2e29] opacity-20 blur-sm"></div>
              <div className="relative flex items-center justify-center h-full w-full rounded-full bg-gradient-to-br from-[#1a2e29] to-[#264a42]">
                <span className="text-[#c69c6d] font-bold text-lg">SO</span>
              </div>
            </div>
            <div>
              <div className="text-[#1a2e29] dark:text-white font-bold text-xl">SPACE ORACLE</div>
              <div className="text-[#c69c6d] text-xs tracking-wide">DELIVERING SPACES WHERE DREAMS THRIVE</div>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center space-x-1">
            <NavLink href="/" label="Dashboard" />
            <NavLink href="/enquiry/new" label="New Enquiry" />
            <NavLink href="/enquiry/list" label="Enquiries" />
            <NavLink href="/site-visits" label="Site Visits" />
            
            <button className="ml-4 premium-button-accent">
              Connect Meta Ads
            </button>
          </div>
          
          <div className="md:hidden">
            <MobileMenu />
          </div>
        </div>
      </nav>
    </header>
  );
}

const NavLink = ({ href, label }: { href: string; label: string }) => {
  return (
    <Link href={href} className="px-4 py-2 rounded-lg text-[#1a2e29] dark:text-[#f0f0ec] hover:bg-[#1a2e29]/5 dark:hover:bg-[#c69c6d]/10 transition-colors">
      {label}
    </Link>
  );
};

const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-[#1a2e29] dark:text-[#f0f0ec] hover:bg-[#1a2e29]/5 dark:hover:bg-[#c69c6d]/10"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-white dark:bg-[#0d1615] shadow-lg p-4 scale-in">
          <div className="flex flex-col space-y-2">
            <MobileNavLink href="/" label="Dashboard" onClick={() => setIsOpen(false)} />
            <MobileNavLink href="/enquiry/new" label="New Enquiry" onClick={() => setIsOpen(false)} />
            <MobileNavLink href="/enquiry/list" label="Enquiries" onClick={() => setIsOpen(false)} />
            <MobileNavLink href="/site-visits" label="Site Visits" onClick={() => setIsOpen(false)} />
            
            <button className="premium-button-accent mt-2">
              Connect Meta Ads
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const MobileNavLink = ({ href, label, onClick }: { href: string; label: string; onClick: () => void }) => {
  return (
    <Link href={href} className="px-4 py-3 rounded-lg text-[#1a2e29] dark:text-[#f0f0ec] hover:bg-[#1a2e29]/5 dark:hover:bg-[#c69c6d]/10 transition-colors" onClick={onClick}>
      {label}
    </Link>
  );
}; 