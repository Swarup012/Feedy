'use client';

import { OnboardingData } from '../OnboardingFlow';
import { CheckCircle, ArrowRight, MessageSquare, BarChart3, Users } from 'lucide-react';

interface SuccessStepProps {
  data: OnboardingData;
}

const goalLabels: Record<string, string> = {
  'collect-feedback': 'Collect feedback',
  'track-issues': 'Track issues',
  'measure-nps': 'Measure NPS',
  'prioritize-roadmap': 'Prioritize roadmap',
  'close-loop': 'Close the loop',
  'understand-users': 'Understand users',
};

const processLabels: Record<string, string> = {
  'email': 'Email',
  'spreadsheet': 'Spreadsheets',
  'jira': 'Jira',
  'trello': 'Trello',
  'notion': 'Notion',
  'linear': 'Linear',
  'none': 'No current process',
  'other': 'Other',
};

export function SuccessStep({ data }: SuccessStepProps) {
  const hasData = data.companyName || (data.goals && data.goals.length > 0) || data.currentProcess;

  return (
    <div className="space-y-6">
      {/* Success Header */}
      <div className="text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-primary" strokeWidth={2} />
        </div>
        <h2 className="text-2xl font-semibold text-foreground">
          You're all set!
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Your workspace is ready. Here's what we saved.
        </p>
      </div>

      {/* Data Summary */}
      {hasData && (
        <div className="border rounded-lg divide-y bg-muted/20">
          {/* Company */}
          {data.companyName && (
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Company</span>
              <span className="text-sm font-medium">{data.companyName}</span>
            </div>
          )}

          {/* Subdomain */}
          {data.companyName && (
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Workspace</span>
              <span className="text-sm font-mono font-medium text-primary">
                {data.companyName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.faddy.site
              </span>
            </div>
          )}

          {/* Company Size */}
          {data.companySize && (
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Team size</span>
              <span className="text-sm font-medium">{data.companySize} employees</span>
            </div>
          )}

          {/* Industry */}
          {data.industry && (
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Industry</span>
              <span className="text-sm font-medium">{data.industry}</span>
            </div>
          )}

          {/* Goals */}
          {data.goals && data.goals.length > 0 && (
            <div className="px-4 py-3">
              <span className="text-sm text-muted-foreground block mb-2">Goals</span>
              <div className="flex flex-wrap gap-1.5">
                {data.goals.map((goal) => (
                  <span
                    key={goal}
                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium"
                  >
                    {goalLabels[goal] || goal}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Current Process */}
          {data.currentProcess && (
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Current process</span>
              <span className="text-sm font-medium">{processLabels[data.currentProcess] || data.currentProcess}</span>
            </div>
          )}

          {/* Team Invites */}
          {data.teamInvites && data.teamInvites.length > 0 && (
            <div className="px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Team invites</span>
              <span className="text-sm font-medium">{data.teamInvites.length} member{data.teamInvites.length !== 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Integrations */}
          {data.integrations && data.integrations.length > 0 && (
            <div className="px-4 py-3">
              <span className="text-sm text-muted-foreground block mb-2">Integrations</span>
              <div className="flex flex-wrap gap-1.5">
                {data.integrations.map((integration) => (
                  <span
                    key={integration}
                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium"
                  >
                    {integration}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* What Happens Next */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">What happens next</h3>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <MessageSquare className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Create your first board</p>
              <p className="text-xs text-muted-foreground">Set up a feedback board to start collecting feature requests and bug reports from your users.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Embed the widget</p>
              <p className="text-xs text-muted-foreground">Add a single script tag to your app so users can submit feedback without leaving your product.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <BarChart3 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Watch feedback roll in</p>
              <p className="text-xs text-muted-foreground">AI clusters feedback by theme automatically. Check the dashboard to see what users want most.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Prompt hint */}
      <p className="text-xs text-muted-foreground text-center">
        Click <span className="font-medium text-foreground">Start Using Faddy</span> below to enter your dashboard.
      </p>
    </div>
  );
}
