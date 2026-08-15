'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';

// Import step components
import { CompanyInfoStep } from './steps/CompanyInfoStep';
import { GoalsStep } from './steps/GoalsStep';
import { CurrentProcessStep } from './steps/CurrentProcessStep';
import { TeamInviteStep } from './steps/TeamInviteStep';
import { IntegrationStep } from './steps/IntegrationStep';
import { SuccessStep } from './steps/SuccessStep';

export interface OnboardingData {
  role?: string;
  companyName?: string;
  companySize?: string;
  industry?: string;
  companyWebsite?: string;
  goals?: string[];
  currentProcess?: string;
  processDetails?: string;
  teamInvites?: string[];
  integrations?: string[];
  firstBoard?: {
    name: string;
    description: string;
    visibility: 'public' | 'private';
  };
  acceptedPolicies?: boolean;
}

const TOTAL_STEPS = 6;

export default function OnboardingFlow() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<OnboardingData>({});
  const [loading, setLoading] = useState(false);
  const [companyNameError, setCompanyNameError] = useState<string | null>(null);
  const [onboardingError, setOnboardingError] = useState<string | null>(null);

  // Check if user already completed onboarding
  useEffect(() => {
    if (user?.onboarding_completed) {
      router.push('/admin');
    }
  }, [user, router]);

  const progress = (currentStep / TOTAL_STEPS) * 100;

  const updateData = (stepData: Partial<OnboardingData>) => {
    setData({ ...data, ...stepData });
  };

  const handleNext = async () => {
    // Validate step 1 - Company name is required
    if (currentStep === 1 && !data.companyName?.trim()) {
      setCompanyNameError('Company name is required to continue');
      return;
    }
    setCompanyNameError(null);
    setOnboardingError(null);
    
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
      await saveProgress(currentStep + 1);
    } else {
      await completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
  };

  const saveProgress = async (step: number) => {
    try {
      // api client sends the HttpOnly cookie automatically — no token needed
      await api.post('/api/users/onboarding/progress', { step, data });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  const completeOnboarding = async () => {
    try {
      setLoading(true);
      setOnboardingError(null);

      const subdomain = data.companyName
        ? data.companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        : undefined;

      const onboardingPayload = {
        ...data,
        subdomain,
      };

      await api.post('/api/users/onboarding/complete', onboardingPayload);

      try {
        await refreshUser();
      } catch {
        // Non-critical — user data will sync on next page load
      }

      await new Promise(resolve => setTimeout(resolve, 200));
      router.push('/admin');
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : 'Something went wrong. Please try again.';
      setOnboardingError(message);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <CompanyInfoStep data={data} onUpdate={(d) => { setCompanyNameError(null); updateData(d); }} companyNameError={companyNameError} />;
      case 2:
        return <GoalsStep data={data} onUpdate={updateData} />;
      case 3:
        return <CurrentProcessStep data={data} onUpdate={updateData} />;
      case 4:
        return <TeamInviteStep data={data} onUpdate={updateData} />;
      case 5:
        return <IntegrationStep data={data} onUpdate={updateData} />;
      case 6:
        return <SuccessStep data={data} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 md:p-8">
      {/* Container */}
      <div className="w-full max-w-2xl bg-background rounded-lg border shadow-sm overflow-hidden flex flex-col">
        
        {/* Form Section */}
        <div className="w-full flex flex-col">
          {/* Progress Bar */}
          <div className="px-6 pt-6 pb-2">
            <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Step Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {renderStep()}
          </div>

          {/* Navigation Footer */}
          <div className="border-t px-6 py-4 bg-muted/30">
            {/* Onboarding Error */}
            {onboardingError && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-destructive font-medium">Failed to complete onboarding</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{onboardingError}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={completeOnboarding}
                  disabled={loading}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-3"
                >
                  Retry
                </Button>
              </div>
            )}

            {/* Policy Acceptance - Show on last step */}
            {currentStep === TOTAL_STEPS && (
              <div className="mb-4 pb-4 border-b border-border">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="policy-acceptance"
                    checked={data.acceptedPolicies || false}
                    onCheckedChange={(checked) => 
                      setData({ ...data, acceptedPolicies: checked as boolean })
                    }
                    className="mt-1"
                  />
                  <label 
                    htmlFor="policy-acceptance" 
                    className="text-sm text-muted-foreground leading-relaxed cursor-pointer"
                  >
                    I agree to the{' '}
                    <Link 
                      href="/policy/terms" 
                      target="_blank"
                      className="text-primary hover:underline font-medium"
                    >
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link 
                      href="/policy/privacy" 
                      target="_blank"
                      className="text-primary hover:underline font-medium"
                    >
                      Privacy Policy
                    </Link>
                  </label>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              <div className="flex gap-2">
                {currentStep < TOTAL_STEPS ? (
                  <>
                    {currentStep >= 3 && (
                      <Button 
                        variant="ghost" 
                        onClick={() => setCurrentStep(currentStep + 1)}
                      >
                        Skip
                      </Button>
                    )}
                    <Button 
                      onClick={handleNext}
                    >
                      Continue
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  </>
                ) : (
                  <Button 
                    onClick={completeOnboarding} 
                    disabled={loading || !data.acceptedPolicies}
                  >
                    {loading ? 'Finishing...' : 'Start Using Faddy'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
