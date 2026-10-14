import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ThumbsUp, TrendingUp } from "lucide-react";
import type { Post } from "@/services/postService";

/**
 * Top public-board posts by votes. Links reuse the existing post route
 * /feedback/:postId (same as feedback-card.tsx). Hidden entirely when
 * there's nothing trending (empty-state cards just add noise here).
 */
export function TrendingBoards({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Trending on boards
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-3">
          {posts.map((post, i) => (
            <li key={post.id}>
              <Link
                href={`/feedback/${post.id}`}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
              >
                <span className="text-xs font-bold text-muted-foreground mt-0.5 w-4 shrink-0">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                    {post.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                    <span>{post.board?.name || "—"}</span>
                    <span className="inline-flex items-center gap-1">
                      <ThumbsUp className="h-3 w-3" />
                      {post.upvotes || 0}
                    </span>
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
