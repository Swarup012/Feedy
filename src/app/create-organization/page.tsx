'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganization } from '@/context/OrganizationContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Building2, Loader2, ChevronLeft, ChevronRight, Check, Rocket } from 'lucide-react';

const TOTAL_STEPS = 3;

const companySizes = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501+', label: '501+ employees' },
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

const goals = [
  { id: 'collect-feedback', label: 'Collect user feedback' },
  { id: 'build-roadmap', label: 'Build a public roadmap' },
  { id: 'changelog', label: 'Publish changelogs' },
  { id: 'support', label: 'Manage support tickets' },
  { id: 'community', label: 'Build a community' },
  { id: 'other', label: 'Something else' },
];

export default function CreateOrganizationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { createOrganization } = useOrganization();
  const [currentStep, setCurrentStep] = useState(1);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    description: '',
    website: '',
    industry: '',
    company_size: '',
    goals: [] as string[],
  });

  const progress = (currentStep / TOTAL_STEPS) * 100;

  const generateSubdomain = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 63);
  };

  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      name,
      subdomain: generateSubdomain(name),
    }));
  };

  const toggleGoal = (goalId: string) => {
    setFormData(prev => ({
      ...prev,
      goals: prev.goals.includes(goalId)
        ? prev.goals.filter(g => g !== goalId)
        : [...prev.goals, goalId],
    }));
  };

  const handleNext = () => {
    if (currentStep === 1 && !formData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Organization name is required',
        variant: 'destructive',
      });
      return;
    }
    if (currentStep === 1 && formData.subdomain.length < 3) {
      toast({
        title: 'Error',
        description: 'Subdomain must be at least 3 characters',
        variant: 'destructive',
      });
      return;
    }
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setCreating(true);
      await createOrganization(formData);

      toast({
        title: 'Success',
        description: `${formData.name} has been created successfully!`,
      });

      // Redirect happens in createOrganization function
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create organization',
        variant: 'destructive',
      });
      setCreating(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                Set up your workspace
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Tell us about your organization
              </p>
            </div>

            <div className="space-y-5">
              {/* Company Name */}
              <div>
                <Label htmlFor="name" className="text-sm font-medium mb-2 block">
                  Organization Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="name"
                  placeholder="Acme Inc"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="h-11"
                />
              </div>

              {/* Subdomain */}
              <div>
                <Label htmlFor="subdomain" className="text-sm font-medium mb-2 block">
                  Subdomain <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="subdomain"
                    placeholder="acme"
                    value={formData.subdomain}
                    onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                    className="h-11"
                    minLength={3}
                    maxLength={63}
                  />
                  <span className="text-sm text-muted-foreground whitespace-nowrap">
                    .faddy.site
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Your workspace URL: {' '}
                  <span className="font-mono text-primary font-medium">
                    {formData.subdomain
                      ? `${formData.subdomain}.faddy.site`
                      : 'your-company.faddy.site'}
                  </span>
                </p>
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description" className="text-sm font-medium mb-2 block">
                  Description{' '}
                  <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="What does your organization do?"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                Organization details
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Help us personalize your experience
              </p>
            </div>

            <div className="space-y-5">
              {/* Industry */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Industry{' '}
                  <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                </Label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) => setFormData({ ...formData, industry: value })}
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

              {/* Company Size */}
              <div>
                <Label className="text-sm font-medium mb-2 block">
                  Company Size{' '}
                  <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                </Label>
                <Select
                  value={formData.company_size}
                  onValueChange={(value) => setFormData({ ...formData, company_size: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select company size" />
                  </SelectTrigger>
                  <SelectContent>
                    {companySizes.map((size) => (
                      <SelectItem key={size.value} value={size.value}>
                        {size.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Website */}
              <div>
                <Label htmlFor="website" className="text-sm font-medium mb-2 block">
                  Website{' '}
                  <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                </Label>
                <Input
                  id="website"
                  type="url"
                  placeholder="https://example.com"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="h-11"
                />
              </div>

              {/* Goals */}
              <div>
                <Label className="text-sm font-medium mb-3 block">
                  What do you want to do with Faddy?{' '}
                  <span className="text-muted-foreground font-normal text-xs">(optional)</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  {goals.map((goal) => {
                    const isSelected = formData.goals.includes(goal.id);
                    return (
                      <div
                        key={goal.id}
                        className={`relative flex items-center space-x-3 border rounded-lg p-3 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50 hover:bg-accent'
                        }`}
                        onClick={() => toggleGoal(goal.id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          className="shrink-0"
                        />
                        <span className="text-sm font-medium">{goal.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Rocket className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                Ready to launch!
              </h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                Your organization <span className="font-semibold text-foreground">{formData.name || 'Acme Inc'}</span> will be
                created at <span className="font-mono text-primary">{formData.subdomain || 'acme'}.faddy.site</span>
              </p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 text-left max-w-sm mx-auto">
              <h3 className="text-sm font-medium mb-3">Summary</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex justify-between">
                  <span>Organization</span>
                  <span className="font-medium text-foreground">{formData.name || '—'}</span>
                </li>
                <li className="flex justify-between">
                  <span>Subdomain</span>
                  <span className="font-mono text-foreground">{formData.subdomain || '—'}</span>
                </li>
                {formData.industry && (
                  <li className="flex justify-between">
                    <span>Industry</span>
                    <span className="font-medium text-foreground">{formData.industry}</span>
                  </li>
                )}
                {formData.company_size && (
                  <li className="flex justify-between">
                    <span>Size</span>
                    <span className="font-medium text-foreground">{formData.company_size}</span>
                  </li>
                )}
                {formData.goals.length > 0 && (
                  <li className="flex justify-between">
                    <span>Goals</span>
                    <span className="font-medium text-foreground">{formData.goals.length} selected</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-2xl bg-background rounded-lg border shadow-sm overflow-hidden flex flex-col">
        {/* Progress Bar */}
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground">
              Step {currentStep} of {TOTAL_STEPS}
            </span>
            <span className="text-xs text-muted-foreground">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {renderStep()}
        </div>

        {/* Navigation Footer */}
        <div className="border-t px-6 py-4 bg-muted/30">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1 || creating}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <div className="flex gap-2">
              {currentStep < TOTAL_STEPS ? (
                <Button onClick={handleNext}>
                  Continue
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={creating}>
                  {creating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Create Organization
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
