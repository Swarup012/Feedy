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
import { PLANS } from '@/config/plans';
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

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      const response = await api.get(`/api/paddle/invoices/${invoiceId}/download`, {
        responseType: 'blob'
      });

      // Check if response is an error (JSON instead of PDF)
      const contentType = response.headers['content-type'];
      if (contentType && contentType.includes('application/json')) {
        // Parse the error message
        const errorText = await response.data.text();
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error || errorData.message || 'Failed to download invoice');
      }

      // Create blob URL and trigger download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      console.error('Error downloading invoice:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to download invoice',
        variant: 'destructive',
      });
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
            const paddleToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || 'test_67753ae11c6f27e94e5909861a5';
            const isSandbox = !paddleToken.startsWith('live_');
            if (isSandbox) Paddle.Environment.set('sandbox');
            Paddle.Setup({ 
              token: paddleToken
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
          description: response.data.data?.message || 'You now have access to unlimited members and advanced features.',
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
    if (!window.confirm('Downgrade to Starter plan? You will lose access to unlimited members (reduced to 5 admins) and priority features. The difference will be credited to your account.')) {
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
    }).format(amount); // Backend already converted from cents to dollars
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
      {/* Top Row: Current Plan + Last Payment side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Current Plan Card */}
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Current Plan</h3>
                  <p className="text-blue-100 text-sm">Manage your subscription</p>
                </div>
              </div>
              {subscription && (
                <div className="px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white">
                  {subscription.status === 'active' ? 'Active' : subscription.status === 'trialing' ? 'Trial' : subscription.status}
                </div>
              )}
            </div>
          </div>
          <CardContent className="p-6">
            <div className="space-y-5">
              {/* Plan Name & Price */}
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {subscription?.plan ? `${subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)}` : 'Free'}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {subscription?.status === 'trialing' && subscription?.currentPeriodEnd
                      ? `Trial ends ${formatDate(subscription.currentPeriodEnd)}`
                      : subscription?.status === 'active' && subscription?.currentPeriodEnd
                      ? `Renews ${formatDate(subscription.currentPeriodEnd)}`
                      : 'Upgrade to access premium features'}
                  </p>
                </div>
                {subscription?.status === 'active' && (subscription?.plan === 'pro' || subscription?.plan === 'starter') && (
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                      {subscription.plan === 'pro'
                        ? (subscription.billingCycle === 'yearly' ? `$${PLANS.pro.yearlyPrice}` : `$${PLANS.pro.monthlyPrice}`)
                        : (subscription.billingCycle === 'yearly' ? `$${PLANS.starter.yearlyPrice}` : `$${PLANS.starter.monthlyPrice}`)}
                    </p>
                    <p className="text-sm text-gray-500">per month</p>
                    {subscription.billingCycle === 'yearly' && (
                      <p className="text-xs text-blue-600 font-medium mt-0.5">
                        Billed ${subscription.plan === 'pro' ? PLANS.pro.yearlyTotal : PLANS.starter.yearlyTotal}/year
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Trial Warning */}
              {subscription?.status === 'trialing' && subscription?.currentPeriodEnd && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Trial Active</p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                      Ends {formatDate(subscription.currentPeriodEnd)}. You'll be charged unless you cancel.
                    </p>
                  </div>
                </div>
              )}

              {/* Cancellation Warning */}
              {subscription?.cancelAtPeriodEnd && subscription?.currentPeriodEnd && (
                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-900 dark:text-red-100">Subscription Cancelled</p>
                    <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">
                      Ends {formatDate(subscription.currentPeriodEnd)}. You'll lose access after this date.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                {!subscription || (subscription.status === 'free' && !subscription.hasActiveSubscription && subscription.plan === 'free') ? (
                  <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
                    <DialogTrigger asChild>
                      <Button className="bg-blue-600 hover:bg-blue-700">
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
                            Starter ${PLANS.starter.monthlyPrice}/mo
                          </Button>
                          <Button
                            variant={selectedPlan === 'pro' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSelectedPlan('pro')}
                            className={selectedPlan === 'pro' ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' : ''}
                          >
                            Pro ${PLANS.pro.monthlyPrice}/mo
                            <Badge className="ml-2 bg-yellow-500 text-xs">Unlimited Members</Badge>
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
                              Save ${selectedPlan === 'pro' ? (PLANS.pro.monthlyPrice * 12 - PLANS.pro.yearlyTotal) : (PLANS.starter.monthlyPrice * 12 - PLANS.starter.yearlyTotal)}/year
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
                                    ${selectedPlan === 'pro' ? PLANS.pro.monthlyPrice : PLANS.starter.monthlyPrice}
                                  </span>
                                  <span className="text-gray-600 dark:text-gray-400">/month</span>
                                </div>
                              ) : (
                                <div>
                                  <div className="flex items-baseline gap-1">
                                    <span className={`text-3xl font-bold ${selectedPlan === 'pro' ? 'text-purple-600 dark:text-purple-400' : ''}`}>
                                      ${selectedPlan === 'pro' ? PLANS.pro.yearlyPrice : PLANS.starter.yearlyPrice}
                                    </span>
                                    <span className="text-gray-600 dark:text-gray-400">/month</span>
                                  </div>
                                  <div className="text-sm text-gray-500 mt-1">
                                    Billed yearly (${selectedPlan === 'pro' ? PLANS.pro.yearlyTotal : PLANS.starter.yearlyTotal}/year)
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="space-y-2 text-sm">
                              {selectedPlan === 'pro' ? (
                                <>
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-purple-500" />
                                    <span className="font-semibold text-purple-600 dark:text-purple-400">Unlimited members</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-purple-500" />
                                    <span className="font-semibold text-purple-600 dark:text-purple-400">Unlimited members</span>
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
                                    <span>Unlimited members, up to 5 admins</span>
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
                            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
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
                                  Save ${PLANS.pro.monthlyPrice * 12 - PLANS.pro.yearlyTotal}/year
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
                                        ${PLANS.pro.monthlyPrice}
                                      </span>
                                      <span className="text-gray-600 dark:text-gray-400">/month</span>
                                    </div>
                                  ) : (
                                    <div>
                                      <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                                          ${PLANS.pro.yearlyPrice}
                                        </span>
                                        <span className="text-gray-600 dark:text-gray-400">/month</span>
                                      </div>
                                      <div className="text-sm text-gray-500 mt-1">
                                        Billed yearly (${PLANS.pro.yearlyTotal}/year)
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <div className="space-y-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-purple-500" />
                                    <span className="font-semibold text-purple-600 dark:text-purple-400">Unlimited members</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-purple-500" />
                                    <span className="font-semibold text-purple-600 dark:text-purple-400">Unlimited members</span>
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
                                `Upgrade to Pro (${upgradeProBillingCycle === 'monthly' ? `$${PLANS.pro.monthlyPrice}/mo` : `$${PLANS.pro.yearlyPrice}/mo`})`
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
                      >
                        {actionLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          'Downgrade to Starter'
                        )}
                      </Button>
                    )}

                    {/* Cancel button for Paddle subscription */}
                    {!subscription?.cancelAtPeriodEnd && (
                      <Button 
                        onClick={handleCancelSubscription}
                        disabled={actionLoading}
                        variant="destructive"
                      >
                        {actionLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel
                          </>
                        )}
                      </Button>
                    )}
                  </>
                )}
              </div>

              {/* Already cancelled notice */}
              {subscription?.cancelAtPeriodEnd && (
                <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    Your subscription will be cancelled at the end of the current billing period.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Last Payment Card */}
        <Card className="overflow-hidden">
          <div className="bg-gradient-to-r from-gray-700 to-gray-800 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Download className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Last Payment</h3>
                <p className="text-gray-300 text-sm">Invoice history</p>
              </div>
            </div>
          </div>
          <CardContent className="p-6">
            {invoices.length > 0 ? (
              <div className="space-y-3">
                {invoices.slice(0, 3).map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getInvoiceStatusIcon(invoice.status)}
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(invoice.date.toString())}</p>
                        <p className="text-xs text-gray-500 capitalize">{invoice.status}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {formatAmount(invoice.amount, invoice.currency)}
                      </p>
                      {invoice.hasInvoice !== false && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          onClick={() => handleDownloadInvoice(invoice.id)}
                          title="Download invoice"
                        >
                          <Download className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                  <CreditCard className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500">No payment history yet</p>
                <p className="text-xs text-gray-400 mt-1">Payments will appear here after your first invoice</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
