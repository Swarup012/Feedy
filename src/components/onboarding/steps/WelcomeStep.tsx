'use client';

import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { OnboardingData } from '../OnboardingFlow';
import { Briefcase, Users, Code, Palette, Headphones, TrendingUp, MoreHorizontal } from 'lucide-react';

interface WelcomeStepProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
}

const roles = [
  { value: 'product_manager', label: 'Product Manager', icon: Briefcase },
  { value: 'founder', label: 'Founder/CEO', icon: TrendingUp },
  { value: 'engineering', label: 'Engineering Lead', icon: Code },
  { value: 'designer', label: 'Designer', icon: Palette },
  { value: 'support', label: 'Customer Success/Support', icon: Headphones },
  { value: 'marketing', label: 'Marketing', icon: TrendingUp },
  { value: 'other', label: 'Other', icon: MoreHorizontal },
];

export function WelcomeStep({ data, onUpdate }: WelcomeStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to Fady! 👋
        </h2>
        <p className="text-gray-600">
          Let's get you set up in just a few steps
        </p>
      </div>

      <div>
        <Label className="text-lg font-semibold mb-4 block">
          What's your role?
        </Label>
        <RadioGroup
          value={data.role}
          onValueChange={(value) => onUpdate({ role: value })}
          className="space-y-3"
        >
          {roles.map((role) => {
            const Icon = role.icon;
            return (
              <div
                key={role.value}
                className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <RadioGroupItem value={role.value} id={role.value} />
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <Label
                    htmlFor={role.value}
                    className="text-base font-medium cursor-pointer flex-1"
                  >
                    {role.label}
                  </Label>
                </div>
              </div>
            );
          })}
        </RadioGroup>
      </div>
    </div>
  );
}
