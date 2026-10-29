import Link from "next/link";
import { docsMetadata } from "../../docs-nav";
import { DocsArticle } from "../../components/docs-article";
import { DocsH2 } from "../../components/docs-headings";
import { DocsCodeBlock } from "../../components/docs-code-block";

export const metadata = docsMetadata("/docs/features/widget");

export default function WidgetDocsPage() {
  return (
    <DocsArticle href="/docs/features/widget">
      <DocsH2>Creating a widget</DocsH2>
      <ol>
        <li>
          Go to <strong>Organization Settings → Widgets</strong>.
        </li>
        <li>
          Click <strong>Create Widget</strong>.
        </li>
        <li>
          Fill in the details:
          <ul>
            <li>
              <strong>Widget Name</strong> — e.g., &ldquo;Product Feedback
              Widget&rdquo;
            </li>
            <li>
              <strong>Default Board</strong> — which board receives feedback
              from this widget
            </li>
            <li>
              <strong>Allowed Domains</strong> — comma-separated list of domains
              (e.g., <code>yourapp.com, app.yourapp.com</code>). Leave empty to
              allow all domains (not recommended for production).
            </li>
            <li>
              <strong>Primary Color</strong> — accent color for the button and
              header
            </li>
          </ul>
        </li>
        <li>
          Configure settings:
          <ul>
            <li>
              <strong>Show voting</strong> — let users upvote (default: on)
            </li>
            <li>
              <strong>Allow anonymous feedback</strong> — submit without
              identifying (default: off)
            </li>
            <li>
              <strong>Show roadmap view</strong> — show roadmap tab (default:
              on)
            </li>
            <li>
              <strong>Require Secure Identity (HMAC)</strong> — signed identity
              tokens (default: on)
            </li>
          </ul>
        </li>
        <li>
          Click <strong>Create Widget</strong>. Copy your API Secret immediately
          — it&rsquo;s shown once and never again.
        </li>
      </ol>

      <DocsH2>Adding the widget to your site</DocsH2>
      <p>
        Click <strong>Copy Embed Code</strong> on your widget card, then paste
        the snippet before the closing <code>&lt;/body&gt;</code> tag on every
        page where the widget should appear:
      </p>
      <DocsCodeBlock
        title="widget embed"
        code={`<script src="https://your-backend-url/widget.js"></script>
<script>
  FeedyWidget.init({
    apiKey: 'your-widget-api-key',
    color: '#3b82f6'
  });
</script>`}
      />

      <DocsH2>Identifying users</DocsH2>
      <p>
        To attribute feedback to specific users, call{" "}
        <code>FeedyWidget.identify()</code> from your page. This requires an
        HMAC signature generated on your server using the API Secret.
      </p>
      <p>
        Without identification, the user can still submit feedback but
        won&rsquo;t be tracked as a{" "}
        <Link href="/docs/plans/limits">tracked user</Link>.
      </p>

      <DocsH2>Managing your widget</DocsH2>
      <p>
        Go to <strong>Organization Settings → Widgets</strong> to edit any
        widget. You can change all settings except the API key. To rotate the
        API Secret (invalidate the old one), click <strong>Rotate Secret</strong>.
      </p>
    </DocsArticle>
  );
}
