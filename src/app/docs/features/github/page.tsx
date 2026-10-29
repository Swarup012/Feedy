import { docsMetadata } from "../../docs-nav";
import { DocsArticle } from "../../components/docs-article";
import { DocsH2 } from "../../components/docs-headings";

export const metadata = docsMetadata("/docs/features/github");

export default function GitHubDocsPage() {
  return (
    <DocsArticle href="/docs/features/github">
      <DocsH2>What you get</DocsH2>
      <ul>
        <li>
          Issues and pull requests from your GitHub repos are analyzed for feedback
        </li>
        <li>
          Detected feedback becomes a suggestion in Smartflow (manual mode) or a
          post on your board (automatic mode)
        </li>
        <li>Choose which repositories to monitor</li>
      </ul>

      <DocsH2>Installing the GitHub App</DocsH2>
      <ol>
        <li>
          Go to <strong>Organization Settings → Integrations</strong>.
        </li>
        <li>
          Find the <strong>GitHub</strong> card and click <strong>Connect</strong>.
        </li>
        <li>
          You&apos;ll be redirected to GitHub. Choose which account or organization
          to install the app on.
        </li>
        <li>
          Select <strong>All repositories</strong> or choose specific repositories
          to monitor.
        </li>
        <li>
          Click <strong>Install</strong>. You&apos;ll return to Faddy. A toast says{" "}
          <strong>&ldquo;GitHub connected&rdquo;</strong>.
        </li>
      </ol>

      <DocsH2>Setting up webhooks</DocsH2>
      <p>
        For Faddy to receive issue and pull request events, configure webhooks in
        your GitHub App settings:
      </p>
      <ol>
        <li>
          In GitHub, go to <strong>Settings → Developer settings → GitHub Apps</strong>{" "}
          and select the Faddy app.
        </li>
        <li>
          Under <strong>Webhooks</strong>, add a new webhook with the URL shown on
          your GitHub integration card in Faddy.
        </li>
        <li>
          Subscribe to <strong>issues</strong> and <strong>pull_request</strong>{" "}
          events.
        </li>
      </ol>

      <DocsH2>Configuring Smartflow mode</DocsH2>
      <p>
        Click <strong>Manage</strong> on the GitHub card to configure:
      </p>
      <ul>
        <li>
          <strong>Automatic Mode</strong> — toggle on to publish feedback directly
          without review (Pro only)
        </li>
        <li>
          <strong>Default Board</strong> — select which board receives
          GitHub-sourced feedback
        </li>
      </ul>

      <DocsH2>Disconnecting</DocsH2>
      <p>
        Click <strong>Disconnect GitHub</strong> in the Manage popover. This
        disconnects Faddy but does not uninstall the GitHub App — you must uninstall
        it separately from your GitHub Settings → Installed Apps.
      </p>
    </DocsArticle>
  );
}
