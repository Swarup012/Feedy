'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Loader2, Zap } from 'lucide-react';
import paddleService from '@/services/paddleService';
import { PLANS } from '@/config/plans';
import { useToast } from '@/hooks/use-toast';

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentPlan?: string;
  onSuccess: () => void;
}

export function UpgradeDialog({ open, onOpenChange, currentPlan, onSuccess }: UpgradeDialogProps) {
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro'>('pro');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleUpgrade = async (skipTrial: boolean = false) => {
    try {
      setLoading(true);
      const response = await paddleService.createCheckoutSession({
        plan: selectedPlan,
        billingCycle,
        skipTrial,
      });

      if (response.success && response.data.url) {
        if (response.data.transactionId) {
          try {
            if (!(window as any).Paddle) {
              const script = document.createElement('script');
              script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
              script.async = true;
              document.body.appendChild(script);

              await new Promise((resolve, reject) => {
                script.onload = () => resolve(true);
                script.onerror = () => reject(new Error('Failed to load Paddle SDK'));
                setTimeout(() => reject(new Error('Paddle SDK load timeout')), 10000);
              });
            }

            const Paddle = (window as any).Paddle;
            if (!Paddle) throw new Error('Paddle SDK not available');

            const paddleToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || '';
            const isSandbox = !paddleToken.startsWith('live_');
            if (isSandbox) Paddle.Environment.set('sandbox');
            Paddle.Setup({ token: paddleToken });

            Paddle.Checkout.open({
              transactionId: response.data.transactionId,
              settings: {
                displayMode: 'overlay',
                theme: 'light',
                successUrl: window.location.origin + '/admin/billing?checkout=success',
              },
            });

            onOpenChange(false);
            onSuccess();
          } catch {
            window.location.href = response.data.url;
          }
        } else {
          window.location.href = response.data.url;
        }
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error) {
      toast({
        title: 'Something went wrong',
        description: 'Could not start checkout. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const plan = PLANS[selectedPlan];
  const savings = plan.monthlyPrice * 12 - plan.yearlyTotal;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-switzer font-bold">
            {currentPlan === 'starter' ? 'Upgrade to Pro' : 'Choose Your Plan'}
          </DialogTitle>
          <DialogDescription>
            {currentPlan === 'starter'
              ? 'Get unlimited members and advanced AI features'
              : 'Start a 14-day free trial, no commitment'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Plan Selector — only show if not already on a plan */}
          {!currentPlan || currentPlan === 'free' ? (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant={selectedPlan === 'starter' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPlan('starter')}
                className={selectedPlan === 'starter' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                Starter ${PLANS.starter.monthlyPrice}/mo
              </Button>
              <Button
                variant={selectedPlan === 'pro' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPlan('pro')}
                className={selectedPlan === 'pro' ? 'bg-blue-600 hover:bg-blue-700' : ''}
              >
                Pro ${PLANS.pro.monthlyPrice}/mo
                <Badge className="ml-2 bg-blue-100 text-blue-700 text-xs">Unlimited Members</Badge>
              </Button>
            </div>
          ) : null}

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span
              className={`text-sm font-medium ${
                billingCycle === 'monthly' ? 'text-gray-900 dark:text-white' : 'text-gray-500'
              }`}
            >
              Monthly
            </span>
            <Switch
              checked={billingCycle === 'yearly'}
              onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
            />
            <span
              className={`text-sm font-medium ${
                billingCycle === 'yearly' ? 'text-gray-900 dark:text-white' : 'text-gray-500'
              }`}
            >
              Yearly
            </span>
            {billingCycle === 'yearly' && (
              <Badge variant="default" className="bg-blue-600">
                Save ${savings}/year
              </Badge>
            )}
          </div>

          {/* Plan Details */}
          <Card className="border-blue-500 border-2">
            <CardHeader>
              <CardTitle className="text-xl">
                {selectedPlan === 'pro' ? 'Pro Plan' : 'Starter Plan'}
              </CardTitle>
              <CardDescription>
                {selectedPlan === 'pro'
                  ? 'For teams that need full AI automation and unlimited members'
                  : 'Everything you need to collect and manage feedback'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                {billingCycle === 'monthly' ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-gray-900 dark:text-white">
                      ${plan.monthlyPrice}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">/month</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-gray-900 dark:text-white">
                        ${plan.yearlyPrice}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">/month</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Billed ${plan.yearlyTotal}/year
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-sm">
                {selectedPlan === 'pro' ? (
                  <>
                    <FeatureItem highlight>Unlimited members</FeatureItem>
                    <FeatureItem highlight>Autopilot Automatic Mode</FeatureItem>
                    <FeatureItem highlight>AI-powered severity classification</FeatureItem>
                    <FeatureItem highlight>Custom domain</FeatureItem>
                    <FeatureItem>125+ tracked users with overage billing</FeatureItem>
                    <FeatureItem>Advanced analytics</FeatureItem>
                    <FeatureItem>Custom branding</FeatureItem>
                  </>
                ) : (
                  <>
                    <FeatureItem>Unlimited boards and posts</FeatureItem>
                    <FeatureItem>Up to 5 admins</FeatureItem>
                    <FeatureItem>125+ tracked users with overage billing</FeatureItem>
                    <FeatureItem>Slack, Discord and Intercom integrations</FeatureItem>
                    <FeatureItem>Autopilot manual mode</FeatureItem>
                    <FeatureItem>AI Chat</FeatureItem>
                    <FeatureItem>Advanced analytics</FeatureItem>
                    <FeatureItem>Custom branding</FeatureItem>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-2">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={() => handleUpgrade(false)}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Starting checkout...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Start {selectedPlan === 'pro' ? 'Pro' : 'Starter'} Trial
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleUpgrade(true)}
              disabled={loading}
            >
              Skip trial and subscribe now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FeatureItem({
  children,
  highlight = false,
}: {
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle
        className={`h-4 w-4 flex-shrink-0 ${highlight ? 'text-blue-600' : 'text-gray-400'}`}
      />
      <span className={highlight ? 'font-semibold text-blue-600 dark:text-blue-400' : ''}>
        {children}
      </span>
    </div>
  );
}
