"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { GitBranch, ArrowRight } from "lucide-react";

export default function GitHubDocsPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <div className="not-prose mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/30 text-slate-700 dark:text-slate-400 text-sm font-semibold mb-4">
          <GitBranch className="h-3.5 w-3.5" />
          Integrations
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          Connecting GitHub
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Track issues and pull requests as feedback via the Faddy GitHub App.
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            Starter &amp; Pro
          </span>
        </p>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        What you get
      </h2>
      <ul className="space-y-2 text-slate-600 dark:text-slate-400 mb-4">
        <li>Issues and pull requests from your GitHub repos are analyzed for feedback</li>
        <li>Detected feedback becomes a suggestion in Autopilot (manual mode) or a post on your board (automatic mode)</li>
        <li>Choose which repositories to monitor</li>
      </ul>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Installing the GitHub App
      </h2>
      <Card className="not-prose mb-8 border-2">
        <CardContent className="p-6">
          <ol className="space-y-4 text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800/30 text-slate-700 dark:text-slate-400 font-bold text-sm flex-shrink-0">
                1
              </span>
              <span>
                Go to <strong>Organization Settings → Integrations</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800/30 text-slate-700 dark:text-slate-400 font-bold text-sm flex-shrink-0">
                2
              </span>
              <span>
                Find the <strong>GitHub</strong> card and click{" "}
                <strong>Connect</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800/30 text-slate-700 dark:text-slate-400 font-bold text-sm flex-shrink-0">
                3
              </span>
              <span>
                You&rsquo;ll be redirected to GitHub. Choose which account or
                organization to install the app on.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800/30 text-slate-700 dark:text-slate-400 font-bold text-sm flex-shrink-0">
                4
              </span>
              <span>
                Select <strong>All repositories</strong> or choose specific
                repositories to monitor.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800/30 text-slate-700 dark:text-slate-400 font-bold text-sm flex-shrink-0">
                5
              </span>
              <span>
                Click <strong>Install</strong>. You&rsquo;ll return to Faddy. A
                toast says <strong>&ldquo;GitHub connected&rdquo;</strong>.
              </span>
            </li>
          </ol>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Setting up webhooks
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        For Faddy to receive issue and pull request events, configure webhooks
        in your GitHub App settings:
      </p>
      <Card className="not-prose mb-8 border-2">
        <CardContent className="p-6">
          <ol className="space-y-4 text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800/30 text-slate-700 dark:text-slate-400 font-bold text-sm flex-shrink-0">
                1
              </span>
              <span>
                In GitHub, go to <strong>Settings → Developer settings → GitHub
                Apps</strong> and select the Faddy app.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800/30 text-slate-700 dark:text-slate-400 font-bold text-sm flex-shrink-0">
                2
              </span>
              <span>
                Under <strong>Webhooks</strong>, add a new webhook with the URL
                shown on your GitHub integration card in Faddy.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800/30 text-slate-700 dark:text-slate-400 font-bold text-sm flex-shrink-0">
                3
              </span>
              <span>
                Subscribe to <strong>issues</strong> and{" "}
                <strong>pull_request</strong> events.
              </span>
            </li>
          </ol>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Configuring Autopilot mode
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Click <strong>Manage</strong> on the GitHub card to configure:
      </p>
      <ul className="space-y-2 text-slate-600 dark:text-slate-400 mb-4">
        <li>
          <strong>Automatic Mode</strong> — toggle on to publish feedback directly
          without review (Pro only)
        </li>
        <li>
          <strong>Default Board</strong> — select which board receives
          GitHub-sourced feedback
        </li>
      </ul>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Disconnecting
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Click <strong>Disconnect GitHub</strong> in the Manage popover. This
        disconnects Faddy but does not uninstall the GitHub App — you must
        uninstall it separately from your GitHub Settings → Installed Apps.
      </p>

      <div className="not-prose mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Related articles
        </h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link href="/docs/features/autopilot">
            <Card className="group hover:shadow-lg transition-all border hover:border-slate-300 dark:hover:border-slate-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors">
                  Using Autopilot
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Review and approve GitHub-sourced suggestions
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/features/triage">
            <Card className="group hover:shadow-lg transition-all border hover:border-slate-300 dark:hover:border-slate-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors">
                  Triage incoming feedback
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Filter and manage posts from all sources
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/features/labels">
            <Card className="group hover:shadow-lg transition-all border hover:border-slate-300 dark:hover:border-slate-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors">
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
