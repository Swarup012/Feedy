"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, ArrowRight } from "lucide-react";

export default function JobRolesDocsPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <div className="not-prose mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 text-sm font-semibold mb-4">
          <Briefcase className="h-3.5 w-3.5" />
          Team
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          Setting Up Job Roles
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Create professional labels for your team and control board visibility.
        </p>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        What are job roles?
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Job roles are professional labels — like &ldquo;Product Manager,&rdquo;{" "}
        &ldquo;Engineer,&rdquo; or &ldquo;Designer&rdquo; — that you assign to
        team members. They&rsquo;re separate from permission roles (owner, admin,
        member) and are used for board visibility targeting.
      </p>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Creating a job role
      </h2>
      <Card className="not-prose mb-8 border-2">
        <CardContent className="p-6">
          <ol className="space-y-4 text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-bold text-sm flex-shrink-0">
                1
              </span>
              <span>
                Go to <strong>Organization Settings → Job Roles</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-bold text-sm flex-shrink-0">
                2
              </span>
              <span>
                Click <strong>Add Role</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 font-bold text-sm flex-shrink-0">
                3
              </span>
              <span>
                Enter a role name (e.g., &ldquo;Senior Developer&rdquo;) and click{" "}
                <strong>Save Role</strong>.
              </span>
            </li>
          </ol>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
            Only admins and owners can create job roles.
          </p>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Assigning roles to team members
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        When inviting a new member, use the <strong>Job Role</strong> dropdown in
        the invite dialog to assign a role. You can also change a member&rsquo;s
        job role later from <strong>Organization Settings → Members</strong>.
      </p>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Using job roles for board visibility
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        When creating or editing a board, job roles appear as toggle chips below
        the privacy setting. Click a role to restrict the board to team members
        with that role.
      </p>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        For example, if you toggle &ldquo;Engineer&rdquo; on a &ldquo;Bug
        Reports&rdquo; board, only team members with the Engineer job role will
        see that board in their admin view.
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        If no roles are toggled, the board is visible to all team members.
      </p>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Editing and deleting roles
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Hover over a role chip in the Job Roles settings to see edit and delete
        buttons. Some default roles cannot be deleted — the delete button is
        disabled with an explanation.
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        When you delete a role, team members who had it will need to be
        reassigned.
      </p>

      <div className="not-prose mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Related articles
        </h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link href="/docs/getting-started/invite-team">
            <Card className="group hover:shadow-lg transition-all border hover:border-teal-300 dark:hover:border-teal-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  Inviting team members
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Add teammates and assign job roles during invite
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/features/team">
            <Card className="group hover:shadow-lg transition-all border hover:border-teal-300 dark:hover:border-teal-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  Team roles &amp; permissions
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Owner, admin, and member permission levels
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/features/boards">
            <Card className="group hover:shadow-lg transition-all border hover:border-teal-300 dark:hover:border-teal-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                  Setting up boards
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Use job roles to control board visibility
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
