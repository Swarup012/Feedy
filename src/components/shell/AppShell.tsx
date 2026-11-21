/**
 * AppShell — Shared navigation shell for Admin and Member Dashboard contexts.
 *
 * Both dashboards use the same structural shell with different:
 *   - `variant`: "admin" (cobalt dark topbar) | "member" (neutral light topbar)
 *   - `navItems`: the route links shown in the top nav
 *   - `rightSlot`: right-side content (ChangelogPopover + icons vs. Submit CTA)
 *
 * Role permissions, authentication guards, and org switching logic remain
 * in the parent layouts (AdminLayout, DashboardPage). This component is
 * purely presentational and layout-focused.
 *
 * Usage:
 *   <AppShell variant="admin" navItems={[...]} rightSlot={<ChangelogPopover />}>
 *     {children}
 *   </AppShell>
 */
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import "./app-shell.css";

export interface AppShellNavItem {
  name: string;
  path: string;
  /** Optional: match by prefix instead of exact path */
  matchPrefix?: boolean;
}

export interface AppShellProps {
  /**
   * "admin"  — dark cobalt topbar, for owners/admins using the Admin Dashboard.
   * "member" — neutral topbar, for members using the Member Dashboard.
   */
  variant: "admin" | "member";
  /** Navigation items rendered in the topbar center/left nav. */
  navItems: AppShellNavItem[];
  /** Content rendered in the topbar right slot (actions, account menu, etc.). */
  rightSlot?: React.ReactNode;
  /** Brand label shown as the leftmost topbar element. */
  brandLabel?: string;
  /** href for the brand label link. Defaults to variant root. */
  brandHref?: string;
  /** Mobile nav drawer open state (controlled externally to allow parent to manage). */
  mobileNavOpen?: boolean;
  /** Called when mobile nav toggle is clicked. */
  onMobileNavToggle?: () => void;
  children: React.ReactNode;
}

/**
 * Returns true if the given nav item should be highlighted as active.
 */
function isNavItemActive(item: AppShellNavItem, pathname: string): boolean {
  if (item.matchPrefix) {
    return pathname?.startsWith(item.path) ?? false;
  }
  return pathname === item.path;
}

export function AppShell({
  variant,
  navItems,
  rightSlot,
  brandLabel = "Dashboard",
  brandHref,
  mobileNavOpen = false,
  onMobileNavToggle,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const resolvedBrandHref = brandHref ?? (variant === "admin" ? "/admin" : "/dashboard");

  return (
    <div className="app-shell" data-variant={variant}>
      <header className={cn("app-shell__topbar", `app-shell__topbar--${variant}`)}>
        <div className="app-shell__topbar-inner">
          {/* Left group: brand + org switcher placeholder + nav */}
          <div className="app-shell__topbar-left">
            <Link
              href={resolvedBrandHref}
              className="app-shell__brand"
              aria-label={`${brandLabel} home`}
            >
              {brandLabel}
            </Link>

            {/* Divider — hidden on mobile */}
            <span className="app-shell__divider" aria-hidden="true" />

            {/* Primary navigation */}
            <nav className="app-shell__nav" aria-label={variant === "admin" ? "Admin" : "Member"}>
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className="app-shell__nav-link"
                  aria-current={isNavItemActive(item, pathname) ? "page" : undefined}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right group: actions, account */}
          <div className="app-shell__topbar-right">
            {rightSlot}

            {/* Mobile hamburger — only rendered if toggle handler provided */}
            {onMobileNavToggle && (
              <button
                type="button"
                className="app-shell__nav-toggle icon-btn"
                onClick={onMobileNavToggle}
                aria-expanded={mobileNavOpen}
                aria-controls="app-shell-mobile-nav"
                aria-label={mobileNavOpen ? "Close menu" : "Open menu"}
              >
                {/* Uses CSS to show hamburger / X based on aria-expanded */}
                <span className="app-shell__hamburger-icon" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {/* Mobile navigation drawer */}
        {onMobileNavToggle && (
          <nav
            id="app-shell-mobile-nav"
            className={cn("app-shell__mobile-nav", mobileNavOpen && "app-shell__mobile-nav--open")}
            aria-label={variant === "admin" ? "Admin menu" : "Member menu"}
          >
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className="app-shell__nav-link"
                aria-current={isNavItemActive(item, pathname) ? "page" : undefined}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        )}
      </header>

      <main className="app-shell__main">{children}</main>
    </div>
  );
}
