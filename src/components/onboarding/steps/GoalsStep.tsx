'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { OnboardingData } from '../OnboardingFlow';
import { Target, TrendingUp, Users, Lightbulb, MessageSquare, BarChart } from 'lucide-react';

interface GoalsStepProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
}

const goals = [
  {
    id: 'collect-feedback',
    label: 'Collect customer feedback',
    description: 'Gather insights from users and customers',
    icon: MessageSquare,
  },
  {
    id: 'prioritize-features',
    label: 'Prioritize feature requests',
    description: 'Decide what to build next based on user demand',
    icon: TrendingUp,
  },
  {
    id: 'manage-roadmap',
    label: 'Manage product roadmap',
    description: 'Plan and communicate your product vision',
    icon: Target,
  },
  {
    id: 'engage-users',
    label: 'Engage with users',
    description: 'Build a community around your product',
    icon: Users,
  },
  {
    id: 'track-ideas',
    label: 'Track internal ideas',
    description: 'Centralize team ideas and discussions',
    icon: Lightbulb,
  },
  {
    id: 'analyze-trends',
    label: 'Analyze feedback trends',
    description: 'Understand patterns in user requests',
    icon: BarChart,
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
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Target className="h-8 w-8 text-purple-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          What are your goals?
        </h2>
        <p className="text-gray-600">
          Select all that apply - we'll customize your experience
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((goal) => {
          const Icon = goal.icon;
          const isChecked = (data.goals || []).includes(goal.id);

          return (
            <div
              key={goal.id}
              onClick={() => handleToggle(goal.id)}
              className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                isChecked
                  ? 'border-purple-500 bg-purple-50'
                  : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
              }`}
            >
              <div className="flex items-start space-x-3">
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={() => handleToggle(goal.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <Icon className="h-5 w-5 text-purple-600" />
                    <Label className="font-semibold cursor-pointer">
                      {goal.label}
                    </Label>
                  </div>
                  <p className="text-sm text-gray-600">{goal.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {(data.goals?.length || 0) > 0 && (
        <div className="text-center text-sm text-gray-600 mt-4">
          {data.goals!.length} goal{data.goals!.length > 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
}
