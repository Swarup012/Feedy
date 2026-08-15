'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { OnboardingData } from '../OnboardingFlow';
import { Folder, Globe, Lock, Info } from 'lucide-react';

interface CreateBoardStepProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
}

const visibilityOptions = [
  {
    value: 'public',
    label: 'Public',
    description: 'Anyone can view and submit feedback',
    icon: Globe,
    recommended: true,
  },
  {
    value: 'private',
    label: 'Private',
    description: 'Only invited team members can access',
    icon: Lock,
    recommended: false,
  },
];

export function CreateBoardStep({ data, onUpdate }: CreateBoardStepProps) {
  const [nameError, setNameError] = useState('');

  const handleNameChange = (name: string) => {
    setNameError('');
    onUpdate({
      firstBoard: {
        ...data.firstBoard,
        name,
      },
    });
  };

  const handleDescriptionChange = (description: string) => {
    onUpdate({
      firstBoard: {
        ...data.firstBoard,
        description,
      },
    });
  };

  const handleVisibilityChange = (visibility: 'public' | 'private') => {
    onUpdate({
      firstBoard: {
        ...data.firstBoard,
        visibility,
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="text-center mb-5">
        <div className="w-16 h-16 bg-warning/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Folder className="h-8 w-8 text-warning" />
        </div>
        <h2 className="text-xl font-bold text-foreground mb-2">
          Create your first board
        </h2>
        <p className="text-muted-foreground">
          Boards help you organize feedback by product, feature, or category
        </p>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-foreground font-medium">
              Quick tip
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Most teams start with a general "Feature Requests" board. You can create more boards later for specific products or categories.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {/* Board Name */}
        <div>
          <Label htmlFor="board-name" className="text-base font-medium">
            Board Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="board-name"
            placeholder="Feature Requests"
            value={data.firstBoard?.name || ''}
            onChange={(e) => handleNameChange(e.target.value)}
            className="mt-2"
          />
          {nameError && (
            <p className="text-sm text-destructive mt-1">{nameError}</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">
            This will create a URL:{' '}
            <span className="font-mono text-primary">
              {data.firstBoard?.name
                ? `/board/${data.firstBoard.name.toLowerCase().replace(/\s+/g, '-')}`
                : '/board/your-board'}
            </span>
          </p>
        </div>

        {/* Board Description */}
        <div>
          <Label htmlFor="board-description" className="text-base font-medium">
            Description{' '}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Textarea
            id="board-description"
            placeholder="Share your ideas and vote on features you'd like to see"
            value={data.firstBoard?.description || ''}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            className="mt-2 min-h-[100px]"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Helps users understand what kind of feedback to submit
          </p>
        </div>

        {/* Visibility */}
        <div>
          <Label className="text-base font-medium mb-3 block">
            Board Visibility
          </Label>
          <RadioGroup
            value={data.firstBoard?.visibility || 'public'}
            onValueChange={(value: 'public' | 'private') =>
              handleVisibilityChange(value)
            }
            className="space-y-3"
          >
            {visibilityOptions.map((option) => {
              const Icon = option.icon;
              return (
                <div
                  key={option.value}
                  className={`border-2 rounded-lg p-4 hover:bg-warning/5 transition-all ${
                    data.firstBoard?.visibility === option.value
                      ? 'border-warning bg-warning/5'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem
                      value={option.value}
                      id={`visibility-${option.value}`}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Icon className="h-5 w-5 text-warning" />
                        <Label
                          htmlFor={`visibility-${option.value}`}
                          className="font-semibold cursor-pointer"
                        >
                          {option.label}
                          {option.recommended && (
                            <span className="ml-2 text-xs bg-success/10 text-success px-2 py-0.5 rounded">
                              Recommended
                            </span>
                          )}
                        </Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </RadioGroup>
        </div>
      </div>
    </div>
  );
}
