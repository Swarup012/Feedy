"use client"
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
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
import { OrganizationSwitcher } from "@/components/organization/OrganizationSwitcher";
import { ChangelogPopover } from "@/components/changelog/ChangelogPopover";
import { Sun, Moon, Menu, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "@/components/theme-provider";
import "./admin.css";

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const { resolvedTheme, setTheme } = useTheme();
  const [viewMode, setViewMode] = useState<"admin" | "public">("admin");
  const [feedbackPath, setFeedbackPath] = useState("/admin/feedback");
  const [boardsLoaded, setBoardsLoaded] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

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
      } finally {
        setBoardsLoaded(true);
      }
    };

    validateFeedbackPath();
  }, []);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "light" ? "dark" : "light");
  };
  const handleToggle = () => {
    if (viewMode === "admin") {
      setViewMode("public");
      router.push("/feedback");
    } else {
      setViewMode("admin");
      router.push("/admin");
    }
  };

  const navItems = [
    { name: "Smartflow", path: "/admin/autopilot" },
    { name: "AI Chat", path: "/admin/ai-chat" },
    { name: "Users", path: "/admin/users" },
    { name: "Feedback", path: feedbackPath },
    { name: "Roadmap", path: "/admin/roadmap" },
    { name: "Changelog", path: "/admin/changelog" },
  ];

  const isCurrent = (itemPath: string) => {
    if (
      itemPath === "/admin/autopilot" ||
      itemPath === "/admin/ai-chat" ||
      itemPath === feedbackPath
    ) {
      return pathname?.startsWith(itemPath);
    }
    return pathname === itemPath;
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <header className="topbar">
        <div className="topbar__inner">
          <div className="topbar__left">
            <Link href="/admin" className="topbar__brand" aria-label="Dashboard home">
              Dashboard
            </Link>

            <div className="topbar__divider" aria-hidden="true" />
            <OrganizationSwitcher />

            <nav className="topbar__nav" aria-label="Admin">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className="topbar__link"
                  aria-current={isCurrent(item.path) ? "page" : undefined}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          <div className="topbar__right">
            <ChangelogPopover />

            <button
              type="button"
              onClick={toggleTheme}
              className="icon-btn"
              aria-label={`Switch to ${resolvedTheme === "light" ? "dark" : "light"} mode`}
            >
              {resolvedTheme === "light" ? (
                <Moon className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Sun className="h-4 w-4" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              className="icon-btn topbar__nav-toggle"
              onClick={() => setNavOpen((v) => !v)}
              aria-expanded={navOpen}
              aria-controls="admin-mobile-nav"
              aria-label={navOpen ? "Close menu" : "Open menu"}
            >
              {navOpen ? (
                <X className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Menu className="h-4 w-4" aria-hidden="true" />
              )}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="user-chip">
                  <Avatar className="h-7 w-7 border border-[color-mix(in_oklab,var(--color-accent-ink)_35%,transparent)]">
                    <AvatarImage
                      src={user?.avatar_url || undefined}
                      alt={user?.name || "User"}
                    />
                    <AvatarFallback className="text-xs font-semibold" style={{ background: "color-mix(in oklab, var(--color-accent-ink) 20%, transparent)", color: "var(--color-accent-ink)" }}>
                      {user?.name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="user-chip__name">{user?.name || "User"}</span>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56 p-2">
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
                  className="cursor-pointer rounded-lg py-2.5 font-medium" style={{ color: "hsl(var(--destructive))" }}
                  onClick={logout}
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <nav
          id="admin-mobile-nav"
          className={cn("topbar__drawer", navOpen && "is-open")}
          aria-label="Admin menu"
        >
          {navItems.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              className="topbar__link"
              aria-current={isCurrent(item.path) ? "page" : undefined}
              onClick={() => setNavOpen(false)}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </header>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
