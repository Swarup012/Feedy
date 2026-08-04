'use client';

import { OnboardingData } from '../OnboardingFlow';
import { CheckCircle } from 'lucide-react';

interface SuccessStepProps {
  data: OnboardingData;
}

export function SuccessStep({ data }: SuccessStepProps) {
  return (
    <div className="space-y-5">
      {/* Success Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-10 w-10 text-primary" strokeWidth={2} />
        </div>
        <h2 className="text-2xl font-semibold text-foreground">
          You're all set!
        </h2>
      </div>

      {/* Summary Cards - Company and Goals Only */}
      <div className="grid grid-cols-2 gap-3">
        {/* Company Card */}
        <div className="border rounded-lg p-4 text-center bg-muted/30">
          <p className="text-xs text-muted-foreground mb-1 font-medium">Company</p>
          <p className="text-sm font-semibold">{data.companyName || 'Not specified'}</p>
        </div>

        {/* Goals Card */}
        <div className="border rounded-lg p-4 text-center bg-muted/30">
          <p className="text-xs text-muted-foreground mb-1 font-medium">Goals</p>
          <p className="text-sm font-semibold">{(data.goals || []).length} selected</p>
        </div>
      </div>
    </div>
  );
}
