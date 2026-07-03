'use client';

import OnboardingFlow from '@/components/onboarding/OnboardingFlow';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import React from 'react';

export default function OnboardingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Wait until auth state is resolved
    if (loading) return;

    if (!user) {
      // Not authenticated at all — send to login
      console.log('❌ No auth on onboarding page, redirecting to /login');
      router.push('/login');
      return;
    }

    if (user.current_organization_id) {
      // User already completed onboarding — they have an org.
      // Redirect to admin/dashboard based on role.
      console.log('✅ User already has an organization, redirecting away from onboarding');
      const role = user.organization_role;
      router.replace(role === 'owner' || role === 'admin' ? '/admin' : '/dashboard');
    }
    // If user exists but has no current_organization_id → show the onboarding flow (fall through)
  }, [user, loading, router]);

  // Show spinner while auth is loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything while a redirect is in flight
  if (!user || user.current_organization_id) {
    return null;
  }

  // Authenticated user with no organization — show onboarding
  return <OnboardingFlow />;
}

