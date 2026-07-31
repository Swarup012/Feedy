'use client';

import { useOrganization } from '@/context/OrganizationContext';
import { Sparkles, X } from 'lucide-react';
import { useState } from 'react';
import { UpgradeDialog } from '@/components/UpgradeDialog';

interface PaidFeatureGateProps {
  children: React.ReactNode;
  /** Label shown in the banner and upgrade dialog, e.g. "Integrations" */
  featureName?: string;
}

/**
 * Wraps a page/section so that:
 *  - Free-plan users see a sticky top banner + faded, non-interactive content
 *  - Paid users (starter / pro) see the content normally
 */
export function PaidFeatureGate({ children, featureName = 'this feature' }: PaidFeatureGateProps) {
  const { organization, loading } = useOrganization();
  const [dismissed, setDismissed] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Payment webhooks update subscription_plan (not the legacy `plan` column).
  // Prefer subscription_plan so paid users unlock after checkout.
  const currentPlan = organization?.subscription_plan || organization?.plan || 'free';
  const isFree = !organization || currentPlan === 'free';

  // Avoid flashing the upgrade banner while org data is still loading
  if (loading) {
    return <>{children}</>;
  }

  if (!isFree) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Upgrade Dialog */}
      <UpgradeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        featureName={featureName}
      />

      <div className="flex flex-col min-h-full">
        {/* ── Sticky upgrade banner ── */}
        {!dismissed && (
          <div className="sticky top-0 z-50 flex items-center gap-3 px-4 py-2.5 bg-slate-900 dark:bg-slate-800 border-b border-slate-700 text-white shadow-sm">
            <Sparkles className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <p className="flex-1 text-sm text-slate-200 leading-tight">
              <span className="font-semibold text-white">{featureName}</span> is available on the{' '}
              <span className="font-semibold text-white">Starter</span> &amp;{' '}
              <span className="font-semibold text-white">Pro</span> plans.
            </p>
            <button
              onClick={() => setDialogOpen(true)}
              className="shrink-0 rounded-md bg-white text-slate-900 hover:bg-slate-100 transition-colors px-3 py-1.5 text-xs font-semibold"
            >
              Upgrade
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="shrink-0 p-1 rounded hover:bg-slate-700 transition-colors text-slate-400 hover:text-white"
              aria-label="Dismiss"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* ── Faded, non-interactive content ── */}
        <div className="flex-1 pointer-events-none select-none opacity-50">
          {children}
        </div>
      </div>
    </>
  );
}
