/* Hallmark · redesign: full · theme: brand (locked design.md) · scope: app · genre: modern-minimal
 * dropped onBoardClick={handleBoardClick} · the prop is not on LeftSidebarProps (baseline TS2322); the sidebar navigates internally
 * waive 56 · the pane sticky bands live in their own scroll containers and never overlap the portal header
 * waive 26a · feedback/[postId]/page.tsx is a server wrapper with no interactive elements; its rings live in the client component */
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Board } from "@/services/boardService";
import { Post } from "@/services/postService";
import { useBoardRealtime } from "@/hooks/useBoardRealtime";
import { useAuth } from "@/hooks/useAuth";
import {
  usePublicBoards,
  usePublicBoard,
  usePublicBoardPosts,
} from "@/hooks/useFeedbackData";

// Import components
import { LeftSidebar } from "@/components/feedback/LeftSidebar";
import { PostsList } from "@/components/feedback/PostsList";
import { PostDetails } from "@/components/feedback/PostDetails";
import { CreatePostDialog } from "@/components/feedback/CreatePostDialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle, LogIn, Plus, UserPlus } from "lucide-react";
import { IconDisplay } from "@/components/ui/icon-picker";
import { saveReturnUrl } from "@/lib/returnUrl";
import { useIsCustomHost } from "@/context/CustomHostContext";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://faddy.site";

export default function PublicBoardPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { toast } = useToast();
  const { user } = useAuth();
  const isCustomHost = useIsCustomHost();

  // ── SWR data ──
  const { boards: allBoards, isLoading: boardsLoading } = usePublicBoards();
  const { board: currentBoard, isLoading: boardLoading } = usePublicBoard(slug);
  const {
    posts: swrPosts,
    isLoading: postsLoading,
    refresh: refreshPosts,
    mutate: mutatePosts,
  } = usePublicBoardPosts(slug, {
    sortBy: "created_at",
    sortOrder: "desc",
  });

  // Public page only shows non-private boards
  const boards = allBoards.filter((b) => !b.is_private);

  // ── Local UI state ──
  const [posts, setPosts] = useState<Post[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedBoards, setSelectedBoards] = useState<string[]>([]);
  const [multiBoardError, setMultiBoardError] = useState<string | null>(null);

  // ── Filters ──
  const [filters, setFilters] = useState({
    status: "",
    search: "",
    startDate: "",
    endDate: "",
    sortBy: "created_at",
    sortOrder: "desc",
  });

  // ── Check private board access ──
  useEffect(() => {
    if (currentBoard?.is_private && !user) {
      if (isCustomHost) {
        // No session (or login page) exists on a custom host — send them to
        // the main app instead of a /login 404.
        window.location.href = `${APP_URL}/login`;
        return;
      }
      toast({
        title: "Private Board",
        description: "Please login to access this board",
        variant: "destructive",
      });
      saveReturnUrl();
      router.push("/login");
    }
  }, [currentBoard, user, toast, router, isCustomHost]);

  // ── Sync SWR posts → local filtered state ──
  useEffect(() => {
    if (postsLoading) {
      setLoading(true);
      return;
    }
    if (selectedBoards.length === 0) {
      setAllPosts(swrPosts);
      setPosts(applyFilters(swrPosts));
      setLoading(false);
    }
  }, [swrPosts, postsLoading, selectedBoards]);

  // ── Multi-board path ──
  useEffect(() => {
    if (selectedBoards.length === 0) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const { postService } = await import("@/services/postService");
        const boardsToFetch = boards.filter((b) => selectedBoards.includes(b.id));
        // Public route: resolves the board from the visited org (subdomain),
        // never the visitor's own org — /api/boards/:slug/posts is session-org
        // scoped and 404s for cross-org portal visitors.
        const results = await Promise.all(
          boardsToFetch.map((b) => postService.getPublicBoardPosts(b.slug)),
        );
        if (cancelled) return;
        const combined = results.flatMap((r) => r.data.posts);
        setAllPosts(combined);
        setPosts(applyFilters(combined));
      } catch {
        if (!cancelled) setMultiBoardError("Failed to load posts");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedBoards, boards, toast]);

  // ── Re-apply filters when filter state changes ──
  useEffect(() => {
    if (allPosts.length > 0) setPosts(applyFilters(allPosts));
  }, [filters, allPosts]);

  // ── Client-side filter logic ──
  function applyFilters(postsToFilter: Post[]) {
    let filtered = [...postsToFilter];
    if (filters.status)
      filtered = filtered.filter((p) => p.status === filters.status);
    if (filters.search) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q),
      );
    }
    if (filters.startDate)
      filtered = filtered.filter(
        (p) => new Date(p.created_at) >= new Date(filters.startDate),
      );
    if (filters.endDate)
      filtered = filtered.filter(
        (p) => new Date(p.created_at) <= new Date(filters.endDate),
      );
    filtered.sort((a, b) => {
      const av = a[filters.sortBy as keyof Post] ?? "";
      const bv = b[filters.sortBy as keyof Post] ?? "";
      return filters.sortOrder === "asc" ? (av > bv ? 1 : -1) : av < bv ? 1 : -1;
    });
    return filtered;
  }

  // ── Real-time updates ──
  useBoardRealtime({
    boardSlug: slug,
    onPostCreated: (post) => {
      setPosts((prev) => [post as Post, ...prev]);
      setAllPosts((prev) => [post as Post, ...prev]);
    },
    onPostDeleted: (postId) => {
      setPosts((prev) => prev.filter((p: any) => p.id !== postId));
      setAllPosts((prev) => prev.filter((p: any) => p.id !== postId));
    },
    onPostStatusChanged: (data) => {
      const patch = (arr: Post[]) =>
        arr.map((p: any) =>
          p.id === data.postId ? { ...p, status: data.newStatus } : p,
        );
      setPosts(patch);
      setAllPosts(patch);
    },
    onCommentCountChanged: (data) => {
      const patch = (arr: Post[]) =>
        arr.map((p: any) =>
          p.id === data.postId
            ? { ...p, comment_count: data.commentCount }
            : p,
        );
      setPosts(patch);
      setAllPosts(patch);
    },
    onPostUpvoted: (data) => {
      const patch = (arr: Post[]) =>
        arr.map((p: any) =>
          p.id === data.postId ? { ...p, upvotes: data.upvoteCount } : p,
        );
      setPosts(patch);
      setAllPosts(patch);
    },
  });

  // ── Create post — show auth modal if guest ──
  // Post-limit enforcement is the server's job (checkPostLimit on the VISITED
  // org). No client pre-check: the visitor's own org plan must never gate
  // posting on another org's board.
  const handleCreatePost = () => {
    if (!user) {
      if (isCustomHost) {
        window.location.href = `${APP_URL}/login`;
        return;
      }
      setShowAuthModal(true);
      return;
    }
    setShowCreatePost(true);
  };

  // ── Post CRUD handlers ──
  const handlePostCreated = (post: Post) => {
    setSelectedPost(post);
    setShowCreatePost(false);
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
    refreshPosts();
    toast({ title: "Success!", description: "Post created successfully" });
  };

  // Board's own color is brand data (not a Tailwind palette class) — used
  // only for the header icon medallion tint.
  const boardColor = (currentBoard as (Board & { color?: string }) | null)
    ?.color;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background text-foreground">
      {/* Board header — icon + name + description, create affordance right */}
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {currentBoard && (
            <>
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary"
                style={boardColor ? { backgroundColor: boardColor + "20" } : undefined}
              >
                <IconDisplay
                  iconName={currentBoard.icon}
                  className="h-5 w-5"
                  style={boardColor ? { color: boardColor } : undefined}
                />
              </span>
              <div className="min-w-0">
                <h1 className="truncate font-headline text-xl font-semibold tracking-tight text-foreground">
                  {currentBoard.name}
                </h1>
                {currentBoard.description && (
                  <p className="truncate text-sm text-muted-foreground">
                    {currentBoard.description}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
        <Button
          variant="outline"
          onClick={handleCreatePost}
          className="h-9 shrink-0 gap-2 border-border px-4 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:ring-2 focus-visible:ring-offset-2"
        >
          <Plus className="h-4 w-4" />
          <span className="max-sm:hidden">Create Post</span>
          <span className="sm:hidden">Create</span>
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <LeftSidebar
          boards={boards}
          currentBoardSlug={slug}
          filters={filters}
          onFilterChange={setFilters}
          selectedBoards={selectedBoards}
          onBoardSelectionChange={setSelectedBoards}
          onCreateBoard={(board) => {
            refreshPosts();
            toast({
              title: "Success!",
              description: `Board "${board.name}" created successfully`,
            });
          }}
          onDeleteBoard={() => {}}
        />

        {/* Multi-board fetch error banner */}
        {multiBoardError && (
          <div className="fixed left-1/2 top-4 z-50 max-w-md -translate-x-1/2">
            <div className="flex items-center gap-2 rounded-lg border border-destructive/25 bg-destructive/10 p-3 shadow-lg">
              <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
              <p className="text-sm font-medium text-destructive">
                {multiBoardError}
              </p>
            </div>
          </div>
        )}

        {/* Middle - Posts List */}
        <PostsList
          posts={posts}
          selectedPost={selectedPost}
          loading={loading}
          currentBoard={currentBoard}
          onPostSelect={setSelectedPost}
          onCreatePost={handleCreatePost}
          onSearchChange={(search) => setFilters({ ...filters, search })}
        />

        {/* Right - Post Details */}
        <PostDetails
          post={selectedPost}
          currentBoard={currentBoard}
          onPostUpdated={(updatedPost) => {
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
            setAllPosts((prev) =>
              prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)),
            );
            setPosts((prev) =>
              prev.map((p) => (p.id === updatedPost.id ? updatedPost : p)),
            );
            refreshPosts();
          }}
          onPostDeleted={(postId) => {
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
          }}
          onAuthRequired={() => setShowAuthModal(true)}
        />
      </div>

      {/* Create Post Dialog */}
      {user && (
        <CreatePostDialog
          open={showCreatePost}
          onOpenChange={setShowCreatePost}
          boardSlug={slug}
          onPostCreated={handlePostCreated}
        />
      )}

      {/* Auth Modal for Guests */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-center font-headline text-2xl font-semibold tracking-tight">
              Join the Conversation
            </DialogTitle>
            <DialogDescription className="text-center text-sm leading-relaxed">
              Create an account or sign in to post feedback, vote, and comment.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-4">
            <Button
              onClick={() => {
                saveReturnUrl();
                router.push("/signup");
              }}
              size="lg"
              className="h-12 w-full gap-2 text-base transition-colors"
            >
              <UserPlus className="h-5 w-5" />
              Create Account
            </Button>

            <Button
              onClick={() => {
                saveReturnUrl();
                router.push("/login");
              }}
              variant="outline"
              size="lg"
              className="h-12 w-full gap-2 border-border text-base transition-colors"
            >
              <LogIn className="h-5 w-5" />
              Sign In
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            You can browse all public boards as a guest.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
