import { BACKEND_URL } from "@/lib/proxyHelper";

/**
 * Server-side organization branding lookup for custom (customer) hostnames.
 *
 * The browser cannot do this on a custom host: /api/organizations/** is not
 * on the custom-host middleware allowlist (404 by design), so the (public)
 * server layout fetches it here after middleware resolved the host. The
 * backend route is public (runs before authenticate) and returns only
 * {id, name, subdomain, logo_url?, branding?} — never tenant secrets.
 */
export interface PublicOrganization {
  name: string;
  logo_url?: string | null;
  // {} when the plan allows branding but no color is set; null for Free.
  branding?: { primaryColor?: string } | null;
}

/**
 * Fetch the branding for a resolved subdomain, or null on any failure.
 *
 * Failure (backend hiccup, non-2xx, malformed body, timeout) degrades to the
 * free-tier presentation ("Faddy" header + Powered by Faddy footer) — it never
 * blocks rendering with an error, because middleware already proved the host
 * resolves. Cached 5 minutes (branding changes are rare).
 *
 * Args:
 *   subdomain: tenant subdomain from the middleware-derived x-subdomain header
 *              (trusted — client-supplied values were stripped first thing).
 *
 * Returns:
 *   The public organization record, or null when unavailable.
 */
export async function fetchCustomHostOrganization(
  subdomain: string,
): Promise<PublicOrganization | null> {
  try {
    const res = await fetch(
      `${BACKEND_URL}/api/organizations/subdomain/${encodeURIComponent(subdomain)}`,
      { next: { revalidate: 300 }, signal: AbortSignal.timeout(4000) },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const org = json?.success ? json.data?.organization : null;
    if (!org || typeof org.name !== 'string') return null;
    // Whitelist: ONLY the fields the header needs — never forward the org
    // record through (it may carry billing/internal columns). Values are
    // shape-checked too: primaryColor must be an exact #rrggbb hex literal
    // (it may end up in inline CSS), logo_url must be https (it may end up
    // in an <img src>). Anything else degrades to the default presentation.
    return {
      name: org.name,
      logo_url:
        typeof org.logo_url === 'string' && org.logo_url.startsWith('https://')
          ? org.logo_url
          : null,
      branding:
        org.branding && typeof org.branding.primaryColor === 'string' && /^#[0-9a-fA-F]{6}$/.test(org.branding.primaryColor)
          ? { primaryColor: org.branding.primaryColor }
          : null,
    };
  } catch {
    return null;
  }
}
