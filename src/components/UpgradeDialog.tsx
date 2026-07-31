'use client';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { Check, Sparkles, Zap, Crown } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import paddleService from '@/services/paddleService';

export interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  featureName?: string;
  feature?: 'boards' | 'posts' | 'team_members' | 'roadmap_items';
}

const PLANS = {
  starter: {
    name: 'Starter',
    monthlyPrice: 19,
    yearlyPrice: 180,
    effectiveMonthly: 15,
    features: [
      'Unlimited boards & posts',
      '125+ tracked users',
      'Advanced analytics & branding',
      'Integrations, Autopilot & AI Chat',
    ],
  },
  pro: {
    name: 'Pro',
    monthlyPrice: 49,
    yearlyPrice: 540,
    effectiveMonthly: 45,
    features: [
      'Everything in Starter',
      'Up to 10 admins',
      'Custom subdomain',
      'Priority support',
    ],
  },
} as const;

export function UpgradeDialog({
  open,
  onOpenChange,
  featureName = 'this feature',
}: UpgradeDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro'>('starter');

  const plan = PLANS[selectedPlan];
  const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.effectiveMonthly;

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      const response = await paddleService.createCheckoutSession({
        plan: selectedPlan,
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
            Paddle.Environment.set('sandbox');
            Paddle.Setup({ token: 'test_67753ae11c6f27e94e5909861a5' });
            Paddle.Checkout.open({
              transactionId: response.data.transactionId,
              settings: {
                displayMode: 'overlay',
                theme: 'light',
                successUrl: window.location.origin + '/admin?checkout=success',
              },
            });
            onOpenChange(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] p-6 gap-0">
        <VisuallyHidden>
          <DialogTitle>Upgrade Plan</DialogTitle>
        </VisuallyHidden>

        {/* Header */}
        <div className="flex items-start gap-3 mb-5">
          <div className="mt-0.5 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-foreground leading-tight">
              Upgrade to unlock {featureName}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Start a 14-day free trial. No credit card required.
            </p>
          </div>
        </div>

        {/* Plan selector */}
        <div className="flex rounded-lg border border-border overflow-hidden mb-4">
          {(['starter', 'pro'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPlan(p)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-medium transition-colors ${
                selectedPlan === p
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {p === 'starter' ? <Zap className="w-3.5 h-3.5" /> : <Crown className="w-3.5 h-3.5" />}
              {PLANS[p].name}
            </button>
          ))}
        </div>

        {/* Billing cycle */}
        <div className="flex rounded-lg border border-border overflow-hidden mb-5">
          {(['monthly', 'yearly'] as const).map((cycle) => (
            <button
              key={cycle}
              onClick={() => setBillingCycle(cycle)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium transition-colors ${
                billingCycle === cycle
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:bg-muted/50'
              }`}
            >
              {cycle === 'monthly' ? 'Monthly' : 'Yearly'}
              {cycle === 'yearly' && (
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full">
                  −21%
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Price + features */}
        <div className="rounded-lg border border-border bg-muted/30 p-4 mb-5">
          <div className="flex items-baseline gap-1 mb-3">
            <span className="text-2xl font-bold text-foreground">${price}</span>
            <span className="text-sm text-muted-foreground">/mo</span>
            {billingCycle === 'yearly' && (
              <span className="ml-auto text-xs text-muted-foreground">
                ${plan.yearlyPrice}/yr
              </span>
            )}
          </div>
          <div className="space-y-2">
            {plan.features.map((feat, i) => (
              <div key={i} className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" strokeWidth={2.5} />
                <span className="text-sm text-foreground">{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <Button
          onClick={handleUpgrade}
          disabled={loading}
          className="w-full h-10 text-sm font-semibold mb-2"
        >
          {loading
            ? 'Opening checkout…'
            : `Start ${plan.name} Free Trial`}
        </Button>
        <button
          onClick={() => onOpenChange(false)}
          className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors py-1"
        >
          Maybe later
        </button>
      </DialogContent>
    </Dialog>
  );
}
