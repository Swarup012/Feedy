"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, ArrowRight } from "lucide-react";

export default function AIChatDocsPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <div className="not-prose mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 text-sm font-semibold mb-4">
          <MessageSquare className="h-3.5 w-3.5" />
          AI Features
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          Using AI Chat
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Ask natural-language questions about your feedback data and get instant
          answers.
          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
            Starter &amp; Pro
          </span>
        </p>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        What AI Chat knows
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        AI Chat is grounded in your actual feedback data. It knows about:
      </p>
      <ul className="space-y-2 text-slate-600 dark:text-slate-400 mb-4">
        <li>Your boards and their posts</li>
        <li>Cluster labels and summaries (AI-grouped feedback themes)</li>
        <li>Post counts and upvote totals per cluster</li>
        <li>Recent posts with their status and category</li>
      </ul>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        It does not hallucinate data — if something isn&rsquo;t in your feedback,
        it will tell you.
      </p>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Getting started
      </h2>
      <Card className="not-prose mb-8 border-2">
        <CardContent className="p-6">
          <ol className="space-y-4 text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-bold text-sm flex-shrink-0">
                1
              </span>
              <span>
                Go to <strong>Admin → AI Chat</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-bold text-sm flex-shrink-0">
                2
              </span>
              <span>
                You&rsquo;ll see four suggestion prompts. Click one to get
                started, or type your own question.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-bold text-sm flex-shrink-0">
                3
              </span>
              <span>
                The AI streams its response in real-time. Below each response,
                you&rsquo;ll see how many clusters and posts it referenced.
              </span>
            </li>
          </ol>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Example questions
      </h2>
      <div className="not-prose grid sm:grid-cols-2 gap-3 mb-8">
        <Card className="border-2">
          <CardContent className="p-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 italic">
              &ldquo;What are the most critical issues users are reporting right
              now?&rdquo;
            </p>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 italic">
              &ldquo;Summarize the top feedback clusters and what I should
              prioritize.&rdquo;
            </p>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 italic">
              &ldquo;Based on recent completed feedback, draft a public changelog
              entry.&rdquo;
            </p>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-4">
            <p className="text-sm text-slate-600 dark:text-slate-400 italic">
              &ldquo;What is the overall sentiment of feedback?&rdquo;
            </p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Conversation history
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Your conversations are saved in the sidebar. Click <strong>New chat</strong>{" "}
        to start a fresh conversation. Click any saved conversation to resume it.
        Delete conversations you no longer need.
      </p>

      <div className="not-prose mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Related articles
        </h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link href="/docs/features/autopilot">
            <Card className="group hover:shadow-lg transition-all border hover:border-violet-300 dark:hover:border-violet-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  Using Autopilot
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Auto-classify and triage feedback with AI
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/features/triage">
            <Card className="group hover:shadow-lg transition-all border hover:border-violet-300 dark:hover:border-violet-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  Triage incoming feedback
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Filter, sort, and prioritize posts
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/plans/comparison">
            <Card className="group hover:shadow-lg transition-all border hover:border-violet-300 dark:hover:border-violet-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                  Understanding your plan
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  AI Chat requires Starter or Pro
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
