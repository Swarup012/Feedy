'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/context/OrganizationContext';
import api from '@/lib/api';
import { Plus, Trash2, Loader2 } from 'lucide-react';

interface PlanWeightRow {
  plan: string;
  weight: string;
}

/**
 * Admin editor for organizations.settings.plan_weight_map.
 * Saves through PUT /api/organizations/:id — the backend merges the
 * settings object (read-merge-write), so sibling settings keys survive.
 */
export function PlanWeightsSection() {
  const { toast } = useToast();
  const { organization, organizationRole, refreshOrganization } = useOrganization();
  const [rows, setRows] = useState<PlanWeightRow[]>([]);
  const [saving, setSaving] = useState(false);
  const isOwner = organizationRole === 'owner';

  useEffect(() => {
    const map = organization?.settings?.plan_weight_map || {};
    setRows(
      Object.entries(map).map(([plan, weight]) => ({
        plan,
        weight: String(weight),
      }))
    );
  }, [organization?.settings]);

  const addRow = () => setRows((prev) => [...prev, { plan: '', weight: '1' }]);
  const removeRow = (index: number) =>
    setRows((prev) => prev.filter((_, i) => i !== index));
  const updateRow = (index: number, field: keyof PlanWeightRow, value: string) =>
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );

  const handleSave = async () => {
    if (!organization) return;

    const map: Record<string, number> = {};
    for (const row of rows) {
      const plan = row.plan.trim();
      if (!plan) continue; // ignore fully-empty rows
      const weight = Number(row.weight);
      if (!Number.isFinite(weight) || weight <= 0) {
        toast({
          title: 'Invalid weight',
          description: `Weight for "${plan}" must be a number greater than 0.`,
          variant: 'destructive',
        });
        return;
      }
      if (plan in map) {
        toast({
          title: 'Duplicate plan',
          description: `"${plan}" appears more than once.`,
          variant: 'destructive',
        });
        return;
      }
      map[plan] = weight;
    }

    try {
      setSaving(true);
      await api.put(`/api/organizations/${organization.id}`, {
        settings: { plan_weight_map: map },
      });
      toast({
        title: 'Plan weights saved',
        description: `${Object.keys(map).length} plan${Object.keys(map).length === 1 ? '' : 's'} mapped.`,
      });
      await refreshOrganization();
    } catch (error: any) {
      toast({
        title: 'Error',
        description:
          error?.response?.data?.error || 'Failed to save plan weights.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue plan weights</CardTitle>
        <CardDescription>
          Map your end-users' plan strings to revenue weights used by severity
          scoring. When a post has multiple authors, the highest mapped weight
          wins; unmapped or missing plans count as 1.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No plan weights configured — all plans count as 1.
          </p>
        )}

        {rows.map((row, index) => (
          <div key={index} className="flex items-end gap-2">
            <div className="flex-1 space-y-1.5">
              <Label htmlFor={`plan-${index}`} className="text-xs">
                Plan string
              </Label>
              <Input
                id={`plan-${index}`}
                placeholder="e.g. enterprise"
                value={row.plan}
                onChange={(e) => updateRow(index, 'plan', e.target.value)}
                disabled={!isOwner}
              />
            </div>
            <div className="w-28 space-y-1.5">
              <Label htmlFor={`weight-${index}`} className="text-xs">
                Weight
              </Label>
              <Input
                id={`weight-${index}`}
                type="number"
                min="0.1"
                step="0.1"
                value={row.weight}
                onChange={(e) => updateRow(index, 'weight', e.target.value)}
                disabled={!isOwner}
              />
            </div>
            {isOwner && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeRow(index)}
                aria-label={`Remove ${row.plan || 'plan'}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}

        <div className="flex items-center justify-between pt-2">
          {isOwner ? (
            <Button variant="outline" size="sm" onClick={addRow}>
              <Plus className="h-4 w-4" /> Add plan
            </Button>
          ) : (
            <span />
          )}
          {isOwner && (
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? 'Saving...' : 'Save Plan Weights'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
