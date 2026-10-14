import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, ArrowRight, ThumbsUp } from "lucide-react";
import { statusLabel } from "@/lib/status";
import { formatDate } from "./format";
import type { MyOverviewUpdate } from "@/hooks/useFeedbackData";

/**
 * "Updates on your suggestions" — status changes and replies from others
 * on the member's own posts (server already excludes the member's own
 * comments and status-change notes).
 */
export function UpdatesTimeline({ updates }: { updates: MyOverviewUpdate[] }) {
  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-foreground">Updates on your suggestions</CardTitle>
      </CardHeader>
      <CardContent>
        {updates.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No updates yet — status changes and team replies will show up here.
          </p>
        ) : (
          <ol className="relative space-y-5 border-l border-border ml-1.5">
            {updates.map((u, i) => (
              <li key={`${u.type}-${u.post_id}-${u.created_at}-${i}`} className="pl-4 relative">
                <span
                  className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background ${
                    u.type === "status_change" ? "bg-primary" : "bg-success"
                  }`}
                />
                <Link
                  href={`/feedback/${u.post_id}`}
                  className="block group"
                >
                  <p className="text-xs text-muted-foreground">
                    {formatDate(u.created_at)}
                    {u.actor_name ? ` · ${u.actor_name}` : ""}
                    {u.is_admin ? " · Team" : ""}
                  </p>
                  <p className="text-sm text-foreground mt-0.5 group-hover:text-primary transition-colors">
                    {u.type === "status_change" ? (
                      <>
                        Moved “{u.post_title || "a suggestion"}” from {statusLabel(u.old_status || "open")} to{" "}
                        <span className="font-medium">{statusLabel(u.new_status || "open")}</span>
                      </>
                    ) : (
                      <>
                        <MessageSquare className="h-3 w-3 inline mr-1 -mt-0.5" />
                        Replied on “{u.post_title || "a suggestion"}”: <span className="text-muted-foreground">{u.excerpt}</span>
                      </>
                    )}
                  </p>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
