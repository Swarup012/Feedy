import { docsMetadata } from "../../docs-nav";
import { DocsArticle } from "../../components/docs-article";
import { DocsH2 } from "../../components/docs-headings";

export const metadata = docsMetadata("/docs/features/submitting-feedback");

export default function SubmittingFeedbackPage() {
  return (
    <DocsArticle href="/docs/features/submitting-feedback">
      <DocsH2>Finding the right board</DocsH2>
      <p>
        Go to your company&rsquo;s feedback page (for example,{" "}
        <code>yourcompany.faddy.site/feedback</code>). You&rsquo;ll see a list
        of boards — each one is a category like &ldquo;Feature Requests&rdquo;
        or &ldquo;Bug Reports.&rdquo; Click the board that best fits what you
        want to share.
      </p>

      <DocsH2>Creating a new post</DocsH2>
      <ol>
        <li>
          <strong>Click &ldquo;New Post&rdquo;</strong> — you&rsquo;ll find this
          button on the board page.
        </li>
        <li>
          <strong>Enter a title</strong> — a short, clear summary of your idea or
          issue (for example, &ldquo;Add dark mode to settings page&rdquo;).
        </li>
        <li>
          <strong>Choose a category</strong> — if the board has categories, pick
          the one that fits (Bug, Feature Request, Improvement, etc.).
        </li>
        <li>
          <strong>Describe your feedback</strong> — explain what you need, why it
          matters, or the steps to reproduce a bug. Be as specific as you can.
        </li>
        <li>
          <strong>Attach images (optional)</strong> — screenshots, mockups, or
          screen recordings help the team understand your feedback.
        </li>
      </ol>

      <DocsH2>Tips for good feedback</DocsH2>
      <ul>
        <li>One idea per post — it&rsquo;s easier for the team to act on</li>
        <li>Use a specific title instead of a vague one</li>
        <li>Explain the &ldquo;why&rdquo; — what problem does this solve for you?</li>
        <li>Check if someone already posted a similar idea and upvote it instead</li>
      </ul>

      <DocsH2>What happens next</DocsH2>
      <p>
        Once submitted, your post appears on the board with an &ldquo;Open&rdquo;
        status. The product team reviews submissions regularly. You can follow
        the post to get notified when its status changes or when the team
        posts an update.
      </p>
    </DocsArticle>
  );
}
