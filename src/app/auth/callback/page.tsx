'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import axios from 'axios';
import { getPublicReturnUrl, clearReturnUrl } from '@/lib/returnUrl';
import { TokenManager } from '@/lib/tokenManager';

export default function AuthCallback() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('🔄 Auth callback started, current URL:', window.location.href);

        // Supabase handles the OAuth callback automatically via URL hash
        // Wait a bit for Supabase to process the hash
        await new Promise(resolve => setTimeout(resolve, 200));

        // Get the session that Supabase created from the OAuth callback
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        console.log('📝 Session check:', { hasSession: !!session, error: sessionError });

        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }

        if (!session) {
          throw new Error('No session found after Google OAuth');
        }

        // Get user data (using the access token from the session)
        const { data: { user }, error: userError } = await supabase.auth.getUser(session.access_token);

        console.log('👤 User check:', { hasUser: !!user, email: user?.email, error: userError });

        if (userError) {
          throw userError;
        }

        if (!user) {
          throw new Error('No user found');
        }

        // Send to backend with Supabase access token for verification
        // Use relative URL to go through Next.js proxy so HttpOnly cookies are set correctly
        const response = await axios.post(
          `/api/auth/google`,
          {
            email: user.email,
            name: user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0],
            googleId: user.id,
            avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture,
            supabaseToken: session.access_token, // 🔒 Send Supabase token for verification
          },
          {
            timeout: 30000, // 30 second timeout
          }
        );

        // Backend returns data in response.data.data format
        const { token, user: backendUser, needsOnboarding } = response.data.data || response.data;

        console.log('🔍 Google OAuth Response:', {
          hasToken: !!token,
          needsOnboarding,
          backendUser: backendUser?.email,
          fullResponse: response.data
        });

        if (token) {
          // Store the backend JWT token for fallback
          localStorage.setItem('access_token', token);
          localStorage.setItem('token', token);
          TokenManager.setUser(backendUser); // Store in cache for instant UI

          console.log('✅ Token stored in localStorage, User stored in cache');

          // 🔑 Dispatch event to trigger AuthContext re-check
          // This fixes the race condition where AuthContext doesn't re-run checkAuth() after redirect
          window.dispatchEvent(new CustomEvent('auth-tokens-stored', { detail: { user: backendUser } }));
          console.log('🔔 Dispatched auth-tokens-stored event');

          // Priority 1: pending invite — always wins over onboarding
          const pendingInviteToken = localStorage.getItem('pendingInviteToken');
          if (pendingInviteToken) {
            console.log('🔙 Redirecting to pending invite:', pendingInviteToken);
            router.push(`/invite/${pendingInviteToken}`);
            return;
          }

          // Check for saved return URL (from public pages like upvoting/commenting)
          const returnUrl = getPublicReturnUrl();
          console.log('🔍 Checking for return URL:', { returnUrl, hasReturnUrl: !!returnUrl });

          if (returnUrl) {
            console.log('🔙 Returning to saved URL after Google login:', returnUrl);
            clearReturnUrl();
            // Use window.location.href for full page reload to refresh AuthContext
            window.location.href = returnUrl;
          } else if (needsOnboarding) {
            console.log('🔄 Redirecting to onboarding (new user)');
            router.push('/onboarding');
          } else {
            console.log('🔄 Redirecting to admin dashboard');
            router.push('/admin/feedback');
          }
        } else {
          console.error('Backend response:', response.data);
          throw new Error('No token received from backend');
        }
      } catch (err: any) {
        console.error('Auth callback error:', err);
        setError(err.message || 'Authentication failed');

        // Redirect to login with error after 3 seconds
        setTimeout(() => {
          router.push('/login?error=auth_failed');
        }, 3000);
      }
    };

    handleCallback();
  }, [router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 text-xl mb-4">
            Authentication Failed
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <p className="text-sm text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Completing authentication...</p>
      </div>
    </div>
  );
}
