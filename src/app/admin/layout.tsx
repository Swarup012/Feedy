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
import {useState,useEffect} from "react"

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [viewMode, setViewMode] = useState<"admin" | "public">("admin");

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark";
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
      .matches
      ? "dark"
      : "light";
    const initialTheme = savedTheme || systemTheme;
    setTheme(initialTheme);
    document.documentElement.className = initialTheme;
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
    { name: "Feedback", path: "/admin/feedback" },
    { name: "Profile", path: "/admin/profile" },
    { name: "Roadmap", path: "/admin/roadmap" },
    { name: "Explore", path: "/feedback"}
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* 🔹 Navbar */}


<nav className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b shadow-sm z-50">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          {/* Left side - Brand + Org Switcher + Nav */}
          <div className="flex items-center gap-6">
            <Link href="/admin" className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              Dashboard
            </Link>

            {/* Organization Switcher */}
            <OrganizationSwitcher />

            <div className="hidden md:flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-blue-600 dark:hover:text-blue-400",
                    pathname === item.path
                      ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 pb-1"
                      : "text-gray-600 dark:text-gray-300"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 shadow-sm"
                aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              >
                {theme === "light" ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌙</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">☀️</span>
                  </div>
                )}
              </button>
          </div>

          {/* Right side - User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 focus:outline-none">
                <Avatar className="h-9 w-9">
                  <AvatarImage src={user?.avatar || ""} alt={user?.name || "User"} />
                  <AvatarFallback>{user?.name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline text-sm font-medium text-gray-700 dark:text-gray-200">
                  {user?.name || "User"}
                </span>
              </button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/admin/profile")}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/admin/organization")}>
                Organization Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push("/admin/feedback")}>
                Feedback
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/create-organization")}>
                + Create Organization
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 cursor-pointer"
                onClick={logout}
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </nav>

      {/* 🔹 Main Content */}

<main className="flex-1 container mx-auto px-6 py-8 mt-16">{children}</main>
    </div>
  );
}
