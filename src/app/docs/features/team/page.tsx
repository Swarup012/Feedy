"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Shield, ArrowRight } from "lucide-react";

export default function TeamDocsPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <div className="not-prose mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-semibold mb-4">
          <Users className="h-3.5 w-3.5" />
          Features
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Team & Permissions</h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Manage team roles and permissions across your organization.
        </p>
      </div>

      <Card className="not-prose mb-8 border-2">
        <CardContent className="p-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Roles</h3>
          <ul className="space-y-3 text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-2"><Shield className="h-5 w-5 text-blue-600 mt-0.5" />Owner: Full access to billing and settings</li>
            <li className="flex items-start gap-2"><Shield className="h-5 w-5 text-blue-600 mt-0.5" />Admin: Manage feedback, roadmap, and changelog</li>
            <li className="flex items-start gap-2"><Shield className="h-5 w-5 text-blue-600 mt-0.5" />Member: Limited editing permissions</li>
          </ul>
        </CardContent>
      </Card>

      <div className="not-prose mt-12">
        <Link href="/docs/plans/comparison">
          <Button variant="outline" className="border-2">
            Next: Plans & Billing
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
