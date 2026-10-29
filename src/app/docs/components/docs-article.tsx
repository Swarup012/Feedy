"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ChevronRight } from "lucide-react";
import { getArticle, getPrevNext, getRelated } from "../docs-nav";
import { cn } from "@/lib/utils";

type TocEntry = { id: string; text: string; level: number };

function DocsToc({ containerRef }: { containerRef: React.RefObject<HTMLElement | null> }) {
  const [entries, setEntries] = useState<TocEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const headings = Array.from(
      container.querySelectorAll<HTMLElement>("h2[id], h3[id]"),
    );
    setEntries(
      headings.map((h) => ({
        id: h.id,
        text: (h.textContent ?? "").replace(/#$/, "").trim(),
        level: Number(h.tagName[1]),
      })),
    );

    const observer = new IntersectionObserver(
      (visible) => {
        for (const entry of visible) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "0px 0px -70% 0px" },
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [containerRef]);

  if (entries.length < 2) return null;

  return (
    <aside className="hidden w-[210px] shrink-0 xl:block" aria-label="On this page">
      <div className="sticky top-[5.5rem] max-h-[calc(100vh-7rem)] overflow-y-auto py-10">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--docs-faint)]">
          On this page
        </p>
        <ul className="space-y-1 border-l border-[var(--docs-border)] text-[13px]">
          {entries.map((e) => (
            <li key={e.id}>
              <a
                href={`#${e.id}`}
                className={cn(
                  "-ml-px block border-l py-1 leading-snug transition-colors",
                  e.level === 3 && "pl-5",
                  e.level === 2 && "pl-3",
                  activeId === e.id
                    ? "border-[var(--docs-accent)] text-[var(--docs-accent-ink)]"
                    : "border-transparent text-[var(--docs-muted)] hover:border-[var(--docs-border)] hover:text-[var(--docs-ink)]",
                )}
              >
                {e.text}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

export function DocsArticle({ href, children }: { href: string; children: ReactNode }) {
  const article = useMemo(() => getArticle(href), [href]);
  const { prev, next } = useMemo(() => getPrevNext(href), [href]);
  const related = useMemo(() => getRelated(href), [href]);
  const bodyRef = useRef<HTMLElement>(null);

  return (
    <div className="xl:flex xl:gap-10">
      <div className="min-w-0 flex-1">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-1.5 text-[12.5px] text-[var(--docs-faint)]">
            <li>
              <Link href="/docs" className="transition-colors hover:text-[var(--docs-ink)]">
                Docs
              </Link>
            </li>
            <ChevronRight className="h-3 w-3" aria-hidden />
            <li>
              <span aria-hidden="true">{article.group}</span>
              <span className="sr-only">{article.group}</span>
            </li>
            <ChevronRight className="h-3 w-3" aria-hidden />
            <li className="truncate text-[var(--docs-muted)]" aria-current="page">
              {article.title}
            </li>
          </ol>
        </nav>

        <header className="mb-8 border-b border-[var(--docs-border)] pb-8">
          <div className="mb-3 flex items-center gap-2.5">
            <span className="rounded-full border border-[var(--docs-border)] px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-[var(--docs-muted)]">
              {article.group}
            </span>
            {article.plan && (
              <span className="rounded-full border border-[var(--docs-accent)]/30 bg-[var(--docs-accent-soft)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--docs-accent-ink)]">
                {article.plan}
              </span>
            )}
          </div>
          <h1 className="font-headline text-[32px] font-semibold leading-tight tracking-tight text-[var(--docs-ink)]">
            {article.title}
          </h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--docs-muted)]">
            {article.description}
          </p>
        </header>

        <article ref={bodyRef} className="docs-prose max-w-[740px]">
          {children}
        </article>

        {(prev || next) && (
          <nav
            aria-label="Article navigation"
            className="mt-14 grid gap-3 border-t border-[var(--docs-border)] pt-8 sm:grid-cols-2"
          >
            {prev ? (
              <Link
                href={prev.href}
                className="group flex items-center gap-3 rounded-lg border border-[var(--docs-border)] p-4 transition-colors hover:border-[var(--docs-accent)]/40 hover:bg-[var(--docs-surface)]"
              >
                <ArrowLeft className="h-4 w-4 shrink-0 text-[var(--docs-faint)] transition-colors group-hover:text-[var(--docs-accent)]" />
                <span className="min-w-0">
                  <span className="block text-[11px] uppercase tracking-wider text-[var(--docs-faint)]">
                    Previous
                  </span>
                  <span className="block truncate text-[13.5px] font-medium text-[var(--docs-ink)]">
                    {prev.title}
                  </span>
                </span>
              </Link>
            ) : (
              <span aria-hidden />
            )}
            {next && (
              <Link
                href={next.href}
                className="group flex items-center justify-end gap-3 rounded-lg border border-[var(--docs-border)] p-4 text-right transition-colors hover:border-[var(--docs-accent)]/40 hover:bg-[var(--docs-surface)]"
              >
                <span className="min-w-0">
                  <span className="block text-[11px] uppercase tracking-wider text-[var(--docs-faint)]">
                    Next
                  </span>
                  <span className="block truncate text-[13.5px] font-medium text-[var(--docs-ink)]">
                    {next.title}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-[var(--docs-faint)] transition-colors group-hover:text-[var(--docs-accent)]" />
              </Link>
            )}
          </nav>
        )}

        {related.length > 0 && (
          <section className="mt-10" aria-labelledby="related-heading">
            <h2
              id="related-heading"
              className="mb-4 text-[13px] font-semibold uppercase tracking-wider text-[var(--docs-faint)]"
            >
              Related
            </h2>
            <ul className="grid gap-2.5 sm:grid-cols-2">
              {related.map((r) => (
                <li key={r.href}>
                  <Link
                    href={r.href}
                    className="block rounded-lg border border-[var(--docs-border)] px-4 py-3 transition-colors hover:border-[var(--docs-accent)]/40 hover:bg-[var(--docs-surface)]"
                  >
                    <span className="block text-[13.5px] font-medium text-[var(--docs-ink)]">
                      {r.title}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] leading-snug text-[var(--docs-faint)]">
                      {r.description}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <DocsToc containerRef={bodyRef} />
    </div>
  );
}
