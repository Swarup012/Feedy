"use client";

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
          { name: "Free", price: "$0", features: ["3 Boards", "20 Tracked Users", "Basic Roadmap"] },
          { name: "Starter", price: "$19/mo", features: ["Unlimited Boards", "125 Tracked Users", "Advanced Analytics"] },
          { name: "Pro", price: "$49/mo", features: ["Unlimited Boards", "Priority Support", "Advanced Analytics"] },
        ].map((plan) => (
          <Card key={plan.name} className="border-2">
            <CardContent className="p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{plan.name}</h3>
              <p className="text-2xl font-bold text-blue-600 mb-4">{plan.price}</p>
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-slate-600 dark:text-slate-400">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
