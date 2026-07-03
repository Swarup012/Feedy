"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Eye, AlertCircle } from "lucide-react";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { LandingFooter } from "@/components/ui/landing-footer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { saveReturnUrl } from "@/lib/returnUrl";
import api from "@/lib/api";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Organization {
  id: string;
  name: string;
  subdomain: string;
  logo_url?: string;
}

// ─── Subdomain detection (pure, synchronous, side-effect free) ───────────────
// Runs immediately during the first client render — no network call.
function detectSubdomain(): string | null {
  if (typeof window === "undefined") return null;
  const hostname = window.location.hostname;
  const parts = hostname.split(".");

  // Production: company.faddy.site → parts = ["company", "faddy", "site"]
  if (parts.length >= 3 && !hostname.includes("localhost")) {
    const sub = parts[0];
    if (sub === "www" || sub === "api" || sub === "admin") return null;
    return sub;
  }

  // Development: company.localhost → parts = ["company", "localhost"]
  if (hostname.includes("localhost") && parts.length > 1 && parts[0] !== "localhost") {
    return parts[0];
  }

  return null;
}

// ─── AdminViewToggle ─────────────────────────────────────────────────────────
function AdminViewToggle() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdminView = pathname.startsWith("/admin");

  if (
    !user ||
    (user.organization_role !== "admin" && user.organization_role !== "owner")
  )
    return null;

  return (
    <Button variant="outline" asChild>
      <Link href={isAdminView ? "/feedback" : "/admin"}>
        <Eye className="mr-2 h-4 w-4" />
        {isAdminView ? "Public View" : "Admin View"}
      </Link>
    </Button>
  );
}

// ─── AppHeader ───────────────────────────────────────────────────────────────
function AppHeader({
  organization,
}: {
  organization: Organization | null;
}) {
  const { user, logout, isAuthenticated } = useAuth();

  const getUserInitials = () => {
    if (!user) return "U";
    return (
      user.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U"
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-gray-950 shadow-sm">
      <div className="container flex h-16 items-center">
        {/* Left — org branding + nav */}
        <div className="mr-4 hidden md:flex">
          <Link href="/feedback" className="mr-6 flex items-center space-x-2">
            <span className="font-switzer font-medium text-gray-900 dark:text-white">
              {organization?.name || "Faddy"}
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/feedback"
              className="transition-colors text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Feedback
            </Link>
            <Link
              href="/roadmap"
              className="transition-colors text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Roadmap
            </Link>
            <Link
              href="/changelog"
              className="transition-colors text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Changelog
            </Link>
          </nav>
        </div>

        {/* Right — user controls */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            {isAuthenticated && user ? (
              <>
                <AdminViewToggle />
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                  <span className="sr-only">Notifications</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={
                            user.avatar_url ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`
                          }
                          alt={user.name}
                        />
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem asChild>
                        <Link href="/profile">Profile</Link>
                      </DropdownMenuItem>
                      {(user.organization_role === "admin" ||
                        user.organization_role === "owner") && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin/feedback">Admin Dashboard</Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>Settings</DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => logout()}>
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button
                onClick={() => {
                  saveReturnUrl();
                  window.location.href = "/login";
                }}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── InvalidOrganizationError ────────────────────────────────────────────────
// Shown as an inline banner ABOVE the page content — never blocks the render.
function InvalidOrganizationBanner() {
  return (
    <div className="w-full bg-destructive/10 border-b border-destructive/20 px-4 py-3">
      <div className="container flex items-center gap-3 text-sm text-destructive">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <span>
          <strong>Organization not found.</strong> The subdomain you visited
          doesn&apos;t match any active organization.{" "}
          <Link href="/" className="underline hover:no-underline">
            Go to homepage
          </Link>
        </span>
      </div>
    </div>
  );
}

// ─── AppLayout ───────────────────────────────────────────────────────────────
export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Detect subdomain synchronously so we know whether to expect an org fetch.
  // This never blocks rendering — it's pure string manipulation on the hostname.
  const [activeSubdomain] = useState<string | null>(() => detectSubdomain());

  // Organization state — starts null, populated asynchronously in background.
  const [organization, setOrganization] = useState<Organization | null>(null);

  // orgError is only true when we KNOW there's a subdomain AND the lookup failed.
  // It is never true on the main domain (no subdomain → no error possible).
  const [orgError, setOrgError] = useState(false);

  // Fetch organization data in the background — does NOT block initial render.
  useEffect(() => {
    if (!activeSubdomain) return; // main domain — nothing to fetch

    let cancelled = false;

    const fetchOrg = async () => {
      try {
        const response = await api.get(
          `/api/organizations/subdomain/${activeSubdomain}`
        );
        if (cancelled) return;

        if (response.data.success && response.data.data?.organization) {
          setOrganization(response.data.data.organization);
        } else {
          setOrgError(true);
        }
      } catch {
        if (!cancelled) {
          console.error("Failed to fetch organization for subdomain:", activeSubdomain);
          setOrgError(true);
        }
      }
    };

    fetchOrg();
    return () => { cancelled = true; };
  }, [activeSubdomain]);

  // ── Always render immediately — no spinner, no blocking ─────────────────
  // Children get the page content visible to crawlers on first paint.
  // The header will silently update its org name once the fetch resolves.
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader organization={organization} />

      {/* Non-blocking org error banner — only shown when on a known-bad subdomain */}
      {orgError && <InvalidOrganizationBanner />}

      <main className="flex-1">{children}</main>
      <LandingFooter showCTA={false} />
    </div>
  );
}
