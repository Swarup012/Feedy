"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ClipboardList,
  Loader2,
  MessagesSquare,
} from "lucide-react";
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
import { saveReturnUrl } from "@/lib/returnUrl";
import { cn } from "@/lib/utils";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://faddy.site";

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

interface FeedbackPageClientProps {
  /** True on a Cloudflare-for-SaaS custom hostname (set server-side). */
  isCustomHost: boolean;
}

export default function FeedbackPageClient({
  isCustomHost,
}: FeedbackPageClientProps) {
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

  // Handle upvote — same-origin POST through the public catch-all proxy
  // (auth via the access_token cookie; the proxy attaches the tenant).
  const handleUpvote = async (postId: string) => {
    if (isCustomHost) {
      // Custom hosts are read-only by design (d) — no session there, so the
      // write affordance is a login link on the main app, never a POST.
      window.location.href = `${APP_URL}/login`;
      return;
    }

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

      const response = await fetch(`/api/public/posts/${postId}/upvote`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

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
      <div className="container py-10">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-primary motion-reduce:animate-none" />
            <p className="text-sm text-muted-foreground">Loading feedback…</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state - no boards
  if (boards.length === 0) {
    return (
      <div className="container py-10">
        <div className="flex h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <ClipboardList className="h-6 w-6 text-muted-foreground" />
            </div>
            <h2 className="font-headline text-lg font-semibold tracking-tight text-foreground">
              No Public Boards Available
            </h2>
            <p className="mt-1 text-sm text-foreground">
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Top Bar for Authenticated Users */}
      {isAuthenticated && (
        <div className="border-b border-border bg-secondary">
          <div className="container py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard")}
              className="gap-2 text-secondary-foreground hover:bg-background hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      )}

      <div className="container py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Sidebar - Filters */}
          <aside className="lg:col-span-3">
            <div className="sticky top-20 space-y-8">
              {/* Board Filter */}
              <section>
                <h2 className="mb-3 px-3 text-sm font-semibold text-foreground">
                  Boards
                </h2>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedBoard("all")}
                    className={cn(
                      "w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      selectedBoard === "all"
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted",
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex-1">All Boards</span>
                      <span
                        className={cn(
                          "text-xs tabular-nums",
                          selectedBoard === "all"
                            ? "text-primary-foreground"
                            : "text-muted-foreground",
                        )}
                      >
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
                          "w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          selectedBoard === board.slug
                            ? "bg-primary text-primary-foreground"
                            : "text-foreground hover:bg-muted",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <IconDisplay
                            iconName={board.icon}
                            className="h-4 w-4 shrink-0"
                          />
                          <span className="flex-1 truncate">{board.name}</span>
                          <span
                            className={cn(
                              "text-xs tabular-nums",
                              selectedBoard === board.slug
                                ? "text-primary-foreground"
                                : "text-muted-foreground",
                            )}
                          >
                            {count}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Status Filter */}
              <section>
                <h2 className="mb-3 px-3 text-sm font-semibold text-foreground">
                  Status
                </h2>
                <div className="space-y-1 px-3">
                  {feedbackStatuses.map((status) => (
                    <div
                      key={status}
                      className="flex items-center gap-2 rounded-md py-1.5"
                    >
                      <Checkbox
                        id={`status-${status}`}
                        checked={selectedStatuses.includes(status)}
                        onCheckedChange={() => toggleStatus(status)}
                      />
                      <Label
                        htmlFor={`status-${status}`}
                        className="cursor-pointer text-sm font-normal capitalize text-foreground"
                      >
                        {status.replace("-", " ")}
                      </Label>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-9">
            {/* Header with Sort and Create Post */}
            <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="font-headline text-2xl font-semibold tracking-tight text-foreground">
                  {selectedBoard === "all"
                    ? "All Feedback"
                    : boards.find((b) => b.slug === selectedBoard)?.name}
                </h1>
                <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                  {filteredPosts.length}{" "}
                  {filteredPosts.length === 1 ? "post" : "posts"}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[180px] whitespace-nowrap">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="most-votes">Most Votes</SelectItem>
                    <SelectItem value="trending">Trending</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                  </SelectContent>
                </Select>
                {isCustomHost ? (
                  // Custom hosts are read-only (d): creating a post needs a
                  // session, which only exists on faddy.site.
                  <Button asChild variant="outline">
                    <a href={`${APP_URL}/login`}>Log in to create a post</a>
                  </Button>
                ) : (
                  <SubmitFeedback
                    boards={boards}
                    buttonText="Create Post"
                    variant="outline"
                  />
                )}
              </div>
            </div>

            {/* Feedback List */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-lg border border-border bg-card p-5"
                  >
                    <div className="flex gap-4">
                      <div className="h-14 w-14 rounded-lg bg-muted" />
                      <div className="flex-1 space-y-3">
                        <div className="h-5 w-3/4 rounded bg-muted" />
                        <div className="h-4 w-full rounded bg-muted" />
                        <div className="h-4 w-5/6 rounded bg-muted" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                  <MessagesSquare className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-headline text-lg font-semibold tracking-tight text-foreground">
                  No feedback yet
                </h3>
                <p className="mt-1 text-sm text-foreground">
                  Be the first to share your ideas!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
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
              <div className="mt-8 flex items-center justify-center">
                <Button variant="outline" disabled>
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
