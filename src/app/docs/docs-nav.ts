import type { Metadata } from "next";

export const DOCS_SITE_URL = "https://faddy.site";

export type DocsArticleMeta = {
  title: string;
  href: string;
  description: string;
  group: string;
  plan?: string;
  keywords: string[];
  sections: string[];
  related: string[];
  popular?: boolean;
};

export type DocsGroup = {
  title: string;
  hrefs: string[];
};

export function headingId(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[‘’']/g, "")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, "-");
}

const articles: DocsArticleMeta[] = [
  {
    title: "Quick Start Guide",
    href: "/docs/getting-started/quick-start",
    description: "Get up and running with Faddy in under 5 minutes.",
    group: "Getting started",
    keywords: ["setup", "quickstart", "signup", "first steps", "onboarding", "organization"],
    sections: [
      "Create Your Account",
      "Create Your First Board",
      "Share Your Board",
      "Start Collecting Feedback",
      "You're All Set!",
    ],
    related: [
      "/docs/getting-started/first-board",
      "/docs/getting-started/invite-team",
      "/docs/features/boards",
    ],
    popular: true,
  },
  {
    title: "Create Your First Board",
    href: "/docs/getting-started/first-board",
    description: "Learn how to create and configure feedback boards.",
    group: "Getting started",
    keywords: ["board", "create", "admin dashboard", "name", "configuration"],
    sections: [
      "What is a Feedback Board?",
      "Step-by-Step Instructions",
      "Navigate to Admin Dashboard",
      'Click "New Board"',
      "Configure Your Board",
      "Click Create",
      "Best Practices",
      "What's Next?",
    ],
    related: [
      "/docs/getting-started/invite-team",
      "/docs/features/boards",
      "/docs/features/triage",
    ],
  },
  {
    title: "Invite Team Members",
    href: "/docs/getting-started/invite-team",
    description: "Collaborate with your team by inviting admins and members.",
    group: "Getting started",
    keywords: ["team", "invite", "member", "admin", "organization settings"],
    sections: [
      "Why Invite Your Team?",
      "Step-by-Step Instructions",
      "Open Organization Settings",
      'Click "Invite Member"',
      "Enter Details",
      "Send Invitation",
      "Team Roles",
    ],
    related: [
      "/docs/features/team",
      "/docs/features/boards",
      "/docs/plans/comparison",
    ],
  },
  {
    title: "Feedback Boards",
    href: "/docs/features/boards",
    description: "Organize customer feedback into structured boards for better prioritization.",
    group: "Feedback management",
    keywords: ["board", "categories", "voting", "comments", "public sharing", "prioritization"],
    sections: ["What is a Feedback Board?", "Key Features"],
    related: [
      "/docs/features/triage",
      "/docs/features/labels",
      "/docs/getting-started/first-board",
    ],
    popular: true,
  },
  {
    title: "Triage Incoming Feedback",
    href: "/docs/features/triage",
    description: "Filter, sort, and prioritize feedback so nothing slips through.",
    group: "Feedback management",
    keywords: ["triage", "filter", "sort", "status", "priority", "board view"],
    sections: [
      "Using the board view",
      "Filters & search",
      "Updating post status",
      "Assigning categories",
      "Creating posts on behalf of users",
    ],
    related: [
      "/docs/features/boards",
      "/docs/features/labels",
      "/docs/features/roadmap",
    ],
  },
  {
    title: "Managing Post Labels",
    href: "/docs/features/labels",
    description: "Create custom categories to organize and filter feedback.",
    group: "Feedback management",
    plan: "Starter & Pro",
    keywords: ["labels", "tags", "categories", "filtering"],
    sections: [
      "Default labels",
      "Creating custom labels",
      "Assigning labels to posts",
      "Using labels for filtering",
    ],
    related: [
      "/docs/features/triage",
      "/docs/features/boards",
      "/docs/plans/comparison",
    ],
  },
  {
    title: "Setting Up the Feedback Widget",
    href: "/docs/features/widget",
    description: "Embed a floating feedback button on your site so users can submit without leaving your app.",
    group: "Feedback management",
    keywords: ["widget", "embed", "script", "javascript", "floating button", "sdk"],
    sections: [
      "Creating a widget",
      "Adding the widget to your site",
      "Identifying users",
      "Managing your widget",
    ],
    related: [
      "/docs/features/using-widget",
      "/docs/plans/limits",
      "/docs/features/boards",
    ],
  },
  {
    title: "Using Smartflow",
    href: "/docs/features/autopilot",
    description: "Paste raw text from chats, emails, or reviews and let AI detect feedback and queue a draft for your approval.",
    group: "AI automation",
    plan: "Starter & Pro",
    keywords: ["autopilot", "smartflow", "ai", "draft", "suggestions", "paste", "automatic mode", "manual mode"],
    sections: [
      "How Smartflow works",
      "Manual vs Automatic mode",
      "Manual mode",
      "Automatic mode",
      "Pasting text directly",
      "Reviewing suggestions",
      "Connecting sources",
    ],
    related: [
      "/docs/features/ai-chat",
      "/docs/features/alerts",
      "/docs/features/triage",
    ],
    popular: true,
  },
  {
    title: "Using AI Chat",
    href: "/docs/features/ai-chat",
    description: "Ask natural-language questions about your feedback data and get instant answers.",
    group: "AI automation",
    plan: "Starter & Pro",
    keywords: ["ai chat", "assistant", "questions", "conversation", "insights"],
    sections: [
      "What AI Chat knows",
      "Getting started",
      "Example questions",
      "Conversation history",
    ],
    related: [
      "/docs/features/autopilot",
      "/docs/features/triage",
      "/docs/plans/comparison",
    ],
  },
  {
    title: "Configuring High-Severity Alerts",
    href: "/docs/features/alerts",
    description: "Get instant Slack or Discord notifications when urgent feedback arrives.",
    group: "AI automation",
    plan: "Pro only",
    keywords: ["alerts", "notifications", "urgent", "severity", "slack", "discord", "channels"],
    sections: [
      "What triggers an alert",
      "Setting up alerts",
      "Alert destinations vs ingestion channels",
      "Managing channels",
    ],
    related: [
      "/docs/features/autopilot",
      "/docs/features/slack",
      "/docs/features/triage",
    ],
  },
  {
    title: "Roadmap",
    href: "/docs/features/roadmap",
    description: "Plan, organize, and share your product roadmap with your users.",
    group: "Roadmap & changelog",
    keywords: ["roadmap", "planned", "in progress", "columns", "public roadmap"],
    sections: ["Roadmap Highlights"],
    related: [
      "/docs/features/boards",
      "/docs/features/changelog",
      "/docs/features/following-roadmap",
    ],
  },
  {
    title: "Changelog",
    href: "/docs/features/changelog",
    description: "Keep customers informed with product updates and release notes.",
    group: "Roadmap & changelog",
    keywords: ["changelog", "release notes", "updates", "announcements"],
    sections: ["Why Use a Changelog?"],
    related: [
      "/docs/features/roadmap",
      "/docs/features/reading-changelog",
      "/docs/features/boards",
    ],
  },
  {
    title: "Connecting Slack",
    href: "/docs/features/slack",
    description: "Monitor a Slack channel and convert messages into actionable feedback.",
    group: "Integrations",
    plan: "Starter & Pro",
    keywords: ["slack", "integration", "channel", "bot", "workspace", "authorize"],
    sections: [
      "What you get",
      "Connecting Slack",
      "Configuring the integration",
      "1. Select a monitored channel",
      "2. Choose Manual or Automatic mode",
      "3. Set a default board",
      "Disconnecting",
    ],
    related: [
      "/docs/features/autopilot",
      "/docs/features/alerts",
      "/docs/features/triage",
    ],
    popular: true,
  },
  {
    title: "Connecting Discord",
    href: "/docs/features/discord",
    description: "Monitor a Discord channel and convert conversations into actionable feedback.",
    group: "Integrations",
    plan: "Starter & Pro",
    keywords: ["discord", "integration", "server", "channel", "bot"],
    sections: [
      "What you get",
      "Connecting Discord",
      "Configuring the integration",
      "1. Select a monitored channel",
      "2. Choose Manual or Automatic mode",
      "3. Set a default board",
      "Disconnecting",
    ],
    related: [
      "/docs/features/autopilot",
      "/docs/features/alerts",
      "/docs/features/triage",
    ],
  },
  {
    title: "Connecting Intercom",
    href: "/docs/features/intercom",
    description: "Receive closed conversation transcripts and turn them into feedback suggestions.",
    group: "Integrations",
    plan: "Starter & Pro",
    keywords: ["intercom", "integration", "conversations", "webhook", "transcripts", "support"],
    sections: [
      "What you get",
      "Connecting Intercom",
      "Setting up the webhook",
      "Configuring Smartflow mode",
      "Disconnecting",
    ],
    related: [
      "/docs/features/autopilot",
      "/docs/features/triage",
      "/docs/features/labels",
    ],
  },
  {
    title: "Connecting GitHub",
    href: "/docs/features/github",
    description: "Track issues and pull requests as feedback via the Faddy GitHub App.",
    group: "Integrations",
    plan: "Starter & Pro",
    keywords: ["github", "integration", "issues", "pull requests", "webhooks", "app"],
    sections: [
      "What you get",
      "Installing the GitHub App",
      "Setting up webhooks",
      "Configuring Smartflow mode",
      "Disconnecting",
    ],
    related: [
      "/docs/features/autopilot",
      "/docs/features/triage",
      "/docs/features/labels",
    ],
  },
  {
    title: "How to submit feedback",
    href: "/docs/features/submitting-feedback",
    description: "Share an idea, bug, or request on a public feedback board.",
    group: "End-user guides",
    keywords: ["submit", "post", "idea", "bug", "request", "public board"],
    sections: [
      "Finding the right board",
      "Creating a new post",
      "Tips for good feedback",
      "What happens next",
    ],
    related: [
      "/docs/features/voting-commenting",
      "/docs/features/following-roadmap",
      "/docs/features/reading-changelog",
    ],
  },
  {
    title: "How to vote and comment",
    href: "/docs/features/voting-commenting",
    description: "Show support for ideas and join the discussion.",
    group: "End-user guides",
    keywords: ["vote", "upvote", "comment", "reply", "discussion"],
    sections: [
      "Upvoting a post",
      "Adding a comment",
      "Replying to comments",
      "Why your vote matters",
    ],
    related: [
      "/docs/features/submitting-feedback",
      "/docs/features/following-roadmap",
      "/docs/features/reading-changelog",
    ],
  },
  {
    title: "How to follow the roadmap",
    href: "/docs/features/following-roadmap",
    description: "See what the team is working on and what is coming next.",
    group: "End-user guides",
    keywords: ["roadmap", "columns", "planned", "completed", "follow", "notifications"],
    sections: [
      "Opening the roadmap",
      "Understanding the columns",
      "Filtering by board",
      "Following a post from the roadmap",
    ],
    related: [
      "/docs/features/submitting-feedback",
      "/docs/features/reading-changelog",
      "/docs/features/voting-commenting",
    ],
  },
  {
    title: "How to read the changelog",
    href: "/docs/features/reading-changelog",
    description: "Track new features, fixes, and improvements as they ship.",
    group: "End-user guides",
    keywords: ["changelog", "release notes", "updates", "filter", "entries"],
    sections: ["Opening the changelog", "Reading an entry", "Filtering entries"],
    related: [
      "/docs/features/following-roadmap",
      "/docs/features/submitting-feedback",
      "/docs/features/voting-commenting",
    ],
  },
  {
    title: "How to use the feedback widget",
    href: "/docs/features/using-widget",
    description: "Submit feedback without leaving the product.",
    group: "End-user guides",
    keywords: ["widget", "feedback button", "panel", "submit", "identify"],
    sections: [
      "What the widget looks like",
      "Submitting feedback from the widget",
      "Identifying yourself",
      "Browsing existing posts",
    ],
    related: [
      "/docs/features/submitting-feedback",
      "/docs/features/widget",
      "/docs/features/voting-commenting",
    ],
  },
  {
    title: "Team & Permissions",
    href: "/docs/features/team",
    description: "Manage team roles and permissions across your organization.",
    group: "Team & billing",
    keywords: ["team", "roles", "permissions", "owner", "admin", "member"],
    sections: ["Roles"],
    related: [
      "/docs/getting-started/invite-team",
      "/docs/features/job-roles",
      "/docs/plans/comparison",
    ],
  },
  {
    title: "Setting Up Job Roles",
    href: "/docs/features/job-roles",
    description: "Create professional labels for your team and control board visibility.",
    group: "Team & billing",
    keywords: ["job roles", "labels", "visibility", "designer", "engineer", "board access"],
    sections: [
      "What are job roles?",
      "Creating a job role",
      "Assigning roles to team members",
      "Using job roles for board visibility",
      "Editing and deleting roles",
    ],
    related: [
      "/docs/getting-started/invite-team",
      "/docs/features/team",
      "/docs/features/boards",
    ],
  },
  {
    title: "Plan Comparison",
    href: "/docs/plans/comparison",
    description: "Compare features across Free, Starter, and Pro plans.",
    group: "Team & billing",
    keywords: ["pricing", "plans", "free", "starter", "pro", "features", "limits"],
    sections: ["Free", "Starter", "Pro", "Tracked Users & Overage"],
    related: [
      "/docs/plans/limits",
      "/docs/features/team",
      "/docs/getting-started/invite-team",
    ],
  },
  {
    title: "Usage Limits",
    href: "/docs/plans/limits",
    description: "Understand plan usage limits and overage policies.",
    group: "Team & billing",
    keywords: ["limits", "overage", "tracked users", "billing", "quota"],
    sections: ["Free", "Starter", "Pro", "Tracked Users & Overage"],
    related: [
      "/docs/plans/comparison",
      "/docs/features/widget",
      "/docs/features/team",
    ],
  },
];

export const docsGroups: DocsGroup[] = [
  {
    title: "Getting started",
    hrefs: [
      "/docs/getting-started/quick-start",
      "/docs/getting-started/first-board",
      "/docs/getting-started/invite-team",
    ],
  },
  {
    title: "Feedback management",
    hrefs: [
      "/docs/features/boards",
      "/docs/features/triage",
      "/docs/features/labels",
      "/docs/features/widget",
    ],
  },
  {
    title: "AI automation",
    hrefs: [
      "/docs/features/autopilot",
      "/docs/features/ai-chat",
      "/docs/features/alerts",
    ],
  },
  {
    title: "Roadmap & changelog",
    hrefs: [
      "/docs/features/roadmap",
      "/docs/features/changelog",
    ],
  },
  {
    title: "Integrations",
    hrefs: [
      "/docs/features/slack",
      "/docs/features/discord",
      "/docs/features/intercom",
      "/docs/features/github",
    ],
  },
  {
    title: "End-user guides",
    hrefs: [
      "/docs/features/submitting-feedback",
      "/docs/features/voting-commenting",
      "/docs/features/following-roadmap",
      "/docs/features/reading-changelog",
      "/docs/features/using-widget",
    ],
  },
  {
    title: "Team & billing",
    hrefs: [
      "/docs/features/team",
      "/docs/features/job-roles",
      "/docs/plans/comparison",
      "/docs/plans/limits",
    ],
  },
];

const articleByHref = new Map(articles.map((a) => [a.href, a]));

export const orderedDocsHref = articles.map((a) => a.href);

export function getArticle(href: string): DocsArticleMeta {
  const article = articleByHref.get(href);
  if (!article) {
    throw new Error(`Unknown docs article: ${href}`);
  }
  return article;
}

export function getPrevNext(
  href: string,
): { prev: DocsArticleMeta | null; next: DocsArticleMeta | null } {
  const index = orderedDocsHref.indexOf(href);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? articleByHref.get(orderedDocsHref[index - 1]) ?? null : null,
    next:
      index < orderedDocsHref.length - 1
        ? articleByHref.get(orderedDocsHref[index + 1]) ?? null
        : null,
  };
}

export function getRelated(href: string): DocsArticleMeta[] {
  return getArticle(href)
    .related.map((r) => articleByHref.get(r))
    .filter((a): a is DocsArticleMeta => Boolean(a));
}

export function getGroupOf(href: string): string {
  return getArticle(href).group;
}

export type DocsSearchResult = {
  title: string;
  href: string;
  context: string;
  group: string;
};

export function searchDocs(query: string, limit = 12): DocsSearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const terms = q.split(/\s+/).filter(Boolean);
  const results: { score: number; result: DocsSearchResult }[] = [];

  for (const article of articles) {
    let score = 0;
    const title = article.title.toLowerCase();
    const description = article.description.toLowerCase();
    const keywords = article.keywords.join(" ");
    const haystack = `${title} ${description} ${keywords}`;

    for (const term of terms) {
      if (!haystack.includes(term)) continue;
      if (title === term) score += 8;
      else if (title.startsWith(term)) score += 6;
      else if (title.includes(term)) score += 5;
      if (keywords.includes(term)) score += 3;
      if (description.includes(term)) score += 2;
      if (article.group.toLowerCase().includes(term)) score += 1;
    }

    if (score === 0) {
      // Fall back to section-heading matches so deep topics stay findable.
      const sectionHit = article.sections.find((s) =>
        s.toLowerCase().includes(q),
      );
      if (sectionHit) {
        results.push({
          score: 2,
          result: {
            title: sectionHit,
            href: `${article.href}#${headingId(sectionHit)}`,
            context: article.title,
            group: article.group,
          },
        });
      }
      continue;
    }

    // Prefer a section-heading anchor when the query matches one exactly.
    const sectionHit = article.sections.find(
      (s) => s.toLowerCase().includes(q),
    );
    results.push({
      score,
      result: {
        title: sectionHit ?? article.title,
        href: sectionHit
          ? `${article.href}#${headingId(sectionHit)}`
          : article.href,
        context: sectionHit ? article.title : article.description,
        group: article.group,
      },
    });
  }

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.result);
}

export function docsMetadata(href: string): Metadata {
  const article = getArticle(href);
  return {
    title: article.title,
    description: article.description,
    keywords: article.keywords,
    alternates: {
      canonical: href,
    },
    openGraph: {
      title: `${article.title} | Faddy Docs`,
      description: article.description,
      url: `${DOCS_SITE_URL}${href}`,
      type: "article",
      siteName: "Faddy Docs",
    },
  };
}
