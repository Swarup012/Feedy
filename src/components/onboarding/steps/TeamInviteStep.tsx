'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OnboardingData } from '../OnboardingFlow';
import { UserPlus, Mail, X, Users } from 'lucide-react';

interface TeamInviteStepProps {
  data: OnboardingData;
  onUpdate: (data: Partial<OnboardingData>) => void;
}

export function TeamInviteStep({ data, onUpdate }: TeamInviteStepProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const invites = data.teamInvites || [];

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleAddEmail = () => {
    setError('');

    if (!email.trim()) {
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (invites.includes(email.toLowerCase())) {
      setError('This email is already added');
      return;
    }

    onUpdate({
      teamInvites: [...invites, email.toLowerCase()],
    });
    setEmail('');
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    onUpdate({
      teamInvites: invites.filter((e) => e !== emailToRemove),
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddEmail();
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          Invite your team
        </h2>
      </div>

      <div className="space-y-5">
        {/* Email Input */}
        <div>
          <Label htmlFor="email-invite" className="text-sm font-medium mb-2 block">
            Email Addresses
          </Label>
          <div className="flex space-x-2">
            <div className="flex-1">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email-invite"
                  type="email"
                  placeholder="teammate@acme.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError('');
                  }}
                  onKeyPress={handleKeyPress}
                  className="h-11 pl-10"
                />
              </div>
              {error && (
                <p className="text-xs text-destructive mt-2">{error}</p>
              )}
            </div>
            <Button
              type="button"
              onClick={handleAddEmail}
              disabled={!email.trim()}
              className="h-11 px-5"
            >
              Add
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter or click Add to include the email
          </p>
        </div>

        {/* Invited Emails List */}
        {invites.length > 0 && (
          <div className="border rounded-lg p-4 bg-muted/30">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium">
                Team Members ({invites.length})
              </Label>
            </div>
            <div className="space-y-2">
              {invites.map((invitedEmail) => (
                <div
                  key={invitedEmail}
                  className="flex items-center justify-between bg-background border rounded-lg p-3 group"
                >
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{invitedEmail}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveEmail(invitedEmail)}
                    className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
