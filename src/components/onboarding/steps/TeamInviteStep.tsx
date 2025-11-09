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
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserPlus className="h-8 w-8 text-indigo-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Invite your team
        </h2>
        <p className="text-gray-600">
          Collaborate better by inviting teammates to join your workspace
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start space-x-3">
          <Users className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm text-blue-900 font-medium">
              Better together
            </p>
            <p className="text-sm text-blue-700 mt-1">
              Teams using feedback tools together see 3x higher adoption rates.
              You can always invite more people later.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Email Input */}
        <div>
          <Label htmlFor="email-invite" className="text-base font-medium">
            Email Addresses
          </Label>
          <div className="flex space-x-2 mt-2">
            <div className="flex-1">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
                  className="pl-10"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 mt-1">{error}</p>
              )}
            </div>
            <Button
              type="button"
              onClick={handleAddEmail}
              disabled={!email.trim()}
            >
              Add
            </Button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Press Enter or click Add to include the email
          </p>
        </div>

        {/* Invited Emails List */}
        {invites.length > 0 && (
          <div className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-medium text-gray-700">
                Team Members ({invites.length})
              </Label>
            </div>
            <div className="space-y-2">
              {invites.map((invitedEmail) => (
                <div
                  key={invitedEmail}
                  className="flex items-center justify-between bg-white border rounded-lg p-3"
                >
                  <div className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{invitedEmail}</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveEmail(invitedEmail)}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {invites.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">No team members added yet</p>
            <p className="text-xs mt-1">You can skip this step and invite people later</p>
          </div>
        )}
      </div>
    </div>
  );
}
