"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/context/OrganizationContext";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OrganizationSwitcher } from "@/components/organization/OrganizationSwitcher";
import { ChangelogPopover } from "@/components/changelog/ChangelogPopover";
import { ShellIcon } from "@/components/shell/ShellIcon";
import { RangePills } from "@/components/admin/RangePills";
import {
  DashboardRangeProvider,
  useDashboardRange,
} from "@/components/admin/dashboard-range";
import { resolvePlan } from "@/config/plans";
import {
  Activity,
  ArrowLeft,
  Bell,
  Briefcase,
  Building2,
  Clock,
  Code,
  CreditCard,
  CircleDollarSign,
  ExternalLink,
  Flag,
  KeyRound,
  LayoutDashboard,
  List,
  Menu,
  MessageSquare,
  Moon,
  PanelLeft,
  Palette,
  Plug,
  Settings,
  Settings2,
  Sun,
  User,
  Users,
  Webhook,
  X,
  Zap,
} from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import "./admin.css";

const SETTINGS_TABS = [
  { tab: "profile", icon: User, label: "Profile" },
  { tab: "general", icon: Settings2, label: "General" },
  { tab: "branding", icon: Palette, label: "Branding" },
  { tab: "revenue", icon: CircleDollarSign, label: "Revenue" },
  { tab: "members", icon: Users, label: "Members" },
  { tab: "roles", icon: Briefcase, label: "Job Roles" },
  { tab: "subdomain", icon: ExternalLink, label: "Subdomain" },
  { tab: "webhooks", icon: Webhook, label: "Webhooks" },
  { tab: "api-keys", icon: KeyRound, label: "API Keys" },
  { tab: "widgets", icon: Code, label: "Widgets" },
  { tab: "integrations", icon: Plug, label: "Integrations" },
  { tab: "notifications", icon: Bell, label: "Notifications" },
  { tab: "billing", icon: CreditCard, label: "Billing" },
  { tab: "tracked-users", icon: Activity, label: "Tracked Users" },
] as const;

function getPageTitle(pathname: string | null): string {
  if (!pathname) return "Dashboard";
  if (pathname === "/admin") return "Dashboard";
  if (pathname.startsWith("/admin/organization") || pathname.startsWith("/admin/settings")) {
    return "Organization settings";
  }
  if (pathname.startsWith("/admin/autopilot")) return "Smart Flow";
  if (pathname.startsWith("/admin/ai-chat")) return "AI Chat";
  if (pathname.startsWith("/admin/feedback")) return "Feedback";
  if (pathname.startsWith("/admin/roadmap")) return "Roadmap";
  if (pathname.startsWith("/admin/changelog")) return "Changelog";
  if (pathname.startsWith("/admin/users")) return "Users";
  if (pathname.startsWith("/admin/billing")) return "Billing";
  if (pathname.startsWith("/admin/webhooks")) return "Webhooks";
  if (pathname.startsWith("/admin/widgets")) return "Widgets";
  if (pathname.startsWith("/admin/api-keys")) return "API Keys";
  if (pathname.startsWith("/admin/api-docs")) return "API Docs";
  if (pathname.startsWith("/admin/tracked-users")) return "Tracked Users";
  if (pathname.startsWith("/admin/boards")) return "Boards";
  return "Admin";
}

function isSettingsPath(pathname: string | null): boolean {
  return (
    !!pathname &&
    (pathname.startsWith("/admin/organization") ||
      pathname.startsWith("/admin/settings"))
  );
}

type SidebarProps = {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onNavigate: () => void;
};

function SidebarLink({
  href,
  icon: Icon,
  label,
  active,
  onNavigate,
}: {
  href: string;
  icon: typeof LayoutDashboard;
  label: string;
  active: boolean;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={href}
      className={cn("admin-nav__item", active && "is-active")}
      aria-current={active ? "page" : undefined}
      aria-label={label}
      onClick={onNavigate}
    >
      <ShellIcon icon={Icon} className="admin-nav__icon" />
      <span className="admin-nav__label">{label}</span>
    </Link>
  );
}

function MainSidebar({ collapsed, onToggleCollapsed, onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const [feedbackPath, setFeedbackPath] = useState("/admin/feedback");

  useEffect(() => {
    const validateFeedbackPath = async () => {
      try {
        const { boardService } = await import("@/services/boardService");
        const response = await boardService.getAllBoards();
        const fetchedBoards = response.data.boards;

        if (fetchedBoards.length > 0) {
          const lastBoard = localStorage.getItem("lastVisitedBoard");
          const lastBoardExists =
            lastBoard && fetchedBoards.some((b) => b.slug === lastBoard);

          if (lastBoardExists) {
            setFeedbackPath(`/admin/feedback/boards/${lastBoard}`);
          } else {
            localStorage.setItem("lastVisitedBoard", fetchedBoards[0].slug);
            setFeedbackPath(`/admin/feedback/boards/${fetchedBoards[0].slug}`);
          }
        } else {
          setFeedbackPath("/admin/feedback/welcome");
          localStorage.removeItem("lastVisitedBoard");
        }
      } catch (error) {
        console.error("Error validating feedback path:", error);
        setFeedbackPath("/admin/feedback/welcome");
      }
    };

    validateFeedbackPath();
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "light" ? "dark" : "light");
  };

  const mainNav = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboard, matchPrefix: false },
    { name: "Smart Flow", path: "/admin/autopilot", icon: Zap, matchPrefix: true },
    { name: "AI Chat", path: "/admin/ai-chat", icon: MessageSquare, matchPrefix: true },
  ];

  const workspaceNav = [
    { name: "Feedback", path: feedbackPath, icon: List, matchPrefix: true },
    { name: "Roadmap", path: "/admin/roadmap", icon: Flag, matchPrefix: true },
    { name: "Changelog", path: "/admin/changelog", icon: Clock, matchPrefix: true },
    { name: "Users", path: "/admin/users", icon: Users, matchPrefix: true },
  ];

  const isCurrent = (item: { path: string; matchPrefix: boolean }) => {
    if (!pathname) return false;
    return item.matchPrefix ? pathname.startsWith(item.path) : pathname === item.path;
  };

  return (
    <>
      <div className="admin-sidebar__top">
        <div className="admin-sidebar__row">
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="admin-collapse"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
          >
            <ShellIcon icon={PanelLeft} />
          </button>
          <div className="admin-org">
            <OrganizationSwitcher className="admin-org__trigger" compact={collapsed} />
          </div>
        </div>
      </div>

      <nav className="admin-sidebar__scroll" aria-label="Admin">
        {mainNav.map((item) => (
          <SidebarLink
            key={item.path}
            href={item.path}
            icon={item.icon}
            label={item.name}
            active={isCurrent(item)}
            onNavigate={onNavigate}
          />
        ))}

        <div className="admin-nav__section">Workspace</div>

        {workspaceNav.map((item) => (
          <SidebarLink
            key={item.path}
            href={item.path}
            icon={item.icon}
            label={item.name}
            active={isCurrent(item)}
            onNavigate={onNavigate}
          />
        ))}

        <div className="admin-nav__bottom">
          <SidebarLink
            href="/admin/organization"
            icon={Settings}
            label="Settings"
            active={isSettingsPath(pathname)}
            onNavigate={onNavigate}
          />
        </div>
      </nav>

      <div className="admin-sidebar__foot">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="admin-user" aria-label="Account menu">
              <Avatar className="admin-user__avatar">
                <AvatarImage
                  src={user?.avatar_url || undefined}
                  alt={user?.name || "User"}
                />
                <AvatarFallback
                  className="text-xs font-semibold"
                  style={{
                    background: "color-mix(in oklab, var(--color-accent) 14%, transparent)",
                    color: "var(--color-ink)",
                  }}
                >
                  {user?.name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <span className="admin-user__name">{user?.name || "User"}</span>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side="right"
            align="end"
            collisionPadding={8}
            className="w-56 p-2 !z-[calc(var(--z-sticky-nav,300)+10)]"
          >
            <DropdownMenuLabel className="font-medium text-base">
              My Account
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push("/admin/organization?tab=profile")}
              className="cursor-pointer rounded-lg py-2.5 font-medium"
            >
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/admin/organization")}
              className="cursor-pointer rounded-lg py-2.5 font-medium"
            >
              Organization Settings
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push("/contact")}
              className="cursor-pointer rounded-lg py-2.5 font-medium"
            >
              Contact Us
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => router.push("/dashboard")}
              className="cursor-pointer rounded-lg py-2.5 font-medium"
            >
              Switch to Member View
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer rounded-lg py-2.5 font-medium text-destructive"
              onClick={logout}
            >
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="admin-sidebar__utils">
          <ChangelogPopover />
          <button
            type="button"
            onClick={toggleTheme}
            className="admin-icon-btn"
            aria-label={`Switch to ${resolvedTheme === "light" ? "dark" : "light"} mode`}
          >
            <ShellIcon icon={resolvedTheme === "light" ? Moon : Sun} />
          </button>
        </div>
      </div>
    </>
  );
}

function SettingsSidebar({ collapsed, onToggleCollapsed, onNavigate }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { organization } = useOrganization();
  const [lastPage, setLastPage] = useState("/admin");

  useEffect(() => {
    const stored = sessionStorage.getItem("admin-last-page");
    if (stored && !isSettingsPath(stored)) setLastPage(stored);
  }, []);

  const standalone = pathname?.startsWith("/admin/settings");
  const activeTab = standalone
    ? "integrations"
    : searchParams.get("tab") || "general";
  const plan = resolvePlan(organization).toUpperCase();

  const selectTab = (tab: string) => {
    onNavigate();
    router.replace(`/admin/organization?tab=${tab}`);
  };

  return (
    <>
      <div className="admin-sidebar__top">
        <div className="admin-sidebar__row">
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="admin-collapse"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
          >
            <ShellIcon icon={PanelLeft} />
          </button>
          <Link
            href={lastPage}
            className="admin-back"
            onClick={onNavigate}
            aria-label="Back to app"
          >
            <ShellIcon icon={ArrowLeft} />
            <span className="admin-nav__label">Back to app</span>
          </Link>
        </div>
      </div>

      <div className="admin-org-head">
        <div className="admin-org-head__name">
          <ShellIcon icon={Building2} className="admin-org-head__icon" />
          <span>{organization?.name || "Organization"}</span>
        </div>
        <Badge variant="outline" className="admin-org-head__badge">
          {plan}
        </Badge>
      </div>

      <nav className="admin-sidebar__scroll" aria-label="Organization settings">
        {SETTINGS_TABS.map(({ tab, icon: Icon, label }) => {
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              type="button"
              onClick={() => selectTab(tab)}
              className={cn("admin-nav__item", active && "is-active")}
              aria-current={active ? "page" : undefined}
              aria-label={label}
            >
              <ShellIcon icon={Icon} className="admin-nav__icon" />
              <span className="admin-nav__label">{label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}

function DashboardTopbarActions() {
  const router = useRouter();
  const { range, setRange } = useDashboardRange();

  return (
    <>
      <RangePills range={range} onChange={setRange} />
      <Button
        onClick={() => router.push("/dashboard")}
        variant="outline"
        className="gap-2 h-9 px-4 text-sm font-medium"
      >
        <ShellIcon icon={Users} />
        Member view
      </Button>
    </>
  );
}

function RoadmapTopbarActions() {
  const { user } = useAuth();
  const isAdminOrOwner =
    user?.organization_role === "admin" || user?.organization_role === "owner";

  return (
    <>
      {isAdminOrOwner && (
        <Button
          variant="outline"
          className="h-auto py-1.5 px-3 text-[13px] font-medium shadow-none"
          onClick={() => window.dispatchEvent(new Event("roadmap:new-roadmap"))}
        >
          New roadmap
        </Button>
      )}
      <Button
        className="h-auto py-1.5 px-3 text-[13px] font-medium shadow-none"
        onClick={() => window.dispatchEvent(new Event("roadmap:create-item"))}
      >
        Create item
      </Button>
    </>
  );
}

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem("admin-sidebar-collapsed") === "1");
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!pathname || isSettingsPath(pathname)) return;
    sessionStorage.setItem("admin-last-page", pathname);
  }, [pathname]);

  const toggleCollapsed = () => {
    setCollapsed((value) => {
      const next = !value;
      localStorage.setItem("admin-sidebar-collapsed", next ? "1" : "0");
      return next;
    });
  };

  const settings = isSettingsPath(pathname);
  const dashboard = pathname === "/admin";
  const roadmap = !!pathname?.startsWith("/admin/roadmap");
  const title = getPageTitle(pathname);

  return (
    <DashboardRangeProvider>
      <div
        className={cn(
          "admin-shell",
          collapsed && "is-collapsed",
          mobileOpen && "is-mobile-open"
        )}
      >
        <aside id="admin-sidebar" className="admin-sidebar" aria-label="Admin navigation">
          {settings ? (
            <Suspense fallback={null}>
              <SettingsSidebar
                collapsed={collapsed}
                onToggleCollapsed={toggleCollapsed}
                onNavigate={() => setMobileOpen(false)}
              />
            </Suspense>
          ) : (
            <MainSidebar
              collapsed={collapsed}
              onToggleCollapsed={toggleCollapsed}
              onNavigate={() => setMobileOpen(false)}
            />
          )}
        </aside>

        {mobileOpen && (
          <button
            type="button"
            className="admin-scrim"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <div className="admin-frame">
          <header className={cn("admin-topbar", roadmap && "admin-topbar--roadmap")}>
            <div className="admin-topbar__left">
              <button
                type="button"
                className="admin-topbar__menu"
                onClick={() => setMobileOpen((value) => !value)}
                aria-label={mobileOpen ? "Close navigation" : "Open navigation"}
                aria-expanded={mobileOpen}
                aria-controls="admin-sidebar"
              >
                <ShellIcon icon={mobileOpen ? X : Menu} />
              </button>
              <p className="admin-topbar__title">{title}</p>
            </div>

            <div className="admin-topbar__actions">
              {dashboard && <DashboardTopbarActions />}
              {roadmap && <RoadmapTopbarActions />}
            </div>
          </header>

          <main className="admin-main">
            {settings && !pathname?.startsWith("/admin/organization") ? (
              <div className="settings-content">{children}</div>
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </DashboardRangeProvider>
  );
}
