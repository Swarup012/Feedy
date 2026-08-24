"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, CheckCircle2, ArrowRight, Settings, Users, Share2 } from "lucide-react";

export default function BoardsDocsPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <div className="not-prose mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-sm font-semibold mb-4">
          <MessageSquare className="h-3.5 w-3.5" />
          Features
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          Feedback Boards
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Organize customer feedback into structured boards for better prioritization.
        </p>
      </div>

      <Card className="not-prose mb-8 border-2">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
            What is a Feedback Board?
          </h3>
          <p className="text-slate-600 dark:text-slate-400">
            A board is a dedicated space where your users can submit ideas, vote, and discuss. Boards help you categorize feedback by product area or theme.
          </p>
        </CardContent>
      </Card>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">Key Features</h2>
      <div className="not-prose grid gap-4">
        <div className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Settings className="h-6 w-6 text-purple-600 dark:text-purple-400 mt-1" />
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-1">Custom Categories</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">Group feedback by product area, feature, or theme.</p>
          </div>
        </div>
        <div className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Users className="h-6 w-6 text-purple-600 dark:text-purple-400 mt-1" />
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-1">Voting & Comments</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">Let users vote and discuss, so priorities are clear.</p>
          </div>
        </div>
        <div className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <Share2 className="h-6 w-6 text-purple-600 dark:text-purple-400 mt-1" />
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-1">Public Sharing</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">Share your board publicly so anyone can submit feedback.</p>
          </div>
        </div>
      </div>

      <div className="not-prose mt-12">
        <Link href="/docs/features/roadmap">
          <Button variant="outline" className="border-2">
            Next: Roadmap
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>

      <div className="not-prose mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Related articles</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link href="/docs/features/team">
            <Card className="group hover:shadow-lg transition-all border hover:border-purple-300 dark:hover:border-purple-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Team roles &amp; permissions</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Who can create boards, change status, and manage settings</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/getting-started/invite-team">
            <Card className="group hover:shadow-lg transition-all border hover:border-purple-300 dark:hover:border-purple-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Invite team members</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Add admins and members to collaborate on feedback</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/plans/comparison">
            <Card className="group hover:shadow-lg transition-all border hover:border-purple-300 dark:hover:border-purple-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">Understanding your plan</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Board and post limits per tier</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
