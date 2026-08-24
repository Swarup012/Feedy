"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { MousePointerClick } from "lucide-react";

export default function UsingWidgetPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <div className="not-prose mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-semibold mb-4">
          <MousePointerClick className="h-3.5 w-3.5" />
          End-User Guide
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          How to use the feedback widget
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Submit feedback without leaving the product.
        </p>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        What the widget looks like
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        The feedback widget is a small button embedded in the product. It
        usually appears in the bottom-right corner of the screen. When you
        click it, a panel opens where you can browse boards and submit
        feedback.
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        [SCREENSHOT: Feedback widget button in bottom-right corner, and panel
        expanded showing board list]
      </p>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Submitting feedback from the widget
      </h2>
      <ol className="space-y-4 text-slate-600 dark:text-slate-400 mb-4">
        <li>
          <strong>Click the widget button</strong> to open the panel.
        </li>
        <li>
          <strong>Select a board</strong> that matches your feedback (for example,
          &ldquo;Feature Requests&rdquo; or &ldquo;Bug Reports&rdquo;).
        </li>
        <li>
          <strong>Click &ldquo;New Post&rdquo;</strong> and fill in a title,
          category, and description.
        </li>
        <li>
          <strong>Submit</strong> — your post appears on the board immediately.
        </li>
      </ol>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Identifying yourself
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        If the product has set up user identity, the widget may automatically
        show your name and email to the team. You do not need to do anything
        extra. If you are not logged in, you may be asked for your name and
        email when you submit feedback.
      </p>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Browsing existing posts
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Before creating a new post, check if someone already suggested the same
        thing. Use the search bar in the widget or scroll through the board.
        If you find a matching post, upvote it instead of creating a duplicate.
      </p>

      <div className="not-prose mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Related articles
        </h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link href="/docs/features/submitting-feedback">
            <Card className="group hover:shadow-lg transition-all border hover:border-emerald-300 dark:hover:border-emerald-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  How to submit feedback
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Creating a post from the full board page
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/features/voting-commenting">
            <Card className="group hover:shadow-lg transition-all border hover:border-emerald-300 dark:hover:border-emerald-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  How to vote and comment
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Show support for existing ideas
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
                  Track what the team is building
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
