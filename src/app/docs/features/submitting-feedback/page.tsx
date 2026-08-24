"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { PenLine } from "lucide-react";

export default function SubmittingFeedbackPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <div className="not-prose mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-semibold mb-4">
          <PenLine className="h-3.5 w-3.5" />
          End-User Guide
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          How to submit feedback
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Share an idea, bug, or request on a public feedback board.
        </p>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Finding the right board
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Go to your company&rsquo;s feedback page (for example,{" "}
        <code>yourcompany.faddy.site/feedback</code>). You&rsquo;ll see a list
        of boards — each one is a category like &ldquo;Feature Requests&rdquo;
        or &ldquo;Bug Reports.&rdquo; Click the board that best fits what you
        want to share.
      </p>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Creating a new post
      </h2>
      <ol className="space-y-4 text-slate-600 dark:text-slate-400 mb-4">
        <li>
          <strong>Click &ldquo;New Post&rdquo;</strong> — you&rsquo;ll find this
          button on the board page.
        </li>
        <li>
          <strong>Enter a title</strong> — a short, clear summary of your idea or
          issue (for example, &ldquo;Add dark mode to settings page&rdquo;).
        </li>
        <li>
          <strong>Choose a category</strong> — if the board has categories, pick
          the one that fits (Bug, Feature Request, Improvement, etc.).
        </li>
        <li>
          <strong>Describe your feedback</strong> — explain what you need, why it
          matters, or the steps to reproduce a bug. Be as specific as you can.
        </li>
        <li>
          <strong>Attach images (optional)</strong> — screenshots, mockups, or
          screen recordings help the team understand your feedback.
        </li>
      </ol>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Tips for good feedback
      </h2>
      <ul className="space-y-2 text-slate-600 dark:text-slate-400 mb-4">
        <li>One idea per post — it&rsquo;s easier for the team to act on</li>
        <li>Use a specific title instead of a vague one</li>
        <li>Explain the &ldquo;why&rdquo; — what problem does this solve for you?</li>
        <li>Check if someone already posted a similar idea and upvote it instead</li>
      </ul>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        What happens next
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Once submitted, your post appears on the board with an &ldquo;Open&rdquo;
        status. The product team reviews submissions regularly. You can follow
        the post to get notified when its status changes or when the team
        posts an update.
      </p>

      <div className="not-prose mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Related articles
        </h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link href="/docs/features/voting-commenting">
            <Card className="group hover:shadow-lg transition-all border hover:border-emerald-300 dark:hover:border-emerald-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  How to vote and comment
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Show support and add to the conversation
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/features/following-roadmap">
            <Card className="group hover:shadow-lg transition-all border hover:border-emerald-300 dark:hover:border-emerald-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  How to follow the roadmap
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  See what&rsquo;s planned, in progress, and completed
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/features/reading-changelog">
            <Card className="group hover:shadow-lg transition-all border hover:border-emerald-300 dark:hover:border-emerald-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  How to read the changelog
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Track new features, fixes, and improvements
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
