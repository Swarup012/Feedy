import { docsMetadata } from "../../docs-nav";
import { DocsArticle } from "../../components/docs-article";
import { DocsH2 } from "../../components/docs-headings";

export const metadata = docsMetadata("/docs/features/following-roadmap");

export default function FollowingRoadmapPage() {
  return (
    <DocsArticle href="/docs/features/following-roadmap">
      <DocsH2>Opening the roadmap</DocsH2>
      <p>
        Go to your company roadmap page (for example,{" "}
        <code>yourcompany.faddy.site/roadmap</code>). You can also find a link
        to it in the top navigation of the feedback board.
      </p>

      <DocsH2>Understanding the columns</DocsH2>
      <p>The roadmap is organized into four columns:</p>
      <ul>
        <li>
          <strong>Planned</strong> — Ideas the team has committed to but has not
          started yet.
        </li>
        <li>
          <strong>In Progress</strong> — The team is actively building this right
          now.
        </li>
        <li>
          <strong>In Review</strong> — Built and waiting to be tested or
          deployed.
        </li>
        <li>
          <strong>Completed</strong> — Released and available to you now.
        </li>
      </ul>

      <DocsH2>Filtering by board</DocsH2>
      <p>
        If your company has multiple boards (Feature Requests, Bug Reports,
        etc.), use the board filter at the top of the roadmap to narrow down
        what you see.
      </p>

      <DocsH2>Following a post from the roadmap</DocsH2>
      <p>
        Click any item on the roadmap to open its detail page. From there you
        can follow it to receive notifications when the status changes or when
        the team posts an update.
      </p>
    </DocsArticle>
  );
}
