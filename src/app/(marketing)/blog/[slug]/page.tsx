import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllBlogSlugs, getBlogPost } from "@/lib/blog";
import { format } from "date-fns";

// ── Static generation ────────────────────────────────────────────────────────
export async function generateStaticParams() {
  const slugs = getAllBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

// ── SEO metadata ─────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    return { title: "Post Not Found — Faddy" };
  }

  return {
    title: `${post.title} — Faddy Blog`,
    description: post.description,
    alternates: {
      canonical: `https://www.usefaddy.com/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://www.usefaddy.com/blog/${post.slug}`,
      type: "article",
      publishedTime: post.date,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) notFound();

  return (
    <main className="min-h-screen bg-background">


      {/* ─── Article ─────────────────────────────────────────────────────── */}
      <article className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
        {/* Meta */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
              Blog
            </span>
            {post.date && (
              <time
                dateTime={post.date}
                className="text-sm text-muted-foreground font-mono"
              >
                {format(new Date(post.date), "MMMM d, yyyy")}
              </time>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight tracking-tight mb-6">
            {post.title}
          </h1>

          {post.description && (
            <p className="text-lg sm:text-xl text-muted-foreground leading-relaxed border-l-4 border-primary/30 pl-5">
              {post.description}
            </p>
          )}
        </header>

        {/* ─── Rendered markdown ─────────────────────────────────────────── */}
        <div
          className="prose-blog"
          dangerouslySetInnerHTML={{ __html: post.contentHtml ?? "" }}
        />

        {/* ─── Footer CTA ────────────────────────────────────────────────── */}
        <div className="mt-20 pt-10 border-t border-border">
          <div className="rounded-2xl bg-primary/5 border border-primary/15 p-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-3">
              Try Faddy free
            </p>
            <p className="text-xl font-semibold text-foreground mb-6 leading-snug">
              Ready to build a feedback loop that actually works?
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              Get started — it&apos;s free →
            </Link>
          </div>
        </div>

        {/* ─── Back link ─────────────────────────────────────────────────── */}
        <div className="mt-10">
          <Link
            href="/blog"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to all posts
          </Link>
        </div>
      </article>

      {/* ─── Footer ──────────────────────────────────────────────────────── */}
      <footer className="border-t border-border">
        <div className="max-w-3xl mx-auto px-6 py-8 flex items-center justify-between text-xs text-muted-foreground">
          <span>© {new Date().getFullYear()} Faddy</span>
          <Link
            href="/policy/privacy"
            className="hover:text-foreground transition-colors"
          >
            Privacy Policy
          </Link>
        </div>
      </footer>
    </main>
  );
}
