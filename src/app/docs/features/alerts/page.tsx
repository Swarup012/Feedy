"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Bell, ArrowRight } from "lucide-react";

export default function AlertsDocsPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <div className="not-prose mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-semibold mb-4">
          <Bell className="h-3.5 w-3.5" />
          Notifications
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          Configuring High-Severity Alerts
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Get instant Slack or Discord notifications when urgent feedback arrives.
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
            Pro only
          </span>
        </p>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        What triggers an alert
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        When a post is classified as <strong>high severity</strong> (billing,
        security, or data loss), Faddy can send a notification to a Slack or
        Discord channel you configure.
      </p>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Alerts are batched within a 30-second window — if multiple high-severity
        posts arrive at the same time, they&rsquo;re combined into one message.
      </p>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Setting up alerts
      </h2>
      <Card className="not-prose mb-8 border-2">
        <CardContent className="p-6">
          <ol className="space-y-4 text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold text-sm flex-shrink-0">
                1
              </span>
              <span>
                Connect Slack or Discord from{" "}
                <strong>Organization Settings → Integrations</strong> (if not
                already connected).
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold text-sm flex-shrink-0">
                2
              </span>
              <span>
                Go to <strong>Organization Settings → Notifications</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold text-sm flex-shrink-0">
                3
              </span>
              <span>
                Toggle on <strong>High-Severity Alerts</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold text-sm flex-shrink-0">
                4
              </span>
              <span>
                Under <strong>Alert Destinations</strong>, click{" "}
                <strong>Add channel</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-bold text-sm flex-shrink-0">
                5
              </span>
              <span>
                Select a provider (Slack or Discord) and choose a channel. Click{" "}
                <strong>Add</strong>.
              </span>
            </li>
          </ol>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Alert destinations vs ingestion channels
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Alert destinations are <strong>independent</strong> of the channel used
        for feedback ingestion. For example, you might ingest feedback from{" "}
        <code>#product-feedback</code> but send high-severity alerts to{" "}
        <code>#urgent</code>.
      </p>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Managing channels
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Each configured channel has its own toggle switch and delete button.
        You can disable individual channels without removing them. If your Slack
        token lacks the <code>chat:write</code> permission, a reconnect banner
        will appear with a <strong>Reconnect</strong> button.
      </p>

      <div className="not-prose mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Related articles
        </h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link href="/docs/features/autopilot">
            <Card className="group hover:shadow-lg transition-all border hover:border-red-300 dark:hover:border-red-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                  Using Autopilot
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  AI classifies severity for incoming feedback
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/features/triage">
            <Card className="group hover:shadow-lg transition-all border hover:border-red-300 dark:hover:border-red-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                  Triage incoming feedback
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  View and manage high-severity posts
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/plans/comparison">
            <Card className="group hover:shadow-lg transition-all border hover:border-red-300 dark:hover:border-red-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                  Understanding your plan
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Alerts and AI severity require Pro
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
