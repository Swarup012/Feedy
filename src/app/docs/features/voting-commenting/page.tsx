"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ThumbsUp, MessageSquare } from "lucide-react";

export default function VotingCommentingPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <div className="not-prose mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-semibold mb-4">
          <ThumbsUp className="h-3.5 w-3.5" />
          End-User Guide
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          How to vote and comment
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Show support for ideas and join the discussion.
        </p>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Upvoting a post
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        See an idea you agree with? Click the <strong>upvote arrow</strong> next
        to the post title. This shows the team how many people want the same
        thing. The vote count helps the product team decide what to build next.
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        You can remove your vote by clicking the upvote arrow again.
      </p>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Adding a comment
      </h2>
      <ol className="space-y-4 text-slate-600 dark:text-slate-400 mb-4">
        <li>
          <strong>Scroll down</strong> to the comments section on any post.
        </li>
        <li>
          <strong>Type your comment</strong> in the text box — add context, share
          your use case, or ask a question.
        </li>
        <li>
          <strong>Click &ldquo;Post&rdquo;</strong> to submit.
        </li>
      </ol>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Replying to comments
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Click <strong>Reply</strong> under any comment to keep the conversation
        organized in threads.
      </p>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Why your vote matters
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Every vote is counted. The product team uses vote counts to prioritize
        what to build first. An idea with 50 votes gets more attention than one
        with 2. Your single vote makes a difference.
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
                  Create a new post on the board
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
                  Track what the team is working on
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
                  See what&rsquo;s been released
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
