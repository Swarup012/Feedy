import { docsMetadata } from "../../docs-nav";
import { DocsArticle } from "../../components/docs-article";
import { DocsH2 } from "../../components/docs-headings";

export const metadata = docsMetadata("/docs/features/voting-commenting");

export default function VotingCommentingPage() {
  return (
    <DocsArticle href="/docs/features/voting-commenting">
      <DocsH2>Upvoting a post</DocsH2>
      <p>
        See an idea you agree with? Click the <strong>upvote arrow</strong> next
        to the post title. This shows the team how many people want the same
        thing. The vote count helps the product team decide what to build next.
      </p>
      <p>You can remove your vote by clicking the upvote arrow again.</p>

      <DocsH2>Adding a comment</DocsH2>
      <ol>
        <li>
          <strong>Scroll down</strong> to the comments section on any post.
        </li>
        <li>
          <strong>Type your comment</strong> in the text box — add context, share
          your use case, or ask a question.
        </li>
        <li>
          <strong>Click &ldquo;Post&rdquo;</strong> to submit.
        </li>
      </ol>

      <DocsH2>Replying to comments</DocsH2>
      <p>
        Click <strong>Reply</strong> under any comment to keep the conversation
        organized in threads.
      </p>

      <DocsH2>Why your vote matters</DocsH2>
      <p>
        Every vote is counted. The product team uses vote counts to prioritize
        what to build first. An idea with 50 votes gets more attention than one
        with 2. Your single vote makes a difference.
      </p>
    </DocsArticle>
  );
}
