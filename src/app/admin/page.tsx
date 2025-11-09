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
  });
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [topBoards, setTopBoards] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch boards and posts
      const [boardsRes, postsRes] = await Promise.all([
        boardService.getAllBoards(),
        api.get('/api/posts'),
      ]);

      const boards = boardsRes.data?.boards || [];
      const allPosts = postsRes.data.data?.posts || [];

      // Calculate stats
      const totalVotes = allPosts.reduce((sum: number, post: any) => 
        sum + (post.votes_count || 0), 0
      );
      const pending = allPosts.filter((post: any) => 
        post.status === 'under_review'
      ).length;

      setStats({
        totalBoards: boards.length,
        totalPosts: allPosts.length,
        totalVotes,
        pendingPosts: pending,
      });

      // Get recent posts (last 10)
      const sorted = [...allPosts].sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setRecentPosts(sorted.slice(0, 10));

      // Get board stats
      const boardStats = boards.map((board: any) => {
        const boardPosts = allPosts.filter((p: any) => p.board_id === board.id);
        return {
          ...board,
          postCount: boardPosts.length,
          totalVotes: boardPosts.reduce((sum: number, p: any) => 
            sum + (p.votes_count || 0), 0
          ),
        };
      });
      
      setTopBoards(boardStats.sort((a: any, b: any) => 
        b.postCount - a.postCount
      ).slice(0, 5));

    } catch (error: any) {
      console.error('Failed to load dashboard:', error);
      toast({
        title: 'Error',
        description: error.response?.data?.error || 'Failed to load dashboard',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <ProtectedRoute allowedRoles={['owner', 'admin']}>
        <DashboardSkeleton />
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={['owner', 'admin']}>
      <div className="space-y-8">
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
          <Button onClick={loadDashboardData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Boards */}
          <Card className="border-l-4 border-l-blue-500">
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
          <Card className="border-l-4 border-l-green-500">
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
          <Card className="border-l-4 border-l-purple-500">
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
          <Card className="border-l-4 border-l-orange-500">
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
        </div>

        {/* Recent Posts and Top Boards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Feedback */}
          <Card>
            <CardHeader>
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
                        <span className="text-sm font-medium">{post.votes_count || 0}</span>
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
          <Card>
            <CardHeader>
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
