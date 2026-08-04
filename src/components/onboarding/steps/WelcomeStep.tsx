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
    <div className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-foreground">
          Welcome to Faddy
        </h2>
        <p className="text-muted-foreground">
          Let's get you set up in just a few steps
        </p>
      </div>

      <div className="space-y-4">
        <Label className="text-sm font-medium">
          What's your role?
        </Label>
        <RadioGroup
          value={data.role}
          onValueChange={(value) => onUpdate({ role: value })}
          className="space-y-2"
        >
          {roles.map((role) => {
            const Icon = role.icon;
            const isSelected = data.role === role.value;
            return (
              <div
                key={role.value}
                className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-all ${
                  isSelected 
                    ? 'border-primary bg-primary/5' 
                    : 'border-border hover:border-primary/50 hover:bg-accent'
                }`}
              >
                <RadioGroupItem value={role.value} id={role.value} />
                <div className="flex items-center gap-3 flex-1">
                  <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <Label
                    htmlFor={role.value}
                    className="text-sm font-medium cursor-pointer flex-1"
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
