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
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OrganizationSwitcher } from "@/components/organization/OrganizationSwitcher";
import { ChangelogPopover } from "@/components/changelog/ChangelogPopover";
import { LayoutDashboard, Sun, Moon, CreditCard, BotMessageSquare } from "lucide-react";
import {useState,useEffect} from "react"

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [viewMode, setViewMode] = useState<"admin" | "public">("admin");
  const [feedbackPath, setFeedbackPath] = useState('/admin/feedback'); // Default to redirect page (handles board routing)
  const [boardsLoaded, setBoardsLoaded] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark";
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
    const initialTheme = savedTheme || systemTheme;
    setTheme(initialTheme);
    document.documentElement.className = initialTheme;

    // Validate and set feedback path
    const validateFeedbackPath = async () => {
      try {
        const { boardService } = await import('@/services/boardService');
        const response = await boardService.getAllBoards();
        const fetchedBoards = response.data.boards;

        if (fetchedBoards.length > 0) {
          const lastBoard = localStorage.getItem('lastVisitedBoard');
          const lastBoardExists = lastBoard && fetchedBoards.some(b => b.slug === lastBoard);

          if (lastBoardExists) {
            setFeedbackPath(`/admin/feedback/boards/${lastBoard}`);
          } else {
            // Use first board and update localStorage
            localStorage.setItem('lastVisitedBoard', fetchedBoards[0].slug);
            setFeedbackPath(`/admin/feedback/boards/${fetchedBoards[0].slug}`);
          }
        } else {
          // No boards exist, use welcome page
          setFeedbackPath('/admin/feedback/welcome');
          localStorage.removeItem('lastVisitedBoard');
        }
      } catch (error) {
        console.error('Error validating feedback path:', error);
        setFeedbackPath('/admin/feedback/welcome');
      } finally {
        setBoardsLoaded(true);
      }
    };

    validateFeedbackPath();
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.className = newTheme;
    localStorage.setItem("theme", newTheme);
  };
  const handleToggle = () => {
    if (viewMode === "admin") {
      setViewMode("public");
      router.push("/feedback"); // 👉 navigate to public view
    } else {
      setViewMode("admin");
      router.push("/admin"); // 👉 navigate back to admin view
    }
  };

  const navItems = [
    { name: "Feedback", path: feedbackPath },
    { name: "Roadmap", path: "/admin/roadmap" },
    { name: "Changelog", path: "/admin/changelog" },
    { name: "AI Chat", path: "/admin/ai-chat" },
    { name: "Autopilot", path: "/admin/autopilot" },
    { name: "Explore", path: "/feedback"},
    { name: "Contact Us", path: "/contact"}
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-background overflow-hidden">
      {/* 🔹 Navbar */}


<nav className="fixed top-0 left-0 right-0 bg-primary backdrop-blur-xl border-b border-primary shadow-sm z-50 flex-shrink-0">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3.5">
          {/* Left side - Brand + Org Switcher + Nav */}
          <div className="flex items-center gap-3 sm:gap-5">
            <Link 
              href="/admin" 
              className="flex items-center group"
            >
              <span className="text-lg font-switzer font-semibold tracking-tight text-white">
                Dashboard
              </span>
            </Link>

            {/* Organization Switcher */}
            <div className="border-l border-white/20 pl-3 sm:pl-5">
              <OrganizationSwitcher />
            </div>

            <div className="hidden lg:flex items-center gap-1 ml-2">
              {/* Feedback link - dynamically uses last visited board */}
              <Link
                href={feedbackPath}
                className={cn(
                  "relative px-3 py-2 text-base font-switzer font-semibold transition-all rounded-lg",
                  pathname?.startsWith('/admin/feedback')
                    ? "text-white bg-white/20"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                )}
              >
                Feedback
                {pathname?.startsWith('/admin/feedback') && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-white rounded-full" />
                )}
              </Link>
              
              {/* Other nav items */}
              {navItems.slice(1).map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "relative px-3 py-2 text-base font-switzer font-semibold transition-all rounded-lg",
                    (item.path === "/admin/autopilot" || item.path === "/admin/ai-chat"
                      ? pathname?.startsWith(item.path)
                      : pathname === item.path)
                      ? "text-white bg-white/20"
                      : "text-white/70 hover:text-white hover:bg-white/10"
                  )}
                >
                  {item.name}
                  {(item.path === "/admin/autopilot" || item.path === "/admin/ai-chat"
                    ? pathname?.startsWith(item.path)
                    : pathname === item.path) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-white rounded-full" />
                  )}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side - Actions & User Menu */}
          <div className="flex items-center gap-2">
            {/* Changelog Bell */}
            <ChangelogPopover />
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-lg bg-white/20 hover:bg-white/30 hover:scale-105 transition-all duration-300"
              aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            >
              {theme === "light" ? (
                <Moon className="h-5 w-5 text-white" />
              ) : (
                <Sun className="h-5 w-5 text-white" />
              )}
            </button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 focus:outline-none hover:opacity-80 transition-opacity">
                  <Avatar className="h-10 w-10 border-2 border-white/30 shadow-md">
                    <AvatarImage src={user?.avatar_url || undefined} alt={user?.name || "User"} />
                    <AvatarFallback className="bg-white/20 text-white font-semibold">
                      {user?.name?.[0]?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden sm:inline text-sm font-switzer font-semibold text-white">
                    {user?.name || "User"}
                  </span>
                </button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end" className="w-56 p-2">
                <DropdownMenuLabel className="font-switzer font-bold text-base">My Account</DropdownMenuLabel>
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
                  className="text-red-600 dark:text-red-400 cursor-pointer rounded-lg py-2.5 font-bold"
                  onClick={logout}
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      {/* 🔹 Main Content */}
      <main className="flex-1 mt-[70px] overflow-y-auto">{children}</main>
    </div>
  );
}
