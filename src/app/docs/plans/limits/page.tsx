import { docsMetadata } from "../../docs-nav";
import { DocsArticle } from "../../components/docs-article";
import { DocsH2 } from "../../components/docs-headings";

export const metadata = docsMetadata("/docs/plans/limits");

export default function PlanLimitsPage() {
  return (
    <DocsArticle href="/docs/plans/limits">
      <DocsH2>Free</DocsH2>
      <p>
        <strong>$0/mo</strong>
      </p>
      <ul>
        <li>
          <strong>Unlimited</strong> boards &amp; posts
        </li>
        <li>
          <strong>20</strong> tracked users (hard limit, no overage)
        </li>
        <li>
          <strong>3</strong> team members, 3 admins
        </li>
        <li>
          <strong>Unlimited</strong> roadmap items
        </li>
        <li>
          AI chat: <strong>10</strong> credits/month
        </li>
      </ul>

      <DocsH2>Starter</DocsH2>
      <p>
        <strong>$25/mo ($19/mo yearly)</strong>
      </p>
      <ul>
        <li>
          <strong>Unlimited</strong> boards &amp; posts
        </li>
        <li>
          <strong>125</strong> tracked users included
        </li>
        <li>
          <strong>5</strong> grace users (overage starts at 131)
        </li>
        <li>
          <strong>Unlimited</strong> team members, 5 admins
        </li>
        <li>
          <strong>Unlimited</strong> roadmap items
        </li>
      </ul>

      <DocsH2>Pro</DocsH2>
      <p>
        <strong>$59/mo ($49/mo yearly)</strong>
      </p>
      <ul>
        <li>
          <strong>Unlimited</strong> boards &amp; posts
        </li>
        <li>
          <strong>125</strong> tracked users included
        </li>
        <li>
          <strong>5</strong> grace users (overage starts at 131)
        </li>
        <li>
          <strong>Unlimited</strong> team members, 10 admins
        </li>
        <li>
          <strong>Unlimited</strong> roadmap items
        </li>
      </ul>

      <DocsH2>Integration Limits</DocsH2>
      <p>
        Free and Starter organizations can have one active integration. Zapier is available
        on both plans and uses that slot, even when the organization has more than one Zapier
        connection. To revoke all Zapier keys, choose Disconnect Zapier in Integrations.
      </p>

      <DocsH2>Tracked Users &amp; Overage</DocsH2>
      <p>
        A <strong>tracked user</strong> is any unique external person who
        submits feedback, upvotes, comments, or contributes a Slack clarification
        that Faddy saves under a published post. Internal team members are not
        counted. Each email address counts once per UTC calendar month. Slack
        clarifications count in the month Faddy first saves them.
      </p>
      <p>
        Both Starter and Pro include 125 tracked users plus five grace users.
        Starting at 131 users, overage is <strong>$3.60 per started block of 10</strong>.
        Paddle collects one charge based on your peak in the UTC month.
        This also applies to annual plans.
      </p>
      <p>
        Free plan has a hard cap of 20 — no overage. When reached, new users can
        still submit feedback but are not tracked.
      </p>
    </DocsArticle>
  );
}
