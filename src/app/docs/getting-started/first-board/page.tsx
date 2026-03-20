"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, MessageSquare, AlertCircle, Lightbulb } from "lucide-react";

export default function FirstBoardPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      {/* Header */}
      <div className="not-prose mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-sm font-semibold mb-4">
          <MessageSquare className="h-3.5 w-3.5" />
          Getting Started
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          Create Your First Board
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Learn how to create and configure feedback boards
        </p>
      </div>

      {/* What is a Board */}
      <Card className="not-prose mb-8 border-2 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/50">
              <Lightbulb className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                What is a Feedback Board?
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                A board is like a category or container for organizing feedback. Think of it as a dedicated space 
                for specific types of feedback like "Feature Requests", "Bug Reports", or "Product Ideas".
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step by Step */}
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
        Step-by-Step Instructions
      </h2>

      <div className="not-prose space-y-6">
        {/* Step 1 */}
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex-shrink-0">
            1
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
              Navigate to Admin Dashboard
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              After logging in, you'll see the admin dashboard. Click on <strong>"Manage Feedback"</strong> 
              in the Quick Actions section.
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex-shrink-0">
            2
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
              Click "New Board"
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-3">
              In the feedback management page, click the <strong>"+ New Board"</strong> button.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex-shrink-0">
            3
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
              Configure Your Board
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-3">
              Fill in the board details:
            </p>
            <ul className="space-y-2 text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Board Name:</strong> Choose a clear, descriptive name (e.g., "Feature Requests", "Bug Reports")
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Description:</strong> Explain what type of feedback this board is for
                </div>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <strong>Visibility:</strong> Choose Public (anyone can view) or Private (team only)
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Step 4 */}
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex-shrink-0">
            4
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
              Click Create
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Hit the <strong>"Create Board"</strong> button and you're done! Your board is now ready to collect feedback.
            </p>
          </div>
        </div>
      </div>

      {/* Best Practices */}
      <Card className="not-prose mt-12 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/30 dark:to-blue-950/30 border-2 border-purple-200 dark:border-purple-800">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            📋 Best Practices
          </h3>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <span className="text-slate-600 dark:text-slate-400">
                <strong>Keep boards focused:</strong> Create separate boards for different categories (Features, Bugs, UX Improvements)
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <span className="text-slate-600 dark:text-slate-400">
                <strong>Use clear names:</strong> Board names should be immediately understandable to users
              </span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <span className="text-slate-600 dark:text-slate-400">
                <strong>Start with 2-3 boards:</strong> Don't overwhelm users with too many options initially
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <div className="not-prose mt-12">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          What's Next?
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Link href="/docs/getting-started/invite-team">
            <Card className="group hover:shadow-xl transition-all border-2 hover:border-blue-300 dark:hover:border-blue-700 h-full">
              <CardContent className="p-5">
                <h4 className="font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Invite Your Team →
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Add team members to help manage feedback
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/features/boards">
            <Card className="group hover:shadow-xl transition-all border-2 hover:border-blue-300 dark:hover:border-blue-700 h-full">
              <CardContent className="p-5">
                <h4 className="font-bold text-slate-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Board Features →
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Explore all board features and settings
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
