"use client";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import DashboardPage from "../dashboard/page";

export default function AdminPage() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isTaskbarVisible, setIsTaskbarVisible] = useState(false);
  const taskbarRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { href: "/admin", label: "Overview", icon: "📊" },
    { href: "/admin/feedback", label: "Feedback", icon: "💬" },
    { href: "/admin/profile", label: "Profile", icon: "👤" },
    { href: "/admin/roadmap", label: "Roadmap", icon: "🗺️" },
  ];

  // Initialize theme from localStorage or system preference
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

  // Mouse movement detection for taskbar
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const distanceFromBottom = window.innerHeight - e.clientY;

      // Show taskbar when cursor is close to bottom (within 100px)
      if (distanceFromBottom < 100) {
        setIsTaskbarVisible(true);
      } else {
        // Hide taskbar when cursor moves away, but only if not hovering over taskbar
        if (!taskbarRef.current?.contains(e.target as Node)) {
          setIsTaskbarVisible(false);
        }
      }
    };

    // Keep taskbar visible when hovering over it
    const handleTaskbarMouseEnter = () => setIsTaskbarVisible(true);
    const handleTaskbarMouseLeave = () => setIsTaskbarVisible(false);

    document.addEventListener("mousemove", handleMouseMove);

    const taskbarElement = taskbarRef.current;
    if (taskbarElement) {
      taskbarElement.addEventListener("mouseenter", handleTaskbarMouseEnter);
      taskbarElement.addEventListener("mouseleave", handleTaskbarMouseLeave);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      if (taskbarElement) {
        taskbarElement.removeEventListener(
          "mouseenter",
          handleTaskbarMouseEnter,
        );
        taskbarElement.removeEventListener(
          "mouseleave",
          handleTaskbarMouseLeave,
        );
      }
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.className = newTheme;
    localStorage.setItem("theme", newTheme);
  };

  const router = useRouter();
  const [viewMode, setViewMode] = useState<"admin" | "public">("admin");

  const handleToggle = () => {
    if (viewMode === "admin") {
      setViewMode("public");
      router.push("/feedback"); // 👉 navigate to public view
    } else {
      setViewMode("admin");
      router.push("/admin"); // 👉 navigate back to admin view
    }
  };

  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pb-24 transition-colors duration-300">
        {/* Main Content */}
        <div className="container mx-auto py-8 px-4">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold font-headline text-gray-900 dark:text-white">
                Admin Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Welcome back, {user?.name || user?.email}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
              {/* View Mode Toggle */}
              <button
                onClick={handleToggle}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-300"
              >
                {viewMode === "admin"
                  ? "Switch to Public View"
                  : "Switch to Admin View"}
              </button>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 shadow-sm"
                aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
              >
                {theme === "light" ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌙</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Dark
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-lg">☀️</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Light
                    </span>
                  </div>
                )}
              </button>

              <button
                onClick={logout}
                className="bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors text-sm"
              >
                Sign Out
              </button>
            </div>
          </header>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                  Total Users
                </CardTitle>
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <span>👥</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  1,234
                </div>
                <p className="text-xs text-muted-foreground">
                  +12% from last month
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                  Feedback
                </CardTitle>
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <span>💬</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  567
                </div>
                <p className="text-xs text-muted-foreground">
                  +8% from last week
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                  Active Issues
                </CardTitle>
                <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
                  <span>⚠️</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  23
                </div>
                <p className="text-xs text-muted-foreground">
                  -5% from yesterday
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 transition-colors duration-300">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-900 dark:text-white">
                  Satisfaction
                </CardTitle>
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <span>⭐</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  94%
                </div>
                <p className="text-xs text-muted-foreground">
                  +2% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Table */}
          <Card className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-gray-200 dark:border-gray-700 transition-colors duration-300 mb-8">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest user interactions and feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-gray-900 dark:text-white">
                      User
                    </TableHead>
                    <TableHead className="text-gray-900 dark:text-white">
                      Action
                    </TableHead>
                    <TableHead className="text-gray-900 dark:text-white">
                      Status
                    </TableHead>
                    <TableHead className="text-gray-900 dark:text-white">
                      Date
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium text-gray-900 dark:text-white">
                      john@example.com
                    </TableCell>
                    <TableCell className="text-gray-700 dark:text-gray-300">
                      Submitted feedback
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">New</Badge>
                    </TableCell>
                    <TableCell className="text-gray-700 dark:text-gray-300">
                      Just now
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-900 dark:text-white">
                      sarah@company.com
                    </TableCell>
                    <TableCell className="text-gray-700 dark:text-gray-300">
                      Updated profile
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Completed</Badge>
                    </TableCell>
                    <TableCell className="text-gray-700 dark:text-gray-300">
                      5 minutes ago
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-gray-900 dark:text-white">
                      mike@startup.com
                    </TableCell>
                    <TableCell className="text-gray-700 dark:text-gray-300">
                      Reported issue
                    </TableCell>
                    <TableCell>
                      <Badge variant="destructive">Urgent</Badge>
                    </TableCell>
                    <TableCell className="text-gray-700 dark:text-gray-300">
                      1 hour ago
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* macOS-Style Auto-Hiding Bottom Taskbar */}
        <div
          ref={taskbarRef}
          className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 transition-all duration-500 ease-in-out ${
            isTaskbarVisible
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-10 pointer-events-none"
          }`}
        >
          <div className="bg-gray-800/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl px-6 py-3 border border-gray-700/50 dark:border-gray-600/50 shadow-2xl transition-colors duration-300">
            <nav className="flex items-center gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ${
                    pathname === item.href
                      ? "bg-white/20 text-white scale-110"
                      : "text-gray-300 hover:text-white hover:bg-white/10 hover:scale-105"
                  }`}
                >
                  <span className="text-xl transition-transform duration-200">
                    {item.icon}
                  </span>
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
