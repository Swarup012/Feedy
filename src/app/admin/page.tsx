"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useOrganization } from "@/context/OrganizationContext";
import { isPaidPlan } from "@/config/plans";
import { boardService } from "@/services/boardService";
import api from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { UpgradeDialog } from "@/components/UpgradeDialog";

import { Clock, Users, ThumbsUp, FileText } from "lucide-react";

import { TrackedUsersWidget } from "@/components/TrackedUsersWidget";
import { TrackedUsersLimitBanner } from "@/components/TrackedUsersLimitBanner";
import { ExpertView } from "@/components/admin/ExpertView";

/* ======================================================
   MAIN PAGE
====================================================== */

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const handleError = useErrorHandler({
    context: "loadDashboard",
    showToast: true,
    logError: true,
  });
  const { organization, organizationRole } = useOrganization();

  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalBoards: 0,
    totalPosts: 0,
    totalVotes: 0,
    pendingPosts: 0,
    newThisWeek: 0,
    activeUsers: 0,
    totalComments: 0,
    statusDistribution: {},
  });

  const [recentPosts, setRecentPosts] = useState([]);
  const [mostUpvoted, setMostUpvoted] = useState([]);
  const [trending, setTrending] = useState([]);
  const [topBoards, setTopBoards] = useState([]);
  const [topContributors, setTopContributors] = useState([]);
  const [feedbackTrend, setFeedbackTrend] = useState([]);
  const [boards, setBoards] = useState([]);

  const pageRef = useRef(null);

  // Check if user has a paid plan (Starter or Pro)
  const hasPaidPlan = isPaidPlan(organization);

  // Free users are locked to basic view, paid users default to expert view
  const [isBasicView, setIsBasicView] = useState(!hasPaidPlan);
  const [upgradeDialogOpen, setUpgradeDialogOpen] = useState(false);

  /* =======================
     DATA LOADING (UNCHANGED)
     ======================= */

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (!loading && pageRef.current) {
      gsap.fromTo(
        pageRef.current.children,
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.04,
          ease: "power2.out",
        },
      );
    }
  }, [loading]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const res = await api.get("/api/dashboard/stats");
      const data = res.data?.data || res.data;

      setStats({
        totalBoards: data.totalBoards || 0,
        totalPosts: data.totalPosts || 0,
        totalVotes: data.totalVotes || 0,
        pendingPosts: data.pendingPosts || 0,
        newThisWeek: data.newThisWeek || 0,
        activeUsers: data.activeUsers || 0,
        totalComments: data.totalComments || 0,
        statusDistribution: data.statusDistribution || {},
        pendingTrend: data.pendingTrend || [],
        newThisWeekTrend: data.newThisWeekTrend || [],
        activeUsersTrend: data.activeUsersTrend || [],
        trendingTrend: data.trendingTrend || [],
      });

      setRecentPosts(data.recentPosts || []);
      setMostUpvoted(data.mostUpvoted || []);
      setTrending(data.trending || []);
      setTopBoards(data.topBoards || []);
      setTopContributors(data.topContributors || []);
      setFeedbackTrend(data.feedbackTrend || []);

      // Fetch boards separately for the board list (lightweight)
      try {
        const boardsRes = await boardService.getAllBoards();
        setBoards(boardsRes.data?.boards || []);
      } catch (boardErr) {
        console.warn("Board list fetch failed (non-critical):", boardErr);
      }
      setLoading(false);
    } catch (err) {
      handleError(err);
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["owner", "admin"]}>
      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        featureName="Expert View"
      />
      <div
        ref={pageRef}
        className="h-screen overflow-hidden bg-background flex flex-col"
      >
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col h-full overflow-hidden space-y-4">
          {/* HEADER - Clean Canny-style header */}
          <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
            <div className="space-y-1">
              <div>
                <h1 className="text-2xl sm:text-3xl font-switzer font-semibold tracking-tight text-foreground">
                  {organization?.name || "Dashboard"}
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  What needs your attention right now
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {/* View Mode Switcher */}
              <div className="inline-flex items-center rounded-lg border border-border bg-background p-1 shadow-sm">
                <button
                  onClick={() => setIsBasicView(true)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    isBasicView
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Basic
                </button>
                <button
                  onClick={() =>
                    hasPaidPlan
                      ? setIsBasicView(false)
                      : setUpgradeDialogOpen(true)
                  }
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                    !isBasicView && hasPaidPlan
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Expert
                </button>
              </div>
              <Button
                onClick={() => router.push("/dashboard")}
                variant="outline"
                className="gap-2 h-11 px-5 transition-all"
              >
                <Users className="h-4 w-4" />
                <span className="font-semibold">Preview member view</span>
              </Button>
            </div>
          </section>

          {/* TRACKED USERS LIMIT WARNING */}
          <TrackedUsersLimitBanner />

          {loading ? (
            /* ===== LOADING SKELETON ===== */
            <div className="flex-1 overflow-y-auto min-h-0 pb-4 space-y-4">
              {/* Stat cards skeleton */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border bg-card p-4 flex items-start gap-3"
                  >
                    <Skeleton className="mt-0.5 w-9 h-9 rounded-lg flex-shrink-0" />
                    <div className="min-w-0 space-y-2 flex-1">
                      <Skeleton className="h-7 w-16" />
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
              {/* Two-column skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                <div className="lg:col-span-3 space-y-4">
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="divide-y divide-border">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="px-5 py-3 flex items-center gap-3"
                        >
                          <Skeleton className="w-2 h-2 rounded-full flex-shrink-0" />
                          <Skeleton className="h-3 w-16 flex-shrink-0" />
                          <Skeleton className="h-4 flex-1" />
                          <Skeleton className="h-3 w-8 flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-border">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-36 mt-1.5" />
                    </div>
                    <div className="divide-y divide-border">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className="px-5 py-3 flex items-center gap-3"
                        >
                          <Skeleton className="w-5 h-4 flex-shrink-0" />
                          <Skeleton className="h-4 flex-1" />
                          <Skeleton className="h-3 w-8 flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-2 space-y-4">
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="divide-y divide-border">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="px-5 py-3 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <Skeleton className="w-2 h-2 rounded-full" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                          <Skeleton className="h-3 w-12" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-border">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-40 mt-1.5" />
                    </div>
                    <div className="px-5 py-4 space-y-3">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-3 w-12" />
                          </div>
                          <Skeleton className="h-1.5 w-full rounded-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : /* ===== BASIC VIEW / EXPERT VIEW ===== */
          isBasicView ? (
            <div className="flex-1 overflow-y-auto min-h-0 pb-4 space-y-4">
              {/* ── Stat Cards ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    label: "Total Posts",
                    value: stats.totalPosts,
                    sub: `${stats.newThisWeek} new this week`,
                    icon: FileText,
                    accent: false,
                  },
                  {
                    label: "Needs Review",
                    value: stats.pendingPosts,
                    sub: "Waiting for your action",
                    icon: Clock,
                    accent: true,
                  },
                  {
                    label: "Total Votes",
                    value: stats.totalVotes,
                    sub: "Across all boards",
                    icon: ThumbsUp,
                    accent: false,
                  },
                  {
                    label: "Active Users",
                    value: stats.activeUsers,
                    sub: "Contributing members",
                    icon: Users,
                    accent: false,
                  },
                ].map(({ label, value, sub, icon: Icon, accent }) => (
                  <div
                    key={label}
                    className="rounded-xl border border-border bg-card p-4 flex items-start gap-3"
                  >
                    <div
                      className={`mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${accent ? "bg-primary/10" : "bg-muted"}`}
                    >
                      <Icon
                        className={`w-4 h-4 ${accent ? "text-primary" : "text-muted-foreground"}`}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-2xl font-bold text-foreground leading-none">
                        {value ?? 0}
                      </p>
                      <p className="text-xs font-medium text-foreground mt-1">
                        {label}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                        {sub}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Two-column layout ── */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                {/* Left — Recent Posts + Top Upvoted */}
                <div className="lg:col-span-3 space-y-4">
                  {/* Recent Posts */}
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          Recent Posts
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Latest feedback from your users
                        </p>
                      </div>
                      <button
                        onClick={() => router.push("/admin/feedback")}
                        className="text-xs text-primary hover:underline font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                      >
                        View all feedback →
                      </button>
                    </div>
                    <div className="divide-y divide-border">
                      {recentPosts.length > 0 ? (
                        recentPosts.slice(0, 5).map((p: any) => {
                          const statusDot: Record<string, string> = {
                            open: "bg-blue-500",
                            "under-review": "bg-amber-500",
                            planned: "bg-cyan-500",
                            "in-progress": "bg-violet-500",
                            completed: "bg-emerald-500",
                            closed: "bg-gray-400",
                          };
                          return (
                            <div
                              key={p.id}
                              className="px-5 py-3 flex items-center gap-3 hover:bg-muted/40 transition-colors"
                            >
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span
                                  className={`w-2 h-2 rounded-full ${statusDot[p.status] || "bg-gray-300"}`}
                                />
                                <span className="text-[11px] text-muted-foreground capitalize">
                                  {(p.status || "open").replace("-", " ")}
                                </span>
                              </div>
                              <span className="flex-1 text-sm font-medium text-foreground truncate">
                                {p.title}
                              </span>
                              <span className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                                <ThumbsUp className="w-3 h-3" />
                                {p.vote_count ?? 0}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                          No posts yet — submit your first piece of feedback to
                          get started
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Top Upvoted */}
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-border">
                      <h3 className="text-sm font-semibold text-foreground">
                        Most Requested
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Posts with the most votes
                      </p>
                    </div>
                    <div className="divide-y divide-border">
                      {mostUpvoted.length > 0 ? (
                        mostUpvoted.slice(0, 4).map((p: any, i: number) => (
                          <div
                            key={p.id}
                            className="px-5 py-3 flex items-center gap-3 hover:bg-muted/40 transition-colors"
                          >
                            <span className="w-5 text-center text-xs font-bold text-muted-foreground flex-shrink-0">
                              #{i + 1}
                            </span>
                            <span className="flex-1 text-sm font-medium text-foreground truncate">
                              {p.title}
                            </span>
                            <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground flex-shrink-0">
                              <ThumbsUp className="w-3 h-3" />
                              {p.vote_count ?? 0}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                          No votes yet — votes show what your users care about
                          most
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right — Boards + Status */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Boards */}
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">
                          Your Boards
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {boards.length} active board
                          {boards.length !== 1 ? "s" : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => router.push("/admin/feedback")}
                        className="text-xs text-primary hover:underline font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                      >
                        See all boards →
                      </button>
                    </div>
                    <div className="divide-y divide-border">
                      {boards.length > 0 ? (
                        boards.slice(0, 5).map((b: any) => (
                          <div
                            key={b.id}
                            onClick={() =>
                              router.push(`/admin/feedback/boards/${b.slug}`)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                router.push(`/admin/feedback/boards/${b.slug}`);
                              }
                            }}
                            tabIndex={0}
                            role="button"
                            className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-muted/40 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                              <span className="text-sm font-medium text-foreground truncate">
                                {b.name}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              {b.postCount ?? 0} posts
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="px-5 py-8 text-center space-y-2">
                          <p className="text-sm text-muted-foreground">
                            No boards yet — a board is where feedback lives
                          </p>
                          <button
                            onClick={() =>
                              router.push("/admin/feedback/welcome")
                            }
                            className="text-xs text-primary hover:underline font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                          >
                            Create your first board →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status Overview */}
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-border">
                      <h3 className="text-sm font-semibold text-foreground">
                        Feedback Status
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Distribution across {stats.totalPosts} posts
                      </p>
                    </div>
                    <div className="px-5 py-4 space-y-3">
                      {Object.entries(stats.statusDistribution || {}).length >
                      0 ? (
                        Object.entries(stats.statusDistribution).map(
                          ([k, v]: [string, any]) => {
                            const pct =
                              stats.totalPosts > 0
                                ? Math.round((v / stats.totalPosts) * 100)
                                : 0;
                            const colors: Record<string, string> = {
                              open: "bg-blue-500",
                              "under-review": "bg-amber-500",
                              planned: "bg-cyan-500",
                              "in-progress": "bg-violet-500",
                              completed: "bg-emerald-500",
                              closed: "bg-gray-400",
                            };
                            return (
                              <div key={k} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-medium text-foreground capitalize">
                                    {k.replace("-", " ")}
                                  </span>
                                  <span className="text-muted-foreground">
                                    {v}{" "}
                                    <span className="text-muted-foreground/60">
                                      ({pct}%)
                                    </span>
                                  </span>
                                </div>
                                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${colors[k] || "bg-primary"} rounded-full transition-all duration-700`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          },
                        )
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No data yet
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Tracked Users */}
                  <TrackedUsersWidget
                    variant="basic"
                    onUsageClick={() => router.push("/admin/tracked-users")}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* ===== EXPERT VIEW (Part 2 — deeper operational analytics) ===== */
            <div className="flex-1 min-h-0 overflow-hidden pb-2">
              <ExpertView organizationId={organization?.id} />
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
