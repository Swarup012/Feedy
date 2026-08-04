"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { boardService, Board } from "@/services/boardService";
import { postService, Post } from "@/services/postService";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { FeedbackCard } from "./components/feedback-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TokenManager } from "@/lib/tokenManager";
import { saveReturnUrl } from "@/lib/returnUrl";
import { cn } from "@/lib/utils";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Helper to get subdomain for multi-tenancy
const getSubdomain = () => {
  if (typeof window === "undefined") return null;

  const hostname = window.location.hostname;
  const parts = hostname.split(".");

  // Handle production domains (e.g., acme.faddy.site)
  if (parts.length >= 3 && !hostname.includes("localhost")) {
    const subdomain = parts[0];
    if (subdomain === "www" || subdomain === "api" || subdomain === "admin") {
      return null;
    }
    return subdomain;
  }

  // Handle development (localhost with subdomain simulation)
  if (
    hostname.includes("localhost") &&
    parts.length > 1 &&
    parts[0] !== "localhost"
  ) {
    return parts[0];
  }

  return null;
};

import { IconDisplay } from "@/components/ui/icon-picker";
import { SubmitFeedback } from "./components/submit-feedback";

const feedbackStatuses = [
  "open",
  "under-review",
  "planned",
  "in-progress",
  "completed",
  "closed",
];

export default function FeedbackPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  // State
  const [boards, setBoards] = useState<Board[]>([]);
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedBoard, setSelectedBoard] = useState<string>("all");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("most-votes");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [upvotedPosts, setUpvotedPosts] = useState<Set<string>>(new Set());

  // Handle upvote
  const handleUpvote = async (postId: string) => {
    if (!isAuthenticated) {
      toast({
        title: "Login Required",
        description: "Please log in to upvote posts.",
        variant: "default",
      });
      saveReturnUrl(); // Save current page before redirecting
      router.push("/login");
      return;
    }

    const wasUpvoted = upvotedPosts.has(postId);

    try {
      // Optimistic update
      setUpvotedPosts((prev) => {
        const newSet = new Set(prev);
        if (wasUpvoted) {
          newSet.delete(postId);
        } else {
          newSet.add(postId);
        }
        return newSet;
      });

      // Update post count optimistically
      setAllPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                upvotes: wasUpvoted ? post.upvotes - 1 : post.upvotes + 1,
              }
            : post,
        ),
      );

      // Call backend API (uses public route with auth required)
      const token = TokenManager.getAccessToken();
      const subdomain = getSubdomain();
      const response = await fetch(
        `${API_URL}/api/public/posts/${postId}/upvote`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(token && { Authorization: `Bearer ${token}` }),
            ...(subdomain && { "x-subdomain": subdomain }),
          },
        },
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Please log in to upvote");
        }
        throw new Error("Failed to upvote");
      }

      toast({
        title: "Success",
        description: wasUpvoted
          ? "Vote removed successfully"
          : "Vote added successfully",
      });
    } catch (error: any) {
      // Revert on error
      setUpvotedPosts((prev) => {
        const newSet = new Set(prev);
        if (wasUpvoted) {
          newSet.add(postId);
        } else {
          newSet.delete(postId);
        }
        return newSet;
      });

      setAllPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                upvotes: wasUpvoted ? post.upvotes + 1 : post.upvotes - 1,
              }
            : post,
        ),
      );

      toast({
        title: "Login Required",
        description: error.message || "Please log in to upvote posts",
        variant: "destructive",
      });

      if (error.message?.includes("log in")) {
        saveReturnUrl(); // Save current page before redirecting
        router.push("/login");
      }
    }
  };

  // Fetch public boards and posts
  const fetchPublicData = async () => {
    try {
      setLoading(true);

      // Fetch public boards
      const boardsResponse = await boardService.getPublicBoards();
      const publicBoards = boardsResponse.data.boards;
      setBoards(publicBoards);

      if (publicBoards.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch posts from all public boards
      const postsPromises = publicBoards.map((board) =>
        postService.getPublicBoardPosts(board.slug),
      );

      const postsResults = await Promise.all(postsPromises);
      const allPostsData = postsResults.flatMap((result) => result.data.posts);

      setAllPosts(allPostsData);
      setFilteredPosts(allPostsData);

      console.log(
        `✅ Loaded ${publicBoards.length} boards, ${allPostsData.length} posts`,
      );
    } catch (error: any) {
      console.error("Error fetching public data:", error);
      toast({
        title: "Error",
        description: "Failed to load feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicData();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...allPosts];

    // Filter by board
    if (selectedBoard !== "all") {
      filtered = filtered.filter((post) => post.board?.slug === selectedBoard);
    }

    // Filter by status
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter((post) =>
        selectedStatuses.includes(post.status),
      );
    }

    // Sort
    switch (sortBy) {
      case "most-votes":
        filtered.sort((a, b) => b.upvotes - a.upvotes);
        break;
      case "trending":
        filtered.sort(
          (a, b) => b.upvotes + b.comment_count - (a.upvotes + a.comment_count),
        );
        break;
      case "newest":
        filtered.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        );
        break;
      case "oldest":
        filtered.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
        );
        break;
    }

    setFilteredPosts(filtered);
  }, [allPosts, selectedBoard, selectedStatuses, sortBy]);

  // Toggle status filter
  const toggleStatus = (status: string) => {
    setSelectedStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  // Clear filters
  const clearFilters = () => {
    setSelectedStatuses([]);
    setSelectedBoard("all");
  };

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-gray-500">Loading feedback...</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state - no boards
  if (boards.length === 0) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center">
            <div className="text-4xl mb-4">📋</div>
            <h2 className="text-lg font-switzer font-medium mb-2">
              No Public Boards Available
            </h2>
            <p className="text-gray-500 mb-4">
              There are no public feedback boards at the moment.
            </p>
            {isAuthenticated && (
              <Button onClick={() => router.push("/admin/feedback")}>
                Go to Admin Dashboard
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Top Bar for Authenticated Users */}
      {isAuthenticated && (
        <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="gap-2 hover:bg-slate-200 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
          {/* Sidebar - Filters */}
          <aside className="lg:col-span-3">
            <div className="sticky top-20 space-y-6">
              {/* Board Filter */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
                <h3 className="text-sm font-switzer font-semibold mb-4 text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Boards
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedBoard("all")}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm font-switzer font-medium transition-colors",
                      selectedBoard === "all"
                        ? "bg-primary text-primary-foreground"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span>All Boards</span>
                      <span className="text-xs opacity-70">
                        {allPosts.length}
                      </span>
                    </div>
                  </button>
                  {boards.map((board) => {
                    const count = allPosts.filter(
                      (p) => p.board?.slug === board.slug,
                    ).length;
                    return (
                      <button
                        key={board.id}
                        onClick={() => setSelectedBoard(board.slug)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md text-sm font-switzer font-medium transition-colors",
                          selectedBoard === board.slug
                            ? "bg-primary text-primary-foreground"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <IconDisplay
                            iconName={board.icon}
                            className="h-4 w-4"
                          />
                          <span className="flex-1">{board.name}</span>
                          <span className="text-xs opacity-70">{count}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Filter */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
                <h3 className="text-sm font-switzer font-semibold mb-4 text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                  Status
                </h3>
                <div className="space-y-2">
                  {feedbackStatuses.map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={`status-${status}`}
                        checked={selectedStatuses.includes(status)}
                        onCheckedChange={() => toggleStatus(status)}
                      />
                      <Label
                        htmlFor={`status-${status}`}
                        className="capitalize font-normal cursor-pointer text-sm text-slate-700 dark:text-slate-300"
                      >
                        {status.replace("-", " ")}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-9">
            {/* Header with Sort and Create Post */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-4">
              <div>
                <h1 className="text-xl font-switzer font-semibold text-slate-900 dark:text-white tracking-tight">
                  {selectedBoard === "all"
                    ? "All Feedback"
                    : boards.find((b) => b.slug === selectedBoard)?.name}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                  {filteredPosts.length}{" "}
                  {filteredPosts.length === 1 ? "post" : "posts"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="most-votes">Most Votes</SelectItem>
                    <SelectItem value="trending">Trending</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                  </SelectContent>
                </Select>
                <SubmitFeedback boards={boards} buttonText="Create Post" variant="outline" />
              </div>
            </div>

            {/* Feedback List */}
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 animate-pulse"
                  >
                    <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full mb-2"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
                  </div>
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-4xl mb-4">💬</div>
                <h3 className="text-lg font-switzer font-semibold text-slate-900 dark:text-white mb-2">
                  No feedback yet
                </h3>
                <p className="text-slate-600 dark:text-slate-400">
                  Be the first to share your ideas!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredPosts.map((feedback) => (
                  <FeedbackCard
                    key={feedback.id}
                    feedback={feedback}
                    onUpvote={handleUpvote}
                    isUpvoted={upvotedPosts.has(feedback.id)}
                  />
                ))}
              </div>
            )}

            {/* Load More */}
            {filteredPosts.length > 0 && (
              <div className="flex items-center justify-center mt-8">
                <Button
                  variant="outline"
                  disabled
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                >
                  No more
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
