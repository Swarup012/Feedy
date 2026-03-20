"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useToast } from "@/hooks/use-toast";
import { Board, boardService } from "@/services/boardService";
import { Post, postService } from "@/services/postService";
import { useBoardRealtime } from "@/hooks/useBoardRealtime";

// Import components
import { LeftSidebar } from "@/components/feedback/LeftSidebar";
import { PostsList } from "@/components/feedback/PostsList";
import { PostDetails } from "@/components/feedback/PostDetails";
import { CreatePostDialog } from "@/components/feedback/CreatePostDialog";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import usageService from "@/services/usageService";

// 🔥 GLOBAL in-memory cache (persists across navigation!)
const postsCache: Record<string, Post[]> = {};
let boardsCache: Board[] | null = null; // Cache all boards globally
const currentBoardCache: Record<string, Board> = {}; // Cache individual boards by slug

export default function BoardPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { toast } = useToast();

  const [boards, setBoards] = useState<Board[]>([]);
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]); // Store all posts (unfiltered)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  
  // 🚀 Initialize from cache immediately if available!
  const cachedPosts = postsCache[slug];
  const cachedBoards = boardsCache;
  const cachedCurrentBoard = currentBoardCache[slug];
  
  const [loading, setLoadingState] = useState(() => {
    const hasCache = cachedPosts && cachedPosts.length > 0;
    console.log(`🎯 Component mount for "${slug}"`);
    console.log(`   Posts cache: ${hasCache ? 'EXISTS (' + cachedPosts.length + ' posts)' : 'EMPTY'}`);
    console.log(`   Boards cache: ${cachedBoards ? 'EXISTS (' + cachedBoards.length + ' boards)' : 'EMPTY'}`);
    console.log(`   Current board cache: ${cachedCurrentBoard ? 'EXISTS' : 'EMPTY'}`);
    return !hasCache;
  });

  // Wrapper to log loading state changes
  const setLoading = (value: boolean) => {
    console.log(`🔄 Loading: ${loading} → ${value} (slug: ${slug})`);
    setLoadingState(value);
  };
  
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedBoards, setSelectedBoards] = useState<string[]>([]); // Board filter
  
  // Pre-load post creation limits for instant popup
  const [canCreatePost, setCanCreatePost] = useState(true);
  const [postLimitReason, setPostLimitReason] = useState<string>("");

  // Pre-load usage data on component mount
  useEffect(() => {
    if (!slug) return; // Skip if no slug
    
    const loadUsage = async () => {
      const { allowed, reason } = await usageService.canCreatePost(slug);
      setCanCreatePost(allowed);
      if (!allowed && reason) {
        setPostLimitReason(reason);
      }
    };
    loadUsage();
  }, [posts.length, slug]); // Re-check when posts change or slug changes

  // 🚀 INSTANT LOAD: Populate from cache on mount (before any useEffect!)
  useEffect(() => {
    let instantLoad = false;
    
    // Load boards from cache
    if (cachedBoards && cachedBoards.length > 0 && boards.length === 0) {
      console.log('⚡ INSTANT boards load:', cachedBoards.length);
      setBoards(cachedBoards);
      instantLoad = true;
    }
    
    // Load current board from cache
    if (cachedCurrentBoard && !currentBoard) {
      console.log('⚡ INSTANT current board load:', slug);
      setCurrentBoard(cachedCurrentBoard);
      instantLoad = true;
    }
    
    // Load posts from cache
    if (cachedPosts && cachedPosts.length > 0 && posts.length === 0) {
      console.log('⚡ INSTANT posts load:', cachedPosts.length);
      setAllPosts(cachedPosts);
      setPosts(cachedPosts);
      setLoading(false);
      instantLoad = true;
    }
    
    if (instantLoad) {
      console.log('⚡⚡⚡ INSTANT CACHE LOAD COMPLETE for:', slug);
    }
  }, []); // Run only once on mount

  // Filters
  const [filters, setFilters] = useState({
    status: "",
    search: "",
    startDate: "",
    endDate: "",
    sortBy: "created_at",
    sortOrder: "desc",
  });

  // Real-time board updates
  useBoardRealtime({
    boardSlug: slug,
    onPostCreated: (post) => {
      console.log('📝 [BoardPage] Real-time: New post created', post);
      setPosts((prev: any) => [post, ...prev]);
      setAllPosts((prev: any) => [post, ...prev]);
    },
    onPostDeleted: (postId) => {
      console.log('🗑️ [BoardPage] Real-time: Post deleted', postId);
      setPosts((prev: any) => prev.filter((p: any) => p.id !== postId));
      setAllPosts((prev: any) => prev.filter((p: any) => p.id !== postId));
    },
    onPostStatusChanged: (data) => {
      console.log('🔄 [BoardPage] Real-time: Post status changed', data);
      setPosts((prev: any) => prev.map((p: any) => 
        p.id === data.postId ? { ...p, status: data.newStatus } : p
      ));
      setAllPosts((prev: any) => prev.map((p: any) => 
        p.id === data.postId ? { ...p, status: data.newStatus } : p
      ));
    },
    onCommentCountChanged: (data) => {
      console.log('💬 [BoardPage] Real-time: Comment count changed', data);
      setPosts((prev: any) => prev.map((p: any) => 
        p.id === data.postId ? { ...p, comment_count: data.commentCount } : p
      ));
      setAllPosts((prev: any) => prev.map((p: any) => 
        p.id === data.postId ? { ...p, comment_count: data.commentCount } : p
      ));
    },
    onPostUpvoted: (data) => {
      console.log('👍 [BoardPage] Real-time: Post upvoted', data);
      setPosts((prev: any) => prev.map((p: any) => 
        p.id === data.postId ? { ...p, upvotes: data.upvoteCount } : p
      ));
      setAllPosts((prev: any) => prev.map((p: any) => 
        p.id === data.postId ? { ...p, upvotes: data.upvoteCount } : p
      ));
    },
  });

  // Fetch all boards (with cache)
  const fetchBoards = async () => {
    try {
      // 🚀 Check cache first
      if (boardsCache && boardsCache.length > 0) {
        console.log('⚡ Boards cache HIT - Instant load!', boardsCache.length, 'boards');
        setBoards(boardsCache);
        
        // Background refresh (silent update)
        boardService.getAllBoards()
          .then(response => {
            boardsCache = response.data.boards;
            setBoards(response.data.boards);
            console.log('🔄 Boards background refresh complete');
          })
          .catch(err => console.log('⚠️ Boards background refresh failed:', err));
        return;
      }

      console.log('📡 Boards cache MISS - Fetching from API...');
      const response = await boardService.getAllBoards();
      boardsCache = response.data.boards; // Cache it
      setBoards(response.data.boards);
      console.log('💾 Cached boards:', boardsCache.length);
    } catch (error: any) {
      console.error('❌ Error fetching boards:', error);
      toast({
        title: "Error",
        description: "Failed to load boards",
        variant: "destructive",
      });
    }
  };

  // Fetch current board (with cache)
  const fetchCurrentBoard = async () => {
    try {
      // 🚀 Check cache first
      if (currentBoardCache[slug]) {
        console.log('⚡ Current board cache HIT:', slug);
        setCurrentBoard(currentBoardCache[slug]);
        
        // Background refresh (silent update)
        boardService.getBoardBySlug(slug)
          .then(response => {
            currentBoardCache[slug] = response.data.board;
            setCurrentBoard(response.data.board);
            console.log('🔄 Current board background refresh complete');
          })
          .catch(err => console.log('⚠️ Current board background refresh failed:', err));
        return;
      }

      console.log('📡 Current board cache MISS - Fetching:', slug);
      const response = await boardService.getBoardBySlug(slug);
      currentBoardCache[slug] = response.data.board; // Cache it
      setCurrentBoard(response.data.board);
      console.log('💾 Cached current board:', slug);
    } catch (error: any) {
      console.error('❌ Error fetching current board:', error);
      toast({
        title: "Error",
        description: "Board not found",
        variant: "destructive",
      });
    }
  };

  // 🔥 Client-side filtering (instant, no API call)
  const applyFilters = (postsToFilter: Post[]) => {
    let filtered = [...postsToFilter];

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(post => post.status === filters.status);
    }

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchLower) ||
        post.description?.toLowerCase().includes(searchLower)
      );
    }

    // Date filters
    if (filters.startDate) {
      filtered = filtered.filter(post => new Date(post.created_at) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      filtered = filtered.filter(post => new Date(post.created_at) <= new Date(filters.endDate));
    }

    // Sorting
    filtered.sort((a, b) => {
      const aValue = a[filters.sortBy as keyof Post];
      const bValue = b[filters.sortBy as keyof Post];
      
      if (filters.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  // Fetch posts from all selected boards
  const fetchPosts = async () => {
    try {
      // 🚀 Check cache first for instant load (NO LOADING STATE!)
      if (postsCache[slug] && selectedBoards.length === 0) {
        console.log('⚡ Cache HIT for board:', slug, '- Instant load!');
        setAllPosts(postsCache[slug]);
        const filtered = applyFilters(postsCache[slug]);
        setPosts(filtered);
        console.log('📊 Set posts from CACHE:', slug, '- Count:', filtered.length);
        setLoading(false); // Ensure no skeleton shows
        
        // Background refresh (silent update, no loading state)
        postService.getPostsByBoard(slug, { sortBy: 'created_at', sortOrder: 'desc' })
          .then(response => {
            postsCache[slug] = response.data.posts;
            setAllPosts(response.data.posts);
            const refreshedFiltered = applyFilters(response.data.posts);
            setPosts(refreshedFiltered);
            console.log('🔄 Background refresh complete for:', slug);
          })
          .catch(err => console.log('⚠️ Background refresh failed:', err));
        return;
      }

      // Only show loading for cache MISS
      setLoading(true);
      console.log('📡 Cache MISS - Fetching from API...');
      
      // If no boards selected, fetch from current board only
      if (selectedBoards.length === 0) {
        const response = await postService.getPostsByBoard(slug, { sortBy: 'created_at', sortOrder: 'desc' });
        const fetchedPosts = response.data.posts;
        
        // 💾 Cache the posts
        postsCache[slug] = fetchedPosts;
        console.log('💾 Cached posts for board:', slug);
        
        setAllPosts(fetchedPosts);
        const filtered = applyFilters(fetchedPosts);
        setPosts(filtered);
        console.log('📊 Set posts for board:', slug, '- Count:', filtered.length);
      } else {
        // Fetch posts from all selected boards
        const boardsToFetch = boards.filter((b: Board) => selectedBoards.includes(b.id));
        const postsPromises = boardsToFetch.map((board: Board) =>
          postService.getPostsByBoard(board.slug, { sortBy: 'created_at', sortOrder: 'desc' })
        );
        
        const results = await Promise.all(postsPromises);
        const combinedPosts = results.flatMap((r: any) => r.data.posts);
        
        setAllPosts(combinedPosts);
        const filtered = applyFilters(combinedPosts);
        setPosts(filtered);
      }

      // Auto-select first post if none selected
      if (!selectedPost && posts.length > 0) {
        setSelectedPost(posts[0]);
      }
    } catch (error: any) {
      console.error('❌ Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      });
    } finally {
      console.log('✅ fetchPosts complete - setting loading to false');
      setLoading(false);
    }
  };

  // 🚀 Prefetch adjacent boards (preload next/prev boards in background)
  const prefetchAdjacentBoards = async () => {
    if (boards.length === 0) return;
    
    const currentIndex = boards.findIndex((b: Board) => b.slug === slug);
    if (currentIndex === -1) return;

    const adjacentBoards = [];
    
    // Previous board
    if (currentIndex > 0) {
      adjacentBoards.push(boards[currentIndex - 1]);
    }
    
    // Next board
    if (currentIndex < boards.length - 1) {
      adjacentBoards.push(boards[currentIndex + 1]);
    }

    // Prefetch in background
    adjacentBoards.forEach(async (board: Board) => {
      if (!postsCache[board.slug]) {
        console.log('🔮 Prefetching board:', board.slug);
        try {
          const response = await postService.getPostsByBoard(board.slug, { sortBy: 'created_at', sortOrder: 'desc' });
          postsCache[board.slug] = response.data.posts;
          console.log('✅ Prefetched:', board.slug);
        } catch (error) {
          console.log('⚠️ Prefetch failed for:', board.slug);
        }
      }
    });
  };

  useEffect(() => {
    // 💾 Save current board slug to localStorage for instant redirect next time
    if (slug) {
      localStorage.setItem('lastVisitedBoard', slug);
      console.log('💾 Saved last visited board:', slug);
    }
    
    fetchBoards();
    fetchCurrentBoard();

    // 🛡️ Safety timeout: Force loading off after 5 seconds if something goes wrong
    const safetyTimeout = setTimeout(() => {
      console.warn('⚠️ Safety timeout triggered - forcing loading off');
      setLoading(false);
    }, 5000);

    return () => clearTimeout(safetyTimeout);
  }, [slug]);

  // Fetch posts only when board or selected boards change (NOT when boards list changes)
  useEffect(() => {
    // Always fetch posts, don't wait for boards
    // (boards list is only needed for multi-board filtering)
    fetchPosts();
  }, [slug, selectedBoards]);

  // Prefetch adjacent boards separately (only when slug or boards list changes)
  useEffect(() => {
    if (boards.length > 0 && slug) {
      prefetchAdjacentBoards();
    }
  }, [slug, boards]);

  // 🔥 Apply filters client-side (instant, no loading)
  useEffect(() => {
    if (allPosts.length > 0) {
      console.log('⚡ Applying filters client-side (instant)');
      const filtered = applyFilters(allPosts);
      setPosts(filtered);
    }
  }, [filters, allPosts]);

  // Handle post created
  const handlePostCreated = (post: Post) => {
    const updatedPosts = [post, ...posts];
    setPosts(updatedPosts);
    setSelectedPost(post);
    setShowCreatePost(false);
    
    // Update cache
    if (postsCache[slug]) {
      postsCache[slug] = [post, ...postsCache[slug]];
      console.log('✅ Created post and updated cache');
    }
    
    toast({
      title: "Success!",
      description: "Post created successfully",
    });
  };

  // Handle post selected
  const handlePostSelect = (post: Post) => {
    setSelectedPost(post);
  };

  // Handle post updated
  const handlePostUpdated = (updatedPost: Post) => {
    const updatedPosts = posts.map((p) => (p.id === updatedPost.id ? updatedPost : p));
    setPosts(updatedPosts);
    setSelectedPost(updatedPost);
    
    // Update cache
    if (postsCache[slug]) {
      postsCache[slug] = postsCache[slug].map((p) => (p.id === updatedPost.id ? updatedPost : p));
      console.log('✅ Updated post in cache');
    }
  };

  // Handle post deleted
  const handlePostDeleted = (postId: string) => {
    const updatedPosts = posts.filter((p) => p.id !== postId);
    setPosts(updatedPosts);
    setSelectedPost(null);
    
    // Update cache
    if (postsCache[slug]) {
      postsCache[slug] = postsCache[slug].filter((p) => p.id !== postId);
      console.log('✅ Deleted post from cache');
    }
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
            const updatedBoards = [newBoard, ...boards];
            setBoards(updatedBoards);
            boardsCache = updatedBoards; // Update cache
            console.log('✅ Created board and updated cache:', newBoard.name);
            toast({
              title: "Success!",
              description: `Board "${newBoard.name}" created successfully`,
            });
          }}
          onDeleteBoard={(boardId) => {
            // Remove the deleted board from state and cache
            const updatedBoards = boards.filter(b => b.id !== boardId);
            setBoards(updatedBoards);
            boardsCache = updatedBoards; // Update cache
            console.log('✅ Deleted board and updated cache');
          }}
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
            // Check post limit instantly using pre-loaded data
            if (!canCreatePost) {
              setShowUpgradeDialog(true);
            } else {
              setShowCreatePost(true);
            }
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
          message={postLimitReason || "You've reached your post limit for this board. Upgrade to Starter for unlimited posts."}
        />
      </div>
    </ProtectedRoute>
  );
}
