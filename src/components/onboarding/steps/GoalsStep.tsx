'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { OnboardingData } from '../OnboardingFlow';
import { CheckCircle } from 'lucide-react';

interface GoalsStepProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
}

const goals = [
  {
    id: 'collect-feedback',
    label: 'Collect customer feedback',
  },
  {
    id: 'prioritize-features',
    label: 'Prioritize feature requests',
  },
  {
    id: 'manage-roadmap',
    label: 'Manage product roadmap',
  },
  {
    id: 'engage-users',
    label: 'Engage with users',
  },
  {
    id: 'track-ideas',
    label: 'Track internal ideas',
  },
  {
    id: 'analyze-trends',
    label: 'Analyze feedback trends',
  },
];

export function GoalsStep({ data, onUpdate }: GoalsStepProps) {
  const handleToggle = (goalId: string) => {
    const currentGoals = data.goals || [];
    const newGoals = currentGoals.includes(goalId)
      ? currentGoals.filter((id) => id !== goalId)
      : [...currentGoals, goalId];
    onUpdate({ goals: newGoals });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          What are your goals?
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {goals.map((goal) => {
          const isChecked = (data.goals || []).includes(goal.id);

          return (
            <div
              key={goal.id}
              onClick={() => handleToggle(goal.id)}
              className={`border rounded-lg p-3 cursor-pointer transition-all ${
                isChecked
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-accent'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <Label className="font-medium text-sm cursor-pointer flex-1">
                  {goal.label}
                </Label>
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => handleToggle(goal.id)}
                  className="shrink-0"
                />
              </div>
            </div>
          );
        })}
      </div>

      {(data.goals?.length || 0) > 0 && (
        <div className="flex items-center justify-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
          <CheckCircle className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {data.goals!.length} goal{data.goals!.length > 1 ? 's' : ''} selected
          </span>
        </div>
      )}
    </div>
  );
}
