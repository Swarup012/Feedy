'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  ExternalLink, 
  Download,
  CreditCard,
  AlertTriangle,
  Loader2,
  Zap,
  Shield,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import paddleService, { SubscriptionInfo, Invoice } from '@/services/paddleService';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

export function BillingSection() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showUpgradeToProDialog, setShowUpgradeToProDialog] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'pro'>('starter');
  const [upgradeProBillingCycle, setUpgradeProBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const { toast } = useToast();

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const [subResponse, invoicesResponse] = await Promise.all([
        paddleService.getSubscription(),
        paddleService.getInvoices(),
      ]);

      if (subResponse.success) {
        setSubscription(subResponse.data);
      } else {
        // If API call fails, set default free plan state
        console.warn('Subscription API returned unsuccessful response, defaulting to free plan');
        setSubscription({
          status: 'free',
          plan: 'free',
          trialEndsAt: null,
          currentPeriodStart: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          hasActiveSubscription: false,
          billingProvider: 'paddle',
        });
      }
      if (invoicesResponse.success && invoicesResponse.data.invoices) {
        setInvoices(invoicesResponse.data.invoices);
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
      
      // Set default free plan state on error to prevent infinite loading
      setSubscription({
        status: 'free',
        plan: 'free',
        trialEndsAt: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        hasActiveSubscription: false,
        billingProvider: 'paddle',
      });
      
      toast({
        title: 'Warning',
        description: 'Could not load subscription data. Showing free plan status.',
        variant: 'default',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (skipTrial: boolean = false) => {
    try {
      setActionLoading(true);
      const response = await paddleService.createCheckoutSession({
        plan: selectedPlan,
        billingCycle,
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
              token: 'test_67753ae11c6f27e94e5909861a5' // Your real client-side token
            });
            
            console.log('🚀 Opening Paddle overlay...');
            Paddle.Checkout.open({
              transactionId: response.data.transactionId,
              settings: {
                displayMode: 'overlay',
                theme: 'light',
                successUrl: window.location.origin + '/admin/profile?checkout=success'
              }
            });
            
            console.log('✅ Overlay opened successfully!');
            setShowUpgradeDialog(false);
            setActionLoading(false);
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
      setActionLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    // For Paddle, we don't have a customer portal like Stripe
    // Instead, users can cancel directly or contact support
    toast({
      title: 'Paddle Subscription',
      description: 'You can cancel your subscription below or contact support for changes.',
    });
  };

  const handleUpgradeToPro = async (selectedBillingCycle: 'monthly' | 'yearly') => {
    try {
      setActionLoading(true);
      
      // Call the update-plan endpoint using the api client (has auth built-in)
      const response = await api.post('/api/paddle/subscription/update-plan', {
        newPlan: 'pro',
        billingCycle: selectedBillingCycle
      });

      if (response.data.success) {
        toast({
          title: 'Upgraded to Pro!',
          description: response.data.data?.message || 'You now have access to 15 team members and priority support.',
        });
        setShowUpgradeToProDialog(false);
        // Reload subscription data
        await loadSubscriptionData();
      } else {
        throw new Error(response.data.message || 'Failed to upgrade subscription');
      }
    } catch (error: any) {
      console.error('Error upgrading subscription:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to upgrade subscription. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDowngradeToStarter = async () => {
    // Confirm downgrade
    if (!window.confirm('Downgrade to Starter plan? You will lose access to 15 team members (reduced to 5) and priority support. The difference will be credited to your account.')) {
      return;
    }

    try {
      setActionLoading(true);
      
      // Call the update-plan endpoint
      const response = await api.post('/api/paddle/subscription/update-plan', {
        newPlan: 'starter',
        billingCycle: subscription?.billingCycle || 'monthly'
      });

      if (response.data.success) {
        toast({
          title: 'Downgraded to Starter',
          description: response.data.data?.message || 'Your plan has been changed to Starter.',
        });
        // Reload subscription data
        await loadSubscriptionData();
      } else {
        throw new Error(response.data.message || 'Failed to downgrade subscription');
      }
    } catch (error: any) {
      console.error('Error downgrading subscription:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to downgrade subscription. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    // Confirm before cancelling
    if (!window.confirm('Are you sure you want to cancel your subscription? You will lose access at the end of your billing period.')) {
      return;
    }

    try {
      setActionLoading(true);
      
      const response = await paddleService.cancelSubscription();

      if (response.success) {
        toast({
          title: 'Subscription Cancelled',
          description: 'Your subscription will be cancelled at the end of the billing period.',
        });
        // Reload subscription data
        await loadSubscriptionData();
      } else {
        throw new Error(response.message || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast({
        title: 'Error',
        description: 'Failed to cancel subscription. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      active: { label: 'Active', variant: 'default' },
      trialing: { label: 'Trial', variant: 'secondary' },
      past_due: { label: 'Past Due', variant: 'destructive' },
      canceled: { label: 'Canceled', variant: 'outline' },
      incomplete: { label: 'Incomplete', variant: 'destructive' },
      free: { label: 'Free Plan', variant: 'outline' },
    };

    const config = statusConfig[status] || statusConfig.free;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getInvoiceStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'open':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'void':
      case 'uncollectible':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subscription Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Plan</CardTitle>
              <CardDescription>Manage your subscription and billing</CardDescription>
            </div>
            {subscription && getStatusBadge(subscription.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Plan Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {subscription?.plan ? `${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan` : 'Free Plan'}
                </h3>
                <p className="text-sm text-gray-500">
                  {subscription?.status === 'trialing' && subscription?.currentPeriodEnd
                    ? `Trial ends ${formatDate(subscription.currentPeriodEnd)}`
                    : subscription?.status === 'active' && subscription?.currentPeriodEnd
                    ? `Renews ${formatDate(subscription.currentPeriodEnd)}`
                    : 'Upgrade to access premium features'}
                </p>
              </div>
              {subscription?.status === 'active' && (subscription?.plan === 'pro' || subscription?.plan === 'starter') && (
                <div className="text-right">
                  <p className="text-2xl font-bold">
                    {subscription.plan === 'pro' 
                      ? (subscription.billingCycle === 'yearly' ? '$45' : '$49')
                      : (subscription.billingCycle === 'yearly' ? '$15' : '$19')}
                  </p>
                  <p className="text-sm text-gray-500">per month</p>
                  {subscription.billingCycle === 'yearly' && (
                    <p className="text-xs text-gray-400">
                      Billed yearly (${subscription.plan === 'pro' ? '540' : '180'}/year)
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Trial Warning */}
            {subscription?.status === 'trialing' && subscription?.currentPeriodEnd && (
              <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-900">
                    Trial Period Active
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Your trial will end on {formatDate(subscription.currentPeriodEnd)}. 
                    You'll be automatically charged unless you cancel.
                  </p>
                </div>
              </div>
            )}

            {/* Cancellation Warning */}
            {subscription?.cancelAtPeriodEnd && subscription?.currentPeriodEnd && (
              <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-900">
                    Subscription Cancelled
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    Your subscription will end on {formatDate(subscription.currentPeriodEnd)}. 
                    You'll lose access to premium features after this date.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {!subscription || (subscription.status === 'free' && !subscription.hasActiveSubscription && subscription.plan === 'free') ? (
              <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
                <DialogTrigger asChild>
                  <Button className="flex-1">
                    <Zap className="h-4 w-4 mr-2" />
                    Choose Your Plan
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Choose Your Plan</DialogTitle>
                    <DialogDescription>
                      Select a billing cycle and start your 14-day free trial
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-6 py-4">
                    {/* Plan Selector */}
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant={selectedPlan === 'starter' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedPlan('starter')}
                        className={selectedPlan === 'starter' ? 'bg-blue-500 hover:bg-blue-600' : ''}
                      >
                        Starter $19/mo
                      </Button>
                      <Button
                        variant={selectedPlan === 'pro' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedPlan('pro')}
                        className={selectedPlan === 'pro' ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' : ''}
                      >
                        Pro $49/mo
                        <Badge className="ml-2 bg-yellow-500 text-xs">15 Members</Badge>
                      </Button>
                    </div>

                    {/* Billing Cycle Toggle */}
                    <div className="flex items-center justify-center gap-4">
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
                          Save ${selectedPlan === 'pro' ? '48' : '48'}/year
                        </Badge>
                      )}
                    </div>

                    {/* Plan Details */}
                    <Card className={selectedPlan === 'pro' ? 'border-purple-500 border-2' : 'border-blue-500 border-2'}>
                      <CardHeader>
                        <CardTitle className="text-xl">{selectedPlan === 'pro' ? 'Pro Plan' : 'Starter Plan'}</CardTitle>
                        <CardDescription>
                          {selectedPlan === 'pro' 
                            ? 'For teams that need more collaboration' 
                            : 'Perfect for growing teams collecting feedback'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          {billingCycle === 'monthly' ? (
                            <div className="flex items-baseline gap-1">
                              <span className={`text-3xl font-bold ${selectedPlan === 'pro' ? 'text-purple-600 dark:text-purple-400' : ''}`}>
                                ${selectedPlan === 'pro' ? '49' : '19'}
                              </span>
                              <span className="text-gray-600 dark:text-gray-400">/month</span>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-baseline gap-1">
                                <span className={`text-3xl font-bold ${selectedPlan === 'pro' ? 'text-purple-600 dark:text-purple-400' : ''}`}>
                                  ${selectedPlan === 'pro' ? '45' : '15'}
                                </span>
                                <span className="text-gray-600 dark:text-gray-400">/month</span>
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                Billed yearly (${selectedPlan === 'pro' ? '540' : '180'}/year)
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 text-sm">
                          {selectedPlan === 'pro' ? (
                            <>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-purple-500" />
                                <span className="font-semibold text-purple-600 dark:text-purple-400">15 team members</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-purple-500" />
                                <span className="font-semibold text-purple-600 dark:text-purple-400">Priority support</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>125+ tracked users included</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-blue-500" />
                                <span>+25 grace buffer (150 total)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>Unlimited boards & posts</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>Advanced analytics</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>Custom branding</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>5 team members</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>125+ tracked users included</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-blue-500" />
                                <span>+25 grace buffer (150 total)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>Unlimited boards & posts</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>Advanced analytics</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>Custom branding</span>
                              </div>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Button 
                        className={`w-full ${selectedPlan === 'pro' 
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
                          : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                        onClick={() => handleUpgrade(false)}
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          `Start ${selectedPlan === 'pro' ? 'Pro' : 'Starter'} Trial`
                        )}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => handleUpgrade(true)}
                        disabled={actionLoading}
                      >
                        Skip Trial & Subscribe Now
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <>
                {/* Upgrade to Pro button for Starter users */}
                {subscription?.plan === 'starter' && !subscription?.cancelAtPeriodEnd && (
                  <Dialog open={showUpgradeToProDialog} onOpenChange={setShowUpgradeToProDialog}>
                    <DialogTrigger asChild>
                      <Button 
                        className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Upgrade to Pro
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle>Upgrade to Pro Plan</DialogTitle>
                        <DialogDescription>
                          Choose your billing cycle for the Pro plan
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="space-y-6 py-4">
                        {/* Billing Cycle Toggle */}
                        <div className="flex items-center justify-center gap-4">
                          <span className={`text-sm font-medium ${upgradeProBillingCycle === 'monthly' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                            Monthly
                          </span>
                          <Switch
                            checked={upgradeProBillingCycle === 'yearly'}
                            onCheckedChange={(checked) => setUpgradeProBillingCycle(checked ? 'yearly' : 'monthly')}
                          />
                          <span className={`text-sm font-medium ${upgradeProBillingCycle === 'yearly' ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                            Yearly
                          </span>
                          {upgradeProBillingCycle === 'yearly' && (
                            <Badge variant="default" className="bg-green-500">
                              Save $48/year
                            </Badge>
                          )}
                        </div>

                        {/* Plan Details */}
                        <Card className="border-purple-500 border-2">
                          <CardHeader>
                            <CardTitle className="text-xl">Pro Plan</CardTitle>
                            <CardDescription>
                              For teams that need more collaboration
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              {upgradeProBillingCycle === 'monthly' ? (
                                <div className="flex items-baseline gap-1">
                                  <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                                    $49
                                  </span>
                                  <span className="text-gray-600 dark:text-gray-400">/month</span>
                                </div>
                              ) : (
                                <div>
                                  <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                                      $45
                                    </span>
                                    <span className="text-gray-600 dark:text-gray-400">/month</span>
                                  </div>
                                  <div className="text-sm text-gray-500 mt-1">
                                    Billed yearly ($540/year)
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-purple-500" />
                                <span className="font-semibold text-purple-600 dark:text-purple-400">15 team members</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-purple-500" />
                                <span className="font-semibold text-purple-600 dark:text-purple-400">Priority support</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>125+ tracked users included</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Shield className="h-4 w-4 text-blue-500" />
                                <span>+25 grace buffer (150 total)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>Unlimited boards & posts</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>Advanced analytics</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span>Custom branding</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Action Button */}
                        <Button 
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                          onClick={() => handleUpgradeToPro(upgradeProBillingCycle)}
                          disabled={actionLoading}
                        >
                          {actionLoading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Upgrading...
                            </>
                          ) : (
                            `Upgrade to Pro (${upgradeProBillingCycle === 'monthly' ? '$49/mo' : '$45/mo'})`
                          )}
                        </Button>
                        <p className="text-xs text-center text-gray-500">
                          The difference will be prorated immediately
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {/* Downgrade to Starter button for Pro users */}
                {subscription?.plan === 'pro' && !subscription?.cancelAtPeriodEnd && (
                  <Button 
                    onClick={() => handleDowngradeToStarter()}
                    disabled={actionLoading}
                    variant="outline"
                    className="flex-1"
                  >
                    {actionLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Downgrading...
                      </>
                    ) : (
                      <>
                        Downgrade to Starter
                      </>
                    )}
                  </Button>
                )}

                {/* Cancel button for Paddle subscription */}
                {!subscription?.cancelAtPeriodEnd && (
                  <Button 
                    onClick={handleCancelSubscription}
                    disabled={actionLoading}
                    variant="destructive"
                    className="flex-1"
                  >
                    {actionLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Cancelling...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Cancel Subscription
                      </>
                    )}
                  </Button>
                )}
                
                {/* Already cancelled */}
                {subscription?.cancelAtPeriodEnd && (
                  <div className="flex-1">
                    <Button 
                      disabled
                      variant="outline"
                        className="w-full"
                      >
                        {actionLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Cancelling...
                          </>
                        ) : (
                          'Cancel Subscription'
                        )}
                      </Button>
                    )}
                    
                    {subscription?.cancelAtPeriodEnd && (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                        <p className="text-sm text-yellow-900 dark:text-yellow-100">
                          Your subscription will be cancelled at the end of the current billing period.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Payment History Card */}
      {invoices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>Your recent invoices and payments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    {getInvoiceStatusIcon(invoice.status)}
                    <div>
                      <p className="font-medium">{formatDate(invoice.date.toString())}</p>
                      <p className="text-sm text-gray-500 capitalize">
                        {invoice.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <p className="font-semibold">
                      {formatAmount(invoice.amount, invoice.currency)}
                    </p>
                    {invoice.pdfUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                      >
                        <a
                          href={invoice.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Invoices Message */}
      {invoices.length === 0 && subscription?.status !== 'free' && (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>Your recent invoices and payments</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-500 py-8">No payment history available</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
