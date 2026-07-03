import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkHtml from "remark-html";

const BLOG_DIR = path.join(process.cwd(), "content/blog");

export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  content?: string;
  contentHtml?: string;
}

/** Returns all blog post slugs (file names without .md) */
export function getAllBlogSlugs(): string[] {
  if (!fs.existsSync(BLOG_DIR)) return [];
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
}

/** Returns sorted list of all post frontmatter (newest first, no content) */
export function getAllBlogPosts(): BlogPost[] {
  const slugs = getAllBlogSlugs();

  const posts = slugs.map((slug) => {
    const filePath = path.join(BLOG_DIR, `${slug}.md`);
    const raw = fs.readFileSync(filePath, "utf-8");
    const { data } = matter(raw);

    return {
      slug: (data.slug as string) || slug,
      title: (data.title as string) || slug,
      description: (data.description as string) || "",
      date: (data.date as string) || "",
    };
  });

  // Sort newest first
  return posts.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

/** Returns a single post's metadata + rendered HTML body */
export async function getBlogPost(
  slug: string
): Promise<BlogPost | null> {
  const filePath = path.join(BLOG_DIR, `${slug}.md`);
  if (!fs.existsSync(filePath)) return null;

  const raw = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(raw);

  const processed = await remark().use(remarkHtml).process(content);
  const contentHtml = processed.toString();

  return {
    slug: (data.slug as string) || slug,
    title: (data.title as string) || slug,
    description: (data.description as string) || "",
    date: (data.date as string) || "",
    content,
    contentHtml,
  };
}
