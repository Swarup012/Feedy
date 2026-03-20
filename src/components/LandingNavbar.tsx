"use client";

import React, { useState } from 'react';
import { HoveredLink, Menu, MenuItem } from '@/components/ui/navbar-menu';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';

export function LandingNavbar({ className }: { className?: string }) {
  const [active, setActive] = useState<string | null>(null);
  const router = useRouter();
  
  return (
    <div className={cn("fixed top-5 inset-x-0 max-w-6xl mx-auto z-50 px-4", className)}>
      <div className="relative rounded-full border border-transparent bg-primary shadow-lg flex items-center justify-between px-8 py-4">
        
        {/* Logo on Left */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
          <Logo width={28} height={28} className="text-blue-600" />
          <span className="text-lg font-bold text-blue-600">Faddy</span>
        </div>
        
        {/* Center Menu */}
        <Menu setActive={setActive}>
          <MenuItem setActive={setActive} active={active} item="Product">
            <div className="flex flex-col space-y-4 text-sm">
              <div className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-2">Features</div>
              <HoveredLink href="/collect-feedback">Collect Feedback</HoveredLink>
              <HoveredLink href="/analyze-feedback">Analyze Feedback</HoveredLink>
              <HoveredLink href="/share-updates">Share Updates</HoveredLink>
              
              <div className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mt-4 mb-2">Use Cases</div>
              <HoveredLink href="/collect-feedback">Feature Request Management</HoveredLink>
              <HoveredLink href="/role-based-access">Role-Based Access Control</HoveredLink>
              <HoveredLink href="/public-roadmap">Public Roadmap</HoveredLink>
            </div>
          </MenuItem>
          
          <MenuItem setActive={setActive} active={active} item="Documentation">
            <div className="flex flex-col space-y-4 text-sm">
              <HoveredLink href="/docs">Getting Started</HoveredLink>
              <HoveredLink href="/docs/features">Features</HoveredLink>
              <HoveredLink href="/docs/plans">Plans & Limits</HoveredLink>
            </div>
          </MenuItem>
          
          <MenuItem setActive={setActive} active={active} item="Pricing">
            <div className="flex flex-col space-y-4 text-sm">
              <HoveredLink href="/pricing">View Plans</HoveredLink>
            </div>
          </MenuItem>
        </Menu>
        
        {/* Auth Buttons on Right */}
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button 
            onClick={() => router.push('/login')}
            className="text-sm font-semibold text-white/80 hover:text-white transition-colors"
          >
            Login
          </button>
          <button 
            onClick={() => router.push('/signup')}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-full hover:bg-blue-700 hover:shadow-lg transition-all"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}
