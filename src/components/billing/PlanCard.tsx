'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Zap, ArrowDown, XCircle, Settings, Loader2 } from 'lucide-react';
import { SubscriptionInfo } from '@/services/paddleService';
import { PLANS } from '@/config/plans';

interface PlanCardProps {
  subscription: SubscriptionInfo;
  onUpgrade: () => void;
  onDowngrade: () => void;
  onCancel: () => void;
  onManageBilling: () => void;
  actionLoading: boolean;
}

export function PlanCard({
  subscription,
  onUpgrade,
  onDowngrade,
  onCancel,
  onManageBilling,
  actionLoading,
}: PlanCardProps) {
  const planName = subscription.plan
    ? subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)
    : 'Free';

  const isActive = subscription.status === 'active';
  const isTrialing = subscription.status === 'trialing';
  const isCancelled = subscription.cancelAtPeriodEnd;
  const isFree = subscription.plan === 'free' && !subscription.hasActiveSubscription;

  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    active: { label: 'Active', variant: 'default' },
    trialing: { label: 'Trial', variant: 'secondary' },
    past_due: { label: 'Past Due', variant: 'destructive' },
    canceled: { label: 'Canceled', variant: 'outline' },
    incomplete: { label: 'Incomplete', variant: 'destructive' },
    free: { label: 'Free Plan', variant: 'outline' },
  };

  const status = statusConfig[subscription.status] || statusConfig.free;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

  const getPrice = () => {
    if (isFree) return null;
    const plan = PLANS[subscription.plan as keyof typeof PLANS];
    if (!plan) return null;
    const isYearly = subscription.billingCycle === 'yearly';
    return {
      amount: isYearly ? plan.yearlyPrice : plan.monthlyPrice,
      period: 'month',
      total: isYearly ? plan.yearlyTotal : null,
    };
  };

  const price = getPrice();

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-switzer font-semibold text-white">Current Plan</h3>
              <p className="text-blue-100 text-sm">Manage your subscription</p>
            </div>
          </div>
          <Badge variant={status.variant} className="bg-white/20 text-white border-white/30">
            {status.label}
          </Badge>
        </div>
      </div>

      <CardContent className="p-6">
        <div className="space-y-5">
          {/* Plan Name & Price */}
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{planName}</h4>
              <p className="text-sm text-gray-500 mt-1">
                {isTrialing && subscription.currentPeriodEnd
                  ? `Trial ends ${formatDate(subscription.currentPeriodEnd)}`
                  : isActive && subscription.currentPeriodEnd
                  ? `Renews ${formatDate(subscription.currentPeriodEnd)}`
                  : isCancelled && subscription.currentPeriodEnd
                  ? `Ends ${formatDate(subscription.currentPeriodEnd)}`
                  : 'Upgrade to unlock more features'}
              </p>
            </div>
            {price && (
              <div className="text-right">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">
                  ${price.amount}
                </p>
                <p className="text-sm text-gray-500">per {price.period}</p>
                {price.total && (
                  <p className="text-xs text-blue-600 font-medium mt-0.5">
                    Billed ${price.total}/year
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Trial Warning */}
          {isTrialing && subscription.currentPeriodEnd && (
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <Zap className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">Trial Active</p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                  Ends {formatDate(subscription.currentPeriodEnd)}. You'll be charged unless you cancel before then.
                </p>
              </div>
            </div>
          )}

          {/* Cancellation Warning */}
          {isCancelled && subscription.currentPeriodEnd && (
            <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg">
              <XCircle className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Subscription ends soon</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                  Access continues until {formatDate(subscription.currentPeriodEnd)}. No further charges.
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            {isFree ? (
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={onUpgrade}>
                <Zap className="h-4 w-4 mr-2" />
                Choose a Plan
              </Button>
            ) : (
              <>
                {subscription.plan === 'starter' && !isCancelled && (
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={onUpgrade}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Zap className="h-4 w-4 mr-2" />
                    )}
                    Upgrade to Pro
                  </Button>
                )}

                {subscription.plan === 'pro' && !isCancelled && (
                  <Button
                    variant="outline"
                    onClick={onDowngrade}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <ArrowDown className="h-4 w-4 mr-2" />
                    )}
                    Downgrade to Starter
                  </Button>
                )}

                {!isCancelled && (
                  <Button
                    variant="outline"
                    onClick={onManageBilling}
                    disabled={actionLoading}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Manage Billing
                  </Button>
                )}

                {!isCancelled && (
                  <Button
                    variant="ghost"
                    className="text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    onClick={onCancel}
                    disabled={actionLoading}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Subscription
                  </Button>
                )}
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
