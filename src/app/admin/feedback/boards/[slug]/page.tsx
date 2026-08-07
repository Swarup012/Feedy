"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useToast } from "@/hooks/use-toast";
import { Board, boardService } from "@/services/boardService";
import { Post, postService } from "@/services/postService";
import { useBoardRealtime } from "@/hooks/useBoardRealtime";
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
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedBoards, setSelectedBoards] = useState<string[]>([]);
  const [canCreatePost, setCanCreatePost] = useState(true);
  const [postLimitReason, setPostLimitReason] = useState<string>("");

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
      setAllPosts(swrPosts);
      setPosts(applyFilters(swrPosts));
      setLoading(false);
    }
  }, [swrPosts, postsLoading, selectedBoards]);

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

  // ── Client-side filter logic ──
  function applyFilters(postsToFilter: Post[]) {
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
  }

  // ── Real-time board updates ──
  useBoardRealtime({
    boardSlug: slug,
    onPostCreated: (post) => {
      setPosts((prev) => [post, ...prev]);
      setAllPosts((prev) => [post, ...prev]);
    },
    onPostDeleted: (postId) => {
      setPosts((prev) => prev.filter((p: any) => p.id !== postId));
      setAllPosts((prev) => prev.filter((p: any) => p.id !== postId));
    },
    onPostStatusChanged: (data) => {
      const patch = (arr: Post[]) =>
        arr.map((p: any) => (p.id === data.postId ? { ...p, status: data.newStatus } : p));
      setPosts(patch);
      setAllPosts(patch);
    },
    onCommentCountChanged: (data) => {
      const patch = (arr: Post[]) =>
        arr.map((p: any) =>
          p.id === data.postId ? { ...p, comment_count: data.commentCount } : p,
        );
      setPosts(patch);
      setAllPosts(patch);
    },
    onPostUpvoted: (data) => {
      const patch = (arr: Post[]) =>
        arr.map((p: any) => (p.id === data.postId ? { ...p, upvotes: data.upvoteCount } : p));
      setPosts(patch);
      setAllPosts(patch);
    },
  });

  // ── Post CRUD handlers ────────────────────────────────────────────────
  // Uses mutatePosts (instant SWR cache write) instead of refreshPosts
  // (network revalidation) so the UI updates in < 50 ms.
  const handlePostCreated = (post: Post) => {
    setSelectedPost(post);
    setShowCreatePost(false);
    // Instant SWR cache update (no network round-trip)
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
    // Sync local filtered state (used by multi-board path + client filters)
    setAllPosts((prev) => [post, ...prev]);
    setPosts((prev) => [post, ...prev]);
    // Background revalidation to catch any server-side side-effects
    refreshPosts();
    toast({ title: "Success!", description: "Post created successfully" });
  };

  const handlePostSelect = (post: Post) => setSelectedPost(post);

  const handlePostUpdated = (updatedPost: Post) => {
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
    refreshPosts();
  };

  const handlePostDeleted = (postId: string) => {
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
    refreshPosts();
  };

  return (
    <ProtectedRoute allowedRoles={["owner", "admin", "member"]}>
      <div className="flex h-full overflow-hidden bg-white">
        {/* LEFT SIDEBAR - Boards & Filters */}
        <LeftSidebar
          boards={boards}
          currentBoardSlug={slug}
          filters={filters}
          onFilterChange={setFilters}
          onCreateBoard={(newBoard) => {
            refreshBoards();
            toast({
              title: "Success!",
              description: `Board "${newBoard.name}" created successfully`,
            });
          }}
          onDeleteBoard={() => refreshBoards()}
          selectedBoards={selectedBoards}
          onBoardSelectionChange={setSelectedBoards}
        />

        {/* MIDDLE - Posts List */}
        <PostsList
          posts={posts}
          selectedPost={selectedPost}
          loading={loading}
          currentBoard={currentBoard}
          onPostSelect={handlePostSelect}
          onCreatePost={() => {
            if (!canCreatePost) setShowUpgradeDialog(true);
            else setShowCreatePost(true);
          }}
          onSearchChange={(search) => setFilters({ ...filters, search })}
        />

        {/* RIGHT - Post Details */}
        <PostDetails
          post={selectedPost}
          currentBoard={currentBoard}
          onPostUpdated={handlePostUpdated}
          onPostDeleted={handlePostDeleted}
        />

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
