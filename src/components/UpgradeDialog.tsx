'use client';

import { Button } from '@/components/ui/button';
import { Check, Sparkles, Crown, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import paddleService, { type SubscriptionInfo } from '@/services/paddleService';
import { PLANS, type PlanTier } from '@/config/plans';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/animate-ui/components/radix/dialog';

export interface UpgradeDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  featureName?: string;
  feature?: 'boards' | 'posts' | 'team_members' | 'roadmap_items';
  subscription?: SubscriptionInfo | null;
}

const PADDLE_CLIENT_TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || 'test_67753ae11c6f27e94e5909861a5';
const IS_SANDBOX = !PADDLE_CLIENT_TOKEN.startsWith('live_');

const STARTER_HIGHLIGHTS = [
  'Unlimited boards & posts',
  'Slack, Discord & Intercom',
  'AI Chat & Autopilot',
  'Webhooks & API',
];

const PRO_HIGHLIGHTS = [
  'Everything in Starter',
  'Autopilot Automatic Mode',
  'AI severity classification',
  'Slack/Discord alerts',
];

export function UpgradeDialog({
  open,
  onOpenChange,
  featureName = 'this feature',
  subscription,
}: UpgradeDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [confirmPlan, setConfirmPlan] = useState<PlanTier | null>(null);
  const [fetchedSubscription, setFetchedSubscription] = useState<SubscriptionInfo | null>(null);

  // Fetch subscription internally when not provided as prop
  useEffect(() => {
    if (subscription !== undefined) return; // prop explicitly provided (including null)
    if (!open) return;
    let cancelled = false;
    paddleService.getSubscription().then((res) => {
      if (!cancelled && res.success) {
        setFetchedSubscription(res.data);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [subscription, open]);

  // Use prop if provided, otherwise use internally fetched value
  const resolvedSubscription = subscription !== undefined ? subscription : fetchedSubscription;

  const starterPrice = billingCycle === 'monthly' ? PLANS.starter.monthlyPrice : PLANS.starter.yearlyPrice;
  const proPrice = billingCycle === 'monthly' ? PLANS.pro.monthlyPrice : PLANS.pro.yearlyPrice;
  const starterSavings = Math.round((1 - PLANS.starter.yearlyPrice / PLANS.starter.monthlyPrice) * 100);

  const handleUpgrade = async (plan: PlanTier) => {
    // Existing subscriber with active/trialing subscription → show confirmation first
    const hasActiveSub = resolvedSubscription?.hasActiveSubscription &&
      ['active', 'trialing'].includes(resolvedSubscription.status);

    if (hasActiveSub) {
      setConfirmPlan(plan);
      return;
    }

    // New/free subscriber → create checkout session directly
    await executeCheckout(plan);
  };

  const executeCheckout = async (plan: PlanTier) => {
    try {
      setLoading(true);
      const response = await paddleService.createCheckoutSession({
        plan,
        billingCycle,
        skipTrial: false,
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
                script.onerror = () => reject(new Error('Failed to load Paddle'));
                setTimeout(() => reject(new Error('Timeout')), 10000);
              });
            }
            const Paddle = (window as any).Paddle;
            if (IS_SANDBOX) Paddle.Environment.set('sandbox');
            Paddle.Setup({ token: PADDLE_CLIENT_TOKEN });
            Paddle.Checkout.open({
              transactionId: response.data.transactionId,
              settings: {
                displayMode: 'overlay',
                theme: 'light',
                successUrl: window.location.origin + '/admin?checkout=success',
              },
            });
            onOpenChange?.(false);
            setLoading(false);
            return;
          } catch {
            // fall through to redirect
          }
        }
        window.location.href = response.data.url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to start checkout', variant: 'destructive' });
      setLoading(false);
    }
  };

  const confirmUpdate = async () => {
    if (!confirmPlan) return;
    try {
      setLoading(true);
      const response = await paddleService.updateSubscriptionPlan(confirmPlan, billingCycle);
      if (response.success) {
        toast({
          title: 'Plan updated',
          description: response.data.message || `Successfully switched to ${confirmPlan} plan.`,
        });
        onOpenChange?.(false);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Failed to update plan';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    } finally {
      setLoading(false);
      setConfirmPlan(null);
    }
  };

  const confirmPrice = confirmPlan === 'starter' ? starterPrice : proPrice;
  const isTrialing = resolvedSubscription?.status === 'trialing';

  const dialogContent = (
    <DialogContent
      className="sm:max-w-[520px] p-0 gap-0 overflow-hidden border-border/50 bg-card"
      from="bottom"
    >
      <DialogHeader className="px-5 pt-5 pb-2">
        <DialogTitle className="flex items-center gap-2 text-base">
          <Sparkles className="w-4 h-4 text-primary" />
          Upgrade to unlock {featureName}
        </DialogTitle>
        <DialogDescription>
          7-day free trial on both plans. No credit card required.
        </DialogDescription>
      </DialogHeader>

      {/* Billing toggle */}
      <div className="px-5 pb-4">
        <div className="inline-flex rounded-lg bg-muted/60 p-0.5">
          {(['monthly', 'yearly'] as const).map((cycle) => (
            <button
              key={cycle}
              onClick={() => setBillingCycle(cycle)}
              className={`relative px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200 ${
                billingCycle === cycle
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {cycle === 'monthly' ? 'Monthly' : 'Yearly'}
              {cycle === 'yearly' && (
                <span className="ml-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                  −{starterSavings}%
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Plan cards — side by side */}
      <div className="px-5 pb-5 grid grid-cols-2 gap-3">
        {/* Starter */}
        <div className="relative rounded-xl border border-border/60 bg-muted/20 p-4 flex flex-col">
          <div className="flex items-center gap-1.5 mb-3">
            <Zap className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Starter</span>
          </div>
          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-2xl font-bold text-foreground">${starterPrice}</span>
            <span className="text-xs text-muted-foreground">/mo</span>
          </div>
          {billingCycle === 'yearly' && (
            <p className="text-[10px] text-muted-foreground -mt-2 mb-3">
              ${PLANS.starter.yearlyTotal}/yr · save ${PLANS.starter.monthlyPrice * 12 - PLANS.starter.yearlyTotal}/yr
            </p>
          )}
          <ul className="space-y-1.5 mb-4 flex-1">
            {STARTER_HIGHLIGHTS.map((feat, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <Check className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                <span className="text-xs text-foreground leading-snug">{feat}</span>
              </li>
            ))}
          </ul>
          <Button
            onClick={() => handleUpgrade('starter')}
            disabled={loading}
            variant="outline"
            className="w-full h-8 text-xs font-semibold border-border/60"
          >
            {loading ? '...' : 'Start Free Trial'}
          </Button>
        </div>

        {/* Pro — highlighted */}
        <div className="relative rounded-xl border border-primary/40 bg-primary/[0.03] p-4 flex flex-col ring-1 ring-primary/10">
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
              Recommended
            </span>
          </div>
          <div className="flex items-center gap-1.5 mb-3 mt-1">
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Pro</span>
          </div>
          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-2xl font-bold text-foreground">${proPrice}</span>
            <span className="text-xs text-muted-foreground">/mo</span>
          </div>
          {billingCycle === 'yearly' && (
            <p className="text-[10px] text-muted-foreground -mt-2 mb-3">
              ${PLANS.pro.yearlyTotal}/yr · save ${PLANS.pro.monthlyPrice * 12 - PLANS.pro.yearlyTotal}/yr
            </p>
          )}
          <ul className="space-y-1.5 mb-4 flex-1">
            {PRO_HIGHLIGHTS.map((feat, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <Check className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" strokeWidth={2.5} />
                <span className="text-xs text-foreground leading-snug">{feat}</span>
              </li>
            ))}
          </ul>
          <Button
            onClick={() => handleUpgrade('pro')}
            disabled={loading}
            className="w-full h-8 text-xs font-semibold"
          >
            {loading ? '...' : 'Start Free Trial'}
          </Button>
        </div>
      </div>
    </DialogContent>
  );

  const confirmDialog = (
    <ConfirmDialog
      open={!!confirmPlan}
      onOpenChange={(v) => { if (!v) setConfirmPlan(null); }}
      title={`Switch to ${confirmPlan ? PLANS[confirmPlan].name : ''}?`}
      description={
        isTrialing
          ? `Since you're still in your trial, you won't be charged today. Your plan will change to ${confirmPlan ? PLANS[confirmPlan].name : ''} at $${confirmPrice}/mo.`
          : `You'll be charged a prorated amount today based on your billing cycle. Your new plan will be ${confirmPlan ? PLANS[confirmPlan].name : ''} at $${confirmPrice}/mo.`
      }
      confirmLabel={isTrialing ? 'Switch Plan' : `Pay $${confirmPrice}/mo`}
      onConfirm={confirmUpdate}
    />
  );

  // Controlled mode: when open/onOpenChange are provided
  if (open !== undefined || onOpenChange !== undefined) {
    return (
      <>
        <Dialog open={open} onOpenChange={onOpenChange}>
          {dialogContent}
        </Dialog>
        {confirmDialog}
      </>
    );
  }

  // Standalone mode: wraps children with a trigger
  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm" className="gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Upgrade
          </Button>
        </DialogTrigger>
        {dialogContent}
      </Dialog>
      {confirmDialog}
    </>
  );
}
