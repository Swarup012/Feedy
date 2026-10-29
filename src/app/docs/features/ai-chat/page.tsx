import { docsMetadata } from "../../docs-nav";
import { DocsArticle } from "../../components/docs-article";
import { DocsH2 } from "../../components/docs-headings";

export const metadata = docsMetadata("/docs/features/ai-chat");

export default function AIChatDocsPage() {
  return (
    <DocsArticle href="/docs/features/ai-chat">
      <DocsH2>What AI Chat knows</DocsH2>
      <p>
        AI Chat is grounded in your actual feedback data. It knows about:
      </p>
      <ul>
        <li>Your boards and their posts</li>
        <li>Cluster labels and summaries (AI-grouped feedback themes)</li>
        <li>Post counts and upvote totals per cluster</li>
        <li>Recent posts with their status and category</li>
      </ul>
      <p>
        It does not hallucinate data — if something isn&rsquo;t in your
        feedback, it will tell you.
      </p>

      <DocsH2>Getting started</DocsH2>
      <ol>
        <li>
          Go to <strong>Admin → AI Chat</strong>.
        </li>
        <li>
          You&rsquo;ll see four suggestion prompts. Click one to get started, or
          type your own question.
        </li>
        <li>
          The AI streams its response in real-time. Below each response,
          you&rsquo;ll see how many clusters and posts it referenced.
        </li>
      </ol>

      <DocsH2>Example questions</DocsH2>
      <ul>
        <li>
          &ldquo;What are the most critical issues users are reporting right
          now?&rdquo;
        </li>
        <li>
          &ldquo;Summarize the top feedback clusters and what I should
          prioritize.&rdquo;
        </li>
        <li>
          &ldquo;Based on recent completed feedback, draft a public changelog
          entry.&rdquo;
        </li>
        <li>&ldquo;What is the overall sentiment of feedback?&rdquo;</li>
      </ul>

      <DocsH2>Conversation history</DocsH2>
      <p>
        Your conversations are saved in the sidebar. Click <strong>New chat</strong>{" "}
        to start a fresh conversation. Click any saved conversation to resume it.
        Delete conversations you no longer need.
      </p>
    </DocsArticle>
  );
}
