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
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Calendar, Download, RefreshCw, Trash2 } from 'lucide-react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

function getStatusBadge(status: string, percent: number) {
  const config: Record<string, { label: string; className: string }> = {
    good: {
      label: 'Good',
      className: 'bg-status-success-bg text-status-success-text border-status-success-border',
    },
    warning: {
      label: 'Warning',
      className: 'bg-status-warning-bg text-status-warning-text border-status-warning-border',
    },
    critical: {
      label: 'Critical',
      className: 'bg-status-warning-bg text-status-warning-text border-status-warning-border',
    },
    exceeded: {
      label: 'Limit Reached',
      className: 'bg-status-error-bg text-status-error-text border-status-error-border',
    },
  };
  const cfg = config[status] || config.good;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {cfg.label}
    </span>
  );
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
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
    if (!isAdmin) return;
    loadAllData();
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    loadUsers();
  }, [isAdmin, currentPage, sortBy, sortOrder]);

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
      <ProtectedRoute allowedRoles={["owner", "admin"]}>
        <div className="settings-content settings-content--wide tu-page">
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
    <ProtectedRoute allowedRoles={["owner", "admin"]}>
      <div className="settings-content settings-content--wide tu-page space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="settings-page__title">Tracked Users</h1>
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

        {/* Usage */}
        <div className="tu-usage">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Tracked Users</p>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-semibold tabular-nums">{usage?.count.toLocaleString() || 0}</span>
                <span className="text-lg text-muted-foreground font-medium">of {usage?.limit.toLocaleString() || 0}</span>
              </div>
            </div>
            {getStatusBadge(usage?.status || 'good', percentUsed)}
          </div>
          <div
            className="tu-meter"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(percentUsed)}
          >
            <div className="tu-meter__fill" style={{ width: `${Math.min(percentUsed, 100)}%` }} />
          </div>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-3">
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
        </div>

        {/* Secondary Stats */}
        <div className="tu-stats">
          <div className="tu-stat">
            <span className="tu-stat__label">Total Actions</span>
            <span className="tu-stat__value">{totalActions.toLocaleString()}</span>
          </div>
          <div className="tu-stat">
            <span className="tu-stat__label">Posts</span>
            <span className="tu-stat__value">{(usage?.breakdown?.posts || 0).toLocaleString()}</span>
          </div>
          <div className="tu-stat">
            <span className="tu-stat__label">Votes</span>
            <span className="tu-stat__value">{(usage?.breakdown?.votes || 0).toLocaleString()}</span>
          </div>
          <div className="tu-stat">
            <span className="tu-stat__label">Comments</span>
            <span className="tu-stat__value">{(usage?.breakdown?.comments || 0).toLocaleString()}</span>
          </div>
        </div>

        {/* Charts */}
        <div className="grid gap-12 md:grid-cols-2">
          {/* Historical Trend — hidden when < 10 tracked users */}
          {(usage?.count || 0) >= 10 ? (
            <section>
              <div className="settings-section__head">
                <h3 className="settings-section__title">Historical Trend</h3>
                <p className="settings-section__desc">Tracked users over the past 6 months</p>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={history} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <XAxis
                    dataKey="billing_period"
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip
                    formatter={(value: number) => [value.toLocaleString(), 'Tracked Users']}
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.5 }}
                  />
                  <Bar dataKey="total_users" radius={[3, 3, 0, 0]} maxBarSize={40}>
                    {history.map((entry, index) => (
                      <Cell
                        key={`trend-${index}`}
                        fill={
                          entry.billing_period === usage?.current_period
                            ? 'hsl(var(--primary))'
                            : 'hsl(var(--primary) / 0.25)'
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </section>
          ) : (
            <section>
              <div className="settings-section__head">
                <h3 className="settings-section__title">Historical Trend</h3>
                <p className="settings-section__desc">Tracked users over the past 6 months</p>
              </div>
              <div className="tu-empty">
                Not enough data yet — check back once you have more tracked users.
              </div>
            </section>
          )}

          {/* Action Breakdown — per-type rows */}
          <section>
            <div className="settings-section__head">
              <h3 className="settings-section__title">Action Breakdown</h3>
              <p className="settings-section__desc">Distribution of user actions this month</p>
            </div>
            {(() => {
              const breakdownData = [
                { name: 'Posts', value: usage?.breakdown?.posts || 0 },
                { name: 'Votes', value: usage?.breakdown?.votes || 0 },
                { name: 'Comments', value: usage?.breakdown?.comments || 0 },
              ];
              const hasData = breakdownData.some((d) => d.value > 0);

              if (!hasData) {
                return <div className="tu-empty">No actions recorded yet this month.</div>;
              }

              return (
                <div className="tu-breakdown">
                  {breakdownData.map((d) => {
                    const pct = totalActions > 0 ? Math.round((d.value / totalActions) * 100) : 0;
                    return (
                      <div key={d.name} className="tu-breakdown__row">
                        <div className="tu-breakdown__top">
                          <span className="tu-breakdown__name">{d.name}</span>
                          <span className="tu-breakdown__meta">
                            {d.value.toLocaleString()} · {pct}%
                          </span>
                        </div>
                        <span className="tu-breakdown__bar">
                          <span style={{ width: `${pct}%` }} />
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </section>
        </div>

        {/* Users Table */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="settings-section__title">Tracked Users List</h3>
              <p className="settings-section__desc">Users who have interacted with your feedback board</p>
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
          <div className="tu-table-wrap">
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
                  <TableHead className="text-right">Posts</TableHead>
                  <TableHead className="text-right">Votes</TableHead>
                  <TableHead className="text-right">Comments</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  {isAdmin && <TableHead className="w-10" />}
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 9 : 8} className="py-2">
                      <div className="tu-empty">No tracked users yet</div>
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
                          <div className="tu-avatar">
                            <span>{getInitials(user.display_name)}</span>
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
                      <TableCell className="text-right text-sm tabular-nums">{user.posts_created}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{user.votes_cast}</TableCell>
                      <TableCell className="text-right text-sm tabular-nums">{user.comments_made}</TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold tabular-nums">{user.total_actions}</span>
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
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

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
        </section>
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
