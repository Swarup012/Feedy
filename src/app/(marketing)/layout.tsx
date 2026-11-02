import { headers } from "next/headers";
import { redirect } from "next/navigation";
import MarketingChrome from "./marketing-chrome";

// Server wrapper for the marketing segment (Stage 3b-2). The navbar/layout
// chrome is a client component; this layer exists because a custom hostname
// has no marketing landing — middleware resolves the host and passes "/" through,
// and here it 307s to the public board with a RELATIVE Location.
// (Middleware cannot emit relative Locations: Next 15's middleware adapter
// URL-parses every Location header and throws Invalid URL on relative values.)
export default async function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const h = await headers();
  if (h.get("x-custom-host") === "1") redirect("/feedback");

  return (
    <MarketingChrome>
      {children}
      <script
        dangerouslySetInnerHTML={{
          __html:
            'window.hallmarkSlots = (m) => { for (const [k, v] of Object.entries(m)) { const s = document.querySelector(`[data-slot="${k}"]`); if (!s) continue; const im = new Image(); im.src = typeof v === "string" ? v : v.src; im.alt = (typeof v === "object" && v.alt) || s.dataset.alt || ""; s.querySelectorAll(":scope > img").forEach((o) => o.remove()); s.prepend(im); } }; document.querySelectorAll("[data-slot] img").forEach((i) => { if (i.complete && !i.naturalWidth) i.remove(); else i.addEventListener("error", () => i.remove(), { once: true }); });',
        }}
      />
    </MarketingChrome>
  );
}
