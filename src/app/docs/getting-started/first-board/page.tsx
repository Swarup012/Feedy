import Link from "next/link";
import { docsMetadata } from "../../docs-nav";
import { DocsArticle } from "../../components/docs-article";
import { DocsH2, DocsH3 } from "../../components/docs-headings";

export const metadata = docsMetadata("/docs/getting-started/first-board");

export default function FirstBoardPage() {
  return (
    <DocsArticle href="/docs/getting-started/first-board">
      <DocsH2>What is a Feedback Board?</DocsH2>
      <p>
        A board is like a category or container for organizing feedback. Think
        of it as a dedicated space for specific types of feedback like "Feature
        Requests", "Bug Reports", or "Product Ideas".
      </p>

      <DocsH2>Step-by-Step Instructions</DocsH2>

      <DocsH3>Navigate to Admin Dashboard</DocsH3>
      <p>
        After logging in, you&apos;ll see the admin dashboard. Click on{" "}
        <strong>&quot;Manage Feedback&quot;</strong> in the Quick Actions
        section.
      </p>

      <DocsH3>Click &quot;New Board&quot;</DocsH3>
      <p>
        In the feedback management page, click the{" "}
        <strong>&quot;+ New Board&quot;</strong> button.
      </p>

      <DocsH3>Configure Your Board</DocsH3>
      <p>Fill in the board details:</p>
      <ul>
        <li>
          <strong>Board Name:</strong> Choose a clear, descriptive name (e.g.,
          "Feature Requests", "Bug Reports")
        </li>
        <li>
          <strong>Description:</strong> Explain what type of feedback this board
          is for
        </li>
        <li>
          <strong>Visibility:</strong> Choose Public (anyone can view) or
          Private (team only)
        </li>
      </ul>

      <DocsH3>Click Create</DocsH3>
      <p>
        Hit the <strong>&quot;Create Board&quot;</strong> button and
        you&apos;re done! Your board is now ready to collect feedback.
      </p>

      <DocsH2>Best Practices</DocsH2>
      <ul>
        <li>
          <strong>Keep boards focused:</strong> Create separate boards for
          different categories (Features, Bugs, UX Improvements)
        </li>
        <li>
          <strong>Use clear names:</strong> Board names should be immediately
          understandable to users
        </li>
        <li>
          <strong>Start with 2-3 boards:</strong> Don&apos;t overwhelm users
          with too many options initially
        </li>
      </ul>

      <DocsH2>What&apos;s Next?</DocsH2>
      <p>
        <Link href="/docs/getting-started/invite-team">Invite Your Team</Link>{" "}
        to add team members to help manage feedback, or explore{" "}
        <Link href="/docs/features/boards">Board Features</Link> to see all
        board features and settings.
      </p>
    </DocsArticle>
  );
}
