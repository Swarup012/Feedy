"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useToast } from "@/hooks/use-toast";
import { Board, boardService } from "@/services/boardService";
import { Post, postService } from "@/services/postService";

// Import components
import { LeftSidebar } from "@/components/feedback/LeftSidebar";
import { PostsList } from "@/components/feedback/PostsList";
import { PostDetails } from "@/components/feedback/PostDetails";
import { CreatePostDialog } from "@/components/feedback/CreatePostDialog";

export default function BoardPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { toast } = useToast();

  const [boards, setBoards] = useState<Board[]>([]);
  const [currentBoard, setCurrentBoard] = useState<Board | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]); // Store all posts
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedBoards, setSelectedBoards] = useState<string[]>([]); // Board filter

  // Filters
  const [filters, setFilters] = useState({
    status: "",
    search: "",
    startDate: "",
    endDate: "",
    sortBy: "created_at",
    sortOrder: "desc",
  });

  // Fetch all boards
  const fetchBoards = async () => {
    try {
      const response = await boardService.getAllBoards();
      setBoards(response.data.boards);
    } catch (error: any) {
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
      const response = await boardService.getBoardBySlug(slug);
      setCurrentBoard(response.data.board);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Board not found",
        variant: "destructive",
      });
    }
  };

  // Fetch posts from all selected boards
  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      // If no boards selected, fetch from current board only
      if (selectedBoards.length === 0) {
        const response = await postService.getPostsByBoard(slug, filters);
        setPosts(response.data.posts);
        setAllPosts(response.data.posts);
      } else {
        // Fetch posts from all selected boards
        const boardsToFetch = boards.filter(b => selectedBoards.includes(b.id));
        const postsPromises = boardsToFetch.map(board =>
          postService.getPostsByBoard(board.slug, filters)
        );
        
        const results = await Promise.all(postsPromises);
        const combinedPosts = results.flatMap(r => r.data.posts);
        
        setPosts(combinedPosts);
        setAllPosts(combinedPosts);
      }

      // Auto-select first post if none selected
      if (!selectedPost && posts.length > 0) {
        setSelectedPost(posts[0]);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
    fetchCurrentBoard();
  }, [slug]);

  useEffect(() => {
    if (boards.length > 0) {
      fetchPosts();
    }
  }, [slug, filters, selectedBoards, boards]);

  // Handle post created
  const handlePostCreated = (post: Post) => {
    setPosts([post, ...posts]);
    setSelectedPost(post);
    setShowCreatePost(false);
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
    setPosts(posts.map((p) => (p.id === updatedPost.id ? updatedPost : p)));
    setSelectedPost(updatedPost);
  };

  // Handle post deleted
  const handlePostDeleted = (postId: string) => {
    setPosts(posts.filter((p) => p.id !== postId));
    setSelectedPost(null);
  };

  return (
    <ProtectedRoute allowedRoles={["owner", "admin"]}>
      <div className="flex h-screen overflow-hidden bg-gray-50">
        {/* LEFT SIDEBAR - Boards & Filters */}
        <LeftSidebar
          boards={boards}
          currentBoardSlug={slug}
          filters={filters}
          onFilterChange={setFilters}
          onCreateBoard={(newBoard) => {
            setBoards([newBoard, ...boards]);
            toast({
              title: "Success!",
              description: `Board "${newBoard.name}" created successfully`,
            });
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
          onCreatePost={() => setShowCreatePost(true)}
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
      </div>
    </ProtectedRoute>
  );
}
