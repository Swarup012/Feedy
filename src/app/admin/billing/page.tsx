'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import paddleService, { SubscriptionInfo, Invoice } from '@/services/paddleService';
import { PlanCard } from '@/components/billing/PlanCard';
import { UpgradeDialog } from '@/components/UpgradeDialog';
import { CancelFlow } from '@/components/billing/CancelFlow';
import { InvoiceHistory } from '@/components/billing/InvoiceHistory';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

function BillingContent() {
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Dialog states
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showCancelFlow, setShowCancelFlow] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (searchParams.get('checkout') === 'success') {
      toast({
        title: 'Checkout complete',
        description: 'Your subscription is now active. Welcome to the team!',
      });
      loadData();
    }
  }, [searchParams]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [subResponse, invoicesResponse] = await Promise.all([
        paddleService.getSubscription(),
        paddleService.getInvoices(10),
      ]);

      if (subResponse.success) {
        setSubscription(subResponse.data);
      } else {
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
      console.error('Error loading billing data:', error);
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
        title: 'Could not load billing data',
        description: 'Showing free plan status. Refresh if this persists.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      setActionLoading(true);
      // Paddle customer portal — open in new tab
      const response = await fetch('/api/paddle/portal', { method: 'POST' });
      const data = await response.json();
      if (data.url) {
        window.open(data.url, '_blank');
      } else {
        toast({
          title: 'Portal unavailable',
          description: 'Contact support@faddy.site for billing changes.',
        });
      }
    } catch {
      toast({
        title: 'Portal unavailable',
        description: 'Contact support@faddy.site for billing changes.',
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelSuccess = async () => {
    await loadData();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-switzer font-bold text-gray-900 dark:text-white">
          Billing
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage your subscription, payment method, and invoices.
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Plan Card — takes 2 columns on desktop */}
        <div className="lg:col-span-2">
          <PlanCard
            subscription={subscription!}
            onUpgrade={() => setShowUpgradeDialog(true)}
            onDowngrade={() => setShowUpgradeDialog(true)}
            onCancel={() => setShowCancelFlow(true)}
            onManageBilling={handleManageBilling}
            actionLoading={actionLoading}
          />
        </div>

        {/* Invoice History — 1 column */}
        <div>
          <InvoiceHistory invoices={invoices} />
        </div>
      </div>

      {/* Upgrade Dialog */}
      <UpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        featureName="billing"
        subscription={subscription}
      />

      {/* Cancel Flow */}
      {subscription && (
        <CancelFlow
          open={showCancelFlow}
          onOpenChange={setShowCancelFlow}
          subscription={subscription}
          onSuccess={handleCancelSuccess}
        />
      )}
    </div>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
