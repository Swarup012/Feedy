import { docsMetadata } from "../../docs-nav";
import { DocsArticle } from "../../components/docs-article";
import { DocsH2 } from "../../components/docs-headings";

export const metadata = docsMetadata("/docs/features/alerts");

export default function AlertsDocsPage() {
  return (
    <DocsArticle href="/docs/features/alerts">
      <DocsH2>What triggers an alert</DocsH2>
      <p>
        When a post is classified as <strong>high severity</strong> (billing,
        security, or data loss), Faddy can send a notification to a Slack or
        Discord channel you configure.
      </p>
      <p>
        Alerts are batched within a 30-second window — if multiple high-severity
        posts arrive at the same time, they&rsquo;re combined into one message.
      </p>
      <p>
        Alert channels are available on <strong>Starter and Pro</strong>. On
        Starter, severity is assigned by keyword rules (billing, security, data
        loss). On Pro, an AI model scores each post instead, so alerts can fire
        on wording the rules would miss.
      </p>

      <DocsH2>Setting up alerts</DocsH2>
      <ol>
        <li>
          Connect Slack or Discord from{" "}
          <strong>Organization Settings → Integrations</strong> (if not already
          connected).
        </li>
        <li>
          Go to <strong>Organization Settings → Notifications</strong>.
        </li>
        <li>
          Toggle on <strong>High-Severity Alerts</strong>.
        </li>
        <li>
          Under <strong>Alert Destinations</strong>, click{" "}
          <strong>Add channel</strong>.
        </li>
        <li>
          Select a provider (Slack or Discord) and choose a channel. Click{" "}
          <strong>Add</strong>.
        </li>
      </ol>

      <DocsH2>Alert destinations vs ingestion channels</DocsH2>
      <p>
        Alert destinations are <strong>independent</strong> of the channel used
        for feedback ingestion. For example, you might ingest feedback from{" "}
        <code>#product-feedback</code> but send high-severity alerts to{" "}
        <code>#urgent</code>.
      </p>

      <DocsH2>Managing channels</DocsH2>
      <p>
        Each configured channel has its own toggle switch and delete button. You
        can disable individual channels without removing them. If your Slack
        token lacks the <code>chat:write</code> permission, a reconnect banner
        will appear with a <strong>Reconnect</strong> button.
      </p>
    </DocsArticle>
  );
}
