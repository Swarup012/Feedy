import Link from "next/link";
import { docsMetadata } from "../../docs-nav";
import { DocsArticle } from "../../components/docs-article";
import { DocsH2 } from "../../components/docs-headings";
import { DocsCallout } from "../../components/docs-callout";

export const metadata = docsMetadata("/docs/getting-started/quick-start");

export default function QuickStartPage() {
  return (
    <DocsArticle href="/docs/getting-started/quick-start">
      <DocsH2>Create Your Account</DocsH2>
      <p>
        Sign up for free and create your organization. No credit card required.
      </p>
      <p>
        <Link
          href="/signup"
          className="inline-flex items-center rounded-md bg-[var(--docs-accent)] px-4 py-2 text-[13.5px] font-medium text-white transition-colors hover:bg-[var(--docs-accent)]/90 no-underline"
        >
          Sign Up Free
        </Link>
      </p>

      <DocsH2>Create Your First Board</DocsH2>
      <p>After logging in, create a feedback board to organize customer requests:</p>
      <ol>
        <li>
          Go to <strong>Admin Dashboard</strong>
        </li>
        <li>
          Click <strong>&quot;Manage Feedback&quot;</strong>
        </li>
        <li>
          Click <strong>&quot;+ New Board&quot;</strong>
        </li>
        <li>Give it a name (e.g., &quot;Feature Requests&quot;)</li>
        <li>
          Click <strong>&quot;Create&quot;</strong>
        </li>
      </ol>
      <DocsCallout variant="tip" title="Tip">
        <p>
          Create separate boards for different types of feedback (Features,
          Bugs, Improvements).
        </p>
      </DocsCallout>

      <DocsH2>Share Your Board</DocsH2>
      <p>Get the public link and share it with your customers:</p>
      <ol>
        <li>Open your board</li>
        <li>
          Click the <strong>&quot;Share&quot;</strong> button
        </li>
        <li>Copy the public link</li>
        <li>Share it on your website, email, or social media</li>
      </ol>
      <DocsCallout variant="tip" title="Public boards">
        <p>
          Anyone can view and submit feedback without logging in.
        </p>
      </DocsCallout>

      <DocsH2>Start Collecting Feedback</DocsH2>
      <p>Your customers can now:</p>
      <ul>
        <li>Submit new feedback and feature requests</li>
        <li>Upvote existing suggestions</li>
        <li>Comment and discuss ideas</li>
        <li>Track progress on their requests</li>
      </ul>

      <DocsH2>You&apos;re All Set!</DocsH2>
      <p>
        Now explore more features to get the most out of Faddy — invite your
        team from <Link href="/docs/getting-started/invite-team">Invite Team Members</Link>,
        then set up your public <Link href="/docs/features/roadmap">Roadmap</Link>.
      </p>
    </DocsArticle>
  );
}
