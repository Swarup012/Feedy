"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Map } from "lucide-react";

export default function FollowingRoadmapPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <div className="not-prose mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-semibold mb-4">
          <Map className="h-3.5 w-3.5" />
          End-User Guide
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          How to follow the roadmap
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          See what the team is working on and what is coming next.
        </p>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Opening the roadmap
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Go to your company roadmap page (for example,{" "}
        <code>yourcompany.faddy.site/roadmap</code>). You can also find a link
        to it in the top navigation of the feedback board.
      </p>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Understanding the columns
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        The roadmap is organized into four columns:
      </p>
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <Card className="border-2">
          <CardContent className="p-4">
            <p className="font-bold text-slate-900 dark:text-white mb-1">
              Planned
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Ideas the team has committed to but has not started yet.
            </p>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-4">
            <p className="font-bold text-slate-900 dark:text-white mb-1">
              In Progress
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              The team is actively building this right now.
            </p>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-4">
            <p className="font-bold text-slate-900 dark:text-white mb-1">
              In Review
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Built and waiting to be tested or deployed.
            </p>
          </CardContent>
        </Card>
        <Card className="border-2">
          <CardContent className="p-4">
            <p className="font-bold text-slate-900 dark:text-white mb-1">
              Completed
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Released and available to you now.
            </p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Filtering by board
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        If your company has multiple boards (Feature Requests, Bug Reports,
        etc.), use the board filter at the top of the roadmap to narrow down
        what you see.
      </p>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Following a post from the roadmap
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Click any item on the roadmap to open its detail page. From there you
        can follow it to receive notifications when the status changes or when
        the team posts an update.
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
          <Link href="/docs/features/reading-changelog">
            <Card className="group hover:shadow-lg transition-all border hover:border-emerald-300 dark:hover:border-emerald-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  How to read the changelog
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  See what has been released
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
