import { docsMetadata } from "../../docs-nav";
import { DocsArticle } from "../../components/docs-article";
import { DocsH2, DocsH3 } from "../../components/docs-headings";
import { DocsCallout } from "../../components/docs-callout";

export const metadata = docsMetadata("/docs/features/slack");

export default function SlackDocsPage() {
  return (
    <DocsArticle href="/docs/features/slack">
      <DocsH2>What you get</DocsH2>
      <ul>
        <li>
          Messages from a Slack channel are automatically analyzed for feedback
        </li>
        <li>
          Detected feedback becomes a suggestion in Autopilot (manual mode) or a
          post on your board (automatic mode)
        </li>
        <li>Set the monitored channel and Autopilot mode per integration</li>
      </ul>

      <DocsH2>Connecting Slack</DocsH2>
      <ol>
        <li>
          Go to <strong>Organization Settings → Integrations</strong>.
        </li>
        <li>
          Find the <strong>Slack</strong> card and click <strong>Connect</strong>.
        </li>
        <li>
          You&apos;ll be redirected to Slack. Review the permissions and click{" "}
          <strong>Authorize</strong>.
        </li>
        <li>
          You&apos;ll return to Faddy. A toast says{" "}
          <strong>&ldquo;Slack connected&rdquo;</strong>.
        </li>
      </ol>

      <DocsH2>Configuring the integration</DocsH2>
      <p>
        After connecting, click <strong>Manage</strong> on the Slack card to
        configure:
      </p>

      <DocsH3>1. Select a monitored channel</DocsH3>
      <p>
        Use the <strong>Monitored Channel</strong> dropdown to pick which Slack
        channel Faddy should watch.
      </p>
      <DocsCallout variant="warning" title="Invite the bot to the channel">
        <p>
          Invite the Feedy bot to the monitored channel so it can receive
          messages. In Slack, type <code>/invite @Feedy</code> (or whatever the
          bot is named in your workspace).
        </p>
      </DocsCallout>

      <DocsH3>2. Choose Manual or Automatic mode</DocsH3>
      <p>
        <strong>Manual mode (default)</strong> — messages become pending
        suggestions in Autopilot. You review and approve or reject each one.
      </p>
      <p>
        <strong>Automatic mode</strong> — feedback is published directly to your
        board without review. Toggle the <strong>Automatic Mode</strong> switch
        to enable. Automatic mode requires the Pro plan.
      </p>

      <DocsH3>3. Set a default board</DocsH3>
      <p>
        Use the <strong>Default Board</strong> dropdown to choose which board
        receives feedback from this Slack channel. This is required for
        Automatic mode.
      </p>

      <DocsH2>Disconnecting</DocsH2>
      <p>
        Click <strong>Disconnect Slack</strong> in the Manage popover. Faddy
        will stop monitoring the channel. This does not remove the Feedy bot
        from your Slack workspace — you can remove it manually from Slack if
        desired.
      </p>
    </DocsArticle>
  );
}
