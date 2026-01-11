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
import stripeService, { SubscriptionInfo, Invoice } from '@/services/stripeService';
import { useToast } from '@/hooks/use-toast';

export function BillingSection() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const { toast } = useToast();

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      const [subResponse, invoicesResponse] = await Promise.all([
        stripeService.getSubscription(),
        stripeService.getInvoices(),
      ]);

      if (subResponse.success) {
        setSubscription(subResponse.data);
      }
      if (invoicesResponse.success && invoicesResponse.data.invoices) {
        setInvoices(invoicesResponse.data.invoices);
      }
    } catch (error) {
      console.error('Error loading subscription data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load subscription data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (skipTrial: boolean = false) => {
    try {
      setActionLoading(true);
      const response = await stripeService.createCheckoutSession({
        plan: 'starter',
        billingCycle,
        skipTrial,
      });
      
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
      setActionLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      setActionLoading(true);
      const response = await stripeService.createPortalSession();
      
      if (response.success && response.data.url) {
        // Redirect to Stripe Customer Portal
        window.location.href = response.data.url;
      } else {
        throw new Error('Failed to create portal session');
      }
    } catch (error) {
      console.error('Error creating portal session:', error);
      toast({
        title: 'Error',
        description: 'Failed to open billing portal',
        variant: 'destructive',
      });
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
              {subscription?.status === 'active' && subscription?.plan === 'pro' && (
                <div className="text-right">
                  <p className="text-2xl font-bold">$29</p>
                  <p className="text-sm text-gray-500">per month</p>
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
            {!subscription || subscription.status === 'free' ? (
              <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
                <DialogTrigger asChild>
                  <Button className="flex-1">
                    <Zap className="h-4 w-4 mr-2" />
                    Upgrade to Starter
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
                          Save $48/year
                        </Badge>
                      )}
                    </div>

                    {/* Plan Details */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-xl">Starter Plan</CardTitle>
                        <CardDescription>
                          Perfect for growing teams collecting feedback
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          {billingCycle === 'monthly' ? (
                            <div className="flex items-baseline gap-1">
                              <span className="text-3xl font-bold">$19</span>
                              <span className="text-gray-600 dark:text-gray-400">/month</span>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-bold">$15</span>
                                <span className="text-gray-600 dark:text-gray-400">/month</span>
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                Billed yearly ($180/year)
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-2 text-sm">
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
                            <span>$6 per 50 additional users</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>1 roadmap</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>5 team members</span>
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

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleUpgrade(false)}
                        disabled={actionLoading}
                      >
                        {actionLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Start 14-Day Free Trial'
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
              <Button 
                onClick={handleManageSubscription} 
                disabled={actionLoading}
                variant="outline"
                className="flex-1"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Manage Subscription
                  </>
                )}
              </Button>
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
