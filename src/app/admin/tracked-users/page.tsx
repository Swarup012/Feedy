'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useOrganization } from '@/context/OrganizationContext';
import trackedUsersService, {
  TrackedUsersUsage,
  TrackedUser,
  HistoricalData
} from '@/services/trackedUsersService';
import api from '@/lib/api';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
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
  Trash2,
} from 'lucide-react';
import { WIDE_CONTAINER } from '@/lib/layout-constants';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

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
  const { organization, organizationRole } = useOrganization();
  const handleLoadError = useErrorHandler({ context: 'loadTrackedUsers', showToast: true, logError: true });
  const handleUsersError = useErrorHandler({ context: 'loadUsersList', showToast: false, logError: true });

  const isAdmin = ['owner', 'admin'].includes(organizationRole ?? '');

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

  // Selection & delete state (admin only)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleteMode, setDeleteMode] = useState<'single' | 'bulk' | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    loadUsers();
  }, [currentPage, sortBy, sortOrder]);

  const loadUsage = useCallback(async () => {
    try {
      const usageResponse = await trackedUsersService.getUsage();
      if (usageResponse.success) {
        setUsage(usageResponse.data);
      }
    } catch (error) {
      handleLoadError(error);
    }
  }, [handleLoadError]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const historyResponse = await trackedUsersService.getHistory(6);

      if (historyResponse.success) {
        setHistory(historyResponse.data.history);
      }

      await Promise.all([loadUsage(), loadUsers()]);
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

  // ── Delete handlers (admin only) ──────────────────────────────────

  const orgId = organization?.id;

  const handleSingleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
    setDeleteMode('single');
  };

  const handleBulkDeleteClick = () => {
    if (selectedIds.size === 0) return;
    setDeleteMode('bulk');
  };

  const executeDelete = async () => {
    if (!deleteMode || !orgId) return;

    setDeleting(true);
    try {
      let serverCount: number | null = null;

      if (deleteMode === 'single' && deleteTargetId) {
        const response = await api.delete(
          `/api/organizations/${orgId}/tracked-users/${deleteTargetId}`
        );
        serverCount = response.data.data?.count ?? response.data.count ?? null;
        toast({ title: 'Tracked user removed' });
      } else if (deleteMode === 'bulk' && selectedIds.size > 0) {
        const response = await api.delete(`/api/organizations/${orgId}/tracked-users`, {
          data: { ids: Array.from(selectedIds) },
        });
        serverCount = response.data.data?.count ?? response.data.count ?? null;
        toast({
          title: 'Tracked users removed',
          description: `${selectedIds.size} user(s) deleted.`,
        });
      }

      setSelectedIds(new Set());
      // Use the authoritative count from the server response to clamp
      // currentPage — avoids fetching a page index that no longer exists.
      const limit = 50;
      let targetPage = currentPage;
      if (serverCount !== null) {
        const newPages = Math.max(1, Math.ceil(serverCount / limit));
        targetPage = Math.min(currentPage, newPages);
      }
      setCurrentPage(targetPage);
      // Re-fetch using the clamped page and the fresh usage stats in parallel.
      await Promise.all([
        (async () => {
          const listResponse = await trackedUsersService.getList({
            page: targetPage,
            limit,
            sort: sortBy,
            order: sortOrder,
          });
          if (listResponse.success) {
            setUsers(listResponse.data.users);
            setTotalPages(listResponse.data.pagination?.pages ?? 1);
          }
        })(),
        loadUsage(),
      ]);
    } catch (error: any) {
      const message =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        'Failed to delete tracked user(s). Please try again.';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setDeleting(false);
      setDeleteMode(null);
      setDeleteTargetId(null);
    }
  };

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds((prev) => {
      if (prev.size === users.length) return new Set();
      return new Set(users.map((u) => u.id));
    });
  };

  const getDeleteTargetName = () => {
    if (deleteMode === 'single' && deleteTargetId) {
      const user = users.find((u) => u.id === deleteTargetId);
      return user?.display_name || user?.email || 'this user';
    }
    return null;
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

  if (loading) {
    return (
      <ProtectedRoute>
        <div className={`${WIDE_CONTAINER} py-5`}>
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
      <div className={`${WIDE_CONTAINER} py-5 space-y-5`}>
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
            {usage?.peak != null && (
              <p className="text-sm text-muted-foreground mt-2">
                Peak this month: <span className="font-medium text-foreground">{usage.peak}</span> · Billing is based on your peak, not your current count.
              </p>
            )}
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

          {/* Action Breakdown — bar chart */}
          <Card>
            <CardHeader>
              <CardTitle>Action Breakdown</CardTitle>
              <CardDescription>Distribution of user actions this month</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const breakdownData = [
                  { name: 'Posts', value: usage?.breakdown?.posts || 0, color: '#3b82f6' },
                  { name: 'Votes', value: usage?.breakdown?.votes || 0, color: '#10b981' },
                  { name: 'Comments', value: usage?.breakdown?.comments || 0, color: '#f59e0b' },
                ];
                const hasData = breakdownData.some((d) => d.value > 0);

                if (!hasData) {
                  return (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <TrendingUp className="h-10 w-10 text-muted-foreground/40 mb-3" />
                      <p className="text-sm text-muted-foreground max-w-xs">
                        No actions recorded yet this month.
                      </p>
                    </div>
                  );
                }

                return (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={breakdownData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                      <Tooltip
                        formatter={(value: number) => [value.toLocaleString(), 'Count']}
                        cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                      />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={60}>
                        {breakdownData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
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
                {isAdmin && selectedIds.size > 0 && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDeleteClick}
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Delete {selectedIds.size} selected
                  </Button>
                )}
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
                  {isAdmin && (
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedIds.size === users.length && users.length > 0}
                        onCheckedChange={toggleAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                  )}
                  <TableHead>User</TableHead>
                  <TableHead>First Seen</TableHead>
                  <TableHead>Last Seen</TableHead>
                  <TableHead className="text-center">Posts</TableHead>
                  <TableHead className="text-center">Votes</TableHead>
                  <TableHead className="text-center">Comments</TableHead>
                  <TableHead className="text-center">Total</TableHead>
                  {isAdmin && <TableHead className="w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 9 : 8} className="text-center text-muted-foreground py-8">
                      No tracked users yet
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      {isAdmin && (
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(user.id)}
                            onCheckedChange={() => toggleRow(user.id)}
                            aria-label={`Select ${user.display_name || user.email}`}
                          />
                        </TableCell>
                      )}
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
                      {isAdmin && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleSingleDeleteClick(user.id)}
                            title="Remove tracked user"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-red-500" />
                          </Button>
                        </TableCell>
                      )}
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

      {/* Delete confirmation dialogs (admin only) */}
      {isAdmin && (
        <>
          <ConfirmDialog
            open={deleteMode === 'single'}
            onOpenChange={(open) => { if (!open) { setDeleteMode(null); setDeleteTargetId(null); } }}
            title="Remove tracked user?"
            description={
              <>
                Are you sure you want to remove <strong>{getDeleteTargetName()}</strong> from
                your tracked users for this billing period? This action cannot be undone.
              </>
            }
            confirmLabel={deleting ? 'Removing…' : 'Remove'}
            variant="destructive"
            onConfirm={executeDelete}
          />

          <ConfirmDialog
            open={deleteMode === 'bulk'}
            onOpenChange={(open) => { if (!open) { setDeleteMode(null); setDeleteTargetId(null); } }}
            title="Remove tracked users?"
            description={
              <>
                Are you sure you want to remove <strong>{selectedIds.size} user(s)</strong> from
                your tracked users for this billing period? This action cannot be undone.
              </>
            }
            confirmLabel={deleting ? 'Removing…' : `Remove ${selectedIds.size} user(s)`}
            variant="destructive"
            onConfirm={executeDelete}
          />
        </>
      )}
    </ProtectedRoute>
  );
}
