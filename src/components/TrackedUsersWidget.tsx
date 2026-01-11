'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Users, TrendingUp, AlertTriangle, CheckCircle, DollarSign, Shield } from 'lucide-react';
import trackedUsersService, { TrackedUsersUsage } from '@/services/trackedUsersService';
import { Skeleton } from '@/components/ui/skeleton';

interface OverageStatus {
  inGracePeriod: boolean;
  overageBlocks: number;
  overageUsers: number;
  overageCost: number;
  graceRemaining: number;
  warningLevel: 'none' | 'info' | 'warning' | 'critical';
}

interface TrackedUsersWidgetProps {
  onUsageClick?: () => void;
}

export function TrackedUsersWidget({ onUsageClick }: TrackedUsersWidgetProps) {
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
        
        // Calculate overage status if on Starter plan
        if (response.data.plan_type === 'starter') {
          calculateOverageStatus(response.data);
        }
        
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

  const calculateOverageStatus = (usageData: TrackedUsersUsage) => {
    const baseLimit = 125;
    const graceBuffer = 25;
    const graceLimit = baseLimit + graceBuffer; // 150
    const overageBlockSize = 50;
    const overagePricePerBlock = 6;
    
    const currentUsers = usageData.count;
    const inGracePeriod = currentUsers > baseLimit && currentUsers <= graceLimit;
    const graceRemaining = inGracePeriod ? graceLimit - currentUsers : 0;
    
    let overageUsers = 0;
    let overageBlocks = 0;
    let overageCost = 0;
    let warningLevel: 'none' | 'info' | 'warning' | 'critical' = 'none';
    
    if (currentUsers > graceLimit) {
      overageUsers = currentUsers - graceLimit;
      overageBlocks = Math.ceil(overageUsers / overageBlockSize);
      overageCost = overageBlocks * overagePricePerBlock;
      warningLevel = 'critical';
    } else if (currentUsers > baseLimit * 0.9) {
      // Warning at 90% of base limit (112+ users)
      warningLevel = inGracePeriod ? 'warning' : 'info';
    }
    
    setOverageStatus({
      inGracePeriod,
      overageBlocks,
      overageUsers,
      overageCost,
      graceRemaining,
      warningLevel,
    });
  };

  const getStatusColor = (status: string, hasOverage: boolean = false) => {
    if (hasOverage) {
      return 'text-red-600 dark:text-red-400';
    }
    
    switch (status) {
      case 'good':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'critical':
        return 'text-orange-600 dark:text-orange-400';
      case 'exceeded':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusIcon = (status: string, overageLevel?: 'none' | 'info' | 'warning' | 'critical') => {
    if (overageLevel === 'critical') {
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    }
    if (overageLevel === 'warning') {
      return <Shield className="h-4 w-4 text-yellow-600" />;
    }
    
    switch (status) {
      case 'good':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'exceeded':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string, usagePercent: number, overageStatus: OverageStatus | null) => {
    // For Starter plan with overage
    if (overageStatus) {
      if (overageStatus.overageCost > 0) {
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <DollarSign className="h-3 w-3" />
            +${overageStatus.overageCost} Overage
          </Badge>
        );
      }
      if (overageStatus.inGracePeriod) {
        return (
          <Badge variant="secondary" className="bg-yellow-500 text-white flex items-center gap-1">
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
    if (status === 'critical') {
      return <Badge variant="destructive" className="bg-orange-500">{Math.round(usagePercent)}% Used</Badge>;
    }
    if (status === 'warning') {
      return <Badge variant="secondary" className="bg-yellow-500 text-white">{Math.round(usagePercent)}% Used</Badge>;
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

  return (
    <Card 
      className={`cursor-pointer transition-all hover:shadow-md ${
        overageStatus?.overageCost > 0 ? 'border-red-500' :
        overageStatus?.inGracePeriod ? 'border-yellow-500' :
        usage.status === 'exceeded' ? 'border-red-500' : 
        usage.status === 'critical' ? 'border-orange-500' : 
        usage.status === 'warning' ? 'border-yellow-500' : ''
      }`}
      onClick={onUsageClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-sm font-medium">Tracked Users</CardTitle>
          <div className={getStatusColor(usage.status, overageStatus?.overageCost! > 0)}>
            {getStatusIcon(usage.status, overageStatus?.warningLevel)}
          </div>
        </div>
        {getStatusBadge(usage.status, usage.usage_percent, overageStatus)}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Count Display */}
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold">
              {usage.count.toLocaleString()}
            </div>
            <div className="text-sm text-muted-foreground">
              / {usage.plan_type === 'starter' ? '125' : usage.limit.toLocaleString()}
              {usage.plan_type === 'starter' && <span className="text-xs ml-1">(+25 grace)</span>}
            </div>
          </div>

          {/* Overage Status - Starter Plan Only */}
          {usage.plan_type === 'starter' && overageStatus && (
            <div className="space-y-2">
              {/* Grace Period Warning */}
              {overageStatus.inGracePeriod && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <div className="font-semibold text-yellow-900 dark:text-yellow-100">
                        Grace Period Active
                      </div>
                      <div className="text-yellow-800 dark:text-yellow-200 mt-0.5">
                        {overageStatus.graceRemaining} users remaining before overage charges
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Overage Charges */}
              {overageStatus.overageCost > 0 && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <DollarSign className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <div className="font-semibold text-red-900 dark:text-red-100">
                        Overage This Month: ${overageStatus.overageCost}
                      </div>
                      <div className="text-red-800 dark:text-red-200 mt-0.5">
                        {overageStatus.overageUsers} users over limit ({overageStatus.overageBlocks} block{overageStatus.overageBlocks > 1 ? 's' : ''} × $6)
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Next Bill Preview */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Next bill estimate:</span>
                  <span className="font-semibold">
                    ${(19 + (overageStatus.overageCost || 0)).toFixed(2)}
                  </span>
                </div>
                {overageStatus.overageCost > 0 && (
                  <div className="text-[10px] text-muted-foreground mt-1">
                    $19 base + ${overageStatus.overageCost} overage
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="space-y-1">
            <Progress 
              value={Math.min(usage.usage_percent, 100)} 
              className={
                overageStatus?.overageCost > 0 ? 'bg-red-100 [&>div]:bg-red-600' :
                overageStatus?.inGracePeriod ? 'bg-yellow-100 [&>div]:bg-yellow-600' :
                usage.status === 'exceeded' ? 'bg-red-100 [&>div]:bg-red-600' :
                usage.status === 'critical' ? 'bg-orange-100 [&>div]:bg-orange-600' :
                usage.status === 'warning' ? 'bg-yellow-100 [&>div]:bg-yellow-600' :
                ''
              }
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{usage.current_period}</span>
              <span>{usage.days_remaining} days left</span>
            </div>
          </div>

          {/* Breakdown (optional - shown if expanded or on hover) */}
          {usage.breakdown && (
            <div className="grid grid-cols-3 gap-2 pt-2 border-t">
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Posts</div>
                <div className="text-sm font-medium">{usage.breakdown.posts}</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-muted-foreground">Votes</div>
                <div className="text-sm font-medium">{usage.breakdown.votes}</div>
              </div>
              <div className="text-center">
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
