'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/context/OrganizationContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Check, 
  X, 
  Sparkles, 
  Zap, 
  TrendingUp,
  Users,
  LayoutGrid,
  MessageSquare,
  Crown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { organization } = useOrganization();
  const { toast } = useToast();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);

  const handleUpgrade = async (planType: 'monthly' | 'yearly', skipTrial: boolean = false) => {
    if (!user || !organization) {
      router.push('/login?redirect=/pricing');
      return;
    }

    try {
      setLoading(true);

      // Create checkout session
      const response = await api.post('/api/stripe/create-checkout-session', {
        plan: 'starter',
        billingCycle: planType,
        skipTrial,
        successUrl: `${window.location.origin}/admin?checkout=success`,
        cancelUrl: `${window.location.origin}/pricing?checkout=cancelled`,
      });

      if (response.data.success && response.data.data.url) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.data.url;
      } else {
        throw new Error('Failed to create checkout session');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to start checkout',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  const plans = {
    free: {
      name: 'Free',
      price: 0,
      description: 'Perfect for trying out Feedy',
      features: [
        { text: '3 feedback boards', included: true },
        { text: '5 posts per board', included: true },
        { text: '20 tracked users', included: true },
        { text: '3 team members', included: true },
        { text: '1 roadmap', included: true },
        { text: 'Basic analytics', included: true },
        { text: 'Custom branding', included: false },
        { text: 'Advanced analytics', included: false },
        { text: 'Priority support', included: false },
      ],
      cta: 'Current Plan',
      highlight: false,
    },
    starter: {
      name: 'Starter',
      monthlyPrice: 19,
      yearlyPrice: 180,
      effectiveMonthlyYearly: 15,
      savings: 48,
      description: 'For growing teams collecting feedback',
      features: [
        { text: 'Unlimited feedback boards', included: true },
        { text: 'Unlimited posts', included: true },
        { text: '125+ tracked users included', included: true },
        { text: '5 team members', included: true },
        { text: '1 roadmap', included: true },
        { text: 'Advanced analytics', included: true },
        { text: 'Custom branding', included: true },
        { text: '$6 per 50 additional users', included: true, subtext: true },
        { text: '14-day free trial', included: true, highlight: true },
      ],
      cta: 'Start Free Trial',
      highlight: true,
    },
  };

  const currentPlan = organization?.subscription_plan || 'free';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">
            <Sparkles className="w-3 h-3 mr-1" />
            Pricing
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Start with our free plan. Upgrade when you need more. Cancel anytime.
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
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
              Save $48/year
            </Badge>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-16">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-2xl">{plans.free.name}</CardTitle>
              </div>
              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">${plans.free.price}</span>
                  <span className="text-gray-600 dark:text-gray-400">/month</span>
                </div>
              </div>
              <CardDescription>{plans.free.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="outline" 
                className="w-full mb-6"
                disabled={currentPlan === 'free'}
              >
                {currentPlan === 'free' ? 'Current Plan' : 'Downgrade'}
              </Button>
              
              <div className="space-y-3">
                {plans.free.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                    )}
                    <span className={feature.included ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 line-through'}>
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Starter Plan */}
          <Card className={`relative ${plans.starter.highlight ? 'border-2 border-blue-500 shadow-xl' : ''}`}>
            {plans.starter.highlight && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white px-4 py-1">
                  <Crown className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-2xl">{plans.starter.name}</CardTitle>
              </div>
              <div className="mb-4">
                {billingCycle === 'monthly' ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">${plans.starter.monthlyPrice}</span>
                    <span className="text-gray-600 dark:text-gray-400">/month</span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">${plans.starter.effectiveMonthlyYearly}</span>
                      <span className="text-gray-600 dark:text-gray-400">/month</span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Billed yearly (${plans.starter.yearlyPrice}/year)
                    </div>
                  </div>
                )}
              </div>
              <CardDescription>{plans.starter.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {currentPlan === 'free' ? (
                <div className="space-y-2 mb-6">
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleUpgrade(billingCycle, false)}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Start 14-Day Free Trial'}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => handleUpgrade(billingCycle, true)}
                    disabled={loading}
                  >
                    Skip Trial & Subscribe Now
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full mb-6"
                  disabled
                >
                  Current Plan
                </Button>
              )}
              
              <div className="space-y-3">
                {plans.starter.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${feature.highlight ? 'text-blue-500' : 'text-green-500'}`} />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <span className={`${feature.highlight ? 'font-semibold text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                        {feature.text}
                      </span>
                      {feature.subtext && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          Flexible overage billing
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Overage Pricing Explanation */}
        <div className="max-w-3xl mx-auto mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                How Overage Billing Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                The Starter plan includes <strong>125+ tracked users</strong>. Tracked users are unique visitors who vote, comment, or submit feedback.
              </p>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                      Grace Period: 20% Buffer
                    </div>
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      You won't be charged until you reach <strong>150 users</strong> (125 base + 25 grace). 
                      This gives you flexibility as your community grows.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="font-semibold">Overage Pricing:</div>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>0-150 users: <strong>$0 overage</strong> (included + grace)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>151-200 users: <strong>+$6</strong> (1 block of 50 users)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>201-250 users: <strong>+$12</strong> (2 blocks of 50 users)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-green-500" />
                    <span>And so on... $6 per additional 50 users</span>
                  </li>
                </ul>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 text-sm">
                <div className="font-semibold mb-2">Example:</div>
                <p className="text-gray-600 dark:text-gray-400">
                  If you have 180 tracked users in a month:
                  <br />
                  • Base plan: $19
                  <br />
                  • Overage: 180 - 150 = 30 users → 1 block = +$6
                  <br />
                  • <strong>Total: $25 for that month</strong>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I cancel my trial anytime?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Yes! You can cancel your 14-day trial at any time with no charges. 
                  If you don't cancel, you'll automatically be charged after the trial ends.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">How does the 14-day trial work?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  You get full access to all Starter plan features for 14 days, completely free. 
                  No credit card required until you decide to continue. We'll remind you 7, 3, and 1 day before your trial ends.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What happens if I exceed my tracked user limit?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  You have a 20% grace buffer (25 users) before any overage charges apply. 
                  After that, you're charged $6 per 50 additional users, billed monthly. 
                  You can track your usage in real-time on your dashboard.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I switch between monthly and yearly billing?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Yes! You can upgrade to yearly billing at any time to save $48/year. 
                  The change will take effect at your next billing cycle.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is there a refund policy?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Monthly plans can be canceled anytime with access until the end of your paid period. 
                  Annual plans are non-refundable but you'll have access for the full year.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0">
            <CardContent className="p-8">
              <Zap className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">
                Ready to Grow Your Feedback Community?
              </h3>
              <p className="text-blue-100 mb-6">
                Start your 14-day free trial today. No credit card required.
              </p>
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => handleUpgrade(billingCycle, false)}
                disabled={loading || currentPlan !== 'free'}
              >
                {currentPlan !== 'free' ? 'Already Subscribed' : 'Start Free Trial'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
