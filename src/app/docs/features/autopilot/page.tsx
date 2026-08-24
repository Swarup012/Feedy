"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Bot, ArrowRight } from "lucide-react";

export default function AutopilotDocsPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <div className="not-prose mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-semibold mb-4">
          <Bot className="h-3.5 w-3.5" />
          AI Features
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          Using Autopilot
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Paste raw text from chats, emails, or reviews. AI detects feedback and
          queues a draft for your approval.
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            Starter &amp; Pro
          </span>
        </p>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        How Autopilot works
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Autopilot uses AI to analyze text and determine whether it contains
        product feedback. If it does, it extracts a title, description, and
        category. If the text is noise (off-topic chatter, greetings, etc.),
        it tells you nothing was found.
      </p>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        You can paste text directly into the Autopilot dashboard, or connect
        integrations (Slack, Discord, Intercom, GitHub) to automatically ingest
        messages.
      </p>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Manual vs Automatic mode
      </h2>
      <div className="not-prose grid md:grid-cols-2 gap-4 mb-8">
        <Card className="border-2">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Manual mode
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              Default for all integrations. AI creates a suggestion, you review
              it in the Review queue, then approve or reject.
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <strong>Good for:</strong> Teams that want human oversight on every
              piece of feedback before it goes public.
            </p>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              Automatic mode
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                Pro only
              </span>
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
              AI publishes posts directly to your board without review. No human
              step — feedback goes live instantly.
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              <strong>Good for:</strong> High-volume teams that trust the AI
              classification and want zero friction.
            </p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Pasting text directly
      </h2>
      <Card className="not-prose mb-8 border-2">
        <CardContent className="p-6">
          <ol className="space-y-4 text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold text-sm flex-shrink-0">
                1
              </span>
              <span>
                Go to <strong>Admin → Autopilot</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold text-sm flex-shrink-0">
                2
              </span>
              <span>
                Paste raw text into the text area — a support chat, email, app
                review, or any text that might contain feedback.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold text-sm flex-shrink-0">
                3
              </span>
              <span>
                Click <strong>Run Autopilot</strong>. The word counter shows how
                much text you&rsquo;ve pasted.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 font-bold text-sm flex-shrink-0">
                4
              </span>
              <span>
                In manual mode, a toast says &ldquo;Suggestion queued&rdquo; and
                the suggestion appears in the Review queue. In automatic mode,
                the post is created immediately.
              </span>
            </li>
          </ol>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Reviewing suggestions
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        The Review queue on the right side of the Autopilot page shows all
        suggestions. Use the status filter to switch between Pending, Approved,
        Rejected, or All.
      </p>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        For each pending suggestion:
      </p>
      <ul className="space-y-2 text-slate-600 dark:text-slate-400 mb-4">
        <li>
          Read the AI-generated title and description
        </li>
        <li>
          Click <strong>View source text</strong> to see the original input
        </li>
        <li>
          Select a board from the dropdown
        </li>
        <li>
          Click <strong>Approve</strong> to publish, or <strong>Reject</strong> to
          dismiss
        </li>
      </ul>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Connecting sources
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        To automatically ingest feedback from external tools, connect an
        integration from <strong>Organization Settings → Integrations</strong>.
        Each connected integration can be set to Manual or Automatic mode
        independently.
      </p>

      <div className="not-prose mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Related articles
        </h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link href="/docs/features/alerts">
            <Card className="group hover:shadow-lg transition-all border hover:border-amber-300 dark:hover:border-amber-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Configuring high-severity alerts
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Get notified when Autopilot flags urgent issues
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/features/ai-chat">
            <Card className="group hover:shadow-lg transition-all border hover:border-amber-300 dark:hover:border-amber-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Using AI Chat
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Ask questions about your feedback data
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/features/triage">
            <Card className="group hover:shadow-lg transition-all border hover:border-amber-300 dark:hover:border-amber-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Triage incoming feedback
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Manual review and status management
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
