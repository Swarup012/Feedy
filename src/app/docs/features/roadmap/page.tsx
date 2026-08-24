"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, Calendar, Link2, ArrowRight } from "lucide-react";

export default function RoadmapDocsPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <div className="not-prose mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-semibold mb-4">
          <TrendingUp className="h-3.5 w-3.5" />
          Features
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Roadmap</h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Plan, organize, and share your product roadmap with your users.
        </p>
      </div>

      <Card className="not-prose mb-8 border-2">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Roadmap Highlights</h3>
          <ul className="space-y-3 text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2"><Calendar className="h-5 w-5 text-green-600 mt-0.5" />Timeline view for releases</li>
            <li className="flex items-start gap-2"><Link2 className="h-5 w-5 text-green-600 mt-0.5" />Link feedback to roadmap items</li>
            <li className="flex items-start gap-2"><TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />Track progress and status</li>
          </ul>
        </CardContent>
      </Card>

      <div className="not-prose mt-12">
        <Link href="/docs/features/changelog">
          <Button variant="outline" className="border-2">
            Next: Changelog
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>

      <div className="not-prose mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Related articles</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link href="/docs/features/boards">
            <Card className="group hover:shadow-lg transition-all border hover:border-green-300 dark:hover:border-green-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Setting up boards</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Create the boards that feed your roadmap</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/features/changelog">
            <Card className="group hover:shadow-lg transition-all border hover:border-green-300 dark:hover:border-green-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Publishing changelog updates</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Announce completed features to your users</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/plans/comparison">
            <Card className="group hover:shadow-lg transition-all border hover:border-green-300 dark:hover:border-green-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Understanding your plan</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Roadmap item limits per tier</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
