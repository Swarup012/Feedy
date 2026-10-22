import { headers } from "next/headers";
import { fetchCustomHostOrganization } from "@/lib/customHostOrg";
import { verifyTenantSig } from "@/lib/proxyHelper";
import LayoutClient from "./layout-client";

// Server wrapper for the (public) route group (Stage 3b-2 steps 1 + 3).
// middleware.ts sets x-custom-host / x-subdomain / x-tenant-sig only after
// the custom-hostname allowlist + host resolution passed; all three are
// stripped from every inbound request first thing, so they can never be
// client-supplied. The tenant signature is verified here anyway (defense
// in depth): branding fetch happens ONLY with a valid HMAC over
// normalizeHost(host)|subdomain.
//
// Custom host: org branding is fetched HERE (server side) because the browser
// cannot reach /api/organizations/** on a custom hostname (allowlist 404).
// First-party: unchanged — the client layout keeps its existing background
// subdomain lookup.
export default async function PublicLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const h = await headers();
  const isCustomHost = h.get("x-custom-host") === "1";
  const subdomain = h.get("x-subdomain");
  const host = h.get("host");

  let initialOrganization = null;
  if (isCustomHost && subdomain) {
    const sigOk = host
      ? await verifyTenantSig(host, subdomain, h.get("x-tenant-sig"))
      : false;
    if (sigOk) {
      initialOrganization = await fetchCustomHostOrganization(subdomain);
    }
  }

  return (
    <LayoutClient
      isCustomHost={isCustomHost}
      initialOrganization={initialOrganization}
    >
      {children}
    </LayoutClient>
  );
}
