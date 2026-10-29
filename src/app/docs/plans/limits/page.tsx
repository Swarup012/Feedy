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
          <strong>25</strong> grace buffer (overage starts at 150)
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
          <strong>25</strong> grace buffer (overage starts at 150)
        </li>
        <li>
          <strong>Unlimited</strong> team members, 10 admins
        </li>
        <li>
          <strong>Unlimited</strong> roadmap items
        </li>
      </ul>

      <DocsH2>Tracked Users &amp; Overage</DocsH2>
      <p>
        A <strong>tracked user</strong> is any unique external person who
        submits feedback, upvotes, or comments. Internal team members are not
        counted. Users are identified by email address, deduplicated per billing
        period.
      </p>
      <p>
        Both Starter and Pro include 125 users with a 25-user grace buffer.
        Charges begin at 150 users at <strong>$12 per block of 50</strong>,
        billed monthly via Paddle.
      </p>
      <p>
        Free plan has a hard cap of 20 — no overage. When reached, new users can
        still submit feedback but are not tracked.
      </p>
    </DocsArticle>
  );
}
