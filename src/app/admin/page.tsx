'use client';

import { useState, useEffect } from 'react';
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
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Users,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  RefreshCw,
  LayoutDashboard,
  FileText,
  ThumbsUp,
  Building2,
  Calendar,
} from 'lucide-react';
import { DashboardSkeleton } from '@/components/admin/DashboardSkeleton';

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
    newThisMonth: 0,
    activeUsers: 0,
    totalComments: 0,
    statusDistribution: {
      open: 0,
      'under-review': 0,
      planned: 0,
      'in-progress': 0,
      completed: 0,
      closed: 0,
    },
  });
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [topBoards, setTopBoards] = useState<any[]>([]);
  const [mostUpvoted, setMostUpvoted] = useState<any[]>([]);
  const [trending, setTrending] = useState<any[]>([]);
  const [topContributors, setTopContributors] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // Track start time for minimum skeleton display
    const startTime = Date.now();
    const minDisplayTime = 800; // Show skeleton for at least 800ms
    
    try {
      setLoading(true);
      
      // Fetch boards and posts
      const [boardsRes, postsRes] = await Promise.all([
        boardService.getAllBoards(),
        api.get('/api/posts'),
      ]);

      const boards = boardsRes.data?.boards || [];
      const allPosts = postsRes.data.data?.posts || [];

      // Time calculations
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Calculate stats
      const totalVotes = allPosts.reduce((sum: number, post: any) => 
        sum + (post.upvotes || 0), 0
      );
      
      const totalComments = allPosts.reduce((sum: number, post: any) => 
        sum + (post.comment_count || 0), 0
      );

      // Status distribution
      const statusDist = {
        open: allPosts.filter((p: any) => p.status === 'open').length,
        'under-review': allPosts.filter((p: any) => p.status === 'under-review').length,
        planned: allPosts.filter((p: any) => p.status === 'planned').length,
        'in-progress': allPosts.filter((p: any) => p.status === 'in-progress').length,
        completed: allPosts.filter((p: any) => p.status === 'completed').length,
        closed: allPosts.filter((p: any) => p.status === 'closed').length,
      };

      // New posts this week/month
      const newThisWeek = allPosts.filter((p: any) => 
        new Date(p.created_at) >= oneWeekAgo
      ).length;
      
      const newThisMonth = allPosts.filter((p: any) => 
        new Date(p.created_at) >= oneMonthAgo
      ).length;

      // Active users (unique authors from last 30 days)
      const recentAuthors = new Set(
        allPosts
          .filter((p: any) => new Date(p.created_at) >= oneMonthAgo)
          .map((p: any) => p.author_id)
          .filter(Boolean)
      );

      setStats({
        totalBoards: boards.length,
        totalPosts: allPosts.length,
        totalVotes,
        pendingPosts: statusDist['under-review'],
        newThisWeek,
        newThisMonth,
        activeUsers: recentAuthors.size,
        totalComments,
        statusDistribution: statusDist,
      });

      // Get recent posts (last 10)
      const sorted = [...allPosts].sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setRecentPosts(sorted.slice(0, 10));

      // Most upvoted posts
      const upvotedSorted = [...allPosts].sort((a: any, b: any) => 
        (b.upvotes || 0) - (a.upvotes || 0)
      );
      setMostUpvoted(upvotedSorted.slice(0, 5));

      // Trending posts (based on recent activity - upvotes + comments in last 7 days)
      const trendingPosts = allPosts
        .filter((p: any) => new Date(p.created_at) >= oneWeekAgo)
        .map((p: any) => ({
          ...p,
          trendingScore: (p.upvotes || 0) * 2 + (p.comment_count || 0) * 3,
        }))
        .sort((a: any, b: any) => b.trendingScore - a.trendingScore)
        .slice(0, 5);
      setTrending(trendingPosts);

      // Top contributors (users with most posts)
      const contributorMap = new Map<string, any>();
      allPosts.forEach((post: any) => {
        if (post.author) {
          const existing = contributorMap.get(post.author.id) || {
            ...post.author,
            postCount: 0,
            totalVotes: 0,
          };
          existing.postCount += 1;
          existing.totalVotes += post.upvotes || 0;
          contributorMap.set(post.author.id, existing);
        }
      });
      const contributors = Array.from(contributorMap.values())
        .sort((a, b) => b.postCount - a.postCount)
        .slice(0, 5);
      console.log('Top Contributors Data:', contributors);
      setTopContributors(contributors);

      // Get board stats
      const boardStats = boards.map((board: any) => {
        const boardPosts = allPosts.filter((p: any) => p.board_id === board.id);
        return {
          ...board,
          postCount: boardPosts.length,
          totalVotes: boardPosts.reduce((sum: number, p: any) => 
            sum + (p.upvotes || 0), 0
          ),
        };
      });
      
      setTopBoards(boardStats.sort((a: any, b: any) => 
        b.postCount - a.postCount
      ).slice(0, 5));

      // Ensure minimum skeleton display time for smooth UX
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, minDisplayTime - elapsed);
      
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);

    } catch (error: any) {
      console.error('Failed to load dashboard:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to load dashboard',
        variant: 'destructive',
      });
      
      // Even on error, respect minimum display time
      const elapsed = Date.now() - startTime;
      const remainingTime = Math.max(0, minDisplayTime - elapsed);
      
      setTimeout(() => {
        setLoading(false);
      }, remainingTime);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: any }> = {
      under_review: { label: 'Pending', variant: 'secondary' },
      approved: { label: 'Approved', variant: 'default' },
      rejected: { label: 'Rejected', variant: 'destructive' },
      implemented: { label: 'Implemented', variant: 'default' },
    };
    
    const config = statusConfig[status] || { label: status, variant: 'outline' };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric' 
    });
  };

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['owner', 'admin']}>
        <DashboardSkeleton />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['owner', 'admin']}>
      <div className="p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <LayoutDashboard className="h-8 w-8 text-blue-600" />
              Admin Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Welcome back, {user?.name || user?.email}
            </p>
            {organization && (
              <div className="flex items-center gap-2 mt-2">
                <Building2 className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {organization.name} · {organizationRole || 'Admin'}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => router.push('/dashboard')} 
              variant="outline"
              className="gap-2"
            >
              <Users className="h-4 w-4" />
              Member Dashboard
            </Button>
            <Button onClick={loadDashboardData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Total Boards */}
          <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Boards
                </CardTitle>
                <div className="h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <LayoutDashboard className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.totalBoards}
              </div>
              <p className="text-xs text-gray-500 mt-1">Active feedback boards</p>
            </CardContent>
          </Card>

          {/* Total Posts */}
          <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Feedback
                </CardTitle>
                <div className="h-10 w-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.totalPosts}
              </div>
              <p className="text-xs text-gray-500 mt-1">Total submissions</p>
            </CardContent>
          </Card>

          {/* Total Votes */}
          <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Votes
                </CardTitle>
                <div className="h-10 w-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                  <ThumbsUp className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.totalVotes}
              </div>
              <p className="text-xs text-gray-500 mt-1">User engagements</p>
            </CardContent>
          </Card>

          {/* Pending Posts */}
          <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Pending Review
                </CardTitle>
                <div className="h-10 w-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.pendingPosts}
              </div>
              <p className="text-xs text-gray-500 mt-1">Needs attention</p>
            </CardContent>
          </Card>

          {/* New This Week */}
          <Card className="border-l-4 border-l-cyan-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  New This Week
                </CardTitle>
                <div className="h-10 w-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-cyan-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.newThisWeek}
              </div>
              <p className="text-xs text-gray-500 mt-1">Last 7 days</p>
            </CardContent>
          </Card>

          {/* New This Month */}
          <Card className="border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  New This Month
                </CardTitle>
                <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-indigo-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.newThisMonth}
              </div>
              <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
            </CardContent>
          </Card>

          {/* Active Users */}
          <Card className="border-l-4 border-l-pink-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Users
                </CardTitle>
                <div className="h-10 w-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                  <Users className="h-5 w-5 text-pink-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.activeUsers}
              </div>
              <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
            </CardContent>
          </Card>

          {/* Total Comments */}
          <Card className="border-l-4 border-l-teal-500 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Comments
                </CardTitle>
                <div className="h-10 w-10 rounded-lg bg-teal-100 dark:bg-teal-900/30 flex items-center justify-center">
                  <MessageSquare className="h-5 w-5 text-teal-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">
                {stats.totalComments}
              </div>
              <p className="text-xs text-gray-500 mt-1">All discussions</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Posts and Top Boards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Recent Feedback */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Recent Feedback</CardTitle>
                  <CardDescription>Latest submissions from users</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/admin/feedback')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentPosts.length > 0 ? (
                <div className="space-y-4">
                  {recentPosts.slice(0, 5).map((post) => (
                    <div 
                      key={post.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                      onClick={() => router.push(`/admin/feedback`)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {post.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(post.status)}
                          <span className="text-xs text-gray-500">
                            {formatDate(post.created_at)}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-gray-500">
                        <ThumbsUp className="h-4 w-4" />
                        <span className="text-sm font-medium">{post.upvotes || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No feedback posts yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Top Boards */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Popular Boards</CardTitle>
                  <CardDescription>Most active feedback boards</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push('/admin/feedback')}
                >
                  View All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {topBoards.length > 0 ? (
                <div className="space-y-4">
                  {topBoards.map((board, index) => (
                    <div 
                      key={board.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {board.name}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <FileText className="h-3 w-3" />
                            {board.postCount} posts
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {board.totalVotes} votes
                          </span>
                        </div>
                      </div>
                      <Badge variant={board.is_public ? 'default' : 'secondary'}>
                        {board.is_public ? 'Public' : 'Private'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <LayoutDashboard className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No boards created yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Status Distribution */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Status Distribution</CardTitle>
            <CardDescription>Feedback items by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.statusDistribution).map(([status, count]) => {
                const statusConfig = {
                  'open': { label: 'Open', color: 'bg-gray-500', textColor: 'text-gray-700' },
                  'under-review': { label: 'Under Review', color: 'bg-blue-500', textColor: 'text-blue-700' },
                  'planned': { label: 'Planned', color: 'bg-purple-500', textColor: 'text-purple-700' },
                  'in-progress': { label: 'In Progress', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
                  'completed': { label: 'Completed', color: 'bg-green-500', textColor: 'text-green-700' },
                  'closed': { label: 'Closed', color: 'bg-red-500', textColor: 'text-red-700' },
                }[status] || { label: status, color: 'bg-gray-500', textColor: 'text-gray-700' };

                const percentage = stats.totalPosts > 0 ? ((count as number) / stats.totalPosts * 100).toFixed(1) : 0;

                return (
                  <div key={status} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className={`font-medium ${statusConfig.textColor}`}>
                        {statusConfig.label}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className={`${statusConfig.color} h-2 rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Most Upvoted and Trending */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Most Upvoted */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">Most Upvoted</CardTitle>
                  <CardDescription>Top feedback by votes</CardDescription>
                </div>
                <ThumbsUp className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              {mostUpvoted.length > 0 ? (
                <div className="space-y-4">
                  {mostUpvoted.map((post, index) => (
                    <div 
                      key={post.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                      onClick={() => router.push(`/admin/feedback`)}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 font-bold text-sm">
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {post.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(post.status)}
                          <span className="text-xs text-gray-500">
                            {post.board?.name || 'Unknown Board'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-purple-600 font-semibold">
                        <ThumbsUp className="h-4 w-4" />
                        <span className="text-sm">{post.upvotes || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ThumbsUp className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No feedback posts yet</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trending Feedback */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold">🔥 Trending This Week</CardTitle>
                  <CardDescription>Most active recent feedback</CardDescription>
                </div>
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              {trending.length > 0 ? (
                <div className="space-y-4">
                  {trending.map((post, index) => (
                    <div 
                      key={post.id}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                      onClick={() => router.push(`/admin/feedback`)}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 font-bold text-sm">
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {post.title}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          {getStatusBadge(post.status)}
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <ThumbsUp className="h-3 w-3" />
                            {post.upvotes || 0}
                          </span>
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {post.comment_count || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>No trending posts this week</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top Contributors */}
        <Card className="shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-semibold">Top Contributors</CardTitle>
                <CardDescription>Most active community members</CardDescription>
              </div>
              <Users className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            {topContributors.length > 0 ? (
              <div className="space-y-4">
                {topContributors.map((contributor, index) => (
                  <div 
                    key={contributor.id}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div className="relative">
                      <Avatar className="h-12 w-12 border-2 border-white dark:border-gray-800">
                        <AvatarImage 
                          src={contributor.avatar_url || ""} 
                          alt={contributor.name || contributor.email}
                        />
                        <AvatarFallback className="bg-green-100 dark:bg-green-900/30 text-green-600 font-semibold">
                          {getInitials(contributor.name || contributor.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-xs font-bold border-2 border-white dark:border-gray-900">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {contributor.name || contributor.email}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          {contributor.postCount} posts
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <ThumbsUp className="h-3 w-3" />
                          {contributor.totalVotes} total votes
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p>No contributors yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => router.push('/admin/feedback')}
              >
                <MessageSquare className="h-6 w-6 text-blue-600" />
                <span className="font-medium">Manage Feedback</span>
                <span className="text-xs text-gray-500">Review and respond</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => router.push('/admin/roadmap')}
              >
                <TrendingUp className="h-6 w-6 text-green-600" />
                <span className="font-medium">Update Roadmap</span>
                <span className="text-xs text-gray-500">Plan features</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-auto py-4 flex flex-col items-center gap-2"
                onClick={() => router.push('/admin/organization')}
              >
                <Building2 className="h-6 w-6 text-purple-600" />
                <span className="font-medium">Organization</span>
                <span className="text-xs text-gray-500">Settings & team</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
