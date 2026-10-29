'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/context/OrganizationContext';
import { planAllowsFeature, resolvePlan } from '@/config/plans';
import { formatMrr } from '@/lib/format-mrr';

interface PostRevenue {
  mrr: number;
  customerCount: number;
  customersWithMrr: number;
  currency: string;
}

/**
 * Admin-only "Known MRR" line for PostDetails (near User Attributes).
 * Fetches GET /api/posts/:postId/revenue ONLY for owner/admin on a plan
 * that allows mrr_insights — PostDetails is mounted on public pages, so
 * non-admins and Free plans must never fire the request. 403/404/locked/
 * failures/no-data all render nothing, silently (no console noise).
 */
export function PostRevenueLine({ postId }: { postId: string }) {
  const { user } = useAuth();
  const { organization } = useOrganization();
  const [revenue, setRevenue] = useState<PostRevenue | null>(null);

  const role = user?.organization_role;
  const canView = role === 'admin' || role === 'owner';
  const planOk = !!organization && planAllowsFeature(resolvePlan(organization), 'mrr_insights');

  useEffect(() => {
    if (!postId || !canView || !planOk) return;
    let cancelled = false;
    api
      .get(`/api/posts/${postId}/revenue`)
      .then((res) => {
        if (cancelled) return;
        const d = res.data?.data ?? res.data;
        if (!d || d.locked || !(d.customersWithMrr > 0)) return;
        setRevenue({
          mrr: d.mrr,
          customerCount: d.customerCount,
          customersWithMrr: d.customersWithMrr,
          currency: d.currency || 'USD',
        });
      })
      .catch(() => {
        // silent — locked/403/404/network all render nothing
      });
    return () => {
      cancelled = true;
    };
  }, [postId, canView, planOk]);

  if (!revenue) return null;

  return (
    <div>
      <label className="text-sm text-muted-foreground block mb-1">Known MRR</label>
      <div className="text-sm text-foreground">
        {formatMrr(revenue.mrr, revenue.currency)}/mo · {revenue.customersWithMrr} of{' '}
        {revenue.customerCount} customers have revenue data
      </div>
    </div>
  );
}
