"use client";

import Link from "next/link";
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

      <div className="not-prose grid md:grid-cols-3 gap-6 mb-8">
        <Card className="border-2">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Free</h3>
            <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold mb-3">$0/mo</p>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><strong>3</strong> boards</li>
              <li><strong>5</strong> posts per board</li>
              <li><strong>20</strong> tracked users (hard limit, no overage)</li>
              <li><strong>3</strong> team members</li>
              <li><strong>1</strong> roadmap item</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Starter</h3>
            <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold mb-3">$25/mo ($19/mo yearly)</p>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><strong>Unlimited</strong> boards &amp; posts</li>
              <li><strong>125</strong> tracked users included</li>
              <li><strong>25</strong> grace buffer (overage starts at 150)</li>
              <li><strong>Unlimited</strong> team members, 5 admins</li>
              <li><strong>Unlimited</strong> roadmap items</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardContent className="p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Pro</h3>
            <p className="text-sm text-blue-600 dark:text-blue-400 font-semibold mb-3">$59/mo ($49/mo yearly)</p>
            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <li><strong>Unlimited</strong> boards &amp; posts</li>
              <li><strong>125</strong> tracked users included</li>
              <li><strong>25</strong> grace buffer (overage starts at 150)</li>
              <li><strong>Unlimited</strong> team members, 10 admins</li>
              <li><strong>Unlimited</strong> roadmap items</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="not-prose border-2">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Tracked Users &amp; Overage</h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            A <strong>tracked user</strong> is any unique external person who submits feedback, upvotes, or comments. Internal team members are not counted. Users are identified by email address, deduplicated per billing period.
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            Both Starter and Pro include 125 users with a 25-user grace buffer. Charges begin at 150 users at <strong>$6 per block of 50</strong>, billed monthly via Paddle.
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Free plan has a hard cap of 20 — no overage. When reached, new users can still submit feedback but are not tracked.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
