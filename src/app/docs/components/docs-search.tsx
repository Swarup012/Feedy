"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { CornerDownLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { docsGroups, getArticle, searchDocs, type DocsSearchResult } from "../docs-nav";

const DocsSearchOpenContext = createContext<{ open: () => void }>({ open: () => {} });

export function DocsSearchProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const openCb = useCallback(() => setOpen(true), []);
  const value = useMemo(() => ({ open: openCb }), [openCb]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <DocsSearchOpenContext.Provider value={value}>
      {children}
      <DocsSearchDialog open={open} onOpenChange={setOpen} />
    </DocsSearchOpenContext.Provider>
  );
}

export function DocsSearchTrigger({ className }: { className?: string }) {
  const { open } = useContext(DocsSearchOpenContext);
  const [shortcut, setShortcut] = useState<string | null>(null);

  useEffect(() => {
    const platform =
      (navigator as unknown as { userAgentData?: { platform?: string } })
        .userAgentData?.platform ?? navigator.platform;
    setShortcut(/Mac|iPhone|iPad|iPod/.test(platform) ? "⌘K" : "Ctrl K");
  }, []);

  return (
    <button
      type="button"
      onClick={open}
      className={
        className ??
        "flex h-8 w-full items-center gap-2 rounded-md border border-[var(--docs-border)] bg-[var(--docs-surface)] px-3 text-[13px] text-[var(--docs-faint)] transition-colors hover:border-[var(--docs-accent)]/40 hover:text-[var(--docs-muted)] lg:max-w-[240px]"
      }
      aria-label="Search documentation"
    >
      <Search className="h-3.5 w-3.5" />
      <span className="flex-1 text-left">Search docs…</span>
      {shortcut && (
        <kbd className="hidden rounded border border-[var(--docs-border)] bg-[var(--docs-bg)] px-1.5 py-0.5 font-sans text-[10px] font-medium text-[var(--docs-faint)] sm:block">
          {shortcut}
        </kbd>
      )}
    </button>
  );
}

function DocsSearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const results: DocsSearchResult[] = useMemo(() => searchDocs(query), [query]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
    setQuery("");
  }, [open]);

  const goTo = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [onOpenChange, router],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, Math.max(results.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && results[active]) {
      e.preventDefault();
      goTo(results[active].href);
    }
  };

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-index="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const suggestions = useMemo(() => {
    const hrefs: string[] = [];
    for (const group of docsGroups) {
      for (const href of group.hrefs) {
        if (getArticle(href).popular) hrefs.push(href);
      }
    }
    return hrefs.map((href) => {
      const a = getArticle(href);
      return { title: a.title, href, context: a.group };
    });
  }, []);

  const items = query.trim() ? results : suggestions;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-w-lg flex-col gap-0 overflow-hidden border border-[var(--docs-border)] bg-[var(--docs-bg)] p-0 text-[var(--docs-ink)] sm:max-w-lg [&>button]:hidden"
      >
        <DialogTitle className="sr-only">Search documentation</DialogTitle>
        <DialogDescription className="sr-only">
          Search Faddy documentation by title, section, or keyword.
        </DialogDescription>
        <div className="flex items-center gap-2.5 border-b border-[var(--docs-border)] px-4">
          <Search className="h-4 w-4 shrink-0 text-[var(--docs-faint)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search docs…"
            className="h-12 w-full bg-transparent text-[14px] text-[var(--docs-ink)] outline-none placeholder:text-[var(--docs-faint)]"
            aria-label="Search query"
            role="combobox"
            aria-expanded
            aria-controls="docs-search-results"
          />
          <Button
            variant="ghost"
            size="sm"
            className="h-6 shrink-0 px-1.5 text-[10px] text-[var(--docs-faint)]"
            onClick={() => onOpenChange(false)}
          >
            Esc
          </Button>
        </div>
        <div
          id="docs-search-results"
          ref={listRef}
          role="listbox"
          aria-label="Search results"
          className="max-h-[360px] overflow-y-auto p-2"
          onKeyDown={onKeyDown}
        >
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <p className="text-sm font-medium text-[var(--docs-ink)]">
                No results for &ldquo;{query.trim()}&rdquo;
              </p>
              <p className="mt-1 text-[13px] text-[var(--docs-faint)]">
                Try broader terms like &ldquo;board&rdquo;, &ldquo;slack&rdquo; or &ldquo;pricing&rdquo;.
              </p>
            </div>
          ) : (
            <>
              {!query.trim() && (
                <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--docs-faint)]">
                  Popular guides
                </p>
              )}
              {items.map((r, i) => (
                <button
                  key={`${r.href}-${i}`}
                  type="button"
                  data-index={i}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => goTo(r.href)}
                  className={`flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-[13.5px] transition-colors ${
                    i === active
                      ? "bg-[var(--docs-accent-soft)] text-[var(--docs-ink)]"
                      : "text-[var(--docs-muted)]"
                  }`}
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{r.title}</span>
                    <span className="block truncate text-xs text-[var(--docs-faint)]">
                      {r.context}
                    </span>
                  </span>
                  {i === active && (
                    <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-[var(--docs-faint)]" />
                  )}
                </button>
              ))}
            </>
          )}
        </div>
        <div className="flex items-center gap-4 border-t border-[var(--docs-border)] px-4 py-2.5 text-[11px] text-[var(--docs-faint)]">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-[var(--docs-border)] px-1 py-0.5 font-sans">↑↓</kbd>
            navigate
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-[var(--docs-border)] px-1 py-0.5 font-sans">↵</kbd>
            open
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-[var(--docs-border)] px-1 py-0.5 font-sans">esc</kbd>
            close
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
