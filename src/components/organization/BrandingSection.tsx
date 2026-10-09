'use client';

import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useOrganization } from '@/context/OrganizationContext';
import api, { isPlanUpgradeRequired } from '@/lib/api';
import { uploadService } from '@/services/uploadService';
import { planAllowsFeature, resolvePlan } from '@/config/plans';
import { UpgradeDialog } from '@/components/UpgradeDialog';
import { ImagePlus, Loader2, X } from 'lucide-react';

const DEFAULT_COLOR = '#3b82f6';
const HEX_RE = /^#[0-9a-fA-F]{6}$/;
const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const LOGO_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

/**
 * Admin editor for org branding: organizations.logo_url + settings.branding.
 * Logo uploads go through uploadService (folder 'branding' — owner + plan
 * gated server-side); settings save through PUT /api/organizations/:id.
 * Portal rendering happens elsewhere — this is settings UI only.
 */
export function BrandingSection() {
  const { toast } = useToast();
  const { organization, organizationRole, refreshOrganization } = useOrganization();
  const isOwner = organizationRole === 'owner';
  const canBrand =
    !!organization &&
    planAllowsFeature(resolvePlan(organization), 'custom_branding');
  const editable = isOwner && canBrand;

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [hex, setHex] = useState(DEFAULT_COLOR);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLogoUrl(organization?.logo_url || null);
    const stored = organization?.settings?.branding?.primaryColor;
    setHex(stored && HEX_RE.test(stored) ? stored : DEFAULT_COLOR);
  }, [organization]);

  const hexValid = HEX_RE.test(hex);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file
    if (!file) return;

    if (!LOGO_TYPES.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Only JPEG, PNG, GIF or WebP images are allowed.',
        variant: 'destructive',
      });
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast({
        title: 'File too large',
        description: 'Logo must be 5MB or smaller.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);
      const url = await uploadService.uploadImage(file, 'branding');
      setLogoUrl(url);
    } catch (error: any) {
      toast({
        title: 'Upload failed',
        description: isPlanUpgradeRequired(error)
          ? 'Custom branding requires a Starter or Pro plan.'
          : error?.response?.data?.message || 'Could not upload the logo.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!organization) return;
    if (!hexValid) {
      toast({
        title: 'Invalid color',
        description: 'Use a hex color like #3b82f6.',
        variant: 'destructive',
      });
      return;
    }

    const normalized = hex.toLowerCase();
    try {
      setSaving(true);
      await api.put(`/api/organizations/${organization.id}`, {
        logo_url: logoUrl || null,
        settings: {
          branding: normalized === DEFAULT_COLOR ? {} : { primaryColor: normalized },
        },
      });
      toast({ title: 'Branding saved' });
      await refreshOrganization();
    } catch (error: any) {
      if (isPlanUpgradeRequired(error)) {
        setShowUpgrade(true);
        return;
      }
      toast({
        title: 'Error',
        description: error?.response?.data?.message || 'Failed to save branding.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding</CardTitle>
        <CardDescription>
          Logo and brand color shown on your public portal and widget.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isOwner && (
          <p className="text-sm text-muted-foreground">
            Only the organization owner can change branding.
          </p>
        )}
        {isOwner && !canBrand && (
          <div className="flex items-center justify-between gap-3 rounded-md border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-900 dark:bg-yellow-950">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Custom branding is available on Starter and Pro.
            </p>
            <Button size="sm" onClick={() => setShowUpgrade(true)}>
              Upgrade
            </Button>
          </div>
        )}

        {/* Logo */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Logo</Label>
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logoUrl}
                  alt="Organization logo"
                  className="h-12 w-12 rounded-md border border-border object-contain"
                />
                {editable && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl(null)}
                    className="absolute -right-2 -top-2 rounded-full bg-background p-0.5 shadow ring-1 ring-border hover:bg-muted"
                    aria-label="Remove logo"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-md border border-dashed border-border text-muted-foreground">
                <ImagePlus className="h-5 w-5" />
              </div>
            )}
            {editable && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                  aria-label="Upload logo"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {uploading ? 'Uploading…' : logoUrl ? 'Replace logo' : 'Upload logo'}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Brand color */}
        <div className="space-y-2">
          <Label htmlFor="branding-color" className="text-sm font-medium text-foreground">
            Brand color
          </Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={hexValid ? hex : DEFAULT_COLOR}
              onChange={(e) => setHex(e.target.value)}
              disabled={!editable}
              className="h-9 w-10 cursor-pointer rounded-md border border-border bg-background p-1"
              aria-label="Brand color picker"
            />
            <Input
              id="branding-color"
              value={hex}
              onChange={(e) => setHex(e.target.value)}
              disabled={!editable}
              placeholder={DEFAULT_COLOR}
              className="w-32 font-mono"
            />
            {editable && (
              <Button variant="ghost" size="sm" onClick={() => setHex(DEFAULT_COLOR)}>
                Reset
              </Button>
            )}
          </div>
          {!hexValid && (
            <p className="text-xs text-destructive">
              Enter a hex color like #3b82f6.
            </p>
          )}
        </div>

        {/* Live preview */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">Preview</Label>
          <div className="rounded-md border border-border p-4 space-y-3">
            <div
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-white"
              style={{ backgroundColor: hexValid ? hex : DEFAULT_COLOR }}
            >
              Header
            </div>
            <button
              type="button"
              className="rounded-md px-3 py-1.5 text-sm font-medium text-white"
              style={{ backgroundColor: hexValid ? hex : DEFAULT_COLOR }}
            >
              Sample button
            </button>
          </div>
        </div>

        {editable && (
          <Button onClick={handleSave} disabled={saving || uploading || !hexValid}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? 'Saving…' : 'Save Branding'}
          </Button>
        )}

        <UpgradeDialog
          open={showUpgrade}
          onOpenChange={setShowUpgrade}
          featureName="Custom Branding"
          subscription={null}
        />
      </CardContent>
    </Card>
  );
}
