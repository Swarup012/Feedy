import { headers } from "next/headers";
import FeedbackPageClient from "./feedback-client";

// Server wrapper (Stage 3b-2): the x-custom-host header is set by middleware
// (never the client) — on a Cloudflare-for-SaaS hostname the client page
// renders vote/comment affordances as "log in on faddy.site" links instead
// of writes (custom hosts are read-only by design (d)).
export default async function FeedbackPage() {
  const h = await headers();
  const isCustomHost = h.get("x-custom-host") === "1";
  return <FeedbackPageClient isCustomHost={isCustomHost} />;
}
