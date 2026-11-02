'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useOrganization } from '@/context/OrganizationContext';
import orgEndUsersService, { OrgEndUser, OrgEndUserDetail } from '@/services/orgEndUsersService';
import { Post } from '@/services/postService';
import { Board } from '@/services/boardService';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
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
  Search,
  ArrowUp,
  ArrowDown,
  MessageSquare,
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
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import './users.css';

// PostDetails (~1.6k lines + roadmap/changelog/realtime deps) is only rendered
// inside the Sheet once a post is clicked — load it on demand instead of
// putting it in this route's First Load JS.
const PostDetails = dynamic(
  () => import('@/components/feedback/PostDetails').then((m) => m.PostDetails),
  {
    ssr: false,
    // Fixed height matching the sheet body (calc(100vh - 64px)) so the
    // chunk-loading skeleton occupies the same box as the real component.
    loading: () => (
      <div className="u-sheetloading">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    ),
  },
);

const STATUS_LABELS: Record<string, string> = {
  open: 'Open',
  'under-review': 'Under Review',
  planned: 'Planned',
  'in-progress': 'In Progress',
  completed: 'Completed',
  closed: 'Closed',
};

const STATUS_PILLS: Record<string, string> = {
  open: 'spill--open',
  'under-review': 'spill--review',
  planned: 'spill--planned',
  'in-progress': 'spill--progress',
  completed: 'spill--done',
  closed: 'spill--closed',
};

const IDENTITY_PILLS: Record<string, { label: string; pill: string }> = {
  verified: { label: 'Verified', pill: 'spill--verified' },
  unverified: { label: 'Unverified', pill: 'spill--progress' },
  email_only: { label: 'Email Only', pill: 'spill--email' },
  anonymous: { label: 'Anonymous', pill: 'spill--anon' },
};

function getInitials(name: string | null | undefined): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
}

// Four lightness steps of one brand hue, picked by name hash.
function getAvatarTint(name: string | null | undefined): string {
  if (!name) return 'uavatar';
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const tier = (Math.abs(hash) % 4) + 1;
  return cn('uavatar', tier > 1 && `uavatar--t${tier}`);
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
  const [postsTotal, setPostsTotal] = useState(0);

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
  const [detailError, setDetailError] = useState(false);

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
        setPostsTotal(response.data.pagination.total);
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
    setDetailError(false);
    try {
      const response = await orgEndUsersService.getById(orgId, userId, controller.signal);
      if (response.success && response.data?.user) {
        setSelectedUser(response.data.user);
      } else {
        setDetailError(true);
      }
    } catch (error: any) {
      if (error?.name === 'CanceledError' || error?.code === 'ERR_CANCELED') return;
      // Non-critical — list data is sufficient, but the stats panel shows an error + retry.
      setDetailError(true);
    } finally {
      if (!controller.signal.aborted) setDetailLoading(false);
    }
  }, [orgId]);

  // ── Select a user ──────────────────────────────────────────────────

  const handleUserSelect = useCallback((user: OrgEndUser) => {
    setSelectedUser(user as OrgEndUserDetail);
    setSelectedUserPosts([]);
    setPostsPage(1);
    setPostsTotal(0);
    setDetailError(false);
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
      // setSearch + setCurrentPage in one batch → one render → loadUsers
      // changes identity once → exactly one request (page 1, new search).
      setSearch(value);
      setCurrentPage(1);
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
    setPostsTotal(t => Math.max(t - 1, 0));
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
      <div className={`${WIDE_CONTAINER} h-full`}>
        <div className="uwork">

          {/* ── User rail ──────────────────────────────────────────── */}
          <aside className="urail" aria-label="End users">
            <div className="urail__tools">
              <div className="urail__search">
                <Search aria-hidden="true" />
                <Input
                  aria-label="Search users"
                  placeholder="Search users…"
                  onChange={(e) => handleSearch(e.target.value)}
                />
              </div>
              <div className="urail__sort">
                <Select
                  value={sortBy}
                  onValueChange={(v) => {
                    setSortBy(v);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="urail__sort-select" aria-label="Sort users by">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last_seen_at">Last Seen</SelectItem>
                    <SelectItem value="created_at">First Seen</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                  </SelectContent>
                </Select>
                <button
                  type="button"
                  className="urail__order"
                  onClick={() => {
                    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                    setCurrentPage(1);
                  }}
                  title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                  aria-label={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                >
                  {sortOrder === 'asc' ? <ArrowUp aria-hidden="true" /> : <ArrowDown aria-hidden="true" />}
                </button>
              </div>
            </div>

            <div className="urail__list">
              {usersLoading ? (
                <div className="u-skeletons">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-[56px] w-full" />
                  ))}
                </div>
              ) : users.length === 0 ? (
                <div className="u-empty">
                  <p className="u-empty__title">
                    {search ? 'No users match your search' : 'No end users yet'}
                  </p>
                  <p className="u-empty__note">
                    {search
                      ? 'Try a shorter name or email fragment.'
                      : 'End users appear here once they sign in to the feedback board.'}
                  </p>
                </div>
              ) : (
                users.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => handleUserSelect(user)}
                    aria-pressed={selectedUser?.id === user.id}
                    className={cn('lrow', selectedUser?.id === user.id && 'is-selected')}
                  >
                    <span className={getAvatarTint(user.name)} aria-hidden="true">
                      {getInitials(user.name)}
                    </span>
                    <span className="lrow__body">
                      <span className="lrow__name">{user.name || 'Anonymous'}</span>
                      <span className="lrow__mail">{user.email || user.external_user_id || '—'}</span>
                    </span>
                    <span
                      className={cn('spill', IDENTITY_PILLS[user.identity_type]?.pill)}
                    >
                      {IDENTITY_PILLS[user.identity_type]?.label || user.identity_type}
                    </span>
                  </button>
                ))
              )}
            </div>

            {/* Pagination — always rendered so its height is reserved from
                first paint; `invisible` keeps the box (no shift) when there
                is a single page or data hasn't loaded yet. */}
            <div
              className={cn(
                'urail__foot',
                totalPages <= 1 && 'invisible',
              )}
            >
              <p className="urail__count">
                <span>{totalUsers} users</span>
                <span>Page {currentPage} of {totalPages}</span>
              </p>
              <div className="ustack">
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
          </aside>

          {/* ── Posts ledger ───────────────────────────────────────── */}
          <section className="uposts" aria-label="User posts">
            {!selectedUser ? (
              <div className="u-empty">
                <p className="u-empty__title">Select a user</p>
                <p className="u-empty__note">
                  Choose a user from the list to view their posts and activity.
                </p>
              </div>
            ) : (
              <>
                <div className="uposts__head">
                  <h3 className="uposts__title">
                    Posts by {selectedUser.name || 'Anonymous'}
                  </h3>
                  <p className="uposts__count">
                    {postsLoading
                      ? 'Loading…'
                      : typeof postsTotal === 'number'
                        ? `${postsTotal} post${postsTotal !== 1 ? 's' : ''}`
                        : null}
                  </p>
                </div>

                <div className="uposts__list">
                  {postsLoading ? (
                    <div className="u-skeletons">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full" />
                      ))}
                    </div>
                  ) : selectedUserPosts.length === 0 ? (
                    <div className="u-empty">
                      <p className="u-empty__title">No posts from this user</p>
                      <p className="u-empty__note">
                        Posts this user creates on the board will be listed here.
                      </p>
                    </div>
                  ) : (
                    selectedUserPosts.map((post) => (
                      <button
                        key={post.id}
                        type="button"
                        onClick={() => handlePostClick(post)}
                        className={cn(
                          'prow',
                          sheetPost?.id === post.id && sheetOpen && 'is-open'
                        )}
                      >
                        <span className="prow__title">{post.title}</span>
                        {post.description && (
                          <span className="prow__excerpt">{post.description}</span>
                        )}
                        <span className="prow__meta">
                          <span className={cn('spill', STATUS_PILLS[post.status])}>
                            {STATUS_LABELS[post.status]}
                          </span>
                          {post.board && (
                            <span className="prow__board">{post.board.name}</span>
                          )}
                          <span className="prow__stat">
                            <ArrowUp aria-hidden="true" />
                            {post.upvotes}
                          </span>
                          <span className="prow__stat">
                            <MessageSquare aria-hidden="true" />
                            {post.comment_count}
                          </span>
                          <span className="prow__time">
                            {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                          </span>
                        </span>
                      </button>
                    ))
                  )}
                </div>

                {postsTotalPages > 1 && (
                  <div className="urail__foot">
                    <p className="urail__count">
                      <span>Page {postsPage} of {postsTotalPages}</span>
                    </p>
                    <div className="ustack">
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
          </section>

          {/* ── User dossier ───────────────────────────────────────── */}
          <aside className="udos" aria-label="User details">
            {!selectedUser ? (
              <div className="u-empty">
                <p className="u-empty__title">Select a user to view details</p>
              </div>
            ) : (
              <div className="udos__inner">
                <div className="udos__profile">
                  <span className={cn(getAvatarTint(selectedUser.name), 'uavatar--lg')} aria-hidden="true">
                    {getInitials(selectedUser.name)}
                  </span>
                  <h3 className="udos__name">{selectedUser.name || 'Anonymous'}</h3>
                  {selectedUser.email && (
                    <p className="udos__mail">{selectedUser.email}</p>
                  )}
                  <span
                    className={cn('spill', 'udos__identity', IDENTITY_PILLS[selectedUser.identity_type]?.pill)}
                  >
                    {IDENTITY_PILLS[selectedUser.identity_type]?.label || selectedUser.identity_type}
                  </span>
                </div>

                <div className="udos__figures">
                  {(
                    [
                      { label: 'Posts', value: selectedUser.posts_count },
                      { label: 'Upvotes', value: selectedUser.upvotes_given_count },
                      { label: 'Comments', value: selectedUser.comments_count },
                    ] as const
                  ).map((stat) => (
                    <div key={stat.label} className="udos__fig">
                      <div className="udos__fig-value">
                        {detailError ? (
                          '-'
                        ) : detailLoading && stat.value === undefined ? (
                          <Skeleton className="h-6 w-8" />
                        ) : (
                          stat.value ?? 0
                        )}
                      </div>
                      <p className="udos__fig-label">{stat.label}</p>
                    </div>
                  ))}
                </div>

                {detailError && (
                  <p className="udos__error">
                    <span>Couldn&apos;t load stats</span>
                    <button
                      type="button"
                      onClick={() => loadUserDetail(selectedUser.id)}
                    >
                      Retry
                    </button>
                  </p>
                )}

                <div className="udos__facts">
                  {selectedUser.external_user_id && (
                    <div className="udos__fact">
                      <ExternalLink aria-hidden="true" />
                      <div className="udos__fact-body">
                        <p className="udos__fact-label">External ID</p>
                        <p className="udos__fact-value is-mono">{selectedUser.external_user_id}</p>
                      </div>
                    </div>
                  )}
                  <div className="udos__fact">
                    <Calendar aria-hidden="true" />
                    <div className="udos__fact-body">
                      <p className="udos__fact-label">First Seen</p>
                      <p className="udos__fact-value">{formatDate(selectedUser.created_at)}</p>
                    </div>
                  </div>
                  <div className="udos__fact">
                    <Clock aria-hidden="true" />
                    <div className="udos__fact-body">
                      <p className="udos__fact-label">Last Seen</p>
                      {detailLoading && !selectedUser.last_seen_at ? (
                        <Skeleton className="h-4 w-20" />
                      ) : (
                        <p className="udos__fact-value">{formatDate(selectedUser.last_seen_at)}</p>
                      )}
                    </div>
                  </div>
                  {detailLoading && !selectedUser.verified_at && (
                    <div className="udos__fact">
                      <Shield aria-hidden="true" />
                      <div className="udos__fact-body">
                        <p className="udos__fact-label">Verified At</p>
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  )}
                  {!detailLoading && selectedUser.verified_at && (
                    <div className="udos__fact">
                      <Shield aria-hidden="true" />
                      <div className="udos__fact-body">
                        <p className="udos__fact-label">Verified At</p>
                        <p className="udos__fact-value">{formatDate(selectedUser.verified_at)}</p>
                      </div>
                    </div>
                  )}
                </div>

                {selectedUser.custom_fields && Object.keys(selectedUser.custom_fields).length > 0 && (
                  <>
                    <p className="udos__section">Custom Fields</p>
                    <div className="udos__fields">
                      {Object.entries(selectedUser.custom_fields).map(([key, value]) => (
                        <div key={key} className="udos__field">
                          <span className="udos__field-key">{key}</span>
                          <span className="udos__field-val">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <div className="udos__danger">
                  <Button
                    variant="outline"
                    size="sm"
                    className="btn--danger-quiet w-full"
                    onClick={() => setDeleteTarget(selectedUser)}
                  >
                    <Trash2 aria-hidden="true" />
                    Delete User
                  </Button>
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* ── Post Detail Sheet ──────────────────────────────────── */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent className="w-[70vw] sm:max-w-[70vw] p-0 overflow-hidden">
            <SheetHeader className="px-6 pt-5 pb-3 border-b border-border">
              <SheetTitle>Post Details</SheetTitle>
            </SheetHeader>
            <div className="u-sheetbody">
              {sheetPost && (
                <PostDetails
                  post={sheetPost}
                  currentBoard={sheetBoard}
                  onPostUpdated={handlePostUpdated}
                  onPostDeleted={handlePostDeleted}
                  onBack={() => setSheetOpen(false)}
                  className="pd pd--sheet"
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
