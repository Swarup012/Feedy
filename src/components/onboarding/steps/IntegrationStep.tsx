'use client';

import { Label } from '@/components/ui/label';
import { OnboardingData } from '../OnboardingFlow';
import { Plug, Slack, Github, Trello, Check } from 'lucide-react';

interface IntegrationStepProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
}

const integrations = [
  {
    id: 'slack',
    name: 'Slack',
    icon: Slack,
    available: true,
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: Github,
    available: true,
  },
  {
    id: 'jira',
    name: 'Jira',
    icon: Trello,
    available: true,
  },
  {
    id: 'linear',
    name: 'Linear',
    icon: Trello,
    available: false,
  },
];

export function IntegrationStep({ data, onUpdate }: IntegrationStepProps) {
  const selectedIntegrations = data.integrations || [];

  const handleToggleIntegration = (integrationId: string) => {
    const isSelected = selectedIntegrations.includes(integrationId);
    const newIntegrations = isSelected
      ? selectedIntegrations.filter((id) => id !== integrationId)
      : [...selectedIntegrations, integrationId];
    onUpdate({ integrations: newIntegrations });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          Connect your tools
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          const isSelected = selectedIntegrations.includes(integration.id);

          return (
            <div
              key={integration.id}
              onClick={() =>
                integration.available && handleToggleIntegration(integration.id)
              }
              className={`border rounded-lg p-4 transition-all ${
                !integration.available
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer'
              } ${
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50 hover:bg-accent'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Icon className={`h-5 w-5 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                  <Label className="font-medium text-sm cursor-pointer">
                    {integration.name}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  {!integration.available && (
                    <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-md font-medium">
                      Coming Soon
                    </span>
                  )}
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedIntegrations.length > 0 && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">
                {selectedIntegrations.length} integration
                {selectedIntegrations.length > 1 ? 's' : ''} selected
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                We'll help you connect these after onboarding is complete.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
