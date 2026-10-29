import { docsMetadata } from "../../docs-nav";
import { DocsArticle } from "../../components/docs-article";
import { DocsH2 } from "../../components/docs-headings";

export const metadata = docsMetadata("/docs/features/roadmap");

export default function RoadmapDocsPage() {
  return (
    <DocsArticle href="/docs/features/roadmap">
      <DocsH2>Roadmap Highlights</DocsH2>
      <ul>
        <li>Timeline view for releases</li>
        <li>Link feedback to roadmap items</li>
        <li>Track progress and status</li>
      </ul>
    </DocsArticle>
  );
}
