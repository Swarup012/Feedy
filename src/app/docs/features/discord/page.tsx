import { docsMetadata } from "../../docs-nav";
import { DocsArticle } from "../../components/docs-article";
import { DocsH2, DocsH3 } from "../../components/docs-headings";

export const metadata = docsMetadata("/docs/features/discord");

export default function DiscordDocsPage() {
  return (
    <DocsArticle href="/docs/features/discord">
      <DocsH2>What you get</DocsH2>
      <ul>
        <li>
          Messages from a Discord channel are automatically analyzed for feedback
        </li>
        <li>
          Detected feedback becomes a suggestion in Autopilot (manual mode) or a
          post on your board (automatic mode)
        </li>
        <li>Set the monitored channel and Autopilot mode per integration</li>
      </ul>

      <DocsH2>Connecting Discord</DocsH2>
      <ol>
        <li>
          Go to <strong>Organization Settings → Integrations</strong>.
        </li>
        <li>
          Find the <strong>Discord</strong> card and click <strong>Connect</strong>.
        </li>
        <li>
          You&apos;ll be redirected to Discord. Select your server and click{" "}
          <strong>Authorize</strong>.
        </li>
        <li>
          You&apos;ll return to Faddy. A toast says{" "}
          <strong>&ldquo;Discord connected&rdquo;</strong> with a prompt to select
          a channel.
        </li>
      </ol>

      <DocsH2>Configuring the integration</DocsH2>
      <p>
        After connecting, click <strong>Manage</strong> on the Discord card to
        configure:
      </p>

      <DocsH3>1. Select a monitored channel</DocsH3>
      <p>
        Use the <strong>Monitored Channel</strong> dropdown to pick which Discord
        channel Faddy should watch. The bot must have permission to read messages
        in that channel.
      </p>

      <DocsH3>2. Choose Manual or Automatic mode</DocsH3>
      <p>
        <strong>Manual mode (default)</strong> — messages become pending
        suggestions in Autopilot. You review and approve or reject each one.
      </p>
      <p>
        <strong>Automatic mode</strong> — feedback is published directly to your
        board without review. Toggle the <strong>Automatic Mode</strong> switch to
        enable.
      </p>

      <DocsH3>3. Set a default board</DocsH3>
      <p>
        Use the <strong>Default Board</strong> dropdown to choose which board
        receives feedback from this Discord channel. This is required for
        Automatic mode.
      </p>

      <DocsH2>Disconnecting</DocsH2>
      <p>
        Click <strong>Disconnect Discord</strong> in the Manage popover. Faddy will
        stop monitoring the channel. This does not remove the bot from your Discord
        server — you can kick it manually if desired.
      </p>
    </DocsArticle>
  );
}
