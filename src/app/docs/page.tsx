import type { Metadata } from "next";
import Link from "next/link";
import { docsGroups, getArticle, DOCS_SITE_URL } from "./docs-nav";
import { DocsSearchTrigger } from "./components/docs-search";

export const metadata: Metadata = {
  title: "Faddy Docs",
  description:
    "Everything you need to collect feedback, build roadmaps, and ship better products with Faddy.",
  alternates: { canonical: "/docs" },
  openGraph: {
    title: "Faddy Docs",
    description:
      "Everything you need to collect feedback, build roadmaps, and ship better products with Faddy.",
    url: `${DOCS_SITE_URL}/docs`,
    type: "website",
  },
};

const popularHrefs = [
  "/docs/getting-started/quick-start",
  "/docs/features/boards",
  "/docs/features/autopilot",
  "/docs/features/slack",
];

export default function DocsHomePage() {
  return (
    <div className="max-w-[880px]">
      <section className="border-b border-[var(--docs-border)] pb-10">
        <p className="mb-3 text-[12.5px] font-semibold uppercase tracking-wider text-[var(--docs-accent-ink)]">
          Documentation
        </p>
        <h1 className="font-headline text-[34px] font-semibold leading-tight tracking-tight text-[var(--docs-ink)]">
          Help &amp; guides for Faddy
        </h1>
        <p className="mt-3 max-w-[620px] text-[15px] leading-relaxed text-[var(--docs-muted)]">
          Set up feedback boards, triage incoming requests, publish roadmaps and
          changelogs, and connect your favorite tools. Use search, or browse the
          guides below.
        </p>
        <div className="mt-6 max-w-[360px]">
          <DocsSearchTrigger
            className="flex h-9 w-full items-center gap-2 rounded-md border border-[var(--docs-border)] bg-[var(--docs-surface)] px-3 text-[13.5px] text-[var(--docs-faint)] transition-colors hover:border-[var(--docs-accent)]/40"
          />
        </div>
      </section>

      <section className="py-10" aria-labelledby="popular-heading">
        <h2
          id="popular-heading"
          className="mb-4 text-[13px] font-semibold uppercase tracking-wider text-[var(--docs-faint)]"
        >
          Popular guides
        </h2>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {popularHrefs.map((href) => {
            const article = getArticle(href);
            return (
              <Link
                key={href}
                href={href}
                className="group rounded-lg border border-[var(--docs-border)] px-4 py-3.5 transition-colors hover:border-[var(--docs-accent)]/40 hover:bg-[var(--docs-surface)]"
              >
                <span className="block text-[14px] font-medium text-[var(--docs-ink)] group-hover:text-[var(--docs-accent-ink)]">
                  {article.title}
                </span>
                <span className="mt-1 block text-[13px] leading-snug text-[var(--docs-muted)]">
                  {article.description}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="pb-10" aria-labelledby="guides-heading">
        <h2
          id="guides-heading"
          className="mb-6 text-[13px] font-semibold uppercase tracking-wider text-[var(--docs-faint)]"
        >
          All guides
        </h2>
        <div className="space-y-9">
          {docsGroups.map((group) => (
            <div key={group.title}>
              <h3 className="mb-1 font-headline text-[15px] font-semibold text-[var(--docs-ink)]">
                {group.title}
              </h3>
              <ul className="divide-y divide-[var(--docs-border)] border-t border-[var(--docs-border)]">
                {group.hrefs.map((href) => {
                  const article = getArticle(href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        className="flex items-baseline justify-between gap-4 py-2.5 transition-colors hover:text-[var(--docs-accent-ink)]"
                      >
                        <span className="text-[13.5px] font-medium text-[var(--docs-ink)]">
                          {article.title}
                        </span>
                        <span className="hidden text-[12.5px] text-[var(--docs-faint)] sm:block sm:max-w-[55%] sm:text-right">
                          {article.description}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-[var(--docs-border)] py-8">
        <p className="text-[13.5px] text-[var(--docs-muted)]">
          Can&apos;t find an answer?{" "}
          <Link
            href="/contact"
            className="font-medium text-[var(--docs-accent-ink)] underline underline-offset-2 hover:text-[var(--docs-accent)]"
          >
            Contact support
          </Link>{" "}
          or{" "}
          <Link
            href="/signup"
            className="font-medium text-[var(--docs-accent-ink)] underline underline-offset-2 hover:text-[var(--docs-accent)]"
          >
            create a free account
          </Link>
          .
        </p>
      </section>
    </div>
  );
}
