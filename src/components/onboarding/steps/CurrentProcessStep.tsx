'use client';

import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { OnboardingData } from '../OnboardingFlow';

interface CurrentProcessStepProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
}

const processes = [
  {
    value: 'email',
    label: 'Email',
  },
  {
    value: 'spreadsheet',
    label: 'Spreadsheets',
  },
  {
    value: 'slack',
    label: 'Slack/Teams',
  },
  {
    value: 'jira',
    label: 'Jira/Linear',
  },
  {
    value: 'other-tool',
    label: 'Other tool',
  },
  {
    value: 'none',
    label: 'No formal process',
  },
];

export function CurrentProcessStep({ data, onUpdate }: CurrentProcessStepProps) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          How do you currently manage feedback?
        </h2>
      </div>

      <div className="space-y-4">
        {/* Process Selection */}
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Current Process
          </Label>
          <RadioGroup
            value={data.currentProcess}
            onValueChange={(value) => onUpdate({ currentProcess: value })}
            className="grid grid-cols-1 md:grid-cols-2 gap-2"
          >
            {processes.map((process) => {
              const isSelected = data.currentProcess === process.value;
              return (
                <div
                  key={process.value}
                  className={`border rounded-lg p-3 cursor-pointer transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-accent'
                  }`}
                  onClick={() => onUpdate({ currentProcess: process.value })}
                >
                  <div className="flex items-center space-x-3">
                    <RadioGroupItem
                      value={process.value}
                      id={`process-${process.value}`}
                      className="shrink-0"
                    />
                    <Label
                      htmlFor={`process-${process.value}`}
                      className="font-medium text-sm cursor-pointer flex-1"
                    >
                      {process.label}
                    </Label>
                  </div>
                </div>
              );
            })}
          </RadioGroup>
        </div>

        {/* Additional Details (Optional) */}
        <div>
          <Label htmlFor="process-details" className="text-sm font-medium mb-2 block">
            Tell us more{' '}
            <span className="text-muted-foreground font-normal text-xs">(optional)</span>
          </Label>
          <Textarea
            id="process-details"
            placeholder="Any challenges or specific workflows you'd like to improve?"
            value={data.processDetails || ''}
            onChange={(e) => onUpdate({ processDetails: e.target.value })}
            className="min-h-[120px] resize-none"
          />
          <p className="text-xs text-muted-foreground mt-2">
            This helps us provide personalized recommendations
          </p>
        </div>
      </div>
    </div>
  );
}
