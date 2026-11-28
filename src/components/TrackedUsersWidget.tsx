'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, TrendingUp, AlertTriangle, CheckCircle, DollarSign, Shield, ChevronRight } from 'lucide-react';
import trackedUsersService, { TrackedUsersUsage } from '@/services/trackedUsersService';
import { Skeleton } from '@/components/ui/skeleton';

interface OverageStatus {
  inGracePeriod: boolean;
  overageBlocks: number;
  overageUsers: number;
  overageCost: number;
  pricePerBlock: number;
  graceRemaining: number;
  warningLevel: 'none' | 'info' | 'warning' | 'critical';
}

interface TrackedUsersWidgetProps {
  onUsageClick?: () => void;
  variant?: 'basic' | 'expert';
}

export function TrackedUsersWidget({ onUsageClick, variant = 'basic' }: TrackedUsersWidgetProps) {
  const [usage, setUsage] = useState<TrackedUsersUsage | null>(null);
  const [overageStatus, setOverageStatus] = useState<OverageStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsage();
    
    // Refresh every 5 minutes
    const interval = setInterval(loadUsage, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadUsage = async () => {
    try {
      setLoading(true);
      const response = await trackedUsersService.getUsage();
      
      if (response.success) {
        setUsage(response.data);
        
        const estimate = response.data.overage;
        setOverageStatus(estimate ? {
          inGracePeriod: estimate.inGracePeriod,
          overageBlocks: estimate.blocks,
          overageUsers: estimate.overageUsers,
          overageCost: estimate.totalCents / 100,
          pricePerBlock: estimate.pricePerBlockCents / 100,
          graceRemaining: Math.max(0, estimate.effectiveLimit - estimate.peakUsers),
          warningLevel: estimate.blocks > 0 ? 'critical' : estimate.inGracePeriod ? 'warning' : 'none',
        } : null);
        setError(null);
      } else {
        setError(response.error || 'Failed to load usage');
      }
    } catch (err) {
      console.error('Error loading tracked users usage:', err);
      setError('Failed to load usage');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string, hasOverage: boolean = false) => {
    if (hasOverage) {
      return 'text-status-error-text';
    }
    
    switch (status) {
      case 'good':
        return 'text-status-success-text';
      case 'warning':
      case 'critical':
        return 'text-status-warning-text';
      case 'exceeded':
        return 'text-status-error-text';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string, overageLevel?: 'none' | 'info' | 'warning' | 'critical') => {
    if (overageLevel === 'critical') {
      return <AlertTriangle className="h-4 w-4 text-status-error-text" />;
    }
    if (overageLevel === 'warning') {
      return <Shield className="h-4 w-4 text-status-warning-text" />;
    }
    
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'exceeded':
        return <AlertTriangle className="h-4 w-4 text-status-error-text" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string, usagePercent: number, overageStatus: OverageStatus | null) => {
    // For eligible paid plans
    if (overageStatus) {
      if (overageStatus.overageCost > 0) {
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            +${overageStatus.overageCost.toFixed(2)} Overage
          </Badge>
        );
      }
      if (overageStatus.inGracePeriod) {
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            Grace Period
          </Badge>
        );
      }
    }
    
    // Original logic for other plans
    if (status === 'exceeded') {
      return <Badge variant="destructive">Limit Reached</Badge>;
    }
    if (status === 'critical' || status === 'warning') {
      return <Badge variant="warning">{Math.round(usagePercent)}% Used</Badge>;
    }
    return <Badge variant="secondary">{Math.round(usagePercent)}% Used</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tracked Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-2 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !usage) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Tracked Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Unable to load usage data</p>
        </CardContent>
      </Card>
    );
  }

  // Render basic view (compact, original design)
  if (variant === 'basic') {
    return (
      <Card
        className={`cursor-pointer transition-all hover:shadow-md flex flex-col ${
          (overageStatus?.overageCost ?? 0) > 0 || usage.status === 'exceeded' ? 'border-status-error-border' :
          overageStatus?.inGracePeriod || usage.status === 'critical' || usage.status === 'warning' ? 'border-status-warning-border' : ''
        }`}
        onClick={onUsageClick}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium">Tracked Users</CardTitle>
            <div className={getStatusColor(usage.status, (overageStatus?.overageCost ?? 0) > 0)}>
              {getStatusIcon(usage.status, overageStatus?.warningLevel)}
            </div>
          </div>
          {getStatusBadge(usage.status, usage.usage_percent, overageStatus)}
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {/* Hero count + period in one row */}
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-bold">
                  {usage.count.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">
                  / {usage.plan_type === 'starter' ? '125' : usage.limit.toLocaleString()}
                  {usage.plan_type === 'starter' && <span className="text-xs ml-1">(+25 grace)</span>}
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{usage.days_remaining}d left</span>
            </div>

            {/* Overage Status — compact single-row banner */}
            {overageStatus && overageStatus.inGracePeriod && (
              <div className="flex items-center gap-2 bg-status-warning-bg border border-status-warning-border rounded-lg px-3 py-2">
                <Shield className="h-3.5 w-3.5 text-status-warning-text flex-shrink-0" />
                <span className="text-xs text-status-warning-text">
                  {overageStatus.graceRemaining} users before overage charges
                </span>
              </div>
            )}
            {overageStatus && overageStatus.overageCost > 0 && (
              <div className="flex items-center gap-2 bg-status-error-bg border border-status-error-border rounded-lg px-3 py-2">
                <DollarSign className="h-3.5 w-3.5 text-status-error-text flex-shrink-0" />
                <span className="text-xs text-status-error-text">
                  ${overageStatus.overageCost.toFixed(2)} overage ({overageStatus.overageUsers} users)
                </span>
              </div>
            )}

            {/* Progress bar */}
            <div className="space-y-1">
              <Progress
                value={Math.min(usage.usage_percent, 100)}
                className={
                  (overageStatus?.overageCost ?? 0) > 0 || usage.status === 'exceeded' ? 'bg-status-error-bg [&>div]:bg-status-error-text' :
                  overageStatus?.inGracePeriod || usage.status === 'critical' || usage.status === 'warning' ? 'bg-status-warning-bg [&>div]:bg-status-warning-text' :
                  ''
                }
              />
            </div>

            {/* Breakdown tiles */}
            {usage.breakdown && (
              <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                <div className="rounded-lg bg-muted/40 py-2 text-center">
                  <div className="text-xs text-muted-foreground">Posts</div>
                  <div className="text-sm font-medium">{usage.breakdown.posts}</div>
                </div>
                <div className="rounded-lg bg-muted/40 py-2 text-center">
                  <div className="text-xs text-muted-foreground">Votes</div>
                  <div className="text-sm font-medium">{usage.breakdown.votes}</div>
                </div>
                <div className="rounded-lg bg-muted/40 py-2 text-center">
                  <div className="text-xs text-muted-foreground">Comments</div>
                  <div className="text-sm font-medium">{usage.breakdown.comments}</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render expert view — same vertical hierarchy, slightly denser
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md flex flex-col h-full ${
        (overageStatus?.overageCost ?? 0) > 0 || usage.status === 'exceeded' ? 'border-status-error-border' :
        overageStatus?.inGracePeriod || usage.status === 'critical' || usage.status === 'warning' ? 'border-status-warning-border' : ''
      }`}
      onClick={onUsageClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 shrink-0">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">Tracked Users</CardTitle>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
        {getStatusBadge(usage.status, usage.usage_percent, overageStatus)}
      </CardHeader>
      <CardContent className="flex-1 min-h-0 overflow-y-auto">
        <div className="space-y-3">
          {/* Row 1: Hero count */}
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold">
              {usage.count.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              / {usage.plan_type === 'starter' ? '125' : usage.limit.toLocaleString()}
              {usage.plan_type === 'starter' && <span className="text-xs ml-1">(+25 grace)</span>}
            </div>
          </div>

          {/* Overage status */}
          {overageStatus && (
            <div className="space-y-2">
              {/* Grace Period Warning */}
              {overageStatus.inGracePeriod && (
                <div className="bg-status-warning-bg border border-status-warning-border rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-status-warning-text flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <div className="font-semibold text-status-warning-text">
                        Grace Period Active
                      </div>
                      <div className="text-status-warning-text/90 mt-0.5">
                        {overageStatus.graceRemaining} users remaining before overage charges
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Overage Charges */}
              {overageStatus.overageCost > 0 && (
                <div className="bg-status-error-bg border border-status-error-border rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <DollarSign className="h-4 w-4 text-status-error-text flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <div className="font-semibold text-status-error-text">
                        Estimated overage this month: ${overageStatus.overageCost.toFixed(2)}
                      </div>
                      <div className="text-status-error-text/90 mt-0.5">
                        {overageStatus.overageUsers} users over limit ({overageStatus.overageBlocks} block{overageStatus.overageBlocks > 1 ? 's' : ''} × ${overageStatus.pricePerBlock.toFixed(2)})
                      </div>
                    </div>
                  </div>
                </div>
              )}


            </div>
          )}

          {/* Row 2: Full-width usage bar with labeled axis */}
          <div className="space-y-1.5">
            <Progress
              value={Math.min(usage.usage_percent, 100)}
              className={
                (overageStatus?.overageCost ?? 0) > 0 || usage.status === 'exceeded' ? 'bg-status-error-bg [&>div]:bg-status-error-text' :
                overageStatus?.inGracePeriod || usage.status === 'critical' || usage.status === 'warning' ? 'bg-status-warning-bg [&>div]:bg-status-warning-text' :
                ''
              }
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{usage.current_period}</span>
              <span>{usage.days_remaining} days left</span>
            </div>
          </div>

          {/* Row 3: Breakdown — three equal stat tiles */}
          {usage.breakdown && (
            <div className="grid grid-cols-3 gap-2 pt-1.5 border-t">
              <div className="rounded-lg bg-muted/40 py-2 text-center">
                <div className="text-xs text-muted-foreground">Posts</div>
                <div className="text-sm font-medium">{usage.breakdown.posts}</div>
              </div>
              <div className="rounded-lg bg-muted/40 py-2 text-center">
                <div className="text-xs text-muted-foreground">Votes</div>
                <div className="text-sm font-medium">{usage.breakdown.votes}</div>
              </div>
              <div className="rounded-lg bg-muted/40 py-2 text-center">
                <div className="text-xs text-muted-foreground">Comments</div>
                <div className="text-sm font-medium">{usage.breakdown.comments}</div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
