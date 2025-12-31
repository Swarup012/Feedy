"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Board, boardService } from "@/services/boardService";
import { Post, postService } from "@/services/postService";
import { useBoardRealtime } from "@/hooks/useBoardRealtime";
import { useAuth } from "@/hooks/useAuth";

// Import components
import { LeftSidebar } from "@/components/feedback/LeftSidebar";
import { PostsList } from "@/components/feedback/PostsList";
import { PostDetails } from "@/components/feedback/PostDetails";
import { CreatePostDialog } from "@/components/feedback/CreatePostDialog";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import usageService from "@/services/usageService";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LogIn, UserPlus } from "lucide-react";

// 🔥 GLOBAL in-memory cache
const postsCache: Record<string, Post[]> = {};
let boardsCache: Board[] | null = null;
const currentBoardCache: Record<string, Board> = {};

export default function PublicBoardPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const { toast } = useToast();
  const { user } = useAuth();

  const [boards, setBoards] = useState<Board[]>([]);
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  
  const cachedPosts = postsCache[slug];
  const cachedBoards = boardsCache;
  const cachedCurrentBoard = currentBoardCache[slug];
  
  const [loading, setLoading] = useState(() => !cachedPosts || cachedPosts.length === 0);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedBoards, setSelectedBoards] = useState<string[]>([]);
  
  // Pre-load post creation limits for instant popup
  const [canCreatePost, setCanCreatePost] = useState(true);
  const [postLimitReason, setPostLimitReason] = useState<string>("");
  
  // Track if we're currently fetching to prevent duplicate calls
  const isFetchingPosts = useRef(false);

  // Pre-load usage data on component mount (only if user is authenticated)
  useEffect(() => {
    if (!user) return; // Skip if not logged in
    
    const loadUsage = async () => {
      const { allowed, reason } = await usageService.canCreatePost();
      setCanCreatePost(allowed);
      if (!allowed && reason) {
        setPostLimitReason(reason);
      }
    };
    loadUsage();
  }, [posts.length, user]); // Re-check when posts change or user logs in

  // Filters
  const [filters, setFilters] = useState({
    status: "",
    search: "",
    startDate: "",
    endDate: "",
    sortBy: "created_at",
    sortOrder: "desc",
  });

  // 🚀 INSTANT LOAD: Populate from cache
  useEffect(() => {
    if (cachedBoards && cachedBoards.length > 0 && boards.length === 0) {
      setBoards(cachedBoards.filter(b => !b.is_private)); // Only show public boards
    }
    
    if (cachedCurrentBoard && !currentBoard) {
      setCurrentBoard(cachedCurrentBoard);
    }
    
    if (cachedPosts && cachedPosts.length > 0 && posts.length === 0) {
      setAllPosts(cachedPosts);
      setPosts(cachedPosts);
      setLoading(false);
    }
  }, [slug]);

  // Real-time updates
  useBoardRealtime({
    boardSlug: slug,
    onPostCreated: (post) => {
      setPosts((prev: any) => [post, ...prev]);
      setAllPosts((prev: any) => [post, ...prev]);
    },
    onPostDeleted: (postId) => {
      setPosts((prev: any) => prev.filter((p: any) => p.id !== postId));
      setAllPosts((prev: any) => prev.filter((p: any) => p.id !== postId));
    },
    onPostStatusChanged: (data) => {
      setPosts((prev: any) => prev.map((p: any) => 
        p.id === data.postId ? { ...p, status: data.newStatus } : p
      ));
      setAllPosts((prev: any) => prev.map((p: any) => 
        p.id === data.postId ? { ...p, status: data.newStatus } : p
      ));
    },
    onCommentCountChanged: (data) => {
      setPosts((prev: any) => prev.map((p: any) => 
        p.id === data.postId ? { ...p, comment_count: data.commentCount } : p
      ));
      setAllPosts((prev: any) => prev.map((p: any) => 
        p.id === data.postId ? { ...p, comment_count: data.commentCount } : p
      ));
    },
    onPostUpvoted: (data) => {
      setPosts((prev: any) => prev.map((p: any) => 
        p.id === data.postId ? { ...p, upvotes: data.upvoteCount } : p
      ));
      setAllPosts((prev: any) => prev.map((p: any) => 
        p.id === data.postId ? { ...p, upvotes: data.upvoteCount } : p
      ));
    },
  });

  // Fetch all PUBLIC boards
  const fetchBoards = async () => {
    try {
      if (boardsCache && boardsCache.length > 0) {
        const publicBoards = boardsCache.filter(b => !b.is_private);
        setBoards(publicBoards);
        
        // Background refresh
        boardService.getPublicBoards()
          .then(response => {
            const freshBoards = response.data.boards;
            boardsCache = freshBoards;
            setBoards(freshBoards);
          })
          .catch(console.error);
        return;
      }

      const response = await boardService.getPublicBoards();
      const fetchedBoards = response.data.boards;
      boardsCache = fetchedBoards;
      setBoards(fetchedBoards);
    } catch (error: any) {
      console.error("Failed to load boards:", error);
      toast({
        title: "Error",
        description: "Failed to load boards",
        variant: "destructive",
      });
    }
  };

  // Fetch current board
  const fetchCurrentBoard = async () => {
    try {
      if (currentBoardCache[slug]) {
        setCurrentBoard(currentBoardCache[slug]);
        
        // Background refresh - use public endpoint for guests
        const refreshMethod = user ? boardService.getBoardBySlug : boardService.getPublicBoardBySlug;
        refreshMethod(slug)
          .then(response => {
            const freshBoard = response.data.board;
            currentBoardCache[slug] = freshBoard;
            setCurrentBoard(freshBoard);
          })
          .catch(console.error);
        return;
      }

      // Use public endpoint for guests, authenticated endpoint for logged-in users
      const fetchMethod = user ? boardService.getBoardBySlug : boardService.getPublicBoardBySlug;
      const response = await fetchMethod(slug);
      const board = response.data.board;
      
      // Check if board is private - redirect if guest
      if (board.is_private && !user) {
        toast({
          title: "Private Board",
          description: "Please login to access this board",
          variant: "destructive",
        });
        router.push('/login');
        return;
      }
      
      currentBoardCache[slug] = board;
      setCurrentBoard(board);
    } catch (error: any) {
      console.error("Failed to load board:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to load board",
        variant: "destructive",
      });
    }
  };

  // Fetch posts for current board
  const fetchPosts = async () => {
    if (!currentBoard || isFetchingPosts.current) return;

    try {
      isFetchingPosts.current = true;
      setLoading(true);
      
      if (cachedPosts && cachedPosts.length > 0) {
        setAllPosts(cachedPosts);
        setPosts(cachedPosts);
        setLoading(false);
        isFetchingPosts.current = false;
        
        // Background refresh - use public endpoint for guests
        const refreshMethod = user ? postService.getPostsByBoard : postService.getPublicBoardPosts;
        refreshMethod(slug)
          .then(response => {
            const freshPosts = response.data.posts;
            postsCache[slug] = freshPosts;
            setAllPosts(freshPosts);
            setPosts(freshPosts);
          })
          .catch(console.error);
        return;
      }

      // Use public endpoint for guests, authenticated endpoint for logged-in users
      const fetchMethod = user ? postService.getPostsByBoard : postService.getPublicBoardPosts;
      const response = await fetchMethod(slug);
      const fetchedPosts = response.data.posts;
      postsCache[slug] = fetchedPosts;
      setAllPosts(fetchedPosts);
      setPosts(fetchedPosts);
    } catch (error: any) {
      console.error("Failed to load posts:", error);
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to load posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      isFetchingPosts.current = false;
    }
  };

  // Load data on mount and slug change
  useEffect(() => {
    isFetchingPosts.current = false; // Reset fetching state when slug changes
    fetchBoards();
    fetchCurrentBoard();
  }, [slug]);

  useEffect(() => {
    if (currentBoard && currentBoard.id) {
      fetchPosts();
    }
  }, [currentBoard?.id]);

  // Apply filters
  useEffect(() => {
    let filtered = [...allPosts];

    // Board filter
    if (selectedBoards.length > 0) {
      filtered = filtered.filter(post => selectedBoards.includes(post.board_id));
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter((post) => post.status === filters.status);
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(
        (post) =>
          post.title.toLowerCase().includes(searchLower) ||
          post.description?.toLowerCase().includes(searchLower)
      );
    }

    // Date filters
    if (filters.startDate) {
      filtered = filtered.filter(
        (post) => new Date(post.created_at) >= new Date(filters.startDate)
      );
    }
    if (filters.endDate) {
      filtered = filtered.filter(
        (post) => new Date(post.created_at) <= new Date(filters.endDate)
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const order = filters.sortOrder === "asc" ? 1 : -1;
      if (filters.sortBy === "created_at") {
        return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * order;
      } else if (filters.sortBy === "upvotes") {
        return (a.upvotes - b.upvotes) * order;
      } else if (filters.sortBy === "comments") {
        return (a.comment_count - b.comment_count) * order;
      }
      return 0;
    });

    setPosts(filtered);
  }, [allPosts, filters, selectedBoards]);

  // Handle board navigation
  const handleBoardClick = (boardSlug: string) => {
    router.push(`/feedback/boards/${boardSlug}`);
  };

  // Handle create post - show auth modal if not logged in
  const handleCreatePost = () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    
    // Check post limit instantly using pre-loaded data
    if (!canCreatePost) {
      setShowUpgradeDialog(true);
      return;
    }
    
    setShowCreatePost(true);
  };

  const handlePostCreated = (post: Post) => {
    setPosts([post, ...posts]);
    setAllPosts([post, ...allPosts]);
    postsCache[slug] = [post, ...(postsCache[slug] || [])];
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
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
          setBoards([...boards, board]);
          boardsCache = [...boards, board];
        }}
        onDeleteBoard={(boardId) => {
          setBoards(boards.filter(b => b.id !== boardId));
          if (boardsCache) {
            boardsCache = boardsCache.filter(b => b.id !== boardId);
          }
        }}
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
          setPosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p));
          setAllPosts(allPosts.map(p => p.id === updatedPost.id ? updatedPost : p));
          setSelectedPost(updatedPost);
        }}
        onPostDeleted={(postId) => {
          setPosts(posts.filter(p => p.id !== postId));
          setAllPosts(allPosts.filter(p => p.id !== postId));
          setSelectedPost(null);
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
        <DialogContent className="sm:max-w-md dark:bg-gray-900 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center dark:text-white">
              Join the Conversation
            </DialogTitle>
            <DialogDescription className="text-center text-base dark:text-gray-400">
              Create an account or sign in to post feedback, vote, and comment
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col gap-3 py-4">
            <Button
              onClick={() => router.push('/signup')}
              size="lg"
              className="w-full text-lg h-12"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Create Account
            </Button>
            
            <Button
              onClick={() => router.push('/login')}
              variant="outline"
              size="lg"
              className="w-full text-lg h-12 dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
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
        message={postLimitReason || "You've reached your monthly post limit. Upgrade to Pro for unlimited posts."}
      />
    </div>
  );
}
