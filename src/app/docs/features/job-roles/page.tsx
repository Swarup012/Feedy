import { docsMetadata } from "../../docs-nav";
import { DocsArticle } from "../../components/docs-article";
import { DocsH2 } from "../../components/docs-headings";
import { DocsCallout } from "../../components/docs-callout";

export const metadata = docsMetadata("/docs/features/job-roles");

export default function JobRolesDocsPage() {
  return (
    <DocsArticle href="/docs/features/job-roles">
      <DocsH2>What are job roles?</DocsH2>
      <p>
        Job roles are professional labels — like &ldquo;Product Manager,&rdquo;{" "}
        &ldquo;Engineer,&rdquo; or &ldquo;Designer&rdquo; — that you assign to team
        members. They&apos;re separate from permission roles (owner, admin, member)
        and are used for board visibility targeting.
      </p>

      <DocsH2>Creating a job role</DocsH2>
      <ol>
        <li>
          Go to <strong>Organization Settings → Job Roles</strong>.
        </li>
        <li>
          Click <strong>Add Role</strong>.
        </li>
        <li>
          Enter a role name (e.g., &ldquo;Senior Developer&rdquo;) and click{" "}
          <strong>Save Role</strong>.
        </li>
      </ol>
      <DocsCallout variant="note">
        <p>Only admins and owners can create job roles.</p>
      </DocsCallout>

      <DocsH2>Assigning roles to team members</DocsH2>
      <p>
        When inviting a new member, use the <strong>Job Role</strong> dropdown in the
        invite dialog to assign a role. You can also change a member&apos;s job role
        later from <strong>Organization Settings → Members</strong>.
      </p>

      <DocsH2>Using job roles for board visibility</DocsH2>
      <p>
        When creating or editing a board, job roles appear as toggle chips below the
        privacy setting. Click a role to restrict the board to team members with
        that role.
      </p>
      <p>
        For example, if you toggle &ldquo;Engineer&rdquo; on a &ldquo;Bug
        Reports&rdquo; board, only team members with the Engineer job role will see
        that board in their admin view.
      </p>
      <DocsCallout variant="note">
        <p>If no roles are toggled, the board is visible to all team members.</p>
      </DocsCallout>

      <DocsH2>Editing and deleting roles</DocsH2>
      <p>
        Hover over a role chip in the Job Roles settings to see edit and delete
        buttons. Some default roles cannot be deleted — the delete button is
        disabled with an explanation.
      </p>
      <DocsCallout variant="note">
        <p>
          When you delete a role, team members who had it will need to be
          reassigned.
        </p>
      </DocsCallout>
    </DocsArticle>
  );
}
