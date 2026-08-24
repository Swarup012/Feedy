"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Users, Mail, Shield } from "lucide-react";

export default function InviteTeamPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
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
                Inviting team members lets you share the workload of reviewing
                feedback, updating roadmaps, and publishing changelogs.
                Different roles ensure the right people have the right access.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
        Step-by-Step Instructions
      </h2>

      <div className="not-prose space-y-6">
        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white font-bold flex-shrink-0">
            1
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
              Open Organization Settings
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              From the Admin Dashboard, click <strong>&ldquo;Organization&rdquo;</strong> in Quick Actions or the top navigation.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white font-bold flex-shrink-0">
            2
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
              Click &ldquo;Invite Member&rdquo;
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              In the organization page, click the <strong>&ldquo;Invite Member&rdquo;</strong> button to open the invite modal.
            </p>
          </div>
        </div>

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
                <span><strong>Email:</strong> Team member&rsquo;s email address</span>
              </li>
              <li className="flex items-start gap-2">
                <Shield className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                <span><strong>Role:</strong> Admin (full access) or Member (limited access)</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex items-start gap-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white font-bold flex-shrink-0">
            4
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">
              Send Invitation
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Click <strong>&ldquo;Send Invite&rdquo;</strong>. Your teammate will receive an email with a link to join.
            </p>
          </div>
        </div>
      </div>

      <Card className="not-prose mt-12 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-2 border-green-200 dark:border-green-800">
        <CardContent className="p-6">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
            Team Roles
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

      <div className="not-prose mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Related articles</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link href="/docs/features/team">
            <Card className="group hover:shadow-lg transition-all border hover:border-green-300 dark:hover:border-green-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Team roles &amp; permissions</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">What owners, admins, and members can do</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/features/boards">
            <Card className="group hover:shadow-lg transition-all border hover:border-green-300 dark:hover:border-green-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Setting up boards</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Create feedback boards for your team to manage</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/plans/comparison">
            <Card className="group hover:shadow-lg transition-all border hover:border-green-300 dark:hover:border-green-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">Understanding your plan</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Team member limits per tier</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
