'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { TokenManager } from '@/lib/tokenManager';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

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
}

const TOTAL_STEPS = 6; // Removed role selection step (now handled in post-auth modal)

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
      
      // Generate subdomain from company name if not provided
      const subdomain = data.companyName
        ? data.companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        : undefined;
      
      const onboardingPayload = {
        ...data,
        subdomain, // Pass generated subdomain
      };
      
      const response = await fetch('/api/users/onboarding/complete', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(onboardingPayload),
      });

      if (!response.ok) {
        throw new Error('Failed to complete onboarding');
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">Welcome to Fady!</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4 mr-2" />
              Skip
            </Button>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Step {currentStep} of {TOTAL_STEPS}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2 bg-white/30" />
          </div>
        </div>

        {/* Step Content */}
        <div className="p-8">
          {renderStep()}
        </div>

        {/* Navigation Footer */}
        <div className="border-t bg-gray-50 p-6 flex items-center justify-between">
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
                  <Button variant="ghost" onClick={() => setCurrentStep(currentStep + 1)}>
                    Skip this step
                  </Button>
                )}
                <Button onClick={handleNext}>
                  Continue
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </>
            ) : (
              <Button onClick={completeOnboarding} disabled={loading}>
                {loading ? 'Finishing...' : 'Start Using Fady'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
