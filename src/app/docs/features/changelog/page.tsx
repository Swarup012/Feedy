"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, Megaphone, ArrowRight } from "lucide-react";

export default function ChangelogDocsPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <div className="not-prose mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm font-semibold mb-4">
          <Bell className="h-3.5 w-3.5" />
          Features
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Changelog</h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Keep customers informed with product updates and release notes.
        </p>
      </div>

      <Card className="not-prose mb-8 border-2">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Why Use a Changelog?</h3>
          <p className="text-slate-600 dark:text-slate-400">
            Publishing updates builds trust, reduces support tickets, and keeps your users engaged with your product’s progress.
          </p>
        </CardContent>
      </Card>

      <div className="not-prose mt-12">
        <Link href="/docs/features/team">
          <Button variant="outline" className="border-2">
            Next: Team & Permissions
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>

      <div className="not-prose mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Related articles</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <Link href="/docs/features/roadmap">
            <Card className="group hover:shadow-lg transition-all border hover:border-blue-300 dark:hover:border-blue-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Setting up your public roadmap</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Plan and share what you're building next</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/features/boards">
            <Card className="group hover:shadow-lg transition-all border hover:border-blue-300 dark:hover:border-blue-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Setting up boards</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">The feedback boards that feed your changelog</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
