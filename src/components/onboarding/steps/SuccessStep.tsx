'use client';

import { Button } from '@/components/ui/button';
import { OnboardingData } from '../OnboardingFlow';
import { CheckCircle, ArrowRight, Rocket, Target, Users, Folder } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SuccessStepProps {
  data: OnboardingData;
}

export function SuccessStep({ data }: SuccessStepProps) {
  const router = useRouter();

  const summary = [
    {
      icon: Target,
      label: 'Role',
      value: data.role || 'Not specified',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      icon: Folder,
      label: 'Company',
      value: data.companyName || 'Not specified',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      icon: CheckCircle,
      label: 'Goals',
      value: `${(data.goals || []).length} selected`,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      icon: Users,
      label: 'Team',
      value: `${(data.teamInvites || []).length} invited`,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Success Header */}
      <div className="text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-4xl font-bold text-gray-900 mb-3">
          🎉 You're all set!
        </h2>
        <p className="text-lg text-gray-600">
          Your workspace is ready. Create your first board to start collecting feedback!
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summary.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="border rounded-lg p-4 text-center hover:shadow-md transition-shadow"
            >
              <div className={`${item.bgColor} w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2`}>
                <Icon className={`h-5 w-5 ${item.color}`} />
              </div>
              <p className="text-xs text-gray-500 mb-1">{item.label}</p>
              <p className="text-sm font-semibold text-gray-900">{item.value}</p>
            </div>
          );
        })}
      </div>

      {/* Next Steps */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3 mb-4">
          <Rocket className="h-6 w-6 text-blue-600 mt-1" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              What's next?
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold">1.</span>
                <span>
                  <strong>Create your first board</strong> - Set up a board to organize feedback
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold">2.</span>
                <span>
                  <strong>Share your board</strong> - Get your public link and embed widget
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold">3.</span>
                <span>
                  <strong>Start collecting feedback</strong> - Invite users to share their ideas
                </span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-blue-600 font-bold">4.</span>
                <span>
                  <strong>Build your roadmap</strong> - Prioritize and plan your product
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Team Invites Confirmation */}
      {(data.teamInvites || []).length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm text-green-900 font-medium">
                Team invites sent!
              </p>
              <p className="text-sm text-green-700 mt-1">
                We've sent email invitations to {data.teamInvites.length} team member
                {data.teamInvites.length > 1 ? 's' : ''}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CTA Buttons */}
      <div className="text-center pt-4">
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => router.push('/admin/feedback')}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg"
          >
            Start with Fady
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <Button
            onClick={() => router.push('/admin')}
            size="lg"
            variant="outline"
            className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg"
          >
            Go to Dashboard
          </Button>
        </div>
        <p className="text-sm text-gray-500 mt-3">
          You can access onboarding tips anytime from the help menu
        </p>
      </div>

      {/* Footer Message */}
      <div className="text-center pt-6 border-t">
        <p className="text-sm text-gray-600">
          Need help getting started?{' '}
          <a href="#" className="text-blue-600 hover:underline font-medium">
            Check out our quick start guide
          </a>
          {' '}or{' '}
          <a href="#" className="text-blue-600 hover:underline font-medium">
            watch a demo video
          </a>
        </p>
      </div>
    </div>
  );
}
