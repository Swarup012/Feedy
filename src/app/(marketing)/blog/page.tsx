import type { Metadata } from "next";
import Link from "next/link";
import { getAllBlogPosts } from "@/lib/blog";
import { format } from "date-fns";

export const metadata: Metadata = {
  title: "Blog — Faddy",
  description:
    "Product insights, SaaS growth tactics, and user feedback best practices from the Faddy team.",
  alternates: {
    canonical: "https://www.usefaddy.com/blog",
  },
  openGraph: {
    title: "Blog — Faddy",
    description:
      "Product insights, SaaS growth tactics, and user feedback best practices from the Faddy team.",
    url: "https://www.usefaddy.com/blog",
    type: "website",
  },
};

export default function BlogListPage() {
  const posts = getAllBlogPosts();

  return (
    <main className="min-h-screen bg-background">

      {/* ─── Hero ────────────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 py-10">
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
            From the team
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground leading-tight tracking-tight mb-4">
          Product &amp; Growth Insights
        </h1>
        <p className="text-base text-muted-foreground max-w-xl leading-relaxed">
          Practical advice on collecting user feedback, building better SaaS
          products, and growing sustainably.
        </p>
      </section>

      {/* ─── Post List ───────────────────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto px-4 pb-12">
        {posts.length === 0 ? (
          <p className="text-muted-foreground text-center py-10">
            No posts yet — check back soon.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="group py-5 flex flex-col sm:flex-row sm:items-start gap-4"
              >
                {/* Date */}
                <time
                  dateTime={post.date}
                  className="shrink-0 text-sm text-muted-foreground w-28 pt-1 font-mono"
                >
                  {post.date
                    ? format(new Date(post.date), "MMM d, yyyy")
                    : "—"}
                </time>

                {/* Content */}
                <div className="flex-1">
                  <Link href={`/blog/${post.slug}`} className="block">
                    <h2 className="text-lg font-semibold text-foreground leading-snug group-hover:text-primary transition-colors mb-2">
                      {post.title}
                    </h2>
                    {post.description && (
                      <p className="text-muted-foreground leading-relaxed text-sm">
                        {post.description}
                      </p>
                    )}
                  </Link>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="inline-flex items-center gap-1 mt-4 text-sm font-medium text-primary hover:underline"
                  >
                    Read more →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border">
        <div className="max-w-4xl mx-auto px-4 py-5 flex items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Faddy</span>
          <Link href="/policy/privacy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
        </div>
      </footer>
    </main>
  );
}
