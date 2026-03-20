'use client';

import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useOrganization } from '@/context/OrganizationContext';
import { boardService } from '@/services/boardService';
import api from '@/lib/api';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

import {
  LayoutDashboard,
  Clock,
  TrendingUp,
  Users,
  ThumbsUp,
  MessageSquare,
  FileText,
  Building2,
} from 'lucide-react';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import { DashboardSkeleton } from '@/components/admin/DashboardSkeleton';
import { TrackedUsersWidget } from '@/components/TrackedUsersWidget';
import { TrackedUsersLimitBanner } from '@/components/TrackedUsersLimitBanner';

/* ======================================================
   MAIN PAGE
====================================================== */

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const handleError = useErrorHandler({ context: 'loadDashboard', showToast: true, logError: true });
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

  const pageRef = useRef(null);
  
  // Check if user has a paid plan (Starter or Pro)
  // Use organization's subscription_plan field - free, starter, or pro
  const currentPlan = organization?.subscription_plan || 'free';
  const hasPaidPlan = currentPlan === 'starter' || currentPlan === 'pro';
  
  // Free users are locked to basic view, paid users default to expert view
  const [isBasicView, setIsBasicView] = useState(!hasPaidPlan);

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
          ease: 'power2.out',
        }
      );
    }
  }, [loading]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [boardsRes, postsRes] = await Promise.all([
        boardService.getAllBoards(),
        api.get('/api/posts'),
      ]);

      const boards = boardsRes.data?.boards || [];
      const posts = postsRes.data?.data?.posts || [];

      const now = new Date();
      const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

      // Validate data before processing
      if (!Array.isArray(boards)) {
        throw new Error('Invalid boards data received from API');
      }

      if (!Array.isArray(posts)) {
        throw new Error('Invalid posts data received from API');
      }

      const totalVotes = posts.reduce((s, p) => s + (p.upvotes || 0), 0);
      const totalComments = posts.reduce((s, p) => s + (p.comment_count || 0), 0);

      const statusDistribution = posts.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {});

      const newThisWeek = posts.filter(p => new Date(p.created_at) >= weekAgo).length;

      const activeUsers = new Set(
        posts.filter(p => new Date(p.created_at) >= monthAgo).map(p => p.author_id)
      ).size;

      // 🔹 Generate trend data for metrics (last 7 days)
      const generateTrend = (filterFn) => {
        return Array.from({ length: 7 }).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          d.setHours(0, 0, 0, 0);

          const nextDay = new Date(d);
          nextDay.setDate(nextDay.getDate() + 1);

          const count = posts.filter(p => {
            const createdAt = new Date(p.created_at);
            return filterFn(p) && createdAt >= d && createdAt < nextDay;
          }).length;

          return { value: count };
        });
      };

      const pendingTrend = generateTrend(p => p.status === 'under-review');
      const newThisWeekTrend = generateTrend(() => true);
      const activeUsersTrend = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        d.setHours(0, 0, 0, 0);

        const nextDay = new Date(d);
        nextDay.setDate(nextDay.getDate() + 1);

        const uniqueUsers = new Set(
          posts.filter(p => {
            const createdAt = new Date(p.created_at);
            return createdAt >= d && createdAt < nextDay;
          }).map(p => p.author_id)
        ).size;

        return { value: uniqueUsers };
      });

      const trendingTrend = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        d.setHours(0, 0, 0, 0);

        const nextDay = new Date(d);
        nextDay.setDate(nextDay.getDate() + 1);

        const trendingCount = posts.filter(p => {
          const createdAt = new Date(p.created_at);
          if (!(createdAt >= d && createdAt < nextDay)) return false;
          const score = (p.upvotes || 0) * 2 + (p.comment_count || 0) * 3;
          return score > 5; // Minimum score to be considered trending
        }).length;

        return { value: trendingCount };
      });

      setStats({
        totalBoards: boards.length,
        totalPosts: posts.length,
        totalVotes,
        pendingPosts: statusDistribution['under-review'] || 0,
        newThisWeek,
        activeUsers,
        totalComments,
        statusDistribution,
        pendingTrend,
        newThisWeekTrend,
        activeUsersTrend,
        trendingTrend,
      });

      setRecentPosts(
        [...posts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 6)
      );

      setMostUpvoted(
        [...posts].sort((a, b) => (b.upvotes || 0) - (a.upvotes || 0)).slice(0, 5)
      );

      setTrending(
        posts
          .filter(p => new Date(p.created_at) >= weekAgo)
          .map(p => ({
            ...p,
            score: (p.upvotes || 0) * 2 + (p.comment_count || 0) * 3,
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, 5)
      );

      setTopBoards(
        boards
          .map(b => ({
            ...b,
            postCount: posts.filter(p => p.board_id === b.id).length,
          }))
          .sort((a, b) => b.postCount - a.postCount)
          .slice(0, 5)
      );

      setTopContributors(
        Object.values(
          posts.reduce((acc, p) => {
            if (!p.author) return acc;
            acc[p.author.id] ??= { ...p.author, posts: 0, votes: 0 };
            acc[p.author.id].posts += 1;
            acc[p.author.id].votes += p.upvotes || 0;
            return acc;
          }, {})
        ).slice(0, 5)
      );

      // 🔹 Feedback volume (30 days)
      const trend = Array.from({ length: 30 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));

        const label = d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        });

        const count = posts.filter(p => {
          const c = new Date(p.created_at);
          return (
            c.getDate() === d.getDate() &&
            c.getMonth() === d.getMonth() &&
            c.getFullYear() === d.getFullYear()
          );
        }).length;

        return { day: label, count };
      });

      setFeedbackTrend(trend);

      setLoading(false);
    } catch (err) {
      handleError(err);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['owner', 'admin']}>
        <DashboardSkeleton />
      </ProtectedRoute>
    );
  }

  /* =======================
     UI - REDESIGNED FOR PREMIUM UX
     ======================= */

  return (
    <ProtectedRoute allowedRoles={['owner', 'admin']}>
      <div ref={pageRef} className="min-h-screen bg-background">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-8">

          {/* HEADER - Clean Canny-style header */}
          <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div>
                <h1 className="text-2xl sm:text-3xl font-switzer font-semibold tracking-tight text-foreground">
                  {organization?.name || 'Dashboard'}
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
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Basic
                </button>
                <button
                  onClick={() => hasPaidPlan ? setIsBasicView(false) : null}
                  disabled={!hasPaidPlan}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all relative ${
                    !isBasicView && hasPaidPlan
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : hasPaidPlan
                      ? 'text-muted-foreground hover:text-foreground'
                      : 'text-muted-foreground/50 cursor-not-allowed'
                  }`}
                  title={!hasPaidPlan ? 'Upgrade to Starter or Pro plan to access Expert view' : ''}
                >
                  Expert
                  {!hasPaidPlan && (
                    <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-[10px] bg-amber-500 text-white rounded-full">
                      ⭐
                    </span>
                  )}
                </button>
              </div>
              <Button 
                onClick={() => router.push('/dashboard')} 
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
            <>
              {/* MULTI-LINE CHART - All Metrics Combined */}
              <MultiMetricChart 
                pendingTrend={stats.pendingTrend || []}
                newThisWeekTrend={stats.newThisWeekTrend || []}
                activeUsersTrend={stats.activeUsersTrend || []}
                trendingTrend={stats.trendingTrend || []}
                stats={stats}
                trending={trending}
              />

              {/* TRACKED USERS WIDGET - Full Width */}
              <section>
                <TrackedUsersWidget 
                  variant="basic"
                  onUsageClick={() => {
                    console.log('🔵 TrackedUsersWidget clicked - navigating to /admin/tracked-users');
                    router.push('/admin/tracked-users');
                  }} 
                />
              </section>
            </>
          ) : (
            /* ===== FULL VIEW ===== */
            <>
              {/* PRIMARY METRICS - Enhanced 4 Column Grid */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                <Metric title="Needs Review" value={stats.pendingPosts} trend={stats.pendingTrend || []} color="blue" />
                <Metric title="New This Week" value={stats.newThisWeek} trend={stats.newThisWeekTrend || []} color="blue" />
                <Metric title="Active Contributors" value={stats.activeUsers} trend={stats.activeUsersTrend || []} color="blue" />
                <Metric title="Trending Feedback" value={trending.length} trend={stats.trendingTrend || []} color="blue" />
              </section>

              {/* TRACKED USERS WIDGET - Full Width */}
              <section>
                <TrackedUsersWidget 
                  variant="expert"
                  onUsageClick={() => {
                    console.log('🔵 TrackedUsersWidget clicked - navigating to /admin/tracked-users');
                    router.push('/admin/tracked-users');
                  }} 
                />
              </section>

              {/* MAIN GRID - Responsive 2 Column Layout */}
              <div className="grid lg:grid-cols-3 gap-5 sm:gap-6">
            
            {/* LEFT COLUMN - 2/3 Width */}
            <div className="lg:col-span-2 space-y-5 sm:space-y-6">
              
              {/* FEEDBACK TREND CHART */}
              <FeedbackTrendChart data={feedbackTrend} />

              {/* RECENT ACTIVITY */}
              <Section 
                title="Recent Feedback" 
                description="Latest submissions requiring your attention"
                icon={MessageSquare}
              >
                <div className="space-y-1.5">
                  {recentPosts.length > 0 ? (
                    recentPosts.map(p => (
                      <Row
                        key={p.id}
                        title={p.title}
                        meta={`${p.upvotes || 0} votes · ${p.comment_count || 0} comments`}
                        onClick={() => router.push('/admin/feedback')}
                        status={p.status}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <MessageSquare className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">No recent posts yet</p>
                    </div>
                  )}
                </div>
              </Section>

              {/* INSIGHTS ROW - 2 Cards Side by Side */}
              <div className="grid md:grid-cols-2 gap-5 sm:gap-6">
                <Section 
                  title="Trending Now" 
                  description="Hot topics this week"
                  icon={TrendingUp}
                  badge={trending.length}
                >
                  <div className="space-y-1.5">
                    {trending.length > 0 ? (
                      trending.map((p, idx) => (
                        <Row key={p.id} title={p.title} meta={`#${idx + 1} · ${p.score} pts`} rank={idx + 1} />
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-sm text-gray-500 dark:text-gray-400">No trending items</p>
                      </div>
                    )}
                  </div>
                </Section>

                <Section 
                  title="Most Upvoted" 
                  description="Community favorites"
                  icon={ThumbsUp}
                  badge={mostUpvoted.length}
                >
                  <div className="space-y-1.5">
                    {mostUpvoted.length > 0 ? (
                      mostUpvoted.map((p, idx) => (
                        <Row key={p.id} title={p.title} meta={`${p.upvotes} votes`} rank={idx + 1} />
                      ))
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-sm text-gray-500 dark:text-gray-400">No upvoted posts</p>
                      </div>
                    )}
                  </div>
                </Section>
              </div>

            </div>

            {/* RIGHT SIDEBAR - 1/3 Width */}
            <div className="space-y-5 sm:space-y-6">
              
              {/* FEEDBACK LIFECYCLE - Enhanced with visual progress */}
              <Section 
                title="Status Overview" 
                description="Feedback distribution"
                icon={FileText}
              >
                <div className="space-y-3">
                  {Object.entries(stats.statusDistribution).length > 0 ? (
                    Object.entries(stats.statusDistribution).map(([k, v]) => {
                      const total = stats.totalPosts;
                      const percentage = total > 0 ? Math.round((v / total) * 100) : 0;
                      return (
                        <div key={k} className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium capitalize text-foreground">
                              {k.replace('-', ' ')}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500 dark:text-gray-400">{percentage}%</span>
                              <Badge variant="secondary" className="font-semibold min-w-[2.5rem] justify-center">
                                {v}
                              </Badge>
                            </div>
                          </div>
                          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-sm text-gray-500 dark:text-gray-400">No data available</p>
                    </div>
                  )}
                </div>
              </Section>

              {/* POPULAR BOARDS */}
              <Section 
                title="Popular Boards" 
                description="Most active boards"
                icon={Building2}
              >
                <div className="space-y-1.5">
                  {topBoards.length > 0 ? (
                    topBoards.map((b, idx) => (
                      <Row key={b.id} title={b.name} meta={`${b.postCount} posts`} rank={idx + 1} />
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Building2 className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No boards yet</p>
                    </div>
                  )}
                </div>
              </Section>

              {/* TOP CONTRIBUTORS - Enhanced with avatars */}
              <Section 
                title="Top Contributors" 
                description="Most active community members"
                icon={Users}
              >
                <div className="space-y-2">
                  {topContributors.length > 0 ? (
                    topContributors.map((c, idx) => (
                      <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg transition-colors">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                          {idx + 1}
                        </div>
                        <Avatar className="h-8 w-8 border-2 border-border shadow-sm">
                          <AvatarImage src={c.avatar_url} alt={c.name} />
                          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                            {(c.name || c.email)?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate text-foreground">{c.name || c.email}</p>
                          <p className="text-xs text-muted-foreground">{c.posts} posts</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No contributors yet</p>
                    </div>
                  )}
                </div>
              </Section>

            </div>
          </div>
            </>
          )}

        </div>
      </div>
    </ProtectedRoute>
  );
}

/* ======================================================
   COMPONENTS
====================================================== */

function MultiMetricChart({ pendingTrend, newThisWeekTrend, activeUsersTrend, trendingTrend, stats, trending }) {
  // Combine all trends into one dataset
  const combinedData = Array.from({ length: 7 }).map((_, i) => ({
    day: i,
    pending: pendingTrend[i]?.value || 0,
    newPosts: newThisWeekTrend[i]?.value || 0,
    activeUsers: activeUsersTrend[i]?.value || 0,
    trending: trendingTrend[i]?.value || 0,
  }));

  return (
    <Card className="transition-shadow duration-300 hover:shadow-md border-border overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-switzer font-semibold">Metrics Overview</CardTitle>
        <CardDescription>7-day trend for all key metrics</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Metric Values at Top */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Needs Review</p>
            <p className="text-3xl font-switzer font-semibold text-foreground">{stats.pendingPosts}</p>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#3b82f6' }}></div>
              <span className="text-xs text-muted-foreground">Blue line</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">New This Week</p>
            <p className="text-3xl font-switzer font-semibold text-foreground">{stats.newThisWeek}</p>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10b981' }}></div>
              <span className="text-xs text-muted-foreground">Green line</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Active Contributors</p>
            <p className="text-3xl font-switzer font-semibold text-foreground">{stats.activeUsers}</p>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#8b5cf6' }}></div>
              <span className="text-xs text-muted-foreground">Purple line</span>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Trending Feedback</p>
            <p className="text-3xl font-switzer font-semibold text-foreground">{trending.length}</p>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#f59e0b' }}></div>
              <span className="text-xs text-muted-foreground">Orange line</span>
            </div>
          </div>
        </div>

        {/* Multi-line Chart */}
        <div className="h-64 w-full">
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
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
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

function Metric({ title, value, trend = [], color = 'blue' }) {
  return (
    <Card className="transition-shadow duration-300 hover:shadow-md border-border overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-stretch gap-4">
          {/* Left side - Title and Value (40%) */}
          <div className="flex flex-col justify-between w-[40%]">
            <p className="text-xs font-switzer font-semibold text-muted-foreground uppercase tracking-wide">
              {title}
            </p>
            <p className="text-4xl font-switzer font-semibold text-foreground mt-auto">
              {value}
            </p>
          </div>
          
          {/* Right side - Micro Line Chart (60%) */}
          {trend.length > 0 && (
            <div className="w-[60%] h-20">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <defs>
                    <linearGradient id="metricGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    fill="url(#metricGradient)"
                    animationDuration={500}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Section({ title, description, children, icon: Icon, badge, fullWidth }) {
  return (
    <Card className="transition-shadow duration-300 hover:shadow-md border-border overflow-hidden">
      <CardHeader className="pb-4 border-b border-border">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            {Icon && (
              <div className="p-2 rounded-lg bg-secondary text-secondary-foreground mt-0.5">
                <Icon className="h-4 w-4" />
              </div>
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg font-switzer font-semibold tracking-tight text-foreground">{title}</CardTitle>
                {badge !== undefined && (
                  <Badge variant="secondary" className="text-xs font-semibold">
                    {badge}
                  </Badge>
                )}
              </div>
              {description && (
                <CardDescription className="text-sm mt-1 text-muted-foreground">{description}</CardDescription>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-5">{children}</CardContent>
    </Card>
  );
}

function Row({ title, meta, onClick, status, rank }) {
  const statusColors = {
    'under-review': 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
    'planned': 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
    'in-progress': 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400',
    'completed': 'bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-400',
    'closed': 'bg-muted text-muted-foreground',
  };

  // Different styles for clickable vs non-clickable items
  const baseClasses = "group flex items-center gap-3 p-3.5 rounded-lg transition-all duration-200";
  const clickableClasses = onClick 
    ? "border border-transparent hover:border-primary/20 hover:bg-accent cursor-pointer"
    : "border border-transparent";

  return (
    <div
      onClick={onClick}
      className={`${baseClasses} ${clickableClasses}`}
    >
      {rank && (
        <div className={`flex items-center justify-center w-7 h-7 rounded-full bg-secondary text-secondary-foreground text-xs font-bold flex-shrink-0 ${onClick ? 'group-hover:scale-110' : ''} transition-transform`}>
          {rank}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <span className={`font-switzer font-semibold text-sm text-foreground block truncate transition-colors ${onClick ? 'group-hover:text-primary' : ''}`}>
          {title}
        </span>
        {status && (
          <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[status] || statusColors['under-review']}`}>
            {status.replace('-', ' ')}
          </span>
        )}
      </div>
      <span className="text-xs font-medium text-muted-foreground ml-2 flex-shrink-0 bg-muted px-2.5 py-1 rounded-full">
        {meta}
      </span>
    </div>
  );
}

function Action({ icon: Icon, label, description, onClick, color = 'blue' }) {
  const colorClasses = {
    blue: {
      bg: 'bg-primary',
      text: 'text-primary'
    },
    purple: {
      bg: 'bg-purple-600 dark:bg-purple-500',
      text: 'text-purple-600 dark:text-purple-500'
    },
    green: {
      bg: 'bg-green-600 dark:bg-green-500',
      text: 'text-green-600 dark:text-green-500'
    },
  };

  return (
    <Card 
      className="relative hover:shadow-lg hover:scale-[1.02] transition-all duration-300 cursor-pointer group border-border overflow-hidden" 
      onClick={onClick}
    >
      <CardContent className="p-5 relative z-10">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${colorClasses[color].bg} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
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
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    );

    const path = lineRef.current.getTotalLength();
    gsap.fromTo(
      lineRef.current,
      { strokeDasharray: path, strokeDashoffset: path },
      { strokeDashoffset: 0, duration: 0.9, ease: 'power2.out', delay: 0.2 }
    );
  }, []);

  // Calculate total and average
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const average = data.length > 0 ? Math.round(total / data.length) : 0;
  const peak = Math.max(...data.map(d => d.count));

  return (
    <Card ref={containerRef} className="transition-shadow duration-300 hover:shadow-md border-border overflow-hidden">
      <CardHeader className="pb-4 border-b border-border">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="p-2 rounded-lg bg-secondary text-secondary-foreground mt-0.5">
              <TrendingUp className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg font-switzer font-semibold tracking-tight text-foreground">Feedback Volume</CardTitle>
              <CardDescription className="text-sm mt-1 text-muted-foreground">Daily submissions trend over the last 30 days</CardDescription>
            </div>
          </div>
          <div className="flex gap-4 items-center">
            <div className="text-right">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Avg/Day</p>
              <p className="text-xl font-semibold text-primary">{average}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Peak</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">{peak}</p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="h-[280px] pt-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="day" 
              tickLine={false} 
              axisLine={false}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              allowDecimals={false} 
              tickLine={false} 
              axisLine={false}
              tick={{ fill: '#9ca3af', fontSize: 11 }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              }}
              labelStyle={{ color: '#374151', fontWeight: 600 }}
            />
            <Line
              dataKey="count"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, strokeWidth: 2 }}
              isAnimationActive={false}
              ref={lineRef}
              fill="url(#colorCount)"
              type="monotone"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
