import { formatDistanceToNow } from "date-fns";
import type { ComponentType } from "react";
import type { Post } from "@/services/postService";

export function MergedHistoryItem({ item, Icon }: { item: Post; Icon?: ComponentType<{ className?: string }> }) {
  return (
    <div className="pd__merged-item">
      <span className="pd__merged-icon">{Icon && <Icon className="h-4 w-4" />}</span>
      <div className="pd__cmt-body">
        <p className="pd__merged-text" style={{ whiteSpace: "pre-wrap" }}>{item.description}</p>
        <span className="pd__merged-when">{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
      </div>
    </div>
  );
}
