import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, ThumbsUp } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusPill } from "./StatusPill";
import { formatDate } from "./format";
import type { Post } from "@/services/postService";

/**
 * Recent feedback table (top 5). Links use the existing post route
 * /feedback/:postId — the same pattern feedback-card.tsx uses.
 */
export function RecentFeedbackTable({
  posts,
  onViewAll,
}: {
  posts: Post[];
  onViewAll: () => void;
}) {
  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-bold text-foreground">Recent feedback</CardTitle>
        <button
          onClick={onViewAll}
          className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
        >
          View all <ArrowRight className="h-3 w-3" />
        </button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border">
              <TableHead className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Suggestion</TableHead>
              <TableHead className="hidden sm:table-cell text-xs text-muted-foreground font-bold uppercase tracking-wider">Board</TableHead>
              <TableHead className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Status</TableHead>
              <TableHead className="text-xs text-muted-foreground font-bold uppercase tracking-wider text-right">Votes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map((post) => (
              <TableRow key={post.id} className="border-border">
                <TableCell className="font-medium text-sm text-foreground max-w-[240px] truncate">
                  <Link href={`/feedback/${post.id}`} className="hover:text-primary transition-colors">
                    {post.title}
                  </Link>
                </TableCell>
                <TableCell className="hidden sm:table-cell text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full bg-primary"
                      style={post.board?.color ? { backgroundColor: post.board.color } : undefined}
                    />
                    {post.board?.name || "—"}
                  </span>
                </TableCell>
                <TableCell>
                  <StatusPill status={post.status} />
                </TableCell>
                <TableCell className="text-right text-xs font-semibold text-foreground">
                  <span className="inline-flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3 text-muted-foreground" />
                    {post.upvotes || 0}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
