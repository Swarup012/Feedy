"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Filter, Search, ArrowRight, ArrowDownRight } from "lucide-react";

export default function TriageDocsPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <div className="not-prose mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-sm font-semibold mb-4">
          <Filter className="h-3.5 w-3.5" />
          Features
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          Triage Incoming Feedback
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Filter, sort, and prioritize feedback so nothing slips through.
        </p>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Using the board view
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Open <strong>Admin → Feedback</strong> and select a board from the left
        sidebar. The main panel shows all posts for that board, with filters and
        search at the top.
      </p>

      <Card className="not-prose mb-8 border-2">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
            Filters &amp; search
          </h3>
          <ul className="space-y-3 text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2">
              <Search className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <strong>Search</strong> — type in the &ldquo;Search posts...&rdquo;
                input to filter by title or description in real-time.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <Filter className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <strong>Status filter</strong> — click &ldquo;All statuses&rdquo;
                to narrow by Open, Under Review, Planned, In Progress, Completed,
                or Closed.
              </div>
            </li>
            <li className="flex items-start gap-2">
              <ArrowDownRight className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <strong>Sort</strong> — choose Newest First, Most Upvoted, or Most
                Commented.
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Updating post status
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Click any post to open the details panel on the right. Admins and owners
        see a <strong>Status</strong> dropdown with all six options. Select a new
        status and the change saves instantly.
      </p>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        When you mark a post as <strong>Completed</strong>, Faddy prompts you to
        create a changelog entry and notifies users who engaged with the post.
      </p>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Assigning categories
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        In the post details panel, click the <strong>Category</strong> field to
        assign a label. You can pick from your org&rsquo;s custom labels or type
        a freeform category. Categories help with filtering and reporting.
      </p>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Creating posts on behalf of users
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Click <strong>New Post</strong> at the top of the posts list. Fill in the
        title, optional category, and description. This is useful when a customer
        emails you feedback directly instead of using the board.
      </p>

      <div className="not-prose mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Related articles
        </h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link href="/docs/features/boards">
            <Card className="group hover:shadow-lg transition-all border hover:border-orange-300 dark:hover:border-orange-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  Setting up boards
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Create the boards where feedback lives
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/features/labels">
            <Card className="group hover:shadow-lg transition-all border hover:border-orange-300 dark:hover:border-orange-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  Managing post labels
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Create custom categories for your feedback
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/features/roadmap">
            <Card className="group hover:shadow-lg transition-all border hover:border-orange-300 dark:hover:border-orange-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                  Setting up your public roadmap
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Link triaged posts to your roadmap
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
