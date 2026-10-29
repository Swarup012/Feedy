import { docsMetadata } from "../../docs-nav";
import { DocsArticle } from "../../components/docs-article";
import { DocsH2, DocsH3 } from "../../components/docs-headings";

export const metadata = docsMetadata("/docs/features/triage");

export default function TriageDocsPage() {
  return (
    <DocsArticle href="/docs/features/triage">
      <DocsH2>Using the board view</DocsH2>
      <p>
        Open <strong>Admin → Feedback</strong> and select a board from the left
        sidebar. The main panel shows all posts for that board, with filters and
        search at the top.
      </p>

      <DocsH3>Filters &amp; search</DocsH3>
      <ul>
        <li>
          <strong>Search</strong> — type in the &ldquo;Search posts...&rdquo;
          input to filter by title or description in real-time.
        </li>
        <li>
          <strong>Status filter</strong> — click &ldquo;All statuses&rdquo; to
          narrow by Open, Under Review, Planned, In Progress, Completed, or
          Closed.
        </li>
        <li>
          <strong>Sort</strong> — choose Newest First, Most Upvoted, or Most
          Commented.
        </li>
      </ul>

      <DocsH2>Updating post status</DocsH2>
      <p>
        Click any post to open the details panel on the right. Admins and owners
        see a <strong>Status</strong> dropdown with all six options. Select a new
        status and the change saves instantly.
      </p>
      <p>
        When you mark a post as <strong>Completed</strong>, Faddy prompts you to
        create a changelog entry and notifies users who engaged with the post.
      </p>

      <DocsH2>Assigning categories</DocsH2>
      <p>
        In the post details panel, click the <strong>Category</strong> field to
        assign a label. You can pick from your org&rsquo;s custom labels or type
        a freeform category. Categories help with filtering and reporting.
      </p>

      <DocsH2>Creating posts on behalf of users</DocsH2>
      <p>
        Click <strong>New Post</strong> at the top of the posts list. Fill in the
        title, optional category, and description. This is useful when a
        customer emails you feedback directly instead of using the board.
      </p>
    </DocsArticle>
  );
}
