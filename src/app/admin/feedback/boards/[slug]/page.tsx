"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useToast } from "@/hooks/use-toast";
import { Board, boardService } from "@/services/boardService";
import { Post, postService } from "@/services/postService";
import { useBoards, useBoard, useBoardPosts } from "@/hooks/useFeedbackData";

// Import components
import { LeftSidebar } from "@/components/feedback/LeftSidebar";
import { PostsList } from "@/components/feedback/PostsList";
import { PostDetails } from "@/components/feedback/PostDetails";
import { CreatePostDialog } from "@/components/feedback/CreatePostDialog";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import usageService from "@/services/usageService";

export default function BoardPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { toast } = useToast();

  // ── SWR data (replaces boardsCache / currentBoardCache / postsCache) ──
  const { boards, isLoading: boardsLoading, refresh: refreshBoards } = useBoards();
  const { board: currentBoard, isLoading: boardLoading } = useBoard(slug);
  const { posts: swrPosts, isLoading: postsLoading, refresh: refreshPosts, mutate: mutatePosts } = useBoardPosts(slug, {
    sortBy: "created_at",
    sortOrder: "desc",
  });

  // ── Local UI state ──
  const [posts, setPosts] = useState<Post[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  // Track optimistic post IDs that SWR revalidation may not yet include
  const pendingOptimisticIds = useRef(new Set<string>());
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedBoards, setSelectedBoards] = useState<string[]>([]);
  const [canCreatePost, setCanCreatePost] = useState(true);
  const [postLimitReason, setPostLimitReason] = useState<string>("");
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");
  const [showSidebar, setShowSidebar] = useState(false);

  // ── Filters ──
  const [filters, setFilters] = useState({
    status: "",
    search: "",
    startDate: "",
    endDate: "",
    sortBy: "created_at",
    sortOrder: "desc",
  });

  // ── Pre-load usage data ──
  useEffect(() => {
    if (!slug) return;
    usageService.canCreatePost(slug).then(({ allowed, reason }) => {
      setCanCreatePost(allowed);
      if (!allowed && reason) setPostLimitReason(reason);
    });
  }, [posts.length, slug]);

  // ── Save last-visited board for redirect ──
  useEffect(() => {
    if (slug) localStorage.setItem("lastVisitedBoard", slug);
  }, [slug]);

  // ── Sync SWR posts → local filtered state ──
  useEffect(() => {
    if (postsLoading) {
      setLoading(true);
      return;
    }
    // Single-board path: derive from SWR data
    if (selectedBoards.length === 0) {
      // Merge: keep any optimistic posts that revalidation hasn't confirmed yet
      const pending = [...pendingOptimisticIds.current];
      const serverIds = new Set(swrPosts.map((p) => p.id));
      const unconfirmed = pending.filter((id) => !serverIds.has(id));
      const merged = unconfirmed.length > 0
        ? [...swrPosts, ...unconfirmed
            .map((id) => posts.find((p) => p.id === id))
            .filter(Boolean) as Post[]]
        : swrPosts;
      // Remove from pending once confirmed by server
      for (const id of pending) {
        if (serverIds.has(id)) pendingOptimisticIds.current.delete(id);
      }
      setAllPosts(merged);
      setPosts(applyFilters(merged));
      setLoading(false);
    }
  }, [swrPosts, postsLoading, selectedBoards]);

  // ── Expire stale optimistic entries after 30s ──
  useEffect(() => {
    if (pendingOptimisticIds.current.size === 0) return;
    const timer = setTimeout(() => {
      pendingOptimisticIds.current.clear();
    }, 30_000);
    return () => clearTimeout(timer);
  }, [posts.length]);

  // ── Multi-board path: manual fetch when board selection changes ──
  useEffect(() => {
    if (selectedBoards.length === 0) return; // single-board handled by SWR
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const boardsToFetch = boards.filter((b) => selectedBoards.includes(b.id));
        const results = await Promise.all(
          boardsToFetch.map((b) =>
            postService.getPostsByBoard(b.slug, { sortBy: "created_at", sortOrder: "desc" }),
          ),
        );
        if (cancelled) return;
        const combined = results.flatMap((r) => r.data.posts);
        setAllPosts(combined);
        setPosts(applyFilters(combined));
      } catch {
        if (!cancelled)
          toast({ title: "Error", description: "Failed to load posts", variant: "destructive" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedBoards, boards, toast]);

  // ── Re-apply client-side filters when filter state changes ──
  useEffect(() => {
    if (allPosts.length > 0) setPosts(applyFilters(allPosts));
  }, [filters, allPosts]);

  // ── Client-side filter logic (memoized) ──
  const applyFilters = useCallback((postsToFilter: Post[]) => {
    let filtered = [...postsToFilter];
    if (filters.status) filtered = filtered.filter((p) => p.status === filters.status);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) => p.title.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q),
      );
    }
    if (filters.startDate)
      filtered = filtered.filter((p) => new Date(p.created_at) >= new Date(filters.startDate));
    if (filters.endDate)
      filtered = filtered.filter((p) => new Date(p.created_at) <= new Date(filters.endDate));
    filtered.sort((a, b) => {
      const av = a[filters.sortBy as keyof Post];
      const bv = b[filters.sortBy as keyof Post];
      return filters.sortOrder === "asc" ? (av > bv ? 1 : -1) : av < bv ? 1 : -1;
    });
    return filtered;
  }, [filters]);

  // ── Post CRUD handlers (memoized) ────────────────────────────────────────
  const handlePostCreated = useCallback((post: Post) => {
    setSelectedPost(post);
    setShowCreatePost(false);
    pendingOptimisticIds.current.add(post.id);
    mutatePosts((current) => {
      if (!current) return current;
      return {
        ...current,
        data: {
          ...current.data,
          posts: [post, ...current.data.posts],
          count: current.data.count + 1,
        },
      };
    }, { revalidate: false });
    setAllPosts((prev) => [post, ...prev]);
    setPosts((prev) => [post, ...prev]);
    toast({ title: "Post created" });
  }, [mutatePosts, toast]);

  const handlePostSelect = useCallback((post: Post) => {
    setSelectedPost(post);
    setMobileView("detail");
  }, []);

  const handleBackToList = useCallback(() => {
    setMobileView("list");
  }, []);

  const handlePostUpdated = useCallback((updatedPost: Post) => {
    setSelectedPost(updatedPost);
    mutatePosts((current) => {
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
    }, { revalidate: false });
    setAllPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
    setPosts((prev) => prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
  }, [mutatePosts]);

  const handlePostDeleted = useCallback((postId: string) => {
    setSelectedPost(null);
    mutatePosts((current) => {
      if (!current) return current;
      return {
        ...current,
        data: {
          ...current.data,
          posts: current.data.posts.filter((p) => p.id !== postId),
          count: current.data.count - 1,
        },
      };
    }, { revalidate: false });
    setAllPosts((prev) => prev.filter((p) => p.id !== postId));
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, [mutatePosts]);

  const handleCreateBoard = useCallback((newBoard: any) => {
    refreshBoards();
    setShowSidebar(false);
    toast({
      title: "Board created",
      description: `"${newBoard.name}" is ready to use.`,
    });
  }, [refreshBoards, toast]);

  const handleDeleteBoard = useCallback(() => {
    refreshBoards();
    setShowSidebar(false);
  }, [refreshBoards]);

  const handleCreatePost = useCallback(() => {
    if (!canCreatePost) setShowUpgradeDialog(true);
    else setShowCreatePost(true);
  }, [canCreatePost]);

  const handleSearchChange = useCallback((search: string) => {
    setFilters((prev) => ({ ...prev, search }));
  }, []);

  return (
    <ProtectedRoute allowedRoles={["owner", "admin", "member"]}>
      <div className="flex h-full overflow-hidden bg-white">
        {/* ── Sidebar: overlay on mobile, persistent on desktop ── */}
        <div className={`
          max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-40
          max-md:transition-transform max-md:duration-300 max-md:ease-in-out
          ${showSidebar ? "max-md:translate-x-0" : "max-md:-translate-x-full"}
          md:relative md:translate-x-0
        `}>
          <LeftSidebar
            boards={boards}
            currentBoardSlug={slug}
            filters={filters}
            onFilterChange={setFilters}
            onCreateBoard={handleCreateBoard}
            onDeleteBoard={handleDeleteBoard}
            selectedBoards={selectedBoards}
            onBoardSelectionChange={setSelectedBoards}
          />
        </div>

        {/* ── Sidebar backdrop on mobile ── */}
        {showSidebar && (
          <div
            className="max-md:fixed max-md:inset-0 max-md:z-30 max-md:bg-black/40 max-md:backdrop-blur-sm"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* ── Posts List: hidden when viewing detail on mobile ── */}
        <div className={`
          max-md:absolute max-md:inset-0 max-md:z-10
          ${mobileView === "detail" ? "max-md:hidden" : "max-md:block"}
          md:block md:relative md:flex-shrink-0
        `}>
          <PostsList
            posts={posts}
            selectedPost={selectedPost}
            loading={loading}
            currentBoard={currentBoard}
            onPostSelect={handlePostSelect}
            onCreatePost={handleCreatePost}
            onSearchChange={handleSearchChange}
            onMenuClick={() => setShowSidebar(true)}
            isMobile
          />
        </div>

        {/* ── Post Details: full-width overlay on mobile when viewing ── */}
        <div className={`
          max-md:absolute max-md:inset-0 max-md:z-20
          ${mobileView === "detail" ? "max-md:block" : "max-md:hidden"}
          md:block md:flex-1 md:min-w-0
        `}>
          <PostDetails
            post={selectedPost}
            currentBoard={currentBoard}
            onPostUpdated={handlePostUpdated}
            onPostDeleted={handlePostDeleted}
            onBack={handleBackToList}
            isMobile
          />
        </div>

        {/* Create Post Dialog */}
        <CreatePostDialog
          open={showCreatePost}
          onOpenChange={setShowCreatePost}
          boardSlug={slug}
          onPostCreated={handlePostCreated}
        />

        {/* Upgrade Dialog for Post Limit */}
        <UpgradeDialog
          open={showUpgradeDialog}
          onOpenChange={setShowUpgradeDialog}
          limitType="posts"
          message={
            postLimitReason ||
            "You've reached your post limit for this board. Upgrade to Starter for unlimited posts."
          }
        />
      </div>
    </ProtectedRoute>
  );
}
