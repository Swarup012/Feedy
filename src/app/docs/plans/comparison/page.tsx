import { docsMetadata } from "../../docs-nav";
import { DocsArticle } from "../../components/docs-article";
import { DocsH2 } from "../../components/docs-headings";

export const metadata = docsMetadata("/docs/plans/comparison");

export default function PlansComparisonPage() {
  return (
    <DocsArticle href="/docs/plans/comparison">
      <DocsH2>Free</DocsH2>
      <p>
        <strong>$0</strong> — yearly: <strong>$0</strong>
      </p>
      <ul>
        <li>Unlimited boards &amp; posts</li>
        <li>20 tracked users (hard limit, no overage)</li>
        <li>3 team members, up to 3 admins</li>
        <li>Unlimited roadmap items</li>
        <li>Autopilot &amp; 1 integration</li>
        <li>AI chat - 10 credits/month</li>
        <li>Advanced analytics</li>
        <li>Public roadmap &amp; changelog</li>
        <li>Feedback widget</li>
      </ul>

      <DocsH2>Starter</DocsH2>
      <p>
        <strong>$25/mo</strong> — yearly:{" "}
        <strong>$19/mo (billed $228/yr)</strong>
      </p>
      <ul>
        <li>Unlimited boards &amp; posts</li>
        <li>125 tracked users included</li>
        <li>25-user grace buffer (overage starts at 150)</li>
        <li>Overage: $12 per 50 users</li>
        <li>Unlimited team members, 5 admins</li>
        <li>Unlimited roadmap items</li>
        <li>Autopilot (manual mode)</li>
        <li>AI Chat</li>
        <li>Slack, Discord &amp; Intercom integrations</li>
        <li>Custom branding</li>
      </ul>

      <DocsH2>Pro</DocsH2>
      <p>
        <strong>$59/mo</strong> — yearly: <strong>$49/mo (billed $588/yr)</strong>
      </p>
      <ul>
        <li>Everything in Starter, plus:</li>
        <li>125 tracked users included</li>
        <li>25-user grace buffer (overage starts at 150)</li>
        <li>Overage: $12 per 50 users</li>
        <li>Up to 10 admins</li>
        <li>Autopilot (automatic mode)</li>
        <li>AI severity classification</li>
        <li>High-severity Slack/Discord alerts</li>
        <li>Instant notifications</li>
        <li>1 custom domain</li>
        <li>Priority support</li>
        <li>Advanced security</li>
        <li>Webhooks &amp; API access</li>
      </ul>

      <DocsH2>Tracked Users &amp; Overage</DocsH2>
      <p>
        Both Starter and Pro include <strong>125 tracked users</strong> per
        month with a <strong>25-user grace buffer</strong>. Overage begins at
        150 users, billed at <strong>$12 per block of 50 users</strong> via
        Paddle.
      </p>
      <p>
        Free plan has a hard cap of 20 tracked users — no overage is available.
        When the limit is reached, new users can still submit feedback but are
        not tracked.
      </p>
    </DocsArticle>
  );
}
