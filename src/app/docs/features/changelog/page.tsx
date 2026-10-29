import { docsMetadata } from "../../docs-nav";
import { DocsArticle } from "../../components/docs-article";
import { DocsH2 } from "../../components/docs-headings";

export const metadata = docsMetadata("/docs/features/changelog");

export default function ChangelogDocsPage() {
  return (
    <DocsArticle href="/docs/features/changelog">
      <DocsH2>Why Use a Changelog?</DocsH2>
      <p>
        Publishing updates builds trust, reduces support tickets, and keeps your
        users engaged with your product&rsquo;s progress.
      </p>
    </DocsArticle>
  );
}
