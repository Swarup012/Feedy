import { docsMetadata } from "../../docs-nav";
import { DocsArticle } from "../../components/docs-article";
import { DocsH2 } from "../../components/docs-headings";

export const metadata = docsMetadata("/docs/features/intercom");

export default function IntercomDocsPage() {
  return (
    <DocsArticle href="/docs/features/intercom">
      <DocsH2>What you get</DocsH2>
      <ul>
        <li>
          When a support conversation closes in Intercom, the transcript is sent to
          Faddy for analysis
        </li>
        <li>AI detects whether the conversation contains product feedback</li>
        <li>
          Detected feedback becomes a suggestion in Autopilot (manual mode) or a
          post on your board (automatic mode)
        </li>
      </ul>

      <DocsH2>Connecting Intercom</DocsH2>
      <ol>
        <li>
          Go to <strong>Organization Settings → Integrations</strong>.
        </li>
        <li>
          Find the <strong>Intercom</strong> card and click <strong>Connect</strong>.
        </li>
        <li>
          You&apos;ll be redirected to Intercom. Click{" "}
          <strong>Authorize access</strong> to grant Faddy permission to read
          conversations.
        </li>
        <li>
          You&apos;ll return to Faddy. A toast says{" "}
          <strong>&ldquo;Intercom connected&rdquo;</strong>.
        </li>
      </ol>

      <DocsH2>Setting up the webhook</DocsH2>
      <p>
        For Faddy to receive conversation transcripts, you need to configure a
        webhook in Intercom:
      </p>
      <ol>
        <li>
          In Intercom, go to <strong>Settings → Webhooks</strong>.
        </li>
        <li>
          Subscribe to the <strong>conversation.admin.closed</strong> event.
        </li>
        <li>
          Point the webhook URL to your Faddy public webhook endpoint. Your
          Intercom integration card in Faddy shows this URL.
        </li>
      </ol>

      <DocsH2>Configuring Autopilot mode</DocsH2>
      <p>
        Click <strong>Manage</strong> on the Intercom card to configure:
      </p>
      <ul>
        <li>
          <strong>Automatic Mode</strong> — toggle on to publish feedback directly
          without review (Pro only)
        </li>
        <li>
          <strong>Default Board</strong> — select which board receives
          Intercom-sourced feedback
        </li>
      </ul>

      <DocsH2>Disconnecting</DocsH2>
      <p>
        Click <strong>Disconnect Intercom</strong> in the Manage popover. You
        should also remove the webhook from Intercom Settings → Webhooks to stop
        sending data to Faddy.
      </p>
    </DocsArticle>
  );
}
