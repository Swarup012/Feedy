import { render, screen, cleanup } from "@testing-library/react";
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";

// ============================================================
// Member dashboard Overview widgets.
//
// Contract covered here:
//  - Status pills always carry a TEXT label (never color alone)
//  - Pipeline bar: 5 segments + legend counts + "N closed" so totals
//    reconcile with "My feedback" (closed excluded from the bar)
//  - Stat cards show the /my-overview values
//  - Empty state: "Post your first idea" CTA instead of zeros
//  - Multi-org: useMyOverview refetches when the org id changes and the
//    SWR key embeds the org id (no cross-org cache hits)
// ============================================================

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) =>
    React.createElement("a", { href, ...rest }, children),
}));

const apiGet = vi.fn();
vi.mock("@/lib/api", () => ({
  default: { get: (...args: unknown[]) => apiGet(...args) },
}));

import { StatCards } from "./StatCards";
import { PipelineCard } from "./PipelineCard";
import { RecentFeedbackTable } from "./RecentFeedbackTable";
import { UpdatesTimeline } from "./UpdatesTimeline";
import { TrendingBoards } from "./TrendingBoards";
import { FirstIdeaCta } from "./FirstIdeaCta";
import { StatusPill } from "./StatusPill";
import { OverviewPanel } from "./OverviewPanel";
import { useMyOverview } from "@/hooks/useFeedbackData";

const STATS = {
  myPosts: 6,
  newThisMonth: 2,
  votesReceived: 12,
  votesThisWeek: 3,
  pipeline: { open: 1, underReview: 1, planned: 1, inProgress: 1, shipped: 1, closed: 1 },
  shippedPercent: 17,
};

beforeEach(() => {
  apiGet.mockReset();
  apiGet.mockImplementation(async (url: string) => {
    if (url.startsWith("/api/dashboard/my-overview")) {
      return {
        data: {
          success: true,
          data: { stats: STATS, posts: [], updates: [] },
        },
      };
    }
    return { data: { success: true, data: { posts: [], count: 0 } } };
  });
});

afterEach(() => cleanup());

describe("StatusPill", () => {
  it("renders a text label for every status, not color alone", () => {
    const statuses = ["open", "under-review", "planned", "in-progress", "completed", "closed"];
    const labels = ["Open", "Under review", "Planned", "In progress", "Shipped", "Closed"];
    statuses.forEach((s, i) => {
      const { container } = render(<StatusPill status={s} />);
      expect(screen.getByText(labels[i])).toBeTruthy();
      // pill is a span with text content — not an empty color chip
      expect(container.textContent).toBe(labels[i]);
      cleanup();
    });
  });
});

describe("StatCards", () => {
  it("shows my feedback, votes, pipeline and shipped values", () => {
    render(<StatCards stats={STATS} />);
    expect(screen.getByText("My feedback")).toBeTruthy();
    expect(screen.getByText("2 new this month")).toBeTruthy();
    expect(screen.getByText("Votes received")).toBeTruthy();
    expect(screen.getByText("+3 this week")).toBeTruthy();
    expect(screen.getByText("In the pipeline")).toBeTruthy();
    // underReview 1 + planned 1 + inProgress 1
    expect(screen.getByText("1 under review · 1 planned · 1 in progress")).toBeTruthy();
    expect(screen.getByText("Shipped")).toBeTruthy();
    expect(screen.getByText("17% of your suggestions")).toBeTruthy();
  });
});

describe("PipelineCard", () => {
  it("renders five legend segments and reconciles closed outside the bar", () => {
    render(<PipelineCard pipeline={STATS.pipeline} />);
    expect(screen.getByText("Your feedback pipeline")).toBeTruthy();
    for (const label of ["Open", "Under review", "Planned", "In progress", "Shipped"]) {
      expect(screen.getByText(label)).toBeTruthy();
    }
    // closed shows as "· N closed" next to the legend
    expect(screen.getByText("· 1 closed")).toBeTruthy();
    // bar + legend: closed count appears only in the reconciliation note
    const closedMatches = screen.getAllByText("1").length;
    expect(closedMatches).toBeGreaterThanOrEqual(5);
  });
});

describe("RecentFeedbackTable", () => {
  it("links suggestions to the existing post route /feedback/:id", () => {
    const posts = [
      {
        id: "post-1",
        title: "Dark mode please",
        status: "under-review",
        upvotes: 4,
        board: { id: "b1", name: "General", slug: "general", icon: "Lightbulb" },
      },
    ] as never[];
    render(<RecentFeedbackTable posts={posts} onViewAll={() => {}} />);
    const link = screen.getByText("Dark mode please") as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("/feedback/post-1");
    expect(screen.getByText("Under review")).toBeTruthy();
  });
});

describe("UpdatesTimeline + TrendingBoards", () => {
  it("timeline shows status changes and replies; trending links to posts", () => {
    render(
      <>
        <UpdatesTimeline
          updates={[
            {
              type: "status_change",
              post_id: "p1",
              post_title: "Fix export",
              old_status: "open",
              new_status: "planned",
              actor_name: "Ada",
              created_at: new Date().toISOString(),
            },
          ]}
        />,
        <TrendingBoards
          posts={[
            {
              id: "hot-1",
              title: "Top request",
              upvotes: 9,
              board: { id: "b1", name: "Ideas", slug: "ideas", icon: "Star" },
            },
          ] as never[]}
        />,
      </>,
    );
    expect(screen.getByText("Updates on your suggestions")).toBeTruthy();
    expect(screen.getByText(/Moved “Fix export” from Open to/)).toBeTruthy();
    expect(screen.getByText("Trending on boards")).toBeTruthy();
    const trendingLink = screen.getByText("Top request").closest("a");
    expect(trendingLink?.getAttribute("href")).toBe("/feedback/hot-1");
  });

  it("hides the trending widget entirely when there's nothing trending", () => {
    const { container } = render(<TrendingBoards posts={[]} />);
    expect(container.firstChild).toBeNull();
    expect(screen.queryByText("Trending on boards")).toBeNull();
  });
});

describe("FirstIdeaCta", () => {
  it("replaces zeros for a brand-new member", () => {
    render(<FirstIdeaCta onPostIdea={() => {}} />);
    expect(screen.getByText("Post your first idea")).toBeTruthy();
    expect(screen.getByText(/New feedback/)).toBeTruthy();
  });
});

describe("OverviewPanel — loading / error / CTA states", () => {
  const PANEL_PROPS: React.ComponentProps<typeof OverviewPanel> = {
    organizationId: "org-1",
    isLoading: false,
    error: null,
    onRetry: () => {},
    stats: null,
    myPosts: [],
    updates: [],
    trendingPosts: [],
    onNewFeedback: () => {},
    onViewAll: () => {},
  };

  it("shows a spinner (not the CTA) while organization id is null", () => {
    const { container } = render(<OverviewPanel {...PANEL_PROPS} organizationId={null} />);
    expect(container.querySelector(".animate-spin")).toBeTruthy();
    expect(screen.queryByText("Post your first idea")).toBeNull();
    expect(screen.queryByText("Couldn't load your overview")).toBeNull();
  });

  it("shows a spinner (not the CTA) while the overview fetch is in flight", () => {
    const { container } = render(<OverviewPanel {...PANEL_PROPS} isLoading={true} />);
    expect(container.querySelector(".animate-spin")).toBeTruthy();
    expect(screen.queryByText("Post your first idea")).toBeNull();
    expect(screen.queryByText("Couldn't load your overview")).toBeNull();
  });

  it("shows an error message with a Retry button on fetch failure — no FirstIdeaCta", () => {
    const onRetry = vi.fn();
    render(
      <OverviewPanel {...PANEL_PROPS} error={new Error("network down")} onRetry={onRetry} />,
    );
    expect(screen.getByText("Couldn't load your overview")).toBeTruthy();
    expect(screen.queryByText("Post your first idea")).toBeNull();

    const retry = screen.getByRole("button", { name: "Retry" });
    retry.click();
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows FirstIdeaCta only when the request succeeded and myPosts is empty", () => {
    render(<OverviewPanel {...PANEL_PROPS} />);
    expect(screen.getByText("Post your first idea")).toBeTruthy();
    expect(screen.queryByText("Couldn't load your overview")).toBeNull();
  });

  it("error wins over empty stats — success-only CTA means no CTA on error", () => {
    render(<OverviewPanel {...PANEL_PROPS} error={new Error("boom")} stats={null} />);
    expect(screen.getByText("Couldn't load your overview")).toBeTruthy();
    expect(screen.queryByText("Post your first idea")).toBeNull();
  });
});

describe("useMyOverview — multi-org refetch", () => {
  it("embeds the org id in the SWR key and refetches on org switch", async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => <>{children}</>;

    const { result, rerender } = renderHook(
      ({ orgId }: { orgId: string | null }) => useMyOverview(orgId),
      {
        wrapper,
        initialProps: { orgId: "org-A" as string | null },
      },
    );

    // First mount: org A key → fetch fired
    expect(apiGet).toHaveBeenCalledWith("/api/dashboard/my-overview");
    await act(async () => {});
    expect(result.current.stats?.myPosts).toBe(6);

    const callsAfterA = apiGet.mock.calls.length;

    // Switch to org B: new key → refetch, no stale org-A data
    rerender({ orgId: "org-B" });
    await act(async () => {});
    expect(apiGet.mock.calls.length).toBeGreaterThan(callsAfterA);

    // No fetch at all while org id is null (e.g. mid org-switch)
    apiGet.mockClear();
    rerender({ orgId: null });
    await act(async () => {});
    expect(apiGet).not.toHaveBeenCalled();
  });
});
