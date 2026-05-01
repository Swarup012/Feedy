'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface Organization {
  id: string;
  name: string;
  subdomain: string;
  slug: string;
  description?: string;
  logo_url?: string;
  website?: string;
  industry?: string;
  company_size?: string;
  plan: string;
  subscription_plan?: string;
  subscription_status?: string;
  max_users: number;
  max_boards: number;
  settings?: any;
  created_at: string;
  updated_at: string;
  role?: string;
  is_current?: boolean;
}

interface OrganizationContextType {
  organization: Organization | null;
  organizations: Organization[]; // All organizations user belongs to
  organizationRole: string | null;
  loading: boolean;
  subdomain: string | null;
  refreshOrganization: () => Promise<void>;
  switchOrganization: (organizationId: string) => Promise<void>;
  createOrganization: (orgData: any) => Promise<Organization>;
}

const OrganizationContext = createContext<OrganizationContextType>({
  organization: null,
  organizations: [],
  organizationRole: null,
  loading: true,
  subdomain: null,
  refreshOrganization: async () => {},
  switchOrganization: async () => {},
  createOrganization: async () => ({} as Organization),
});

export function OrganizationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationRole, setOrganizationRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [subdomain, setSubdomain] = useState<string | null>(null);

  // Get subdomain from hostname or cookie
  useEffect(() => {
    // Try cookie first
    const cookieSubdomain = document.cookie
      .split('; ')
      .find(row => row.startsWith('x-subdomain='))
      ?.split('=')[1];

    if (cookieSubdomain) {
      setSubdomain(cookieSubdomain);
      return;
    }

    // Parse from hostname
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    
    if (parts.length >= 3 && !hostname.includes('localhost')) {
      const sub = parts[0];
      if (sub !== 'www' && sub !== 'api' && sub !== 'admin') {
        setSubdomain(sub);
      }
    } else if (hostname.includes('localhost') && parts.length > 1 && parts[0] !== 'localhost') {
      setSubdomain(parts[0]);
    }
  }, []);

  const fetchOrganization = async () => {
    if (!isAuthenticated) {
      setOrganization(null);
      setOrganizations([]);
      setOrganizationRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Fetch current organization
      const response = await fetch('/api/organizations/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOrganization(data.data.organization);
        setOrganizationRole(data.data.role);
      } else {
        setOrganization(null);
        setOrganizationRole(null);
      }

      // Fetch all organizations
      const allOrgsResponse = await fetch('/api/organizations/me/all', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        },
      });

      if (allOrgsResponse.ok) {
        const allOrgsData = await allOrgsResponse.json();
        setOrganizations(allOrgsData.data.organizations || []);
      } else {
        setOrganizations([]);
      }
    } catch (error) {
      console.error('Failed to fetch organization:', error);
      setOrganization(null);
      setOrganizations([]);
      setOrganizationRole(null);
    } finally {
      setLoading(false);
    }
  };

  // Auto-switch organization based on subdomain
  useEffect(() => {
    const autoSwitchBasedOnSubdomain = async () => {
      // Only run if authenticated, subdomain exists, and organizations are loaded
      if (!isAuthenticated || !subdomain || loading || organizations.length === 0 || !organization) {
        return;
      }

      // Check if current organization matches subdomain
      if (organization.subdomain === subdomain) {
        console.log('✅ Already on correct organization for subdomain:', subdomain);
        return;
      }

      // Find organization matching subdomain
      const targetOrg = organizations.find(org => org.subdomain === subdomain);
      
      if (targetOrg) {
        console.log('🔄 Subdomain mismatch detected. Switching from', organization.subdomain, 'to', subdomain);
        
        try {
          // Switch to the organization that matches the subdomain
          await fetch('/api/users/me/current-organization', {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ organizationId: targetOrg.id }),
          });
          
          // Refresh organization data
          await fetchOrganization();
          console.log('✅ Switched to organization:', targetOrg.name);
        } catch (error) {
          console.error('❌ Failed to auto-switch organization:', error);
        }
      } else {
        console.log('ℹ️ User is not a member of organization with subdomain:', subdomain);
      }
    };

    autoSwitchBasedOnSubdomain();
  }, [isAuthenticated, subdomain, loading, organizations, organization]);

  const switchOrganization = async (organizationId: string) => {
    try {
      const response = await fetch('/api/users/me/current-organization', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ organizationId }),
      });

      if (!response.ok) {
        throw new Error('Failed to switch organization');
      }

      const data = await response.json();
      
      // Redirect to the new organization's subdomain
      const newOrg = organizations.find(o => o.id === organizationId);
      if (newOrg) {
        const hostname = window.location.hostname;
        const port = window.location.port ? `:${window.location.port}` : '';
        const protocol = window.location.protocol;
        
        // Determine redirect path based on user's role in the new organization
        const redirectPath = newOrg.role === 'owner' || newOrg.role === 'admin' ? '/admin' : '/dashboard';
        
        if (hostname.includes('localhost')) {
          // Development: subdomain.localhost:5173
          window.location.href = `${protocol}//${newOrg.subdomain}.localhost${port}${redirectPath}`;
        } else {
          // Production: subdomain.yourdomain.com
          const baseDomain = hostname.split('.').slice(-2).join('.');
          window.location.href = `${protocol}//${newOrg.subdomain}.${baseDomain}${redirectPath}`;
        }
      } else {
        // Fallback: refresh current page
        await fetchOrganization();
      }
    } catch (error) {
      console.error('Failed to switch organization:', error);
      throw error;
    }
  };

  const createOrganization = async (orgData: any): Promise<Organization> => {
    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orgData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create organization');
      }

      const data = await response.json();
      const newOrg = data.data.organization;
      
      // Refresh organizations list
      await fetchOrganization();
      
      // Redirect to new organization
      const hostname = window.location.hostname;
      const port = window.location.port ? `:${window.location.port}` : '';
      const protocol = window.location.protocol;
      
      if (hostname.includes('localhost')) {
        window.location.href = `${protocol}//${newOrg.subdomain}.localhost${port}/admin`;
      } else {
        const baseDomain = hostname.split('.').slice(-2).join('.');
        window.location.href = `${protocol}//${newOrg.subdomain}.${baseDomain}/admin`;
      }
      
      return newOrg;
    } catch (error) {
      console.error('Failed to create organization:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchOrganization();
  }, [isAuthenticated, user]);

  const refreshOrganization = async () => {
    await fetchOrganization();
  };

  return (
    <OrganizationContext.Provider
      value={{
        organization,
        organizations,
        organizationRole,
        loading,
        subdomain,
        refreshOrganization,
        switchOrganization,
        createOrganization,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error('useOrganization must be used within OrganizationProvider');
  }
  return context;
}
