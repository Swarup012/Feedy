import { docsMetadata } from "../../docs-nav";
import { DocsArticle } from "../../components/docs-article";
import { DocsH2, DocsH3 } from "../../components/docs-headings";
import { DocsCallout } from "../../components/docs-callout";

export const metadata = docsMetadata("/docs/features/boards");

export default function BoardsDocsPage() {
  return (
    <DocsArticle href="/docs/features/boards">
      <DocsH2>What is a Feedback Board?</DocsH2>
      <p>
        A board is a dedicated space where your users can submit ideas, vote,
        and discuss. Boards help you categorize feedback by product area or
        theme.
      </p>

      <DocsH2>Key Features</DocsH2>

      <DocsH3>Custom Categories</DocsH3>
      <p>Group feedback by product area, feature, or theme.</p>

      <DocsH3>Voting &amp; Comments</DocsH3>
      <p>Let users vote and discuss, so priorities are clear.</p>

      <DocsH3>Public Sharing</DocsH3>
      <p>Share your board publicly so anyone can submit feedback.</p>

      <DocsCallout variant="note" title="Boards scale with your plan">
        <p>
          The number of boards you can create depends on your plan — see{" "}
          <a href="/docs/plans/comparison">Plan Comparison</a> for details.
        </p>
      </DocsCallout>
    </DocsArticle>
  );
}
