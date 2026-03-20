'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { CreditCard, Check, X, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import paddleService from '@/services/paddleService';

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  feature?: 'boards' | 'posts' | 'team_members' | 'roadmap_items';
}

const FEATURE_LIMITS = {
  boards: {
    free: '3 boards',
    starter: 'Unlimited boards',
    pro: 'Unlimited boards',
  },
  posts: {
    free: '5 posts per board',
    starter: 'Unlimited posts',
    pro: 'Unlimited posts',
  },
  team_members: {
    free: '3 team members',
    starter: '5 team members',
    pro: '15 team members',
  },
  roadmap_items: {
    free: '1 roadmap',
    starter: '1 roadmap',
    pro: '1 roadmap',
  },
};

const FREE_PLAN_FEATURES = [
  '1 Organization',
  '3 feedback boards',
  '5 posts per board',
  '20 tracked users',
  '3 team members',
  '1 roadmap',
  'Basic analytics',
];

const STARTER_PLAN_FEATURES = [
  '1 Organization',
  'Unlimited boards',
  'Unlimited posts',
  '125+ tracked users',
  '5 team members',
  '1 roadmap',
  'Advanced analytics',
  'Custom branding',
  '$6 per 50 additional users',
  '14-day free trial',
];

const PRO_PLAN_FEATURES = [
  '1 Organization',
  'Unlimited boards',
  'Unlimited posts',
  '125+ tracked users',
  '15 team members',
  '1 roadmap',
  'Priority support',
  'Advanced analytics',
  'Custom branding',
  '$6 per 50 additional users',
  '14-day free trial',
];

export function UpgradeDialog({
  open,
  onOpenChange,
  title = 'Upgrade to Starter',
  description,
  feature = 'boards',
}: UpgradeDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro'>('starter');

  const handleUpgrade = async (skipTrial: boolean = false) => {
    try {
      setLoading(true);
      const response = await paddleService.createCheckoutSession({
        plan: selectedPlan,
        billingCycle: billingCycle,
        skipTrial,
      });
      
      if (response.success && response.data.url) {
        // Check if we have a transactionId (Paddle Billing with overlay)
        if (response.data.transactionId) {
          console.log('🔵 Opening Paddle overlay checkout...', response.data.transactionId);
          
          try {
            // Load Paddle.js dynamically if not already loaded
            if (!(window as any).Paddle) {
              console.log('📦 Loading Paddle.js SDK...');
              const script = document.createElement('script');
              script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
              script.async = true;
              document.body.appendChild(script);
              
              await new Promise((resolve, reject) => {
                script.onload = () => {
                  console.log('✅ Paddle.js loaded successfully');
                  resolve(true);
                };
                script.onerror = () => reject(new Error('Failed to load Paddle SDK'));
                setTimeout(() => reject(new Error('Paddle SDK load timeout')), 10000);
              });
            }
            
            // Initialize Paddle with your client-side token
            const Paddle = (window as any).Paddle;
            if (!Paddle) throw new Error('Paddle SDK not available');
            
            console.log('⚙️ Initializing Paddle with client token...');
            Paddle.Environment.set('sandbox');
            Paddle.Setup({ 
              token: 'test_67753ae11c6f27e94e5909861a5' // Your client-side token
            });
            
            console.log('🚀 Opening Paddle overlay...');
            Paddle.Checkout.open({
              transactionId: response.data.transactionId,
              settings: {
                displayMode: 'overlay',
                theme: 'light',
                successUrl: window.location.origin + '/admin?checkout=success'
              }
            });
            
            console.log('✅ Overlay opened successfully!');
            onOpenChange(false); // Close the dialog
            setLoading(false);
          } catch (overlayError) {
            console.error('⚠️ Overlay failed, falling back to redirect:', overlayError);
            window.location.href = response.data.url;
          }
        } else {
          // Fallback: Redirect to checkout URL
          console.log('🔄 Redirecting to checkout page...');
          window.location.href = response.data.url;
        }
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: 'Error',
        description: 'Failed to start checkout process',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const featureTitleMap: Record<string, string> = {
    boards: 'Board',
    posts: 'Post',
    team_members: 'Team Member',
    roadmap_items: 'Roadmap Item',
  };
  
  const featureTitle = featureTitleMap[feature] || 'Feature';

  const defaultDescription = description || `You've reached the limit for ${featureTitle.toLowerCase()}s on the Free plan. Upgrade to Starter for more access.`;

  const starterMonthlyPrice = 19;
  const starterYearlyPrice = 180;
  const starterEffectiveMonthly = 15; // $180/year ÷ 12 months = $15/month
  const proMonthlyPrice = 49;
  const proYearlyPrice = 540;
  const proEffectiveMonthly = 45; // $540/year ÷ 12 months = $45/month
  
  const monthlyPrice = selectedPlan === 'pro' ? proMonthlyPrice : starterMonthlyPrice;
  const yearlyPrice = selectedPlan === 'pro' ? proYearlyPrice : starterYearlyPrice;
  const effectiveMonthlyYearly = selectedPlan === 'pro' ? proEffectiveMonthly : starterEffectiveMonthly;
  const savings = selectedPlan === 'pro' ? 48 : 48; // Both save $48/year

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <DialogTitle className="text-2xl">{title}</DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2">
            {defaultDescription}
          </DialogDescription>
        </DialogHeader>

        {/* Plan Selector */}
        <div className="flex items-center justify-center gap-2 py-3 border-b">
          <Button
            variant={selectedPlan === 'starter' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPlan('starter')}
            className={selectedPlan === 'starter' ? 'bg-blue-500 hover:bg-blue-600' : ''}
          >
            Starter ${starterMonthlyPrice}/mo
          </Button>
          <Button
            variant={selectedPlan === 'pro' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPlan('pro')}
            className={selectedPlan === 'pro' ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' : ''}
          >
            Pro ${proMonthlyPrice}/mo
            <Badge className="ml-2 bg-yellow-500 text-xs">15 Members</Badge>
          </Button>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-center gap-4 py-4 border-b">
          <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
            Monthly
          </span>
          <Switch
            checked={billingCycle === 'yearly'}
            onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
          />
          <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
            Yearly
          </span>
          {billingCycle === 'yearly' && (
            <Badge variant="default" className="bg-green-500">
              Save ${savings}/year
            </Badge>
          )}
        </div>

        {/* Plan Comparison */}
        <div className="grid grid-cols-2 gap-4 my-6">
          {/* Free Plan */}
          <div className="border rounded-lg p-4 bg-gray-50 dark:bg-card">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">Free Plan</h3>
              <Badge variant="outline">Current</Badge>
            </div>
            <div className="mb-3">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">$0</div>
              <div className="text-xs text-gray-500">Forever free</div>
            </div>
            <div className="space-y-2 text-sm">
              {FREE_PLAN_FEATURES.map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-600 dark:text-gray-400">{feat}</span>
                </div>
              ))}
              <div className="flex items-start gap-2">
                <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-400">Advanced analytics</span>
              </div>
              <div className="flex items-start gap-2">
                <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600 dark:text-gray-400">Custom branding</span>
              </div>
            </div>
          </div>

          {/* Selected Plan */}
          <div className={`border-2 rounded-lg p-4 relative ${
            selectedPlan === 'pro' 
              ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950' 
              : 'border-blue-500 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950'
          }`}>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className={selectedPlan === 'pro' 
                ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white' 
                : 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
              }>
                {selectedPlan === 'pro' ? 'Pro Plan' : 'Recommended'}
              </Badge>
            </div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {selectedPlan === 'pro' ? 'Pro Plan' : 'Starter Plan'}
              </h3>
            </div>
            <div className="mb-3">
              {billingCycle === 'monthly' ? (
                <>
                  <div className={`text-2xl font-bold ${
                    selectedPlan === 'pro' ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'
                  }`}>
                    ${monthlyPrice}
                    <span className="text-sm font-normal text-gray-600 dark:text-gray-400">/month</span>
                  </div>
                  <div className="text-xs text-gray-500">Billed monthly</div>
                </>
              ) : (
                <>
                  <div className={`text-2xl font-bold ${
                    selectedPlan === 'pro' ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'
                  }`}>
                    ${effectiveMonthlyYearly}
                    <span className="text-sm font-normal text-gray-600 dark:text-gray-400">/month</span>
                  </div>
                  <div className="text-xs text-gray-500">${yearlyPrice}/year (save ${savings})</div>
                </>
              )}
            </div>
            <div className="space-y-2 text-sm">
              {(selectedPlan === 'pro' ? PRO_PLAN_FEATURES : STARTER_PLAN_FEATURES).map((feat, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Check className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                    selectedPlan === 'pro' ? 'text-purple-500' : 'text-green-500'
                  }`} />
                  <span className={`font-medium ${
                    feat.includes('trial') ? 'text-green-600 dark:text-green-400' : 
                    feat.includes('15 team') || feat.includes('Priority') ? 'text-purple-600 dark:text-purple-400 font-semibold' :
                    'text-gray-900 dark:text-white'
                  }`}>
                    {feat}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Maybe Later
          </Button>
          <Button
            onClick={() => handleUpgrade(false)}
            disabled={loading}
            className={selectedPlan === 'pro' 
              ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
              : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700'
            }
          >
            <CreditCard className="mr-2 h-4 w-4" />
            {loading ? 'Loading...' : `Start ${selectedPlan === 'pro' ? 'Pro' : 'Starter'} Trial`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
