"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { MessageCircle, ArrowRight } from "lucide-react";

export default function DiscordDocsPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <div className="not-prose mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-sm font-semibold mb-4">
          <MessageCircle className="h-3.5 w-3.5" />
          Integrations
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          Connecting Discord
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Monitor a Discord channel and convert conversations into actionable
          feedback.
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            Starter &amp; Pro
          </span>
        </p>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        What you get
      </h2>
      <ul className="space-y-2 text-slate-600 dark:text-slate-400 mb-4">
        <li>Messages from a Discord channel are automatically analyzed for feedback</li>
        <li>Detected feedback becomes a suggestion in Autopilot (manual mode) or a post on your board (automatic mode)</li>
        <li>Set the monitored channel and Autopilot mode per integration</li>
      </ul>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Connecting Discord
      </h2>
      <Card className="not-prose mb-8 border-2">
        <CardContent className="p-6">
          <ol className="space-y-4 text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold text-sm flex-shrink-0">
                1
              </span>
              <span>
                Go to <strong>Organization Settings → Integrations</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold text-sm flex-shrink-0">
                2
              </span>
              <span>
                Find the <strong>Discord</strong> card and click{" "}
                <strong>Connect</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold text-sm flex-shrink-0">
                3
              </span>
              <span>
                You&rsquo;ll be redirected to Discord. Select your server and
                click <strong>Authorize</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold text-sm flex-shrink-0">
                4
              </span>
              <span>
                You&rsquo;ll return to Faddy. A toast says{" "}
                <strong>&ldquo;Discord connected&rdquo;</strong> with a prompt to
                select a channel.
              </span>
            </li>
          </ol>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Configuring the integration
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        After connecting, click <strong>Manage</strong> on the Discord card to
        configure:
      </p>

      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
        1. Select a monitored channel
      </h3>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Use the <strong>Monitored Channel</strong> dropdown to pick which
        Discord channel Faddy should watch. The bot must have permission to
        read messages in that channel.
      </p>

      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
        2. Choose Manual or Automatic mode
      </h3>
      <div className="not-prose grid md:grid-cols-2 gap-4 mb-4">
        <Card className="border-2">
          <CardContent className="p-4">
            <p className="font-bold text-slate-900 dark:text-white mb-1">
              Manual mode (default)
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Messages become pending suggestions in Autopilot. You review and
              approve or reject each one.
            </p>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-4">
            <p className="font-bold text-slate-900 dark:text-white mb-1">
              Automatic mode
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                Pro only
              </span>
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Feedback is published directly to your board without review. Toggle
              the <strong>Automatic Mode</strong> switch to enable.
            </p>
          </CardContent>
        </Card>
      </div>

      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
        3. Set a default board
      </h3>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Use the <strong>Default Board</strong> dropdown to choose which board
        receives feedback from this Discord channel. This is required for
        Automatic mode.
      </p>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Disconnecting
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Click <strong>Disconnect Discord</strong> in the Manage popover. Faddy
        will stop monitoring the channel. This does not remove the bot from
        your Discord server — you can kick it manually if desired.
      </p>

      <div className="not-prose mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Related articles
        </h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link href="/docs/features/autopilot">
            <Card className="group hover:shadow-lg transition-all border hover:border-indigo-300 dark:hover:border-indigo-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Using Autopilot
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Review and approve Discord-sourced suggestions
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/features/alerts">
            <Card className="group hover:shadow-lg transition-all border hover:border-indigo-300 dark:hover:border-indigo-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Configuring high-severity alerts
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Send urgent alerts to a Discord channel
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/features/triage">
            <Card className="group hover:shadow-lg transition-all border hover:border-indigo-300 dark:hover:border-indigo-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Triage incoming feedback
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Filter and manage posts from all sources
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
