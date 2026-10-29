'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/context/OrganizationContext';
import api from '@/lib/api';
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
  const isOwner = organizationRole === 'owner';

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
    <Card id="revenue-data">
      <CardHeader>
        <CardTitle>Revenue data</CardTitle>
        <CardDescription>
          Which custom fields carry each customer&apos;s monthly revenue, sent
          with identify(). Example:{' '}
          <code className="text-xs bg-muted px-1 py-0.5 rounded">
            {'{ mrr: 299, plan: "pro", company: "acme" }'}
          </code>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="mrr-field-key" className="text-xs">
              MRR field key
            </Label>
            <Input
              id="mrr-field-key"
              placeholder="e.g. mrr"
              value={mrrFieldKey}
              onChange={(e) => setMrrFieldKey(e.target.value)}
              disabled={!isOwner}
              maxLength={100}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="account-field-key" className="text-xs">
              Account field key (optional)
            </Label>
            <Input
              id="account-field-key"
              placeholder="e.g. company"
              value={accountFieldKey}
              onChange={(e) => setAccountFieldKey(e.target.value)}
              disabled={!isOwner}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              Groups people at the same company so one company counts once.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="mrr-currency" className="text-xs">
              Currency
            </Label>
            <Input
              id="mrr-currency"
              placeholder="USD"
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              disabled={!isOwner}
              maxLength={3}
              className="uppercase"
            />
          </div>
        </div>

        {isOwner && (
          <div className="flex justify-end pt-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save Revenue Settings'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
