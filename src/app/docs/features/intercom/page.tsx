"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Headphones, ArrowRight } from "lucide-react";

export default function IntercomDocsPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <div className="not-prose mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-semibold mb-4">
          <Headphones className="h-3.5 w-3.5" />
          Integrations
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          Connecting Intercom
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Receive closed conversation transcripts and turn them into feedback
          suggestions.
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            Starter &amp; Pro
          </span>
        </p>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        What you get
      </h2>
      <ul className="space-y-2 text-slate-600 dark:text-slate-400 mb-4">
        <li>When a support conversation closes in Intercom, the transcript is sent to Faddy for analysis</li>
        <li>AI detects whether the conversation contains product feedback</li>
        <li>Detected feedback becomes a suggestion in Autopilot (manual mode) or a post on your board (automatic mode)</li>
      </ul>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Connecting Intercom
      </h2>
      <Card className="not-prose mb-8 border-2">
        <CardContent className="p-6">
          <ol className="space-y-4 text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold text-sm flex-shrink-0">
                1
              </span>
              <span>
                Go to <strong>Organization Settings → Integrations</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold text-sm flex-shrink-0">
                2
              </span>
              <span>
                Find the <strong>Intercom</strong> card and click{" "}
                <strong>Connect</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold text-sm flex-shrink-0">
                3
              </span>
              <span>
                You&rsquo;ll be redirected to Intercom. Click{" "}
                <strong>Authorize access</strong> to grant Faddy permission to
                read conversations.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold text-sm flex-shrink-0">
                4
              </span>
              <span>
                You&rsquo;ll return to Faddy. A toast says{" "}
                <strong>&ldquo;Intercom connected&rdquo;</strong>.
              </span>
            </li>
          </ol>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Setting up the webhook
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        For Faddy to receive conversation transcripts, you need to configure a
        webhook in Intercom:
      </p>
      <Card className="not-prose mb-8 border-2">
        <CardContent className="p-6">
          <ol className="space-y-4 text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold text-sm flex-shrink-0">
                1
              </span>
              <span>
                In Intercom, go to <strong>Settings → Webhooks</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold text-sm flex-shrink-0">
                2
              </span>
              <span>
                Subscribe to the <strong>conversation.admin.closed</strong> event.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold text-sm flex-shrink-0">
                3
              </span>
              <span>
                Point the webhook URL to your Faddy public webhook endpoint.
                Your Intercom integration card in Faddy shows this URL.
              </span>
            </li>
          </ol>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Configuring Autopilot mode
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Click <strong>Manage</strong> on the Intercom card to configure:
      </p>
      <ul className="space-y-2 text-slate-600 dark:text-slate-400 mb-4">
        <li>
          <strong>Automatic Mode</strong> — toggle on to publish feedback directly
          without review (Pro only)
        </li>
        <li>
          <strong>Default Board</strong> — select which board receives
          Intercom-sourced feedback
        </li>
      </ul>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Disconnecting
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Click <strong>Disconnect Intercom</strong> in the Manage popover. You
        should also remove the webhook from Intercom Settings → Webhooks to
        stop sending data to Faddy.
      </p>

      <div className="not-prose mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Related articles
        </h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link href="/docs/features/autopilot">
            <Card className="group hover:shadow-lg transition-all border hover:border-blue-300 dark:hover:border-blue-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Using Autopilot
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Review and approve Intercom-sourced suggestions
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/features/triage">
            <Card className="group hover:shadow-lg transition-all border hover:border-blue-300 dark:hover:border-blue-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Triage incoming feedback
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Filter and manage posts from all sources
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/features/labels">
            <Card className="group hover:shadow-lg transition-all border hover:border-blue-300 dark:hover:border-blue-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Managing post labels
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Categorize feedback from all sources
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
