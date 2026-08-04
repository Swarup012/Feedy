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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

const BREAKDOWN_COLORS = {
  posts: 'bg-blue-500',
  votes: 'bg-emerald-500',
  comments: 'bg-amber-500',
};

function getStatusBadge(status: string, percent: number) {
  const config: Record<string, { label: string; className: string; icon: React.ElementType }> = {
    good: {
      label: 'Good',
      className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800',
      icon: CheckCircle,
    },
    warning: {
      label: 'Warning',
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-450 border-yellow-200 dark:border-yellow-800',
      icon: AlertTriangle,
    },
    critical: {
      label: 'Critical',
      className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800',
      icon: AlertTriangle,
    },
    exceeded: {
      label: 'Limit Reached',
      className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
      icon: AlertTriangle,
    },
  };
  const cfg = config[status] || config.good;
  const Icon = cfg.icon;
  return (
    <Badge variant="outline" className={`gap-1 ${cfg.className}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
}

function getAvatarColor(name: string | null | undefined): string {
  if (!name) return 'bg-gray-400';
  const colors = [
    'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500',
    'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-pink-500',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

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
      handleUsersError(error);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const percentUsed = usage?.usage_percent || 0;
  const totalActions = usage?.breakdown
    ? usage.breakdown.posts + usage.breakdown.votes + usage.breakdown.comments
    : 0;
  const breakdownTotal = totalActions || 1;

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto px-4 py-5">
          <Skeleton className="h-10 w-52 mb-4" />
          <Skeleton className="h-36 mb-4" />
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <Skeleton className="h-64" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-5 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Tracked Users</h1>
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

        {/* Hero Usage Card */}
        <Card className="overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Tracked Users</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-bold tabular-nums">{usage?.count.toLocaleString() || 0}</span>
                  <span className="text-lg text-muted-foreground font-medium">of {usage?.limit.toLocaleString() || 0}</span>
                </div>
              </div>
              {getStatusBadge(usage?.status || 'good', percentUsed)}
            </div>
            <Progress value={percentUsed} className="h-2 mb-3" />
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {usage?.days_remaining || 0} days remaining until reset on{' '}
                <span className="font-medium text-foreground">{usage?.current_period || ''}</span>
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Secondary Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Actions</p>
                  <p className="text-lg font-bold tabular-nums">{totalActions.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Posts</p>
                  <p className="text-lg font-bold tabular-nums">{(usage?.breakdown?.posts || 0).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <ThumbsUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Votes</p>
                  <p className="text-lg font-bold tabular-nums">{(usage?.breakdown?.votes || 0).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Comments</p>
                  <p className="text-lg font-bold tabular-nums">{(usage?.breakdown?.comments || 0).toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Historical Trend — hidden when < 10 tracked users */}
          {(usage?.count || 0) >= 10 ? (
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
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Historical Trend</CardTitle>
                <CardDescription>Tracked users over the past 6 months</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Not enough data yet — check back once you have more tracked users.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Breakdown — horizontal progress bars */}
          <Card>
            <CardHeader>
              <CardTitle>Action Breakdown</CardTitle>
              <CardDescription>Distribution of user actions this month</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Posts */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Posts</span>
                  <span className="text-muted-foreground tabular-nums">{(usage?.breakdown?.posts || 0).toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${breakdownTotal > 0 ? ((usage?.breakdown?.posts || 0) / breakdownTotal) * 100 : 0}%` }}
                  />
                </div>
              </div>
              {/* Votes */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Votes</span>
                  <span className="text-muted-foreground tabular-nums">{(usage?.breakdown?.votes || 0).toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${breakdownTotal > 0 ? ((usage?.breakdown?.votes || 0) / breakdownTotal) * 100 : 0}%` }}
                  />
                </div>
              </div>
              {/* Comments */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Comments</span>
                  <span className="text-muted-foreground tabular-nums">{(usage?.breakdown?.comments || 0).toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-500"
                    style={{ width: `${breakdownTotal > 0 ? ((usage?.breakdown?.comments || 0) / breakdownTotal) * 100 : 0}%` }}
                  />
                </div>
              </div>
              {/* Legend */}
              <div className="flex items-center gap-4 pt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" />Posts</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" />Votes</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" />Comments</span>
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
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No tracked users yet
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <div className={`flex-shrink-0 w-7 h-7 rounded-full ${getAvatarColor(user.display_name)} flex items-center justify-center`}>
                            <span className="text-[10px] font-semibold text-white">{getInitials(user.display_name)}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-sm truncate">{user.display_name || 'Anonymous'}</div>
                            <div className="text-xs text-muted-foreground truncate">
                              {user.email || user.user_identifier}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{formatDate(user.first_tracked_at)}</TableCell>
                      <TableCell className="text-sm">{formatDate(user.last_activity_at)}</TableCell>
                      <TableCell className="text-center text-sm tabular-nums">{user.posts_created}</TableCell>
                      <TableCell className="text-center text-sm tabular-nums">{user.votes_cast}</TableCell>
                      <TableCell className="text-center text-sm tabular-nums">{user.comments_made}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="tabular-nums">{user.total_actions}</Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Caption */}
            <p className="text-xs text-muted-foreground mt-3">
              Different email addresses are tracked as separate users, even for the same name.
            </p>

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
