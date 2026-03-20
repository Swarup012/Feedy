'use client';

import OnboardingFlow from '@/components/onboarding/OnboardingFlow';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import React from 'react';

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [canShowOnboarding, setCanShowOnboarding] = React.useState(false);

  useEffect(() => {
    // Check if there's a token in localStorage
    const token = localStorage.getItem('token');
    
    console.log('🔍 Onboarding page auth check:', { 
      loading, 
      hasUser: !!user, 
      hasToken: !!token 
    });
    
    // If we have a token, allow onboarding to show even if user isn't loaded yet
    if (token) {
      console.log('✅ Token found, showing onboarding');
      setCanShowOnboarding(true);
      return;
    }
    
    // Only redirect if loading is complete, no user, AND no token
    if (!loading && !user && !token) {
      console.log('❌ No auth, redirecting to login');
      router.push('/login');
    }
  }, [user, loading, router]);

  // Show loading only if no token exists
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  
  if (loading && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show onboarding if we have a token OR if user is loaded
  if (canShowOnboarding || user) {
    return <OnboardingFlow />;
  }

  return null;
}
