import { docsMetadata } from "../../docs-nav";
import { DocsArticle } from "../../components/docs-article";
import { DocsH2, DocsH3 } from "../../components/docs-headings";

export const metadata = docsMetadata("/docs/getting-started/invite-team");

export default function InviteTeamPage() {
  return (
    <DocsArticle href="/docs/getting-started/invite-team">
      <DocsH2>Why Invite Your Team?</DocsH2>
      <p>
        Inviting team members lets you share the workload of reviewing
        feedback, updating roadmaps, and publishing changelogs. Different roles
        ensure the right people have the right access.
      </p>

      <DocsH2>Step-by-Step Instructions</DocsH2>

      <DocsH3>Open Organization Settings</DocsH3>
      <p>
        From the Admin Dashboard, click <strong>&ldquo;Organization&rdquo;</strong>{" "}
        in Quick Actions or the top navigation.
      </p>

      <DocsH3>Click &quot;Invite Member&quot;</DocsH3>
      <p>
        In the organization page, click the{" "}
        <strong>&ldquo;Invite Member&rdquo;</strong> button to open the invite
        modal.
      </p>

      <DocsH3>Enter Details</DocsH3>
      <p>Fill out the invite form:</p>
      <ul>
        <li>
          <strong>Email:</strong> Team member&rsquo;s email address
        </li>
        <li>
          <strong>Role:</strong> Admin (full access) or Member (limited access)
        </li>
      </ul>

      <DocsH3>Send Invitation</DocsH3>
      <p>
        Click <strong>&ldquo;Send Invite&rdquo;</strong>. Your teammate will
        receive an email with a link to join.
      </p>

      <DocsH2>Team Roles</DocsH2>

      <DocsH3>Owner</DocsH3>
      <p>Full control over billing, settings, and team management.</p>

      <DocsH3>Admin</DocsH3>
      <p>Manage feedback, roadmaps, and changelogs.</p>

      <DocsH3>Member</DocsH3>
      <p>View and comment, with limited editing permissions.</p>
    </DocsArticle>
  );
}
