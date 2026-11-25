'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/context/OrganizationContext';
import api from '@/lib/api';
import { planAllowsFeature, resolvePlan } from '@/config/plans';
import { UpgradeDialog } from '@/components/UpgradeDialog';
import { LockedNotice } from '@/components/settings/LockedNotice';
import { ShellIcon } from '@/components/shell/ShellIcon';
import { Loader2 } from 'lucide-react';

/**
 * Admin editor for organizations.settings.mrr_field_key / account_field_key
 * / currency — the Phase-1 resolver's input contract. Saves through
 * PUT /api/organizations/:id (read-merge-write; sibling settings keys
 * survive). Client validation mirrors backend validateMrrSettings.
 */
export function RevenueSettingsSection() {
  const { toast } = useToast();
  const { organization, organizationRole, refreshOrganization } = useOrganization();
  const [mrrFieldKey, setMrrFieldKey] = useState('mrr');
  const [accountFieldKey, setAccountFieldKey] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [saving, setSaving] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const isOwner = organizationRole === 'owner';
  // Flat gate: fields stay visible but disabled on Free; while the org loads
  // we render active (mirrors the previous PaidFeatureGate loading behaviour).
  const locked =
    !!organization && !planAllowsFeature(resolvePlan(organization), 'mrr_insights');

  useEffect(() => {
    const settings = organization?.settings || {};
    setMrrFieldKey(typeof settings.mrr_field_key === 'string' && settings.mrr_field_key ? settings.mrr_field_key : 'mrr');
    setAccountFieldKey(typeof settings.account_field_key === 'string' ? settings.account_field_key : '');
    setCurrency(typeof settings.currency === 'string' && settings.currency ? settings.currency.toUpperCase() : 'USD');
  }, [organization?.settings]);

  const handleSave = async () => {
    if (!organization) return;

    const mrrKey = mrrFieldKey.trim();
    if (!mrrKey || mrrKey.length > 100) {
      toast({
        title: 'Invalid MRR field key',
        description: 'MRR field key must be a non-empty string (max 100 characters).',
        variant: 'destructive',
      });
      return;
    }

    const accountKey = accountFieldKey.trim();
    if (accountKey && accountKey.length > 100) {
      toast({
        title: 'Invalid account field key',
        description: 'Account field key must be at most 100 characters, or empty to clear.',
        variant: 'destructive',
      });
      return;
    }

    const currencyCode = currency.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(currencyCode)) {
      toast({
        title: 'Invalid currency',
        description: 'Currency must be a 3-letter ISO code, e.g. USD.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      await api.put(`/api/organizations/${organization.id}`, {
        settings: {
          mrr_field_key: mrrKey,
          // empty string → explicit null (clears grouping)
          account_field_key: accountKey ? accountKey : null,
          currency: currencyCode,
        },
      });
      toast({
        title: 'Revenue data settings saved',
        description: 'MRR fields will be read using these keys.',
      });
      await refreshOrganization();
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error?.response?.data?.error || 'Failed to save revenue data settings.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="settings-section revenue-section" id="revenue-data">
      <UpgradeDialog
        open={showUpgrade}
        onOpenChange={setShowUpgrade}
        featureName="Revenue insights"
      />

      <div className="settings-section__head">
        <h3 className="settings-section__title revenue-section__title">Revenue data</h3>
        <p className="settings-section__desc revenue-section__desc">
          Which custom fields carry each customer&apos;s monthly revenue, sent
          with identify(). Example:{' '}
          <code className="revenue-code">{'{ mrr: 299, plan: "pro", company: "acme" }'}</code>
        </p>
      </div>

      {locked && (
        <LockedNotice onUpgrade={() => setShowUpgrade(true)}>
          Revenue insights are available on Starter and Pro.
        </LockedNotice>
      )}

      <div className={locked ? 'revenue-grid revenue-grid--locked' : 'revenue-grid'}>
        <div className="settings-field revenue-grid__field">
          <Label htmlFor="mrr-field-key" className="settings-label">
            MRR field key
          </Label>
          <Input
            id="mrr-field-key"
            placeholder="e.g. mrr"
            value={mrrFieldKey}
            onChange={(e) => setMrrFieldKey(e.target.value)}
            disabled={!isOwner || locked}
            maxLength={100}
            className="revenue-input"
          />
        </div>
        <div className="settings-field revenue-grid__field">
          <Label htmlFor="account-field-key" className="settings-label">
            Account field key (optional)
          </Label>
          <Input
            id="account-field-key"
            placeholder="e.g. company"
            value={accountFieldKey}
            onChange={(e) => setAccountFieldKey(e.target.value)}
            disabled={!isOwner || locked}
            maxLength={100}
            className="revenue-input"
          />
        </div>
        <div className="settings-field revenue-grid__field">
          <Label htmlFor="mrr-currency" className="settings-label">
            Currency
          </Label>
          <Input
            id="mrr-currency"
            placeholder="USD"
            value={currency}
            onChange={(e) => setCurrency(e.target.value.toUpperCase())}
            disabled={!isOwner || locked}
            maxLength={3}
            className="revenue-input uppercase"
          />
        </div>
      </div>

      <p className="revenue-helper">
        Account field groups people at the same company so one company counts once.
      </p>

      {isOwner && (
        <div className="revenue-actions">
          <Button onClick={handleSave} disabled={saving || locked}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? 'Saving...' : 'Save revenue settings'}
          </Button>
        </div>
      )}
    </section>
  );
}
