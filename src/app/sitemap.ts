import type { MetadataRoute } from "next";
import { getAllBlogPosts } from "@/lib/blog";

const SITE_URL = "https://www.usefaddy.com";
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// ── Fetch public board slugs from the backend ─────────────────────────────
// This runs on the server at request time (no auth cookie needed — public API).
async function getPublicBoardSlugs(): Promise<string[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/public/boards`, {
      next: { revalidate: 3600 }, // cache for 1 hour
    });
    if (!res.ok) return [];
    const json = await res.json();
    // The public boards API returns { success, data: { boards: [{ slug }] } }
    const boards: { slug: string }[] =
      json?.data?.boards ?? json?.boards ?? [];
    return boards.map((b) => b.slug).filter(Boolean);
  } catch {
    return [];
  }
}

export const revalidate = 3600; // regenerate sitemap at most once per hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const boardSlugs = await getPublicBoardSlugs();

  // ── Static marketing & app pages ────────────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/canny-alternative`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/changelog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/feedback`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/roadmap`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.75,
    },
    // Marketing feature pages
    {
      url: `${SITE_URL}/collect-feedback`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${SITE_URL}/analyze-feedback`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${SITE_URL}/share-updates`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.65,
    },
    {
      url: `${SITE_URL}/role-based-access`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/public-roadmap`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    // Policy pages
    {
      url: `${SITE_URL}/policy/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/policy/terms`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  // ── Dynamic board pages ──────────────────────────────────────────────────
  const boardPages: MetadataRoute.Sitemap = boardSlugs.map((slug) => ({
    url: `${SITE_URL}/feedback/boards/${slug}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  // ── Dynamic per-board roadmap pages ─────────────────────────────────────
  const roadmapPages: MetadataRoute.Sitemap = boardSlugs.map((slug) => ({
    url: `${SITE_URL}/roadmap/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  // ── Blog pages ───────────────────────────────────────────────────────────
  const blogPosts = getAllBlogPosts();
  const blogListPage: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
  ];
  const blogPostPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${SITE_URL}/blog/${post.slug}`,
    lastModified: post.date ? new Date(post.date) : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    ...staticPages,
    ...boardPages,
    ...roadmapPages,
    ...blogListPage,
    ...blogPostPages,
  ];
}

