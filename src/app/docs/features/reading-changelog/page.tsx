"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen } from "lucide-react";

export default function ReadingChangelogPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <div className="not-prose mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-semibold mb-4">
          <BookOpen className="h-3.5 w-3.5" />
          End-User Guide
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          How to read the changelog
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Track new features, fixes, and improvements as they ship.
        </p>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Opening the changelog
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Go to your company changelog page (for example,{" "}
        <code>yourcompany.faddy.site/changelog</code>). You can also find a
        link in the top navigation of the feedback board.
      </p>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Reading an entry
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Each changelog entry shows a title, date, and description. Items are
        tagged with a badge that tells you what kind of change it is:
      </p>
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          New
        </span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
          Improved
        </span>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
          Fixed
        </span>
      </div>
      <ul className="space-y-2 text-slate-600 dark:text-slate-400 mb-4">
        <li>
          <strong>New</strong> — a feature that did not exist before
        </li>
        <li>
          <strong>Improved</strong> — an existing feature that works better now
        </li>
        <li>
          <strong>Fixed</strong> — a bug that has been resolved
        </li>
      </ul>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Filtering entries
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        If your company has multiple boards, you can filter changelog entries by
        board to see updates relevant to a specific product area.
      </p>

      <div className="not-prose mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Related articles
        </h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link href="/docs/features/following-roadmap">
            <Card className="group hover:shadow-lg transition-all border hover:border-emerald-300 dark:hover:border-emerald-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  How to follow the roadmap
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  See what is planned and in progress
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/features/submitting-feedback">
            <Card className="group hover:shadow-lg transition-all border hover:border-emerald-300 dark:hover:border-emerald-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  How to submit feedback
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Request new features and report bugs
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
                  Show support and add to the conversation
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
