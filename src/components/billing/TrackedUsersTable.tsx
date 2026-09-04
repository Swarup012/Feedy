'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/hooks/use-toast';
import api from '@/lib/api';
import { Loader2, Trash2, Users } from 'lucide-react';

interface TrackedUser {
  id: string;
  display_name: string | null;
  email: string | null;
  identification_method: string | null;
  last_activity_at: string;
  total_actions: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface TrackedUsersTableProps {
  organizationId: string;
}

export function TrackedUsersTable({ organizationId }: TrackedUsersTableProps) {
  const { toast } = useToast();
  const [users, setUsers] = useState<TrackedUser[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, pages: 0 });
  const [peak, setPeak] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Confirmation dialog state
  const [deleteMode, setDeleteMode] = useState<'single' | 'bulk' | null>(null);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await api.get(
        `/api/organizations/${organizationId}/tracked-users`,
        { params: { page, limit: 20 } }
      );

      const data = response.data.data ?? response.data;
      setUsers(data.users ?? []);
      setPagination(data.pagination ?? { page, limit: 20, total: 0, pages: 0 });
      setPeak(typeof data.peak === 'number' ? data.peak : null);
      setSelectedIds(new Set());
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.response?.data?.error || 'Failed to load tracked users.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [organizationId, toast]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleSingleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
    setDeleteMode('single');
  };

  const handleBulkDeleteClick = () => {
    if (selectedIds.size === 0) return;
    setDeleteMode('bulk');
  };

  const executeDelete = async () => {
    if (!deleteMode) return;

    setDeleting(true);
    try {
      let serverCount: number | null = null;

      if (deleteMode === 'single' && deleteTargetId) {
        const response = await api.delete(
          `/api/organizations/${organizationId}/tracked-users/${deleteTargetId}`
        );
        serverCount = response.data.data?.count ?? response.data.count ?? null;
        toast({ title: 'Tracked user removed' });
      } else if (deleteMode === 'bulk' && selectedIds.size > 0) {
        const response = await api.delete(`/api/organizations/${organizationId}/tracked-users`, {
          data: { ids: Array.from(selectedIds) },
        });
        serverCount = response.data.data?.count ?? response.data.count ?? null;
        toast({
          title: 'Tracked users removed',
          description: `${selectedIds.size} user(s) deleted.`,
        });
      }

      setSelectedIds(new Set());
      // Use the authoritative count from the server response.
      // If the server didn't return a count (unexpected), fall back to
      // subtracting 1 for single deletes or re-fetching the current page
      // for bulk (since we can't know the actual number removed).
      const limit = pagination.limit || 20;
      let targetPage = pagination.page;
      if (serverCount !== null) {
        const newPages = Math.max(1, Math.ceil(serverCount / limit));
        targetPage = Math.min(pagination.page, newPages);
      } else if (deleteMode === 'bulk') {
        // Server didn't return count — re-fetch current page and let
        // the response correct the pagination state.
        targetPage = pagination.page;
      }
      await fetchUsers(targetPage);
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getDeleteTargetName = () => {
    if (deleteMode === 'single' && deleteTargetId) {
      const user = users.find((u) => u.id === deleteTargetId);
      return user?.display_name || user?.email || 'this user';
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Tracked Users</CardTitle>
              <CardDescription>
                {pagination.total} user(s) tracked this billing period
              </CardDescription>
              {peak !== null && (
                <p className="text-sm text-muted-foreground mt-1">
                  Peak this month: <span className="font-medium text-foreground">{peak}</span> · Billing is based on your peak, not your current count.
                </p>
              )}
            </div>
            {selectedIds.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDeleteClick}
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Delete {selectedIds.size} selected
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No tracked users yet</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={selectedIds.size === users.length && users.length > 0}
                        onCheckedChange={toggleAll}
                        aria-label="Select all"
                      />
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Identified by</TableHead>
                    <TableHead>Last seen</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.has(user.id)}
                          onCheckedChange={() => toggleRow(user.id)}
                          aria-label={`Select ${user.display_name || user.email}`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0">
                          <div className="font-medium text-sm truncate">
                            {user.display_name || 'Anonymous'}
                          </div>
                          {user.email && (
                            <div className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {user.identification_method || 'unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(user.last_activity_at)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="tabular-nums">
                          {user.total_actions}
                        </Badge>
                      </TableCell>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.pages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchUsers(pagination.page - 1)}
                      disabled={pagination.page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchUsers(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialogs */}
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
  );
}
