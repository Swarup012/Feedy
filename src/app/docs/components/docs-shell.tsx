"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { DocsSidebarNav } from "./docs-sidebar-nav";
import { DocsSearchProvider, DocsSearchTrigger } from "./docs-search";

export function DocsShell({ children }: { children: ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <DocsSearchProvider>
      <div className="min-h-screen bg-[var(--docs-bg)] text-[var(--docs-ink)]">
        <a
          href="#docs-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-[var(--docs-raised)] focus:px-3 focus:py-2 focus:text-sm focus:text-[var(--docs-ink)] focus:shadow-lg"
        >
          Skip to content
        </a>

        <header className="sticky top-0 z-40 h-14 border-b border-[var(--docs-border)] bg-[var(--docs-header)] backdrop-blur-xl">
          <div className="mx-auto flex h-full max-w-[1440px] items-center gap-3 px-4 lg:px-8">
            <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="-ml-1 rounded-md p-2 text-[var(--docs-muted)] transition-colors hover:bg-[var(--docs-surface)] hover:text-[var(--docs-ink)] lg:hidden"
                  aria-label="Open documentation navigation"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-[300px] border-[var(--docs-border)] bg-[var(--docs-bg)] p-0 text-[var(--docs-ink)] sm:w-[320px]"
              >
                <SheetTitle className="sr-only">Documentation navigation</SheetTitle>
                <div className="flex h-14 items-center border-b border-[var(--docs-border)] px-4">
                  <Logo width={24} height={24} />
                  <span className="ml-2 font-headline text-[15px] font-semibold">
                    Faddy Docs
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto px-3 py-4">
                  <DocsSidebarNav onNavigate={() => setMobileNavOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>

            <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Faddy home">
              <Logo width={24} height={24} />
              <span className="font-headline text-[15px] font-semibold tracking-tight">
                Faddy
              </span>
            </Link>
            <span className="h-4 w-px bg-[var(--docs-border)]" aria-hidden />
            <Link
              href="/docs"
              className="shrink-0 text-[13.5px] font-medium text-[var(--docs-muted)] transition-colors hover:text-[var(--docs-ink)]"
            >
              Docs
            </Link>

            <div className="ml-auto flex items-center gap-2.5">
              <div className="hidden sm:block sm:w-[200px] lg:w-[240px]">
                <DocsSearchTrigger />
              </div>
              <button
                type="button"
                className="rounded-md border border-[var(--docs-border)] bg-[var(--docs-surface)] p-1.5 text-[var(--docs-faint)] sm:hidden"
                aria-label="Search documentation"
                onClick={() => {
                  // Reuse the same ⌘K dialog via keyboard-equivalent shortcut.
                  document.dispatchEvent(
                    new KeyboardEvent("keydown", { key: "k", ctrlKey: true }),
                  );
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </button>
              <ThemeToggle />
              <Link href="/login" className="hidden sm:block">
                <Button variant="ghost" size="sm" className="text-[var(--docs-muted)]">
                  Sign in
                </Button>
              </Link>
              <Link href="/signup">
                <Button size="sm" className="bg-[var(--docs-accent)] text-white hover:bg-[var(--docs-accent)]/90">
                  Get started
                </Button>
              </Link>
            </div>
          </div>
        </header>

        <div className="mx-auto flex w-full max-w-[1440px] px-4 lg:px-8">
          <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-[248px] shrink-0 overflow-y-auto pb-10 pr-2 pt-6 lg:block">
            <DocsSidebarNav />
          </aside>

          <main id="docs-content" className="min-w-0 flex-1 pt-10">
            <div className="mx-auto max-w-[1010px] pb-16 lg:px-2">{children}</div>
          </main>
        </div>

        <footer className="border-t border-[var(--docs-border)]">
          <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-6 text-[12.5px] text-[var(--docs-faint)] lg:px-8">
            <span>© {new Date().getFullYear()} Faddy</span>
            <div className="flex items-center gap-4">
              <Link href="/docs" className="transition-colors hover:text-[var(--docs-ink)]">
                Documentation home
              </Link>
              <Link href="/contact" className="transition-colors hover:text-[var(--docs-ink)]">
                Contact support
              </Link>
              <Link href="/" className="transition-colors hover:text-[var(--docs-ink)]">
                faddy.site
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </DocsSearchProvider>
  );
}
