import { docsMetadata } from "../../docs-nav";
import { DocsArticle } from "../../components/docs-article";
import { DocsH2 } from "../../components/docs-headings";

export const metadata = docsMetadata("/docs/features/using-widget");

export default function UsingWidgetPage() {
  return (
    <DocsArticle href="/docs/features/using-widget">
      <DocsH2>What the widget looks like</DocsH2>
      <p>
        The feedback widget is a small button embedded in the product. It
        usually appears in the bottom-right corner of the screen. When you
        click it, a panel opens where you can browse boards and submit
        feedback.
      </p>

      <DocsH2>Submitting feedback from the widget</DocsH2>
      <ol>
        <li>
          <strong>Click the widget button</strong> to open the panel.
        </li>
        <li>
          <strong>Select a board</strong> that matches your feedback (for example,
          &ldquo;Feature Requests&rdquo; or &ldquo;Bug Reports&rdquo;).
        </li>
        <li>
          <strong>Click &ldquo;New Post&rdquo;</strong> and fill in a title,
          category, and description.
        </li>
        <li>
          <strong>Submit</strong> — your post appears on the board immediately.
        </li>
      </ol>

      <DocsH2>Identifying yourself</DocsH2>
      <p>
        If the product has set up user identity, the widget may automatically
        show your name and email to the team. You do not need to do anything
        extra. If you are not logged in, you may be asked for your name and
        email when you submit feedback.
      </p>

      <DocsH2>Browsing existing posts</DocsH2>
      <p>
        Before creating a new post, check if someone already suggested the same
        thing. Use the search bar in the widget or scroll through the board.
        If you find a matching post, upvote it instead of creating a duplicate.
      </p>
    </DocsArticle>
  );
}
