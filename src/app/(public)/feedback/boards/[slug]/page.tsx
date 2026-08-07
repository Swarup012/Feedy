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
import { UpgradeDialog } from "@/components/UpgradeDialog";
import usageService from "@/services/usageService";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LogIn, UserPlus } from "lucide-react";
import { saveReturnUrl } from "@/lib/returnUrl";

export default function PublicBoardPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { toast } = useToast();
  const { user } = useAuth();

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

  // ── Pre-load usage data (only if authenticated) ──
  useEffect(() => {
    if (!user || !slug) return;
    usageService.canCreatePost(slug).then(({ allowed, reason }) => {
      setCanCreatePost(allowed);
      if (!allowed && reason) setPostLimitReason(reason);
    });
  }, [posts.length, user, slug]);

  // ── Check private board access ──
  useEffect(() => {
    if (currentBoard?.is_private && !user) {
      toast({
        title: "Private Board",
        description: "Please login to access this board",
        variant: "destructive",
      });
      saveReturnUrl();
      router.push("/login");
    }
  }, [currentBoard, user, toast, router]);

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
        const results = await Promise.all(
          boardsToFetch.map((b) =>
            postService.getPostsByBoard(b.slug, {
              sortBy: "created_at",
              sortOrder: "desc",
            }),
          ),
        );
        if (cancelled) return;
        const combined = results.flatMap((r) => r.data.posts);
        setAllPosts(combined);
        setPosts(applyFilters(combined));
      } catch {
        if (!cancelled)
          toast({
            title: "Error",
            description: "Failed to load posts",
            variant: "destructive",
          });
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
      const av = a[filters.sortBy as keyof Post];
      const bv = b[filters.sortBy as keyof Post];
      return filters.sortOrder === "asc" ? (av > bv ? 1 : -1) : av < bv ? 1 : -1;
    });
    return filtered;
  }

  // ── Real-time updates ──
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

  // ── Board navigation ──
  const handleBoardClick = (boardSlug: string) => {
    router.push(`/feedback/boards/${boardSlug}`);
  };

  // ── Create post — show auth modal if guest ──
  const handleCreatePost = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (!canCreatePost) {
      setShowUpgradeDialog(true);
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

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-background">
      {/* Left Sidebar */}
      <LeftSidebar
        boards={boards}
        currentBoardSlug={slug}
        onBoardClick={handleBoardClick}
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

      {/* Create Post Dialog */}
      {user && (
        <CreatePostDialog
          open={showCreatePost}
          onOpenChange={setShowCreatePost}
          boards={boards}
          defaultBoardId={currentBoard?.id}
          onPostCreated={handlePostCreated}
        />
      )}

      {/* Auth Modal for Guests */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md dark:bg-background dark:border-border">
          <DialogHeader>
            <DialogTitle className="text-2xl font-switzer font-medium text-center dark:text-white">
              Join the Conversation
            </DialogTitle>
            <DialogDescription className="text-center text-base dark:text-gray-400">
              Create an account or sign in to post feedback, vote, and comment
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 py-4">
            <Button
              onClick={() => {
                saveReturnUrl();
                router.push("/signup");
              }}
              size="lg"
              className="w-full text-lg h-12"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Create Account
            </Button>

            <Button
              onClick={() => {
                saveReturnUrl();
                router.push("/login");
              }}
              variant="outline"
              size="lg"
              className="w-full text-lg h-12 dark:bg-card dark:border-border dark:text-white dark:hover:bg-gray-700"
            >
              <LogIn className="mr-2 h-5 w-5" />
              Sign In
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            You can browse all public boards as a guest
          </div>
        </DialogContent>
      </Dialog>

      {/* Upgrade Dialog for Post Limit */}
      <UpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        limitType="posts"
        message={
          postLimitReason ||
          "This board has reached its post limit. Upgrade to Starter for unlimited posts."
        }
      />
    </div>
  );
}
