'use client';

import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { MessageSquare, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import api from '@/lib/api';

interface UsageData {
  used: number;
  limit: number;
  remaining: number;
  periodStart: string | null;
  periodEnd: string | null;
}

interface MessageLimitCounterProps {
  orgId: string;
  plan: string;
  /** Trigger a re-fetch when this value changes (e.g. after sending a message) */
  refreshKey?: number;
  className?: string;
}

export function MessageLimitCounter({
  orgId,
  plan,
  refreshKey,
  className,
}: MessageLimitCounterProps) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  // Pro = unlimited — don't render anything
  if (plan === 'pro') return null;

  useEffect(() => {
    let cancelled = false;

    async function fetchUsage() {
      try {
        setLoading(true);
        const res = await api.get(`/organizations/${orgId}/feedback-chat/usage`);
        if (!cancelled && res.data?.success) {
          setUsage(res.data.data);
        }
      } catch (err) {
        console.error('Failed to fetch AI chat usage:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchUsage();
    return () => { cancelled = true; };
  }, [orgId, refreshKey]);

  if (loading && !usage) {
    return (
      <div className={cn('flex items-center gap-2 text-xs text-muted-foreground', className)}>
        <MessageSquare className="w-3.5 h-3.5 animate-pulse" />
        <span>Loading usage...</span>
      </div>
    );
  }

  if (!usage || usage.limit === -1) return null;

  const percent = Math.min(100, Math.round((usage.used / usage.limit) * 100));
  const isNearLimit = percent >= 80;
  const isAtLimit = percent >= 100;

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {isAtLimit ? (
            <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
          ) : (
            <MessageSquare className="w-3.5 h-3.5" />
          )}
          <span>
            {usage.used} / {usage.limit} messages this month
          </span>
        </div>
        {isNearLimit && !isAtLimit && (
          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            {usage.remaining} left
          </span>
        )}
        {isAtLimit && (
          <span className="text-xs text-destructive font-medium">
            Limit reached
          </span>
        )}
      </div>
      <Progress
        value={percent}
        className={cn(
          'h-1.5',
          isAtLimit && '[&>div]:bg-destructive',
          isNearLimit && !isAtLimit && '[&>div]:bg-amber-500',
        )}
      />
    </div>
  );
}
