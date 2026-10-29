import { docsMetadata } from "../../docs-nav";
import { DocsArticle } from "../../components/docs-article";
import { DocsH2 } from "../../components/docs-headings";

export const metadata = docsMetadata("/docs/features/labels");

export default function LabelsDocsPage() {
  return (
    <DocsArticle href="/docs/features/labels">
      <DocsH2>Default labels</DocsH2>
      <p>
        Every org starts with three default labels:{" "}
        <strong>Feature Request</strong>, <strong>Bug Report</strong>, and{" "}
        <strong>General Feedback</strong>. These appear in the category dropdown
        when creating or editing posts.
      </p>

      <DocsH2>Creating custom labels</DocsH2>
      <ol>
        <li>
          Go to <strong>Organization Settings</strong> from the admin sidebar.
        </li>
        <li>
          Labels are managed per-organization. Create new labels via the API or
          by typing a custom category directly when creating a post.
        </li>
        <li>
          Custom categories typed during post creation are saved and appear in
          the dropdown for future posts.
        </li>
      </ol>

      <DocsH2>Assigning labels to posts</DocsH2>
      <p>
        When creating a post, use the <strong>Category</strong> dropdown to
        select a label. You can also type a custom category directly — Faddy
        saves it for future use.
      </p>
      <p>
        To change a post&rsquo;s category later, open the post details panel and
        click the <strong>Category</strong> field. Only admins and owners can
        edit categories.
      </p>

      <DocsH2>Using labels for filtering</DocsH2>
      <p>
        Labels help you filter and segment feedback. On the admin board view,
        use the search input to find posts by category name. In Expert View, the
        Autopilot Performance panel shows feedback volume by category.
      </p>
    </DocsArticle>
  );
}
