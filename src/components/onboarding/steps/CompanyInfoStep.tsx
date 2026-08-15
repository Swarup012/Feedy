'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { OnboardingData } from '../OnboardingFlow';
import { useState, useEffect, useCallback } from 'react';
import { Check, X, Loader2, AlertCircle } from 'lucide-react';
import api from '@/lib/api';

interface CompanyInfoStepProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
  companyNameError?: string | null;
}

const companySizes = [
  { value: '1', label: 'Just me (1)' },
  { value: '2-10', label: '2-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-1000', label: '201-1000 employees' },
  { value: '1000+', label: '1000+ employees' },
];

const industries = [
  'SaaS/Software',
  'E-commerce',
  'Fintech',
  'Healthcare',
  'Education',
  'Marketing/Agency',
  'Consulting',
  'Manufacturing',
  'Real Estate',
  'Other',
];

export function CompanyInfoStep({ data, onUpdate, companyNameError }: CompanyInfoStepProps) {
  const [subdomainStatus, setSubdomainStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    suggestedSubdomain: string | null;
  }>({
    checking: false,
    available: null,
    suggestedSubdomain: null,
  });

  // Debounced subdomain check
  const checkSubdomain = useCallback(async (companyName: string) => {
    if (!companyName || companyName.trim().length === 0) {
      setSubdomainStatus({ checking: false, available: null, suggestedSubdomain: null });
      return;
    }

    const baseSubdomain = companyName
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/^-+|-+$/g, '');

    if (!baseSubdomain || baseSubdomain.length < 3) {
      setSubdomainStatus({ checking: false, available: null, suggestedSubdomain: null });
      return;
    }

    setSubdomainStatus({ checking: true, available: null, suggestedSubdomain: null });

    try {
      const response = await api.get(`/api/organizations/subdomain/${baseSubdomain}/availability`);
      const { available } = response.data.data; // Fixed: response.data.data.available

      if (available) {
        setSubdomainStatus({ checking: false, available: true, suggestedSubdomain: null });
      } else {
        // Generate suggested subdomain with random suffix
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const suggestedSubdomain = `${baseSubdomain}-${randomSuffix}`;
        setSubdomainStatus({ 
          checking: false, 
          available: false, 
          suggestedSubdomain 
        });
      }
    } catch (error) {
      console.error('Error checking subdomain:', error);
      setSubdomainStatus({ checking: false, available: null, suggestedSubdomain: null });
    }
  }, []);

  // Debounce effect (500ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      checkSubdomain(data.companyName || '');
    }, 500);

    return () => clearTimeout(timer);
  }, [data.companyName, checkSubdomain]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          Set up your workspace
        </h2>
      </div>

      <div className="space-y-6">
        {/* Company Name */}
        <div>
          <Label htmlFor="company-name" className="text-sm font-medium mb-2 block">
            Company Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="company-name"
            placeholder="Acme Inc."
            value={data.companyName || ''}
            onChange={(e) => onUpdate({ companyName: e.target.value })}
            className={`h-11 ${companyNameError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
            aria-describedby={companyNameError ? 'company-name-error' : undefined}
            aria-invalid={!!companyNameError}
          />
          {companyNameError && (
            <p id="company-name-error" className="mt-1.5 text-xs text-destructive flex items-center gap-1.5">
              <AlertCircle className="h-3 w-3" />
              {companyNameError}
            </p>
          )}
          
          {/* Subdomain Status */}
          {data.companyName && (
            <div className="mt-2">
              {subdomainStatus.checking ? (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Checking availability...
                </p>
              ) : subdomainStatus.available === true ? (
                <p className="text-xs text-success flex items-center gap-1.5">
                  <Check className="h-3 w-3" />
                  Available: {' '}
                  <span className="font-mono font-medium">
                    {data.companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.faddy.site
                  </span>
                </p>
              ) : subdomainStatus.available === false && subdomainStatus.suggestedSubdomain ? (
                <p className="text-xs text-warning flex items-center gap-1.5">
                  <X className="h-3 w-3" />
                  Taken. You'll get: {' '}
                  <span className="font-mono font-medium">
                    {subdomainStatus.suggestedSubdomain}.faddy.site
                  </span>
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Your workspace: {' '}
                  <span className="font-mono text-primary font-medium">
                    {data.companyName
                      ? `${data.companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.faddy.site`
                      : 'your-company.faddy.site'}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>

        {/* Company Size */}
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Company Size
          </Label>
          <RadioGroup
            value={data.companySize}
            onValueChange={(value) => onUpdate({ companySize: value })}
            className="grid grid-cols-2 gap-2"
          >
            {companySizes.map((size) => {
              const isSelected = data.companySize === size.value;
              return (
                <div
                  key={size.value}
                  className={`relative flex items-center space-x-3 border rounded-lg p-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-accent'
                  }`}
                  onClick={() => onUpdate({ companySize: size.value })}
                >
                  <RadioGroupItem value={size.value} id={`size-${size.value}`} className="shrink-0" />
                  <Label
                    htmlFor={`size-${size.value}`}
                    className="cursor-pointer flex-1 text-sm font-medium"
                  >
                    {size.label}
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </div>

        {/* Industry */}
        <div>
          <Label htmlFor="industry" className="text-sm font-medium mb-2 block">
            Industry
          </Label>
          <Select
            value={data.industry}
            onValueChange={(value) => onUpdate({ industry: value })}
          >
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Select your industry" />
            </SelectTrigger>
            <SelectContent>
              {industries.map((industry) => (
                <SelectItem key={industry} value={industry}>
                  {industry}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Company Website (Optional) */}
        <div>
          <Label htmlFor="website" className="text-sm font-medium mb-2 block">
            Company Website{' '}
            <span className="text-muted-foreground font-normal text-xs">(optional)</span>
          </Label>
          <Input
            id="website"
            type="url"
            placeholder="https://acme.com"
            value={data.companyWebsite || ''}
            onChange={(e) => onUpdate({ companyWebsite: e.target.value })}
            className="h-11"
          />
        </div>
      </div>
    </div>
  );
}
