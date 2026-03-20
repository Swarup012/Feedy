"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle2, Users, Mail, Shield, UserPlus } from "lucide-react";

export default function InviteTeamPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      {/* Header */}
      <div className="not-prose mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm font-semibold mb-4">
          <Users className="h-3.5 w-3.5" />
          Getting Started
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          Invite Team Members
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Collaborate with your team by inviting admins and members
        </p>
      </div>

      {/* Why Invite */}
      <Card className="not-prose mb-8 border-2 border-green-200 dark:border-green-800">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-green-100 dark:bg-green-900/50">
              <Users className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                Why Invite Your Team?
              </h3>
              <p className="text-slate-600 dark:text-slate-400">
                Inviting team members lets you share the workload of reviewing feedback, updating roadmaps, and publishing changelogs.
                Different roles ensure the right people have the right access.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
        Step-by-Step Instructions
      </h2>

      <div className="not-prose space-y-6">
        {/* Step 1 */}
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white font-bold flex-shrink-0">
            1
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
              Open Organization Settings
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              From the Admin Dashboard, click <strong>"Organization"</strong> in Quick Actions or the top navigation.
            </p>
          </div>
        </div>

        {/* Step 2 */}
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white font-bold flex-shrink-0">
            2
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
              Click "Invite Member"
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              In the organization page, click the <strong>"Invite Member"</strong> button to open the invite modal.
            </p>
          </div>
        </div>

        {/* Step 3 */}
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white font-bold flex-shrink-0">
            3
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
              Enter Details
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-3">
              Fill out the invite form:
            </p>
            <ul className="space-y-2 text-slate-600 dark:text-slate-400">
              <li className="flex items-start gap-2">
                <Mail className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Email:</strong> Team member's email address</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Role:</strong> Admin (full access) or Member (limited access)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Step 4 */}
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white font-bold flex-shrink-0">
            4
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
              Send Invitation
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Click <strong>"Send Invite"</strong>. Your teammate will receive an email with a link to join.
            </p>
          </div>
        </div>
      </div>

      {/* Roles */}
      <Card className="not-prose mt-12 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-200 dark:border-green-800">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            👥 Team Roles
          </h3>
          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Owner</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Full control over billing, settings, and team management.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Admin</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Manage feedback, roadmaps, and changelogs.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Member</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">View and comment, with limited editing permissions.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps */}
      <div className="not-prose mt-12">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
          Next Steps
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <Link href="/docs/features/team">
            <Card className="group hover:shadow-xl transition-all border-2 hover:border-green-300 dark:hover:border-green-700 h-full">
              <CardContent className="p-5">
                <h4 className="font-bold text-slate-900 dark:text-white mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  Team Permissions →
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Learn about roles and permissions
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/features/boards">
            <Card className="group hover:shadow-xl transition-all border-2 hover:border-green-300 dark:hover:border-green-700 h-full">
              <CardContent className="p-5">
                <h4 className="font-bold text-slate-900 dark:text-white mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                  Feedback Boards →
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Explore board features and settings
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
