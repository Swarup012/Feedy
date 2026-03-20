'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { TokenManager } from '@/lib/tokenManager';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Logo } from '@/components/logo';

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
      alert('Please enter your company name to continue');
      return;
    }
    
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
      // Save progress to backend
      await saveProgress(currentStep + 1);
    } else {
      // Final step - complete onboarding
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
      const token = TokenManager.getAccessToken();
      await fetch('/api/users/onboarding/progress', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ step, data }),
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  const completeOnboarding = async () => {
    try {
      setLoading(true);
      const token = TokenManager.getAccessToken();
      
      console.log('🔑 Token from TokenManager:', token ? `${token.substring(0, 20)}...` : 'null');
      console.log('🔑 Token from localStorage direct:', localStorage.getItem('token') ? 'exists' : 'null');
      
      if (!token) {
        throw new Error('No authentication token found. Please log in again.');
      }
      
      // Generate subdomain from company name if not provided
      const subdomain = data.companyName
        ? data.companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        : undefined;
      
      const onboardingPayload = {
        ...data,
        subdomain, // Pass generated subdomain
      };
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/onboarding/complete`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(onboardingPayload),
      });

      console.log('📡 Onboarding complete response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Onboarding failed:', errorText);
        throw new Error(`Failed to complete onboarding: ${response.status} - ${errorText}`);
      }

      // IMPORTANT: Refresh user data to get updated organization_role = 'owner'
      console.log('🔄 Refreshing user data after onboarding...');
      
      try {
        // Use AuthContext's refreshUser to update user state and localStorage
        await refreshUser();
        console.log('✅ User data refreshed with organization role');
      } catch (error) {
        console.error('⚠️ Failed to refresh user data:', error);
        // Continue anyway, user will be refreshed on next page load
      }

      // Small delay to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 200));

      router.push('/admin');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <CompanyInfoStep data={data} onUpdate={updateData} />;
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
            {/* Policy Acceptance - Show on last step */}
            {currentStep === TOTAL_STEPS && (
              <div className="mb-4 pb-4 border-b border-gray-200">
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
                    className="text-sm text-gray-600 leading-relaxed cursor-pointer"
                  >
                    I agree to the{' '}
                    <Link 
                      href="/policy/terms" 
                      target="_blank"
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Terms of Service
                    </Link>{' '}
                    and{' '}
                    <Link 
                      href="/policy/privacy" 
                      target="_blank"
                      className="text-blue-600 hover:underline font-medium"
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
