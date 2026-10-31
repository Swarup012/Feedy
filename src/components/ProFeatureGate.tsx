'use client';

import { useOrganization } from '@/context/OrganizationContext';
import { Lock, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { UpgradeDialog } from '@/components/UpgradeDialog';
import { Button } from '@/components/ui/button';
import { planAllowsFeature, resolvePlan, type PlanFeatures, type PlanTier } from '@/config/plans';

interface ProFeatureGateProps {
  children: React.ReactNode;
  featureName?: string;
  /**
   * Plan feature key from PLANS config. When set, access is derived from the
   * config instead of a hardcoded plan name, so the gate follows pricing.
   * When omitted, the gate stays Pro-only.
   */
  feature?: keyof PlanFeatures;
}

const PLAN_ORDER: PlanTier[] = ['free', 'starter', 'pro'];

function cheapestPlanFor(feature: keyof PlanFeatures): PlanTier {
  return PLAN_ORDER.find((tier) => planAllowsFeature(tier, feature)) ?? 'pro';
}

export function ProFeatureGate({ children, featureName = 'this feature', feature }: ProFeatureGateProps) {
  const { organization, loading } = useOrganization();
  const [dialogOpen, setDialogOpen] = useState(false);

  const plan = resolvePlan(organization);
  const hasAccess = feature ? planAllowsFeature(plan, feature) : plan === 'pro';
  const upgradeTarget = feature ? cheapestPlanFor(feature) : 'pro';

  const showGate = !organization || !hasAccess;

  if (loading) return <>{children}</>;
  if (!showGate) return <>{children}</>;

  return (
    <>
      <UpgradeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        featureName={featureName}
      />

      <div className="relative flex flex-col min-h-full">
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto flex flex-col items-center gap-3 bg-background/90 backdrop-blur-sm border border-border/60 rounded-2xl px-6 py-5 shadow-lg max-w-xs text-center">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{featureName}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upgrade to {upgradeTarget === 'starter' ? 'Starter' : 'Pro'} to use this feature.
              </p>
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => setDialogOpen(true)}>
              <Sparkles className="w-3.5 h-3.5" />
              Upgrade
            </Button>
          </div>
        </div>

        <div className="flex-1 pointer-events-none select-none opacity-40">
          {children}
        </div>
      </div>
    </>
  );
}
