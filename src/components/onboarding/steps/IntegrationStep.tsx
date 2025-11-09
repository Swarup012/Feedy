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
    description: 'Get notified about new feedback in your Slack workspace',
    icon: Slack,
    iconColor: 'text-purple-600',
    bgColor: 'bg-purple-100',
    available: true,
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'Sync feedback with GitHub issues and pull requests',
    icon: Github,
    iconColor: 'text-gray-800',
    bgColor: 'bg-gray-100',
    available: true,
  },
  {
    id: 'jira',
    name: 'Jira',
    description: 'Create and link Jira tickets from feedback items',
    icon: Trello,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-100',
    available: true,
  },
  {
    id: 'linear',
    name: 'Linear',
    description: 'Sync feedback with Linear issues',
    icon: Trello,
    iconColor: 'text-indigo-600',
    bgColor: 'bg-indigo-100',
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
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Plug className="h-8 w-8 text-cyan-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Connect your tools
        </h2>
        <p className="text-gray-600">
          Integrate with your existing workflow (you can set this up later too)
        </p>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <Plug className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="text-sm text-amber-900 font-medium">
              Optional step
            </p>
            <p className="text-sm text-amber-700 mt-1">
              You can skip this for now and set up integrations later from your settings.
              We'll guide you through the setup process.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {integrations.map((integration) => {
          const Icon = integration.icon;
          const isSelected = selectedIntegrations.includes(integration.id);

          return (
            <div
              key={integration.id}
              onClick={() =>
                integration.available && handleToggleIntegration(integration.id)
              }
              className={`border-2 rounded-lg p-5 transition-all ${
                !integration.available
                  ? 'opacity-50 cursor-not-allowed'
                  : 'cursor-pointer'
              } ${
                isSelected
                  ? 'border-cyan-500 bg-cyan-50'
                  : 'border-gray-200 hover:border-cyan-300 hover:bg-cyan-50/50'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`${integration.bgColor} p-3 rounded-lg flex-shrink-0`}>
                  <Icon className={`h-6 w-6 ${integration.iconColor}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="font-semibold text-base cursor-pointer">
                      {integration.name}
                    </Label>
                    {isSelected && (
                      <div className="bg-cyan-500 rounded-full p-1">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                    {!integration.available && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                        Coming Soon
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {integration.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {selectedIntegrations.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
          <div className="flex items-start space-x-3">
            <Check className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm text-green-900 font-medium">
                {selectedIntegrations.length} integration
                {selectedIntegrations.length > 1 ? 's' : ''} selected
              </p>
              <p className="text-sm text-green-700 mt-1">
                We'll help you connect these after onboarding is complete.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
