import { headers } from "next/headers";
import PostDetailClient from "./post-detail-client";

// Server wrapper (Stage 3b-2): the x-custom-host header is set by middleware
// (never the client) — on a Cloudflare-for-SaaS hostname the vote/comment
// affordances render as "log in on faddy.site" links instead of writes
// (custom hosts are read-only by design (d)).
export default async function PostDetailPage() {
  const h = await headers();
  const isCustomHost = h.get("x-custom-host") === "1";
  return <PostDetailClient isCustomHost={isCustomHost} />;
}
