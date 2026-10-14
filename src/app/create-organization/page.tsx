'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/context/OrganizationContext';

/**
 * Organization creation is paused for additional organizations.
 *
 * This route no longer renders a form — it only decides where the visitor
 * belongs and redirects there (never shows the create form):
 *   - not logged in          → /login
 *   - zero organizations     → /onboarding   (first org is created there)
 *   - already has an org     → /admin (owner/admin) or /dashboard (member)
 */
export default function CreateOrganizationPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { organizations, organizationRole, loading: orgLoading } = useOrganization();

  useEffect(() => {
    // Wait for auth + organization fetch before deciding
    if (authLoading || orgLoading) return;

    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    if (organizations.length === 0) {
      router.replace('/onboarding');
      return;
    }

    router.replace(
      organizationRole === 'owner' || organizationRole === 'admin' ? '/admin' : '/dashboard'
    );
  }, [authLoading, orgLoading, isAuthenticated, organizations.length, organizationRole, router]);

  // Never show the create form — while the decision is in flight, render nothing.
  return null;
}
