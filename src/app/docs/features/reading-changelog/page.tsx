import { docsMetadata } from "../../docs-nav";
import { DocsArticle } from "../../components/docs-article";
import { DocsH2 } from "../../components/docs-headings";

export const metadata = docsMetadata("/docs/features/reading-changelog");

export default function ReadingChangelogPage() {
  return (
    <DocsArticle href="/docs/features/reading-changelog">
      <DocsH2>Opening the changelog</DocsH2>
      <p>
        Go to your company changelog page (for example,{" "}
        <code>yourcompany.faddy.site/changelog</code>). You can also find a
        link in the top navigation of the feedback board.
      </p>

      <DocsH2>Reading an entry</DocsH2>
      <p>
        Each changelog entry shows a title, date, and description. Items are
        tagged with a badge that tells you what kind of change it is:
      </p>
      <ul>
        <li>
          <strong>New</strong> — a feature that did not exist before
        </li>
        <li>
          <strong>Improved</strong> — an existing feature that works better now
        </li>
        <li>
          <strong>Fixed</strong> — a bug that has been resolved
        </li>
      </ul>

      <DocsH2>Filtering entries</DocsH2>
      <p>
        If your company has multiple boards, you can filter changelog entries by
        board to see updates relevant to a specific product area.
      </p>
    </DocsArticle>
  );
}
