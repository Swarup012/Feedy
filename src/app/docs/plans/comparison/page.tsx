"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function PlansComparisonPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <div className="not-prose mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">Plan Comparison</h1>
        <p className="text-base text-slate-600 dark:text-slate-400">
          Compare features across Free, Starter, and Pro plans.
        </p>
      </div>

      <div className="not-prose grid md:grid-cols-3 gap-6">
        {[
          {
            name: "Free",
            price: "$0",
            yearly: "$0",
            features: [
              "3 boards",
              "5 posts per board",
              "20 tracked users (hard limit, no overage)",
              "3 team members",
              "1 roadmap item",
              "Public roadmap & changelog",
              "Feedback widget",
            ],
          },
          {
            name: "Starter",
            price: "$25/mo",
            yearly: "$19/mo (billed $228/yr)",
            features: [
              "Unlimited boards & posts",
              "125 tracked users included",
              "25-user grace buffer (overage starts at 150)",
              "Overage: $6 per 50 users",
              "Unlimited team members, 5 admins",
              "Unlimited roadmap items",
              "Autopilot (manual mode)",
              "AI Chat",
              "Slack, Discord & Intercom integrations",
              "Custom branding",
              "Webhooks & API access",
            ],
          },
          {
            name: "Pro",
            price: "$59/mo",
            yearly: "$49/mo (billed $588/yr)",
            features: [
              "Everything in Starter, plus:",
              "125 tracked users included",
              "25-user grace buffer (overage starts at 150)",
              "Overage: $6 per 50 users",
              "Up to 10 admins",
              "Autopilot (automatic mode)",
              "AI severity classification",
              "High-severity Slack/Discord alerts",
              "Instant notifications",
              "1 custom domain",
              "Priority support",
              "Advanced security",
            ],
          },
        ].map((plan) => (
          <Card key={plan.name} className="border-2">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{plan.name}</h3>
              <p className="text-2xl font-bold text-blue-600">{plan.price}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{plan.yearly}</p>
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="not-prose mt-8 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Tracked Users &amp; Overage</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
          Both Starter and Pro include <strong>125 tracked users</strong> per month with a <strong>25-user grace buffer</strong>.
          Overage begins at 150 users, billed at <strong>$6 per block of 50 users</strong> via Paddle.
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Free plan has a hard cap of 20 tracked users — no overage is available. When the limit is reached, new users can still submit feedback but are not tracked.
        </p>
      </div>

      <div className="not-prose mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Related articles</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link href="/docs/plans/limits">
            <Card className="group hover:shadow-lg transition-all border hover:border-blue-300 dark:hover:border-blue-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Usage limits</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Detailed limits for boards, posts, and tracked users</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/features/team">
            <Card className="group hover:shadow-lg transition-all border hover:border-blue-300 dark:hover:border-blue-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Team roles &amp; permissions</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Member and admin limits per plan</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/getting-started/invite-team">
            <Card className="group hover:shadow-lg transition-all border hover:border-blue-300 dark:hover:border-blue-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Invite team members</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Add teammates up to your plan limit</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
