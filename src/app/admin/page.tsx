"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useOrganization } from "@/context/OrganizationContext";
import { boardService } from "@/services/boardService";
import api from "@/lib/api";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { UpgradeDialog } from "@/components/UpgradeDialog";

import {
  LayoutDashboard,
  Clock,
  TrendingUp,
  Users,
  ThumbsUp,
  MessageSquare,
  FileText,
} from "lucide-react";

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import { DashboardSkeleton } from "@/components/admin/DashboardSkeleton";
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
  // Use organization's subscription_plan field - free, starter, or pro
  const currentPlan = organization?.subscription_plan || "free";
  const hasPaidPlan = currentPlan === "starter" || currentPlan === "pro";

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

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={["owner", "admin"]}>
        <DashboardSkeleton />
      </ProtectedRoute>
    );
  }

  /* =======================
     UI - REDESIGNED FOR PREMIUM UX
     ======================= */

  return (
    <ProtectedRoute allowedRoles={["owner", "admin"]}>
      <UpgradeDialog
        open={upgradeDialogOpen}
        onOpenChange={setUpgradeDialogOpen}
        featureName="Expert View"
      />
      <div ref={pageRef} className="h-screen overflow-hidden bg-background flex flex-col">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col h-full overflow-hidden space-y-4">
          {/* HEADER - Clean Canny-style header */}
          <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
            <div className="space-y-1">
              <div>
                <h1 className="text-2xl sm:text-3xl font-switzer font-semibold tracking-tight text-foreground">
                  {organization?.name || "Dashboard"}
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Here's what's happening with your organization
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
                  onClick={() => hasPaidPlan ? setIsBasicView(false) : setUpgradeDialogOpen(true)}
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
                <span className="font-semibold">Member View</span>
              </Button>
            </div>
          </section>

          {/* TRACKED USERS LIMIT WARNING */}
          <TrackedUsersLimitBanner />

          {isBasicView ? (
            /* ===== BASIC VIEW ===== */
            <div className="flex-1 overflow-y-auto min-h-0 pb-4 space-y-4">

              {/* ── Stat Cards ── */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    label: 'Total Posts',
                    value: stats.totalPosts,
                    sub: `${stats.newThisWeek} new this week`,
                    icon: FileText,
                    color: 'text-blue-600',
                    bg: 'bg-blue-50 dark:bg-blue-950/30',
                  },
                  {
                    label: 'Needs Review',
                    value: stats.pendingPosts,
                    sub: 'Waiting for your action',
                    icon: Clock,
                    color: 'text-amber-600',
                    bg: 'bg-amber-50 dark:bg-amber-950/30',
                  },
                  {
                    label: 'Total Votes',
                    value: stats.totalVotes,
                    sub: 'Across all boards',
                    icon: ThumbsUp,
                    color: 'text-emerald-600',
                    bg: 'bg-emerald-50 dark:bg-emerald-950/30',
                  },
                  {
                    label: 'Active Users',
                    value: stats.activeUsers,
                    sub: 'Contributing members',
                    icon: Users,
                    color: 'text-violet-600',
                    bg: 'bg-violet-50 dark:bg-violet-950/30',
                  },
                ].map(({ label, value, sub, icon: Icon, color, bg }) => (
                  <div
                    key={label}
                    className="rounded-xl border border-border bg-card p-4 flex items-start gap-3"
                  >
                    <div className={`mt-0.5 w-9 h-9 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-4 h-4 ${color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-2xl font-bold text-foreground leading-none">{value ?? 0}</p>
                      <p className="text-xs font-medium text-foreground mt-1">{label}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{sub}</p>
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
                        <h3 className="text-sm font-semibold text-foreground">Recent Posts</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Latest feedback from your users</p>
                      </div>
                      <button
                        onClick={() => router.push('/admin/feedback')}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        View all →
                      </button>
                    </div>
                    <div className="divide-y divide-border">
                      {recentPosts.length > 0 ? (
                        recentPosts.slice(0, 5).map((p: any) => {
                          const statusDot: Record<string, string> = {
                            open: 'bg-blue-500',
                            'under-review': 'bg-amber-500',
                            planned: 'bg-cyan-500',
                            'in-progress': 'bg-violet-500',
                            completed: 'bg-emerald-500',
                            closed: 'bg-gray-400',
                          };
                          return (
                            <div key={p.id} className="px-5 py-3 flex items-center gap-3 hover:bg-muted/40 transition-colors">
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot[p.status] || 'bg-gray-300'}`} />
                              <span className="flex-1 text-sm font-medium text-foreground truncate">{p.title}</span>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <ThumbsUp className="w-3 h-3" />{p.vote_count ?? 0}
                                </span>
                                <span className="text-[11px] text-muted-foreground capitalize hidden sm:block">
                                  {(p.status || 'open').replace('-', ' ')}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                          No posts yet
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Top Upvoted */}
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-border">
                      <h3 className="text-sm font-semibold text-foreground">Most Requested</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Posts with the most votes</p>
                    </div>
                    <div className="divide-y divide-border">
                      {mostUpvoted.length > 0 ? (
                        mostUpvoted.slice(0, 4).map((p: any, i: number) => (
                          <div key={p.id} className="px-5 py-3 flex items-center gap-3 hover:bg-muted/40 transition-colors">
                            <span className="w-5 text-center text-xs font-bold text-muted-foreground flex-shrink-0">#{i + 1}</span>
                            <span className="flex-1 text-sm font-medium text-foreground truncate">{p.title}</span>
                            <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400 flex-shrink-0">
                              <ThumbsUp className="w-3 h-3" />{p.vote_count ?? 0}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="px-5 py-8 text-center text-sm text-muted-foreground">No votes yet</div>
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
                        <h3 className="text-sm font-semibold text-foreground">Your Boards</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{boards.length} active board{boards.length !== 1 ? 's' : ''}</p>
                      </div>
                      <button
                        onClick={() => router.push('/admin/feedback')}
                        className="text-xs text-primary hover:underline font-medium"
                      >
                        Manage →
                      </button>
                    </div>
                    <div className="divide-y divide-border">
                      {boards.length > 0 ? (
                        boards.slice(0, 5).map((b: any) => (
                          <div
                            key={b.id}
                            onClick={() => router.push(`/admin/feedback/boards/${b.slug}`)}
                            className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-muted/40 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                              <span className="text-sm font-medium text-foreground truncate">{b.name}</span>
                            </div>
                            <span className="text-xs text-muted-foreground flex-shrink-0">{b.postCount ?? 0} posts</span>
                          </div>
                        ))
                      ) : (
                        <div className="px-5 py-6 text-center space-y-2">
                          <p className="text-sm text-muted-foreground">No boards yet</p>
                          <button
                            onClick={() => router.push('/admin/feedback/welcome')}
                            className="text-xs text-primary hover:underline font-medium"
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
                      <h3 className="text-sm font-semibold text-foreground">Feedback Status</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">Distribution across {stats.totalPosts} posts</p>
                    </div>
                    <div className="px-5 py-4 space-y-3">
                      {Object.entries(stats.statusDistribution || {}).length > 0 ? (
                        Object.entries(stats.statusDistribution).map(([k, v]: [string, any]) => {
                          const pct = stats.totalPosts > 0 ? Math.round((v / stats.totalPosts) * 100) : 0;
                          const colors: Record<string, string> = {
                            open: 'bg-blue-500',
                            'under-review': 'bg-amber-500',
                            planned: 'bg-cyan-500',
                            'in-progress': 'bg-violet-500',
                            completed: 'bg-emerald-500',
                            closed: 'bg-gray-400',
                          };
                          return (
                            <div key={k} className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-medium text-foreground capitalize">{k.replace('-', ' ')}</span>
                                <span className="text-muted-foreground">{v} <span className="text-muted-foreground/60">({pct}%)</span></span>
                              </div>
                              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${colors[k] || 'bg-primary'} rounded-full transition-all duration-700`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No data yet</p>
                      )}
                    </div>
                  </div>

                  {/* Tracked Users */}
                  <TrackedUsersWidget
                    variant="basic"
                    onUsageClick={() => router.push('/admin/tracked-users')}
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

/* ======================================================
   COMPONENTS
====================================================== */

function MultiMetricChart({
  pendingTrend,
  newThisWeekTrend,
  activeUsersTrend,
  trendingTrend,
  stats,
  trending,
}) {
  // Combine all trends into one dataset
  const combinedData = Array.from({ length: 7 }).map((_, i) => ({
    day: i,
    pending: pendingTrend[i]?.value || 0,
    newPosts: newThisWeekTrend[i]?.value || 0,
    activeUsers: activeUsersTrend[i]?.value || 0,
    trending: trendingTrend[i]?.value || 0,
  }));

  return (
    <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border-border/80 overflow-hidden">
      <CardHeader className="pb-4 border-b border-border/60 bg-gradient-to-r from-transparent to-muted/30">
        <CardTitle className="text-lg font-switzer font-semibold">
          Metrics Overview
        </CardTitle>
        <CardDescription>7-day trend for all key metrics</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Metric Values at Top */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Needs Review
            </p>
            <p className="text-xl font-switzer font-semibold text-foreground">
              {stats.pendingPosts}
            </p>
            <div className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: "#3b82f6" }}
              ></div>
              <span className="text-xs text-muted-foreground">Blue line</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              New This Week
            </p>
            <p className="text-xl font-switzer font-semibold text-foreground">
              {stats.newThisWeek}
            </p>
            <div className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: "#10b981" }}
              ></div>
              <span className="text-xs text-muted-foreground">Green line</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Active Contributors
            </p>
            <p className="text-xl font-switzer font-semibold text-foreground">
              {stats.activeUsers}
            </p>
            <div className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: "#8b5cf6" }}
              ></div>
              <span className="text-xs text-muted-foreground">Purple line</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Trending Feedback
            </p>
            <p className="text-xl font-switzer font-semibold text-foreground">
              {trending.length}
            </p>
            <div className="flex items-center gap-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: "#f59e0b" }}
              ></div>
              <span className="text-xs text-muted-foreground">Orange line</span>
            </div>
          </div>
        </div>

        {/* Multi-line Chart */}
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={combinedData}>
              <defs>
                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="orangeGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "hsl(var(--foreground))" }}
              />
              <Line
                type="monotone"
                dataKey="pending"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                fill="url(#blueGradient)"
                name="Needs Review"
                animationDuration={500}
              />
              <Line
                type="monotone"
                dataKey="newPosts"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
                fill="url(#greenGradient)"
                name="New This Week"
                animationDuration={500}
              />
              <Line
                type="monotone"
                dataKey="activeUsers"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
                fill="url(#purpleGradient)"
                name="Active Contributors"
                animationDuration={500}
              />
              <Line
                type="monotone"
                dataKey="trending"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                fill="url(#orangeGradient)"
                name="Trending Feedback"
                animationDuration={500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ title, value, trend = [], color = "blue" }) {
  const colorMap = {
    blue: { stroke: "#3b82f6", bg: "bg-blue-50 dark:bg-blue-950/30", border: "border-l-blue-500", accent: "text-blue-600" },
    green: { stroke: "#10b981", bg: "bg-emerald-50 dark:bg-emerald-950/30", border: "border-l-emerald-500", accent: "text-emerald-600" },
    purple: { stroke: "#8b5cf6", bg: "bg-violet-50 dark:bg-violet-950/30", border: "border-l-violet-500", accent: "text-violet-600" },
    amber: { stroke: "#f59e0b", bg: "bg-amber-50 dark:bg-amber-950/30", border: "border-l-amber-500", accent: "text-amber-600" },
  };
  const colors = colorMap[color] || colorMap.blue;
  const gradientId = `metricGrad-${color}`;

  return (
    <Card className={`transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border-border overflow-hidden border-l-2 ${colors.border}`}>
      <CardContent className="p-5">
        <div className="flex items-stretch gap-4">
          <div className="flex flex-col justify-between w-[40%]">
            <p className="text-xs font-switzer font-medium text-muted-foreground uppercase tracking-wider">
              {title}
            </p>
            <p className={`text-xl font-switzer font-bold mt-2 ${colors.accent}`}>
              {value}
            </p>
          </div>
          {trend.length > 0 && (
            <div className="w-[60%] h-16 mt-auto">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.stroke} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={colors.stroke} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke={colors.stroke}
                    strokeWidth={2}
                    fill={`url(#${gradientId})`}
                    dot={false}
                    animationDuration={800}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Section({
  title,
  description,
  children,
  icon: Icon,
  badge,
  fullWidth,
}) {
  return (
    <Card className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border-border/80 overflow-hidden flex flex-col h-full">
      <CardHeader className="pb-4 border-b border-border/60 bg-gradient-to-r from-transparent to-muted/30 shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {Icon && (
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary mt-0.5">
                <Icon className="h-4 w-4" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-switzer font-semibold tracking-tight text-foreground">
                  {title}
                </CardTitle>
                {badge !== undefined && (
                  <Badge variant="secondary" className="text-xs font-semibold">
                    {badge}
                  </Badge>
                )}
              </div>
              {description && (
                <CardDescription className="text-sm mt-1 text-muted-foreground">
                  {description}
                </CardDescription>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-5 flex-1 min-h-0 overflow-y-auto">{children}</CardContent>
    </Card>
  );
}

function Row({ title, meta, onClick, status, rank }) {
  const statusColors = {
    "under-review":
      "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400",
    planned: "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400",
    "in-progress":
      "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400",
    completed:
      "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400",
    closed: "bg-muted text-muted-foreground",
  };

  // Different styles for clickable vs non-clickable items
  const baseClasses =
    "group flex items-center gap-3 p-3.5 rounded-lg transition-all duration-200";
  const clickableClasses = onClick
    ? "border border-transparent hover:border-primary/20 hover:bg-accent cursor-pointer"
    : "border border-transparent";

  return (
    <div onClick={onClick} className={`${baseClasses} ${clickableClasses}`}>
      {rank && (
        <div
          className={`flex items-center justify-center w-7 h-7 rounded-full bg-secondary text-secondary-foreground text-xs font-bold flex-shrink-0 ${onClick ? "group-hover:scale-110" : ""} transition-transform`}
        >
          {rank}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <span
          className={`font-switzer font-semibold text-sm text-foreground block truncate transition-colors ${onClick ? "group-hover:text-primary" : ""}`}
        >
          {title}
        </span>
        {status && (
          <span
            className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[status] || statusColors["under-review"]}`}
          >
            {status.replace("-", " ")}
          </span>
        )}
      </div>
      <span className="text-xs font-medium text-muted-foreground ml-2 flex-shrink-0 bg-muted px-2.5 py-1 rounded-full">
        {meta}
      </span>
    </div>
  );
}

function Action({ icon: Icon, label, description, onClick, color = "blue" }) {
  const colorClasses = {
    blue: {
      bg: "bg-primary",
      text: "text-primary",
    },
    purple: {
      bg: "bg-purple-600 dark:bg-purple-500",
      text: "text-purple-600 dark:text-purple-500",
    },
    green: {
      bg: "bg-green-600 dark:bg-green-500",
      text: "text-green-600 dark:text-green-500",
    },
  };

  return (
    <Card
      className="relative hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer group border-border overflow-hidden"
      onClick={onClick}
    >
      <CardContent className="p-5 relative z-10">
        <div className="flex items-start gap-4">
          <div
            className={`p-3 rounded-lg ${colorClasses[color].bg} shadow-sm group-hover:scale-110 transition-transform duration-300`}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0 pt-1">
            <p className="font-semibold text-base text-foreground mb-1 transition-colors">
              {label}
            </p>
            {description && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* =======================
   GRAPH COMPONENT
   ======================= */

function FeedbackTrendChart({ data }) {
  const containerRef = useRef(null);
  const lineRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !lineRef.current) return;

    gsap.fromTo(
      containerRef.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
    );

    const path = lineRef.current.getTotalLength();
    gsap.fromTo(
      lineRef.current,
      { strokeDasharray: path, strokeDashoffset: path },
      { strokeDashoffset: 0, duration: 0.9, ease: "power2.out", delay: 0.2 },
    );
  }, []);

  // Calculate total and average
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const average = data.length > 0 ? Math.round(total / data.length) : 0;
  const peak = Math.max(...data.map((d) => d.count));

  // 30 daily points cannot fit 30 readable labels. Show only the first,
  // last, and every 7th day so ticks never overlap on narrow cards.
  const ticks = data.reduce((acc, d, i) => {
    if (i === 0 || i === data.length - 1 || i % 7 === 0) {
      acc.push(d.day);
    }
    return acc;
  }, [] as string[]);

  return (
    <Card
      ref={containerRef}
      className="transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 border-border/80 overflow-hidden flex flex-col h-full"
    >
      <CardHeader className="pb-4 border-b border-border/60 bg-gradient-to-r from-transparent to-muted/30 shrink-0">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex-1">
              <CardTitle className="text-lg font-switzer font-semibold tracking-tight text-foreground">
                Feedback Volume
              </CardTitle>
              <CardDescription className="text-sm mt-1 text-muted-foreground">
                Daily submissions trend over the last 30 days
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                Avg/Day
              </p>
              <p className="text-lg font-semibold text-primary">{average}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Peak
              </p>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                {peak}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 flex-1 min-h-0 relative">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#9ca3af", fontSize: 11 }}
              ticks={ticks}
            />
            <YAxis
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#9ca3af", fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.98)",
                border: "1px solid #e5e7eb",
                borderRadius: "10px",
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                padding: "8px 12px",
              }}
              labelStyle={{ color: "#374151", fontWeight: 600, marginBottom: 4 }}
              itemStyle={{ color: "#3b82f6", fontWeight: 500 }}
              formatter={(value) => [`${value} posts`, "Submissions"]}
            />
            <Area
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={2.5}
              fill="url(#colorCount)"
              type="monotone"
              dot={false}
              activeDot={{ r: 5, strokeWidth: 2, fill: "#3b82f6", stroke: "#fff" }}
              isAnimationActive={false}
              ref={lineRef}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
