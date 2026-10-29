"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { docsGroups, getArticle } from "../docs-nav";
import { cn } from "@/lib/utils";

export function DocsSidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Documentation" className="space-y-7">
      <div>
        <Link
          href="/docs"
          onClick={onNavigate}
          className={cn(
            "block rounded-md px-2.5 py-1.5 text-[13px] font-medium transition-colors",
            pathname === "/docs"
              ? "bg-[var(--docs-accent-soft)] text-[var(--docs-accent-ink)]"
              : "text-[var(--docs-muted)] hover:bg-[var(--docs-surface)] hover:text-[var(--docs-ink)]",
          )}
        >
          Introduction
        </Link>
      </div>
      {docsGroups.map((group) => (
        <div key={group.title}>
          <h3 className="mb-2 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--docs-faint)]">
            {group.title}
          </h3>
          <ul className="space-y-0.5">
            {group.hrefs.map((href) => {
              const article = getArticle(href);
              const isActive = pathname === href;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "block rounded-md border-l-2 px-2.5 py-1.5 text-[13px] leading-snug transition-colors",
                      isActive
                        ? "border-[var(--docs-accent)] bg-[var(--docs-accent-soft)] font-medium text-[var(--docs-accent-ink)]"
                        : "border-transparent text-[var(--docs-muted)] hover:bg-[var(--docs-surface)] hover:text-[var(--docs-ink)]",
                    )}
                  >
                    {article.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
