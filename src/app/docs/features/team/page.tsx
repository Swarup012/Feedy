import { docsMetadata } from "../../docs-nav";
import { DocsArticle } from "../../components/docs-article";
import { DocsH2 } from "../../components/docs-headings";

export const metadata = docsMetadata("/docs/features/team");

export default function TeamDocsPage() {
  return (
    <DocsArticle href="/docs/features/team">
      <DocsH2>Roles</DocsH2>
      <ul>
        <li>
          <strong>Owner</strong>: Full access to billing and settings
        </li>
        <li>
          <strong>Admin</strong>: Manage feedback, roadmap, and changelog
        </li>
        <li>
          <strong>Member</strong>: Limited editing permissions
        </li>
      </ul>
    </DocsArticle>
  );
}
