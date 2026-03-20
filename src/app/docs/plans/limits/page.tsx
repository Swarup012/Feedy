"use client";

import { Card, CardContent } from "@/components/ui/card";

export default function PlanLimitsPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <div className="not-prose mb-12">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Usage Limits</h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Understand plan usage limits and overage policies.
        </p>
      </div>

      <Card className="not-prose border-2">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Free Plan Limits</h3>
          <ul className="space-y-2 text-slate-600 dark:text-slate-400">
            <li>3 Boards</li>
            <li>5 Posts per Board</li>
            <li>20 Tracked Users</li>
            <li>Basic Roadmap Access</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
