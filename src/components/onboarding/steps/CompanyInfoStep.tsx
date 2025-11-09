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
import { Building2 } from 'lucide-react';

interface CompanyInfoStepProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
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

export function CompanyInfoStep({ data, onUpdate }: CompanyInfoStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Let's set up your workspace! 🚀
        </h2>
        <p className="text-gray-600">
          Tell us about your company to get started
        </p>
      </div>

      <div className="space-y-5">
        {/* Company Name */}
        <div>
          <Label htmlFor="company-name" className="text-base font-medium">
            Company Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="company-name"
            placeholder="Acme Inc."
            value={data.companyName || ''}
            onChange={(e) => onUpdate({ companyName: e.target.value })}
            className="mt-2"
          />
          <p className="text-sm text-gray-500 mt-1">
            We'll create your workspace:{' '}
            <span className="font-mono text-blue-600">
              {data.companyName
                ? `${data.companyName.toLowerCase().replace(/\s+/g, '-')}.fady.com`
                : 'your-company.fady.com'}
            </span>
          </p>
        </div>

        {/* Company Size */}
        <div>
          <Label className="text-base font-medium mb-3 block">
            Company Size
          </Label>
          <RadioGroup
            value={data.companySize}
            onValueChange={(value) => onUpdate({ companySize: value })}
            className="grid grid-cols-2 gap-3"
          >
            {companySizes.map((size) => (
              <div
                key={size.value}
                className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-gray-50"
              >
                <RadioGroupItem value={size.value} id={`size-${size.value}`} />
                <Label
                  htmlFor={`size-${size.value}`}
                  className="cursor-pointer flex-1 text-sm"
                >
                  {size.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Industry */}
        <div>
          <Label htmlFor="industry" className="text-base font-medium">
            Industry
          </Label>
          <Select
            value={data.industry}
            onValueChange={(value) => onUpdate({ industry: value })}
          >
            <SelectTrigger className="mt-2">
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
          <Label htmlFor="website" className="text-base font-medium">
            Company Website{' '}
            <span className="text-gray-400 font-normal">(optional)</span>
          </Label>
          <Input
            id="website"
            type="url"
            placeholder="https://acme.com"
            value={data.companyWebsite || ''}
            onChange={(e) => onUpdate({ companyWebsite: e.target.value })}
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );
}
