'use client';

import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
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

/* ======================================================
   MAIN PAGE
====================================================== */

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
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

      setStats({
        totalBoards: boards.length,
        totalPosts: posts.length,
        totalVotes,
        pendingPosts: statusDistribution['under-review'] || 0,
        newThisWeek,
        activeUsers,
        totalComments,
        statusDistribution,
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
      toast({ title: 'Failed to load dashboard', variant: 'destructive' });
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
     UI
     ======================= */

  return (
    <ProtectedRoute allowedRoles={['owner', 'admin']}>
      <div ref={pageRef} className="p-8 space-y-10">

        {/* HEADER */}
        <section className="space-y-2">
          <h1 className="text-3xl font-semibold flex items-center gap-3 dark:text-gray-100">
            <LayoutDashboard className="h-7 w-7 text-blue-600 dark:text-blue-500" />
            Admin Dashboard
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Overview for <strong>{organization?.name}</strong>
          </p>

<Button 
  onClick={() => router.push('/dashboard')} 
  variant="outline"
  className="gap-2 bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-700"
>
  <Users className="h-4 w-4" />
  Member Dashboard
</Button>

        </section>

        {/* PRIMARY METRICS */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6 ">
          <Metric title="Needs Review" value={stats.pendingPosts} icon={Clock} />
          <Metric title="New This Week" value={stats.newThisWeek} icon={TrendingUp} />
          <Metric title="Active Contributors" value={stats.activeUsers} icon={Users} />
          <Metric title="Trending Feedback" value={trending.length} icon={ThumbsUp} />
        </section>

        {/* ACTION FEED */}
        <Section title="What Needs Attention">
          {recentPosts.map(p => (
            <Row
              key={p.id}
              title={p.title}
              meta={`${p.upvotes || 0} votes · ${p.comment_count || 0} comments`}
              onClick={() => router.push('/admin/feedback')}
            />
          ))}
        </Section>

        {/* GRAPH */}
        <FeedbackTrendChart data={feedbackTrend} />

        {/* INSIGHTS */}
        <div className="grid lg:grid-cols-2 gap-8">
          <Section title="🔥 Trending Feedback">
            {trending.map(p => (
              <Row key={p.id} title={p.title} meta={`Score ${p.score}`} />
            ))}
          </Section>

          <Section title="⭐ Most Valued">
            {mostUpvoted.map(p => (
              <Row key={p.id} title={p.title} meta={`${p.upvotes} votes`} />
            ))}
          </Section>
        </div>

        {/* EXECUTION HEALTH */}
        <Section title="Feedback Lifecycle Health">
          {Object.entries(stats.statusDistribution).map(([k, v]) => (
            <div key={k} className="flex justify-between text-sm">
              <span className="capitalize">{k.replace('-', ' ')}</span>
              <span className="font-medium">{v}</span>
            </div>
          ))}
        </Section>

        {/* CONTEXT */}
        <div className="grid lg:grid-cols-2 gap-8">
          <Section title="Popular Boards">
            {topBoards.map(b => (
              <Row key={b.id} title={b.name} meta={`${b.postCount} posts`} />
            ))}
          </Section>

          <Section title="Top Contributors">
            {topContributors.map(c => (
              <Row key={c.id} title={c.name || c.email} meta={`${c.posts} posts`} />
            ))}
          </Section>
        </div>

        {/* QUICK ACTIONS */}
        <Section title="Quick Actions">
          <div className="grid md:grid-cols-3 gap-4">
            <Action label="Manage Feedback" onClick={() => router.push('/admin/feedback')} />
            <Action label="Update Roadmap" onClick={() => router.push('/admin/roadmap')} />
            <Action label="Organization Settings" onClick={() => router.push('/admin/organization')} />
          </div>
        </Section>
      </div>
    </ProtectedRoute>
  );
}

/* ======================================================
   COMPONENTS
====================================================== */

function Metric({ title, value, icon: Icon }) {
  return (
    <Card>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-semibold dark:text-gray-100">{value}</p>
        </div>
        <Icon className="h-6 w-6 text-blue-600 dark:text-blue-500" />
      </CardContent>
    </Card>
  );
}

function Section({ title, children }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

function Row({ title, meta, onClick }) {
  return (
    <div
      onClick={onClick}
      className="flex justify-between items-center p-3 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
    >
      <span className="font-medium truncate dark:text-gray-100">{title}</span>
      <span className="text-sm text-gray-500 dark:text-gray-400">{meta}</span>
    </div>
  );
}

function Action({ label, onClick }) {
  return (
    <Button variant="outline" onClick={onClick}>
      {label}
    </Button>
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

  return (
    <Card ref={containerRef}>
      <CardHeader>
        <CardTitle>Feedback Volume (Last 30 Days)</CardTitle>
        <CardDescription>Daily submissions trend</CardDescription>
      </CardHeader>

      <CardContent className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="day" tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <Tooltip />
            <Line
              dataKey="count"
              stroke="#2563eb"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              ref={lineRef}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
