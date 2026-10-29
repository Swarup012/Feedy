import { docsMetadata } from "../../docs-nav";
import { DocsArticle } from "../../components/docs-article";
import { DocsH2, DocsH3 } from "../../components/docs-headings";

export const metadata = docsMetadata("/docs/features/autopilot");

export default function AutopilotDocsPage() {
  return (
    <DocsArticle href="/docs/features/autopilot">
      <DocsH2>How Smartflow works</DocsH2>
      <p>
        Smartflow uses AI to analyze text and determine whether it contains
        product feedback. If it does, it extracts a title, description, and
        category. If the text is noise (off-topic chatter, greetings, etc.), it
        tells you nothing was found.
      </p>
      <p>
        You can paste text directly into the Smartflow dashboard, or connect
        integrations (Slack, Discord, Intercom, GitHub) to automatically ingest
        messages.
      </p>

      <DocsH2>Manual vs Automatic mode</DocsH2>

      <DocsH3>Manual mode</DocsH3>
      <p>
        Default for all integrations. AI creates a suggestion, you review it in
        the Review queue, then approve or reject.
      </p>
      <p>
        <strong>Good for:</strong> Teams that want human oversight on every
        piece of feedback before it goes public.
      </p>

      <DocsH3>Automatic mode</DocsH3>
      <p>
        AI publishes posts directly to your board without review. No human step
        — feedback goes live instantly. Automatic mode requires the Pro plan.
      </p>
      <p>
        <strong>Good for:</strong> High-volume teams that trust the AI
        classification and want zero friction.
      </p>

      <DocsH2>Pasting text directly</DocsH2>
      <ol>
        <li>
          Go to <strong>Admin → Smartflow</strong>.
        </li>
        <li>
          Paste raw text into the text area — a support chat, email, app review,
          or any text that might contain feedback.
        </li>
        <li>
          Click <strong>Run Smartflow</strong>. The word counter shows how much
          text you&rsquo;ve pasted.
        </li>
        <li>
          In manual mode, a toast says &ldquo;Suggestion queued&rdquo; and the
          suggestion appears in the Review queue. In automatic mode, the post is
          created immediately.
        </li>
      </ol>

      <DocsH2>Reviewing suggestions</DocsH2>
      <p>
        The Review queue on the right side of the Smartflow page shows all
        suggestions. Use the status filter to switch between Pending, Approved,
        Rejected, or All.
      </p>
      <p>For each pending suggestion:</p>
      <ul>
        <li>Read the AI-generated title and description</li>
        <li>
          Click <strong>View source text</strong> to see the original input
        </li>
        <li>Select a board from the dropdown</li>
        <li>
          Click <strong>Approve</strong> to publish, or <strong>Reject</strong>{" "}
          to dismiss
        </li>
      </ul>

      <DocsH2>Connecting sources</DocsH2>
      <p>
        To automatically ingest feedback from external tools, connect an
        integration from <strong>Organization Settings → Integrations</strong>.
        Each connected integration can be set to Manual or Automatic mode
        independently.
      </p>
    </DocsArticle>
  );
}
