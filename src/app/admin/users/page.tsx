'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useOrganization } from '@/context/OrganizationContext';
import orgEndUsersService, { OrgEndUser, OrgEndUserDetail } from '@/services/orgEndUsersService';
import { Post } from '@/services/postService';
import { Board } from '@/services/boardService';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Users,
  Search,
  ArrowUp,
  MessageSquare,
  User,
  ExternalLink,
  Shield,
  Calendar,
  Clock,
  Trash2,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { WIDE_CONTAINER } from '@/lib/layout-constants';
import { PostDetails } from '@/components/feedback/PostDetails';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-muted text-muted-foreground',
  'under-review': 'bg-primary/10 text-primary',
  planned: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  'in-progress': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  closed: 'bg-destructive/10 text-destructive',
};

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  'under-review': 'Under Review',
  planned: 'Planned',
  'in-progress': 'In Progress',
  completed: 'Completed',
  closed: 'Closed',
};

const IDENTITY_BADGES: Record<string, { label: string; className: string }> = {
  verified: { label: 'Verified', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  unverified: { label: 'Unverified', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
  email_only: { label: 'Email Only', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  anonymous: { label: 'Anonymous', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400' },
};

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

export default function UsersPage() {
  const { toast } = useToast();
  const { organization } = useOrganization();
  const orgId = organization?.id;

  // Users list state
  const [users, setUsers] = useState<OrgEndUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('last_seen_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Selected user state
  const [selectedUser, setSelectedUser] = useState<OrgEndUserDetail | null>(null);
  const [selectedUserPosts, setSelectedUserPosts] = useState<Post[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsPage, setPostsPage] = useState(1);
  const [postsTotalPages, setPostsTotalPages] = useState(1);

  // Post detail sheet state
  const [sheetPost, setSheetPost] = useState<Post | null>(null);
  const [sheetBoard, setSheetBoard] = useState<Board | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Debounced search ref
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // AbortController ref for cancelling stale requests
  const abortRef = useRef<AbortController | null>(null);

  // Separate AbortController ref for user detail loads (independent of list loads)
  const detailAbortRef = useRef<AbortController | null>(null);

  // Detail panel loading state
  const [detailLoading, setDetailLoading] = useState(false);

  // Delete user state
  const [deleteTarget, setDeleteTarget] = useState<OrgEndUser | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Load users list ────────────────────────────────────────────────

  const loadUsers = useCallback(async () => {
    if (!orgId) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setUsersLoading(true);
    try {
      const response = await orgEndUsersService.getList(orgId, {
        page: currentPage,
        limit: 50,
        search,
        sortBy,
        sortOrder,
      }, controller.signal);
      if (response.success) {
        setUsers(response.data.users);
        setTotalPages(response.data.pagination.pages);
        setTotalUsers(response.data.pagination.total);
      }
    } catch (error: any) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return;
      toast({ title: 'Error', description: 'Failed to load users', variant: 'destructive' });
    } finally {
      if (!controller.signal.aborted) setUsersLoading(false);
    }
  }, [orgId, currentPage, search, sortBy, sortOrder, toast]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Reset to page 1 when search/sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortBy, sortOrder]);

  // Cleanup debounce timer and abort controllers on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      abortRef.current?.abort();
      detailAbortRef.current?.abort();
    };
  }, []);

  // ── Load posts for selected user ───────────────────────────────────

  const loadUserPosts = useCallback(async (userId: string, page: number = 1) => {
    if (!orgId) return;
    setPostsLoading(true);
    try {
      const response = await orgEndUsersService.getPosts(orgId, userId, { page, limit: 50 });
      if (response.success) {
        setSelectedUserPosts(response.data.posts);
        setPostsTotalPages(response.data.pagination.pages);
        setPostsPage(page);
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to load user posts', variant: 'destructive' });
    } finally {
      setPostsLoading(false);
    }
  }, [orgId, toast]);

  // ── Load user detail ───────────────────────────────────────────────

  const loadUserDetail = useCallback(async (userId: string) => {
    if (!orgId) return;
    detailAbortRef.current?.abort();
    const controller = new AbortController();
    detailAbortRef.current = controller;
    setDetailLoading(true);
    try {
      const response = await orgEndUsersService.getById(orgId, userId, controller.signal);
      if (response.success) {
        setSelectedUser(response.data.user);
      }
    } catch (error: any) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return;
      // Non-critical — list data is sufficient
    } finally {
      if (!controller.signal.aborted) setDetailLoading(false);
    }
  }, [orgId]);

  // ── Select a user ──────────────────────────────────────────────────

  const handleUserSelect = useCallback((user: OrgEndUser) => {
    setSelectedUser(user as OrgEndUserDetail);
    setSelectedUserPosts([]);
    setPostsPage(1);
    loadUserPosts(user.id, 1);
    loadUserDetail(user.id);
  }, [loadUserPosts, loadUserDetail]);

  // ── Handle post click → open Sheet ─────────────────────────────────

  const handlePostClick = useCallback((post: Post) => {
    setSheetPost(post);
    setSheetBoard(post.board || null);
    setSheetOpen(true);
  }, []);

  // ── Handle search input with debounce ──────────────────────────────

  const handleSearch = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value);
    }, 250);
  }, []);

  // ── Delete user ───────────────────────────────────────────────────

  const handleDelete = useCallback(async () => {
    if (!orgId || !deleteTarget) return;
    setDeleting(true);
    try {
      const result = await orgEndUsersService.delete(orgId, deleteTarget.id);
      if (result.success) {
        toast({ title: 'User deleted' });
        setDeleteTarget(null);
        if (selectedUser?.id === deleteTarget.id) {
          setSelectedUser(null);
          setSelectedUserPosts([]);
        }
        loadUsers();
      } else {
        toast({ title: 'Error', description: result.error || 'Failed to delete user', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Failed to delete user', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  }, [orgId, deleteTarget, selectedUser, loadUsers, toast]);

  // ── PostDetails callbacks for the Sheet ────────────────────────────

  const handlePostUpdated = useCallback((updatedPost: Post) => {
    setSheetPost(updatedPost);
    // Also update in the posts list
    setSelectedUserPosts(prev =>
      prev.map(p => p.id === updatedPost.id ? updatedPost : p)
    );
  }, []);

  const handlePostDeleted = useCallback((postId: string) => {
    setSheetOpen(false);
    setSheetPost(null);
    setSelectedUserPosts(prev => prev.filter(p => p.id !== postId));
  }, []);

  // ── Format date ────────────────────────────────────────────────────

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <ProtectedRoute>
      <div className={`${WIDE_CONTAINER} py-5`}>
        {/* Header */}
        <div className="mb-5">
          <h1 className="text-xl font-bold">Manage your valuable customers</h1>
        </div>

        {/* 3-column layout */}
        <div className="flex gap-0 border border-border rounded-lg overflow-hidden" style={{ height: 'calc(100vh - 160px)' }}>

          {/* ── LEFT COLUMN: Users List ──────────────────────────── */}
          <div className="w-[320px] min-w-[320px] border-r border-border flex flex-col bg-background">
            {/* Search + Sort */}
            <div className="p-3 border-b border-border space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-10"
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={(v) => setSortBy(v)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last_seen_at">Last Seen</SelectItem>
                    <SelectItem value="created_at">First Seen</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 flex-shrink-0"
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                  title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                >
                  <span className="text-xs font-mono">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                </Button>
              </div>
            </div>

            {/* Users list */}
            <div className="flex-1 overflow-y-auto">
              {usersLoading ? (
                <div className="p-3 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : users.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <Users className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    {search ? 'No users match your search' : 'No end users yet'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {users.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className={cn(
                        'w-full text-left p-3 hover:bg-muted/50 transition-colors',
                        selectedUser?.id === user.id && 'bg-primary/10'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full ${getAvatarColor(user.name)} flex items-center justify-center`}>
                          <span className="text-[10px] font-semibold text-white">{getInitials(user.name)}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-medium text-sm truncate">
                            {user.name || 'Anonymous'}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {user.email || user.external_user_id || '—'}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] flex-shrink-0', IDENTITY_BADGES[user.identity_type]?.className)}
                        >
                          {IDENTITY_BADGES[user.identity_type]?.label || user.identity_type}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-3 border-t border-border flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {totalUsers} users · Page {currentPage} of {totalPages}
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="h-7 text-xs"
                  >
                    Prev
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="h-7 text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* ── MIDDLE COLUMN: Posts by Selected User ─────────────── */}
          <div className="flex-1 min-w-0 flex flex-col bg-background">
            {!selectedUser ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <Users className="h-12 w-12 text-muted-foreground/30 mb-4" />
                <h3 className="font-semibold text-lg text-foreground mb-1">Select a user</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Choose a user from the list to view their posts and activity.
                </p>
              </div>
            ) : (
              <>
                {/* Posts header */}
                <div className="p-3 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">
                      Posts by {selectedUser.name || 'Anonymous'}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {postsLoading ? 'Loading...' : `${selectedUserPosts.length} post${selectedUserPosts.length !== 1 ? 's' : ''}`}
                    </p>
                  </div>
                </div>

                {/* Posts list */}
                <div className="flex-1 overflow-y-auto">
                  {postsLoading ? (
                    <div className="p-3 space-y-3">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : selectedUserPosts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center p-6">
                      <MessageSquare className="h-10 w-10 text-muted-foreground/40 mb-3" />
                      <p className="text-sm text-muted-foreground">No posts from this user</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {selectedUserPosts.map((post) => (
                        <button
                          key={post.id}
                          onClick={() => handlePostClick(post)}
                          className={cn(
                            'w-full text-left p-4 hover:bg-muted/50 transition-colors',
                            sheetPost?.id === post.id && sheetOpen && 'bg-primary/10'
                          )}
                        >
                          <div className="space-y-2">
                            <h4 className="font-semibold text-sm line-clamp-2 text-foreground">
                              {post.title}
                            </h4>
                            {post.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {post.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <Badge
                                variant="secondary"
                                className={cn('text-xs', STATUS_COLORS[post.status])}
                              >
                                {STATUS_LABELS[post.status]}
                              </Badge>
                              {post.board && (
                                <span className="text-xs text-muted-foreground">
                                  {post.board.name}
                                </span>
                              )}
                              <div className="flex items-center gap-1">
                                <ArrowUp className="h-3 w-3" />
                                <span>{post.upvotes}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                <span>{post.comment_count}</span>
                              </div>
                              <span>
                                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Posts pagination */}
                {postsTotalPages > 1 && (
                  <div className="p-3 border-t border-border flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      Page {postsPage} of {postsTotalPages}
                    </p>
                    <div className="flex gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadUserPosts(selectedUser.id, postsPage - 1)}
                        disabled={postsPage === 1}
                        className="h-7 text-xs"
                      >
                        Prev
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => loadUserPosts(selectedUser.id, postsPage + 1)}
                        disabled={postsPage === postsTotalPages}
                        className="h-7 text-xs"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ── RIGHT COLUMN: User Detail Panel ──────────────────── */}
          <div className="w-[300px] min-w-[300px] border-l border-border flex flex-col bg-background">
            {!selectedUser ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <User className="h-10 w-10 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">Select a user to view details</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Avatar + Name */}
                <div className="flex flex-col items-center text-center">
                  <div className={`w-14 h-14 rounded-full ${getAvatarColor(selectedUser.name)} flex items-center justify-center mb-3`}>
                    <span className="text-lg font-semibold text-white">{getInitials(selectedUser.name)}</span>
                  </div>
                  <h3 className="font-bold text-base">{selectedUser.name || 'Anonymous'}</h3>
                  {selectedUser.email && (
                    <p className="text-sm text-muted-foreground mt-0.5">{selectedUser.email}</p>
                  )}
                  <Badge
                    variant="outline"
                    className={cn('mt-2 text-xs', IDENTITY_BADGES[selectedUser.identity_type]?.className)}
                  >
                    {IDENTITY_BADGES[selectedUser.identity_type]?.label || selectedUser.identity_type}
                  </Badge>
                </div>

                {/* Info rows */}
                <div className="space-y-3 border-t border-border pt-4">
                  {selectedUser.external_user_id && (
                    <div className="flex items-start gap-2.5">
                      <ExternalLink className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">External ID</p>
                        <p className="text-sm font-mono truncate">{selectedUser.external_user_id}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2.5">
                    <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">First Seen</p>
                      <p className="text-sm">{formatDate(selectedUser.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Last Seen</p>
                      {detailLoading && !selectedUser.last_seen_at ? (
                        <Skeleton className="h-4 w-20 mt-0.5" />
                      ) : (
                        <p className="text-sm">{formatDate(selectedUser.last_seen_at)}</p>
                      )}
                    </div>
                  </div>
                  {detailLoading && !selectedUser.verified_at && (
                    <div className="flex items-start gap-2.5">
                      <Shield className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Verified At</p>
                        <Skeleton className="h-4 w-24 mt-0.5" />
                      </div>
                    </div>
                  )}
                  {!detailLoading && selectedUser.verified_at && (
                    <div className="flex items-start gap-2.5">
                      <Shield className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-muted-foreground">Verified At</p>
                        <p className="text-sm">{formatDate(selectedUser.verified_at)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Custom fields */}
                {selectedUser.custom_fields && Object.keys(selectedUser.custom_fields).length > 0 && (
                  <div className="border-t border-border pt-4">
                    <p className="text-xs text-muted-foreground mb-2">Custom Fields</p>
                    <div className="space-y-1.5">
                      {Object.entries(selectedUser.custom_fields).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-muted-foreground truncate mr-2">{key}</span>
                          <span className="font-medium truncate">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Delete user */}
                <div className="border-t border-border pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDeleteTarget(selectedUser)}
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Delete User
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Post Detail Sheet ──────────────────────────────────── */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="w-[70vw] sm:max-w-[70vw] p-0 overflow-hidden">
            <SheetHeader className="px-6 pt-5 pb-3 border-b border-border">
              <SheetTitle>Post Details</SheetTitle>
            </SheetHeader>
            <div className="overflow-y-auto" style={{ height: 'calc(100vh - 64px)' }}>
              {sheetPost && (
                <PostDetails
                  post={sheetPost}
                  currentBoard={sheetBoard}
                  onPostUpdated={handlePostUpdated}
                  onPostDeleted={handlePostDeleted}
                  onBack={() => setSheetOpen(false)}
                  className="flex-1 bg-gray-50 dark:bg-background flex overflow-hidden"
                />
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* Delete User Confirmation */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete{" "}
                <strong>{deleteTarget?.name || 'this user'}</strong>?
                Their posts and activity will be permanently removed.
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={deleting}
                variant="destructive"
              >
                {deleting ? 'Deleting…' : 'Delete User'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </ProtectedRoute>
  );
}
