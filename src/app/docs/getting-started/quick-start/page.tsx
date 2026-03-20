"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, PlayCircle, Zap } from "lucide-react";

export default function QuickStartPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      {/* Header */}
      <div className="not-prose mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-semibold mb-4">
          <Zap className="h-3.5 w-3.5" />
          Getting Started
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          Quick Start Guide
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Get up and running with Faddy in under 5 minutes
        </p>
      </div>

      {/* Step-by-step Guide */}
      <div className="not-prose space-y-8">
        {/* Step 1 */}
        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-lg flex-shrink-0">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                  Create Your Account
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Sign up for free and create your organization. No credit card required.
                </p>
                <Link href="/signup">
                  <Button className="bg-gradient-to-r from-blue-600 to-blue-700 gap-2">
                    Sign Up Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 2 */}
        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white font-bold text-lg flex-shrink-0">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                  Create Your First Board
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  After logging in, create a feedback board to organize customer requests:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-400 ml-4">
                  <li>Go to <strong>Admin Dashboard</strong></li>
                  <li>Click <strong>"Manage Feedback"</strong></li>
                  <li>Click <strong>"+ New Board"</strong></li>
                  <li>Give it a name (e.g., "Feature Requests")</li>
                  <li>Click <strong>"Create"</strong></li>
                </ol>
                <div className="mt-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-900 dark:text-blue-300 font-medium">
                    💡 <strong>Tip:</strong> Create separate boards for different types of feedback (Features, Bugs, Improvements)
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 3 */}
        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white font-bold text-lg flex-shrink-0">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                  Share Your Board
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Get the public link and share it with your customers:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-400 ml-4">
                  <li>Open your board</li>
                  <li>Click the <strong>"Share"</strong> button</li>
                  <li>Copy the public link</li>
                  <li>Share it on your website, email, or social media</li>
                </ol>
                <div className="mt-4 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-900 dark:text-green-300 font-medium">
                    ✅ <strong>Public boards</strong> allow anyone to view and submit feedback without logging in
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 4 */}
        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-white font-bold text-lg flex-shrink-0">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                  Start Collecting Feedback
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Your customers can now:
                </p>
                <ul className="space-y-2 text-slate-600 dark:text-slate-400">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Submit new feedback and feature requests
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Upvote existing suggestions
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Comment and discuss ideas
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Track progress on their requests
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Next Steps */}
      <div className="not-prose mt-12 p-8 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 border border-slate-300 dark:border-slate-600">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
          🎉 You're All Set!
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Now explore more features to get the most out of Faddy:
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link href="/docs/getting-started/invite-team">
            <Button variant="outline" className="w-full justify-between border-2">
              Invite Team Members
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/docs/features/roadmap">
            <Button variant="outline" className="w-full justify-between border-2">
              Create a Roadmap
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
