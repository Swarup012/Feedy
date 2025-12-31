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
import { CreditCard, Check, X, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import stripeService from '@/services/stripeService';

interface UpgradeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  feature?: 'boards' | 'posts' | 'team_members';
}

const FEATURE_LIMITS = {
  boards: {
    free: 1,
    pro: 'Unlimited',
  },
  posts: {
    free: '5 per month',
    pro: 'Unlimited',
  },
  team_members: {
    free: 3,
    pro: 'Unlimited',
  },
};

export function UpgradeDialog({
  open,
  onOpenChange,
  title = 'Upgrade to Pro',
  description,
  feature = 'boards',
}: UpgradeDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async () => {
    try {
      setLoading(true);
      const response = await stripeService.createCheckoutSession();
      
      if (response.success && response.data.url) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.url;
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

  const featureTitle = {
    boards: 'Board',
    posts: 'Post',
    team_members: 'Team Member',
  }[feature];

  const defaultDescription = description || `You've reached the limit for ${featureTitle.toLowerCase()}s on the Free plan. Upgrade to Pro for unlimited access.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
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

        {/* Plan Comparison */}
        <div className="grid grid-cols-2 gap-4 my-6">
          {/* Free Plan */}
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Free Plan</h3>
              <Badge variant="outline">Current</Badge>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">
                  {FEATURE_LIMITS[feature].free} {featureTitle.toLowerCase()}
                  {feature === 'posts' ? '' : '(s)'}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">Basic features</span>
              </div>
              <div className="flex items-start gap-2">
                <X className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-600">Community support</span>
              </div>
            </div>
          </div>

          {/* Pro Plan */}
          <div className="border-2 border-blue-500 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-purple-50 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                Recommended
              </Badge>
            </div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Pro Plan</h3>
              <span className="text-lg font-bold text-blue-600">$29/mo</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="font-medium">
                  Unlimited {featureTitle.toLowerCase()}s
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="font-medium">All features</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="font-medium">Priority support</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="font-medium">14-day free trial</span>
              </div>
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
            onClick={handleUpgrade}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            {loading ? 'Loading...' : 'Upgrade to Pro'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
