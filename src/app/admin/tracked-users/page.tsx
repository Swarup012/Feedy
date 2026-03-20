'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import trackedUsersService, {
  TrackedUsersUsage,
  TrackedUser,
  HistoricalData
} from '@/services/trackedUsersService';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Download,
  RefreshCw,
  TrendingUp,
  MessageSquare,
  ThumbsUp,
  FileText,
  Calendar,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function TrackedUsersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const handleLoadError = useErrorHandler({ context: 'loadTrackedUsers', showToast: true, logError: true });
  const handleUsersError = useErrorHandler({ context: 'loadUsersList', showToast: false, logError: true });

  const [usage, setUsage] = useState<TrackedUsersUsage | null>(null);
  const [users, setUsers] = useState<TrackedUser[]>([]);
  const [history, setHistory] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<'created_at' | 'last_activity_at' | 'total_actions'>('last_activity_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [currentPage, sortBy, sortOrder]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [usageResponse, historyResponse] = await Promise.all([
        trackedUsersService.getUsage(),
        trackedUsersService.getHistory(6),
      ]);

      if (usageResponse.success) {
        setUsage(usageResponse.data);
      }

      if (historyResponse.success) {
        setHistory(historyResponse.data.history);
      }

      await loadUsers();
    } catch (error) {
      handleLoadError(error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await trackedUsersService.getList({
        page: currentPage,
        limit: 50,
        sort: sortBy,
        order: sortOrder,
      });

      if (response.success) {
        setUsers(response.data.users);
        setTotalPages(response.data.pagination?.pages ? response.data.pagination.pages : 1);
      }
    } catch (error) {
      // Silent error for users list - don't show toast, just log
      handleUsersError(error);
      // Still set empty arrays to prevent errors in rendering
      setUsers([]);
      setTotalPages(1);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      await trackedUsersService.exportCSV();
      toast({
        title: 'Success',
        description: 'CSV export downloaded successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export CSV',
        variant: 'destructive',
      });
    } finally {
      setExporting(false);
    }
  };

  const handleRecalculate = async () => {
    try {
      setRefreshing(true);
      const response = await trackedUsersService.recalculateCache();
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Cache recalculated successfully',
        });
        await loadAllData();
      } else {
        throw new Error(response.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to recalculate cache',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-orange-600';
      case 'exceeded': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="h-12 w-64 mb-6" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </ProtectedRoute>
    );
  }

  const breakdownData = usage?.breakdown ? [
    { name: 'Posts', value: usage.breakdown.posts, color: COLORS[0] },
    { name: 'Votes', value: usage.breakdown.votes, color: COLORS[1] },
    { name: 'Comments', value: usage.breakdown.comments, color: COLORS[2] },
  ] : [];

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Tracked Users</h1>
            <p className="text-muted-foreground mt-1">
              Monitor unique users interacting with your feedback board
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleRecalculate}
              variant="outline"
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={handleExport}
              variant="outline"
              disabled={exporting}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Current Count */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usage?.count.toLocaleString() || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                of {usage?.limit.toLocaleString() || 0} limit
              </p>
              <Progress value={usage?.usage_percent || 0} className="mt-2" />
            </CardContent>
          </Card>

          {/* Days Remaining */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Days Remaining</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usage?.days_remaining || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Until {usage?.current_period || ''} resets
              </p>
            </CardContent>
          </Card>

          {/* Total Actions */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Actions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {usage?.breakdown
                  ? (usage.breakdown.posts + usage.breakdown.votes + usage.breakdown.comments).toLocaleString()
                  : 0}
              </div>
              <p className="text-xs text-muted-foreground">
                Posts, votes, and comments
              </p>
            </CardContent>
          </Card>

          {/* Status */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              {usage?.status === 'exceeded' ? (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-600" />
              )}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getStatusColor(usage?.status || 'good')}`}>
                {usage?.status === 'exceeded' ? 'Limit Reached' :
                 usage?.status === 'critical' ? 'Critical' :
                 usage?.status === 'warning' ? 'Warning' : 'Good'}
              </div>
              <p className="text-xs text-muted-foreground">
                {Math.round(usage?.usage_percent || 0)}% of limit used
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Historical Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Historical Trend</CardTitle>
              <CardDescription>Tracked users over the past 6 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="billing_period" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total_users"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Tracked Users"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Action Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Action Breakdown</CardTitle>
              <CardDescription>Distribution of user actions this month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={breakdownData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {breakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-3 gap-4 mt-4">
                <div className="text-center">
                  <FileText className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                  <div className="text-sm font-medium">{usage?.breakdown.posts || 0}</div>
                  <div className="text-xs text-muted-foreground">Posts</div>
                </div>
                <div className="text-center">
                  <ThumbsUp className="h-5 w-5 mx-auto mb-1 text-green-600" />
                  <div className="text-sm font-medium">{usage?.breakdown.votes || 0}</div>
                  <div className="text-xs text-muted-foreground">Votes</div>
                </div>
                <div className="text-center">
                  <MessageSquare className="h-5 w-5 mx-auto mb-1 text-orange-600" />
                  <div className="text-sm font-medium">{usage?.breakdown.comments || 0}</div>
                  <div className="text-xs text-muted-foreground">Comments</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Tracked Users List</CardTitle>
                <CardDescription>Users who have interacted with your feedback board</CardDescription>
              </div>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last_activity_at">Last Seen</SelectItem>
                    <SelectItem value="created_at">First Seen</SelectItem>
                    <SelectItem value="total_actions">Most Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>First Seen</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead className="text-center">Posts</TableHead>
                  <TableHead className="text-center">Votes</TableHead>
                  <TableHead className="text-center">Comments</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No tracked users yet
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="font-medium">{user.display_name || 'Anonymous'}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.email || user.user_identifier}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(user.first_tracked_at)}</TableCell>
                      <TableCell>{formatDate(user.last_activity_at)}</TableCell>
                      <TableCell className="text-center">{user.posts_created}</TableCell>
                      <TableCell className="text-center">{user.votes_cast}</TableCell>
                      <TableCell className="text-center">{user.comments_made}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary">{user.total_actions}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  );
}
