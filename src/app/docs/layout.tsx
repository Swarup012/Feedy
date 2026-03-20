"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LandingFooter } from "@/components/ui/landing-footer";
import { 
  BookOpen, 
  Search, 
  Home, 
  Rocket, 
  Settings, 
  Zap,
  Menu,
  X,
  ChevronRight
} from "lucide-react";

const navigation = [
  {
    title: "Getting Started",
    icon: Rocket,
    items: [
      { title: "Introduction", href: "/docs" },
      { title: "Quick Start", href: "/docs/getting-started/quick-start" },
      { title: "Create Your First Board", href: "/docs/getting-started/first-board" },
      { title: "Invite Team Members", href: "/docs/getting-started/invite-team" },
    ],
  },
  {
    title: "Features",
    icon: Zap,
    items: [
      { title: "Feedback Boards", href: "/docs/features/boards" },
      { title: "Roadmap", href: "/docs/features/roadmap" },
      { title: "Changelog", href: "/docs/features/changelog" },
      { title: "Team & Permissions", href: "/docs/features/team" },
    ],
  },
  {
    title: "Plans & Billing",
    icon: Settings,
    items: [
      { title: "Plan Comparison", href: "/docs/plans/comparison" },
      { title: "Usage Limits", href: "/docs/plans/limits" },
    ],
  },
];

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-50 dark:from-slate-950 dark:via-blue-950/10 dark:to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <Logo width={28} height={28} />
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Faddy
              </span>
            </Link>
            <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
            <Link href="/docs" className="flex items-center gap-2 text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">
              <BookOpen className="h-4 w-4" />
              <span className="font-semibold">Documentation</span>
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="outline" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="bg-gradient-to-r from-blue-600 to-blue-700">
                Get Started
              </Button>
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <div className="container flex-1 items-start md:grid md:grid-cols-[240px_1fr] md:gap-8 lg:grid-cols-[280px_1fr] lg:gap-12 py-8">
        {/* Sidebar Navigation */}
        <aside className={cn(
          "fixed top-16 z-30 h-[calc(100vh-4rem)] w-full shrink-0 overflow-y-auto border-r border-slate-200/60 dark:border-slate-800/60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl md:sticky md:block",
          mobileMenuOpen ? "block" : "hidden md:block"
        )}>
          <div className="p-6 space-y-8">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search docs..."
                className="pl-9 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              />
            </div>

            {/* Navigation */}
            <nav className="space-y-6">
              {navigation.map((section) => (
                <div key={section.title}>
                  <h4 className="flex items-center gap-2 mb-3 text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    <section.icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    {section.title}
                  </h4>
                  <ul className="space-y-1.5">
                    {section.items.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all",
                            pathname === item.href
                              ? "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
                              : "text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                          )}
                        >
                          {pathname === item.href && (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                          {item.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>

            {/* Help Card */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border border-blue-200/50 dark:border-blue-800/50">
              <h4 className="font-bold text-sm mb-2 text-slate-900 dark:text-white">
                Need Help?
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mb-3">
                Can't find what you're looking for?
              </p>
              <Link href="/contact">
                <Button size="sm" variant="outline" className="w-full text-xs">
                  Contact Support
                </Button>
              </Link>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="relative py-6 lg:py-8">
          <div className="mx-auto max-w-4xl">
            {children}
          </div>
        </main>
      </div>

      <LandingFooter showCTA={false} />
    </div>
  );
}
