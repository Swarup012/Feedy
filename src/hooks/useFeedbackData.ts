/**
 * SWR hooks for the feedback board page.
 *
 * These replace the old module-level in-memory caches (postsCache,
 * boardsCache, currentBoardCache) with SWR — backed by the backend
 * Redis caching (120 s TTL, invalidate-on-write, org-scoped keys).
 *
 * Key conventions:
 *   /api/boards           → org-scoped board list (backend filters by JWT org)
 *   /api/boards/:slug     → single board detail
 *   /api/boards/:slug/posts → posts for a board
 */

import useSWR, { mutate } from "swr";
import api from "@/lib/api";
import type { Board } from "@/services/boardService";
import type { Post } from "@/services/postService";

// ── Shared fetcher ─────────────────────────────────────────────────────
// Uses the existing axios instance so cookies, auth, and the x-subdomain
// header are attached automatically.
const fetcher = async (url: string) => {
  const response = await api.get(url);
  return response.data;
};

// ── Response shapes (mirror the backend) ───────────────────────────────
interface BoardsResponse {
  success: boolean;
  data: { boards: Board[]; count: number };
}

interface BoardResponse {
  success: boolean;
  data: { board: Board };
}

interface PostsResponse {
  success: boolean;
  data: { posts: Post[]; count: number };
}

// ── Board list ─────────────────────────────────────────────────────────
// SWR key: "/api/boards"
// Backend scopes to the user's org via JWT session.
// Defaults: revalidateOnFocus + revalidateOnReconnect ON (backend cache
// keeps repeat requests cheap).
export function useBoards() {
  const { data, error, isLoading, mutate } = useSWR<BoardsResponse>(
    "/api/boards",
    fetcher,
  );

  return {
    boards: data?.data?.boards ?? [],
    count: data?.data?.count ?? 0,
    error,
    isLoading,
    /** Re-fetch boards from backend (e.g. after create/delete). */
    refresh: () => mutate(),
  };
}

// ── Board detail by slug ───────────────────────────────────────────────
// SWR key: "/api/boards/:slug"  (null when slug is absent → no fetch)
export function useBoard(slug: string | null) {
  const { data, error, isLoading } = useSWR<BoardResponse>(
    slug ? `/api/boards/${slug}` : null,
    fetcher,
  );

  return {
    board: data?.data?.board ?? null,
    error,
    isLoading,
  };
}

// ── Posts for a board ──────────────────────────────────────────────────
// SWR key: "/api/boards/:slug/posts"
// Caller can pass the same query params the old getPostsByBoard accepted.
export function useBoardPosts(
  slug: string | null,
  filters?: {
    sortBy?: string;
    sortOrder?: string;
    status?: string;
    search?: string;
  },
) {
  // Build a stable key that includes the filter params so SWR re-fetches
  // when filters change, but deduplicates identical requests.
  const key = slug
    ? `/api/boards/${slug}/posts?${new URLSearchParams(
        Object.entries(filters ?? {}).filter(([, v]) => !!v) as [
          string,
          string,
        ][],
      ).toString()}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<PostsResponse>(
    key,
    fetcher,
    { refreshInterval: 10_000 },
  );

  return {
    posts: data?.data?.posts ?? [],
    count: data?.data?.count ?? 0,
    error,
    isLoading,
    /** Re-fetch posts from backend. */
    refresh: () => mutate(),
    /** Direct mutate access for optimistic updates (used later). */
    mutate,
  };
}

// ── Public board hooks (no auth required) ──────────────────────────────
// These use the /api/public/ endpoints for unauthenticated users.

export function usePublicBoards() {
  const { data, error, isLoading, mutate } = useSWR<BoardsResponse>(
    "/api/public/boards",
    fetcher,
  );

  return {
    boards: data?.data?.boards ?? [],
    count: data?.data?.count ?? 0,
    error,
    isLoading,
    refresh: () => mutate(),
  };
}

export function usePublicBoard(slug: string | null) {
  const { data, error, isLoading } = useSWR<BoardResponse>(
    slug ? `/api/public/boards/${slug}` : null,
    fetcher,
  );

  return {
    board: data?.data?.board ?? null,
    error,
    isLoading,
  };
}

export function usePublicBoardPosts(
  slug: string | null,
  filters?: {
    sortBy?: string;
    sortOrder?: string;
    status?: string;
    search?: string;
  },
) {
  const key = slug
    ? `/api/public/boards/${slug}/posts?${new URLSearchParams(
        Object.entries(filters ?? {}).filter(([, v]) => !!v) as [
          string,
          string,
        ][],
      ).toString()}`
    : null;

  const { data, error, isLoading, mutate } = useSWR<PostsResponse>(
    key,
    fetcher,
    { refreshInterval: 10_000 },
  );

  return {
    posts: data?.data?.posts ?? [],
    count: data?.data?.count ?? 0,
    error,
    isLoading,
    refresh: () => mutate(),
    mutate,
  };
}

// ── Member dashboard (org-scoped keys) ─────────────────────────────────

/** Shape returned by GET /api/dashboard/my-overview (data field). */
export interface MyOverviewStats {
  myPosts: number;
  newThisMonth: number;
  votesReceived: number;
  votesThisWeek: number;
  pipeline: {
    open: number;
    underReview: number;
    planned: number;
    inProgress: number;
    shipped: number;
    closed: number;
  };
  shippedPercent: number;
}

export interface MyOverviewUpdate {
  type: "status_change" | "reply";
  post_id: string;
  post_title: string | null;
  old_status?: string;
  new_status?: string;
  excerpt?: string;
  actor_name: string | null;
  is_admin?: boolean;
  created_at: string;
}

export interface MyOverviewResponse {
  success: boolean;
  data: {
    stats: MyOverviewStats;
    posts: Post[];
    updates: MyOverviewUpdate[];
  };
}

export interface TrendingPostsResponse {
  success: boolean;
  data: { posts: Post[]; count: number };
}

// Fetchers for the array-key hooks: SWR spreads array keys as arguments,
// so the org id rides along purely as a cache discriminator. The BACKEND
// never reads it from the query string — it resolves the org from the
// session/subdomain and verifies membership server-side.
const keyFetcher = async ([url]: [string, string]) => {
  const response = await api.get(url);
  return response.data;
};

/**
 * Member dashboard overview (stats + posts + updates timeline).
 * The SWR key embeds the active organization id, so switching orgs
 * refetches and never serves another org's cached data.
 */
export function useMyOverview(orgId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR<MyOverviewResponse>(
    orgId ? ["/api/dashboard/my-overview", orgId] : null,
    keyFetcher,
  );

  return {
    stats: data?.data?.stats ?? null,
    posts: data?.data?.posts ?? [],
    updates: data?.data?.updates ?? [],
    error,
    isLoading,
    refresh: () => mutate(),
  };
}

/**
 * Top public-board posts by votes (trending widget).
 * Org-scoped SWR key — see useMyOverview for the rationale.
 */
export function useTrendingPosts(orgId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR<TrendingPostsResponse>(
    orgId ? ["/api/public/trending-posts?limit=3", orgId] : null,
    keyFetcher,
  );

  return {
    posts: data?.data?.posts ?? [],
    error,
    isLoading,
    refresh: () => mutate(),
  };
}

// ── Optimistic helpers (for post CRUD — wired up in next step) ─────────
// These are exported so the board page can call them after the API call.
// They manipulate the SWR cache directly, no extra network requests.

/**
 * Optimistically prepend a new post to the board's SWR cache entry,
 * then revalidate in the background once the server confirms.
 */
export function optimisticCreatePost(
  slug: string,
  newPost: Post,
  apiCall: () => Promise<Post>,
) {
  const key = `/api/boards/${slug}/posts`;

  mutate(
    key,
    (current: PostsResponse | undefined) => {
      if (!current) return current;
      return {
        ...current,
        data: {
          ...current.data,
          posts: [newPost, ...current.data.posts],
          count: current.data.count + 1,
        },
      };
    },
    { revalidate: false },
  );

  return apiCall()
    .then((serverPost) => {
      // Replace optimistic entry with server truth, then revalidate
      mutate(key);
      return serverPost;
    })
    .catch((err) => {
      // Roll back: remove the optimistic entry and revalidate from server
      mutate(key);
      throw err;
    });
}

/**
 * Optimistically update a post in the board's SWR cache entry.
 */
export function optimisticUpdatePost(
  slug: string,
  updatedPost: Post,
  apiCall: () => Promise<Post>,
) {
  const key = `/api/boards/${slug}/posts`;

  mutate(
    key,
    (current: PostsResponse | undefined) => {
      if (!current) return current;
      return {
        ...current,
        data: {
          ...current.data,
          posts: current.data.posts.map((p) =>
            p.id === updatedPost.id ? updatedPost : p,
          ),
        },
      };
    },
    { revalidate: false },
  );

  return apiCall()
    .then((serverPost) => {
      mutate(key);
      return serverPost;
    })
    .catch((err) => {
      mutate(key);
      throw err;
    });
}

/**
 * Optimistically remove a post from the board's SWR cache entry.
 */
export function optimisticDeletePost(
  slug: string,
  postId: string,
  apiCall: () => Promise<void>,
) {
  const key = `/api/boards/${slug}/posts`;

  mutate(
    key,
    (current: PostsResponse | undefined) => {
      if (!current) return current;
      return {
        ...current,
        data: {
          ...current.data,
          posts: current.data.posts.filter((p) => p.id !== postId),
          count: current.data.count - 1,
        },
      };
    },
    { revalidate: false },
  );

  return apiCall()
    .then(() => {
      mutate(key);
    })
    .catch((err) => {
      mutate(key);
      throw err;
    });
}
