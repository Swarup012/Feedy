"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { boardService, Board } from "@/services/boardService";
import { postService, Post } from "@/services/postService";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { FeedbackCard } from "./components/feedback-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { List, LayoutGrid, Loader2 } from "lucide-react";
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
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold mb-2">
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
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar - Filters */}
        <aside className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Board Filter */}
              <div>
                <h3 className="text-sm font-medium mb-2">Board</h3>
                <Select value={selectedBoard} onValueChange={setSelectedBoard}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Boards</SelectItem>
                    {boards.map((board) => (
                      <SelectItem key={board.id} value={board.slug}>
                        <div className="flex items-center gap-2">
                          <span>{board.icon}</span>
                          <span>{board.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Status Filter */}
              <div>
                <h3 className="text-sm font-medium mb-2">Status</h3>
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
                        className="capitalize font-normal cursor-pointer"
                      >
                        {status.replace("-", " ")}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <Button variant="ghost" className="w-full" onClick={clearFilters}>
                Clear all filters
              </Button>
            </CardContent>
          </Card>
        </aside>

        {/* Main Content */}
        <main className="md:col-span-3">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold font-headline">
                Feedback Board
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {filteredPosts.length}{" "}
                {filteredPosts.length === 1 ? "post" : "posts"}
              </p>
            </div>

            <div className="flex items-center gap-4">
              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="most-votes">Most Votes</SelectItem>
                  <SelectItem value="trending">Trending</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "outline" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "outline" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {/* Submit Feedback - pass real data */}
              <SubmitFeedback boards={boards} />
            </div>
          </div>

          {/* Posts */}
          {filteredPosts.length === 0 ? (
            <Card className="p-12">
              <div className="text-center">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold mb-2">No feedback yet</h3>
                <p className="text-gray-500 mb-4">
                  {selectedStatuses.length > 0 || selectedBoard !== "all"
                    ? "No posts match your filters. Try adjusting your selection."
                    : "Be the first to submit feedback!"}
                </p>
                {(selectedStatuses.length > 0 || selectedBoard !== "all") && (
                  <Button onClick={clearFilters} variant="outline">
                    Clear Filters
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredPosts.map((feedback) => (
                <FeedbackCard key={feedback.id} feedback={feedback} />
              ))}
            </div>
          )}

          {/* Load More - can be implemented later */}
          {filteredPosts.length > 0 && (
            <div className="flex items-center justify-center mt-8">
              <Button variant="outline" disabled>
                Load more (Coming soon)
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
