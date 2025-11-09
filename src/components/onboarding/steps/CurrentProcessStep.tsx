'use client';

import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { OnboardingData } from '../OnboardingFlow';
import { Workflow, Mail, FileText, MessageCircle, ClipboardList } from 'lucide-react';

interface CurrentProcessStepProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
}

const processes = [
  {
    value: 'email',
    label: 'Email',
    description: 'Collecting feedback via email threads',
    icon: Mail,
  },
  {
    value: 'spreadsheet',
    label: 'Spreadsheets',
    description: 'Tracking in Google Sheets or Excel',
    icon: FileText,
  },
  {
    value: 'slack',
    label: 'Slack/Teams',
    description: 'Managing in chat channels',
    icon: MessageCircle,
  },
  {
    value: 'jira',
    label: 'Jira/Linear',
    description: 'Using project management tools',
    icon: ClipboardList,
  },
  {
    value: 'other-tool',
    label: 'Other tool',
    description: 'Using a different feedback tool',
    icon: Workflow,
  },
  {
    value: 'none',
    label: 'No formal process',
    description: 'Starting fresh with feedback management',
    icon: Workflow,
  },
];

export function CurrentProcessStep({ data, onUpdate }: CurrentProcessStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Workflow className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          How do you currently manage feedback?
        </h2>
        <p className="text-gray-600">
          Understanding your current process helps us provide better guidance
        </p>
      </div>

      <div className="space-y-5">
        {/* Process Selection */}
        <div>
          <Label className="text-base font-medium mb-3 block">
            Current Process
          </Label>
          <RadioGroup
            value={data.currentProcess}
            onValueChange={(value) => onUpdate({ currentProcess: value })}
            className="grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            {processes.map((process) => {
              const Icon = process.icon;
              return (
                <div
                  key={process.value}
                  className={`border-2 rounded-lg p-4 hover:bg-green-50 transition-all ${
                    data.currentProcess === process.value
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem
                      value={process.value}
                      id={`process-${process.value}`}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Icon className="h-5 w-5 text-green-600" />
                        <Label
                          htmlFor={`process-${process.value}`}
                          className="font-semibold cursor-pointer"
                        >
                          {process.label}
                        </Label>
                      </div>
                      <p className="text-sm text-gray-600">
                        {process.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </RadioGroup>
        </div>

        {/* Additional Details (Optional) */}
        <div>
          <Label htmlFor="process-details" className="text-base font-medium">
            Tell us more{' '}
            <span className="text-gray-400 font-normal">(optional)</span>
          </Label>
          <Textarea
            id="process-details"
            placeholder="Any challenges or specific workflows you'd like to improve?"
            value={data.processDetails || ''}
            onChange={(e) => onUpdate({ processDetails: e.target.value })}
            className="mt-2 min-h-[120px]"
          />
          <p className="text-sm text-gray-500 mt-1">
            This helps us provide personalized recommendations
          </p>
        </div>
      </div>
    </div>
  );
}
