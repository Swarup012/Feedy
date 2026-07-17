'use client';

import { useState, useEffect, useCallback } from 'react';
import jobRolesService, { JobRole } from '@/services/jobRolesService';

/**
 * Hook that fetches and caches dynamic job roles for the given organization.
 * Returns the roles list, loading state, and a refresh function.
 */
export function useJobRoles(organizationId: string | null | undefined) {
  const [roles, setRoles] = useState<JobRole[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    if (!organizationId) {
      setRoles([]);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await jobRolesService.listRoles(organizationId);
      setRoles(data);
    } catch (err: any) {
      console.error('Failed to fetch job roles:', err);
      setError(err?.response?.data?.error || 'Failed to load job roles');
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return { roles, loading, error, refresh: fetchRoles };
}
