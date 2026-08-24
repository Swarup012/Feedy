"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Tag, ArrowRight } from "lucide-react";

export default function LabelsDocsPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <div className="not-prose mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-sm font-semibold mb-4">
          <Tag className="h-3.5 w-3.5" />
          Features
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          Managing Post Labels
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Create custom categories to organize and filter feedback.
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            Starter &amp; Pro
          </span>
        </p>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Default labels
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Every org starts with three default labels: <strong>Feature Request</strong>,{" "}
        <strong>Bug Report</strong>, and <strong>General Feedback</strong>. These
        appear in the category dropdown when creating or editing posts.
      </p>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Creating custom labels
      </h2>
      <Card className="not-prose mb-8 border-2">
        <CardContent className="p-6">
          <ol className="space-y-4 text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-bold text-sm flex-shrink-0">
                1
              </span>
              <span>
                Go to <strong>Organization Settings</strong> from the admin sidebar.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-bold text-sm flex-shrink-0">
                2
              </span>
              <span>
                Labels are managed per-organization. Create new labels via the
                API or by typing a custom category directly when creating a post.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 font-bold text-sm flex-shrink-0">
                3
              </span>
              <span>
                Custom categories typed during post creation are saved and appear
                in the dropdown for future posts.
              </span>
            </li>
          </ol>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Assigning labels to posts
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        When creating a post, use the <strong>Category</strong> dropdown to
        select a label. You can also type a custom category directly — Faddy
        saves it for future use.
      </p>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        To change a post&rsquo;s category later, open the post details panel and
        click the <strong>Category</strong> field. Only admins and owners can
        edit categories.
      </p>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Using labels for filtering
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Labels help you filter and segment feedback. On the admin board view,
        use the search input to find posts by category name. In Expert View,
        the Autopilot Performance panel shows feedback volume by category.
      </p>

      <div className="not-prose mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Related articles
        </h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link href="/docs/features/triage">
            <Card className="group hover:shadow-lg transition-all border hover:border-purple-300 dark:hover:border-purple-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Triage incoming feedback
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Filter and prioritize posts by category
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/features/boards">
            <Card className="group hover:shadow-lg transition-all border hover:border-purple-300 dark:hover:border-purple-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Setting up boards
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Boards organize feedback by product area
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/plans/comparison">
            <Card className="group hover:shadow-lg transition-all border hover:border-purple-300 dark:hover:border-purple-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Understanding your plan
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Custom labels require Starter or Pro
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
