'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download,
  CreditCard,
  AlertTriangle,
  Loader2,
  Zap,
} from 'lucide-react';
import paddleService, { SubscriptionInfo, Invoice } from '@/services/paddleService';
import { PLANS } from '@/config/plans';
import api from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { UpgradeDialog } from '@/components/UpgradeDialog';

export function BillingSection() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
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

  const handleManageSubscription = async () => {
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
                  <>
                    <Button 
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={() => setShowUpgradeDialog(true)}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Choose Your Plan
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Upgrade to Pro button for Starter users */}
                    {subscription?.plan === 'starter' && !subscription?.cancelAtPeriodEnd && (
                      <Button 
                        className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        onClick={() => setShowUpgradeDialog(true)}
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Upgrade to Pro
                      </Button>
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

              <UpgradeDialog
                open={showUpgradeDialog}
                onOpenChange={setShowUpgradeDialog}
                featureName="billing"
                subscription={subscription}
              />

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
