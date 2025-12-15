"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { boardService, Board } from "@/services/boardService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { CreateBoardDialog } from "@/components/feedback/CreateBoardDialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Folder } from "lucide-react";

export default function FeedbackPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [boards, setBoards] = useState<Board[]>([]);

  // Fetch boards and redirect if one exists
  useEffect(() => {
    const checkBoards = async () => {
      try {
        // 🔥 Check localStorage first for instant redirect
        const lastBoardSlug = localStorage.getItem('lastVisitedBoard');
        
        if (lastBoardSlug) {
          // Instant redirect to last visited board (no API call needed)
          console.log('🚀 Instant redirect to last board:', lastBoardSlug);
          router.replace(`/admin/feedback/boards/${lastBoardSlug}`);
          return; // Skip API call
        }

        // First time or no history - fetch boards
        setLoading(true);
        const response = await boardService.getAllBoards();
        const fetchedBoards = response.data.boards;
        setBoards(fetchedBoards);

        if (fetchedBoards.length > 0) {
          // Save first board as default and redirect
          localStorage.setItem('lastVisitedBoard', fetchedBoards[0].slug);
          router.replace(`/admin/feedback/boards/${fetchedBoards[0].slug}`);
        } else {
          setShowCreateBoard(true);
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load boards",
          variant: "destructive",
        });
        setShowCreateBoard(true);
      } finally {
        setLoading(false);
      }
    };

    checkBoards();
  }, [router, toast]);

  const handleBoardCreated = (board: Board) => {
    toast({
      title: "Success!",
      description: `Board "${board.name}" created successfully`,
    });
    router.push(`/admin/feedback/boards/${board.slug}`);
  };

  // 🔄 Loading State with Skeleton
  if (loading) {
    return (
      <div className="p-8 space-y-4">
        <div className="flex items-center justify-between mb-8">
          <div className="space-y-2">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  // 🆕 Empty State (Styled like modern version)
  if (boards.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-screen space-y-6 p-6 bg-gradient-to-br from-blue-50 to-indigo-100">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Folder className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold">Create Your First Board</h2>
            <p className="text-gray-500 max-w-md">
              {user?.role === "admin"
                ? "Boards help you organize feedback by product, feature, or category. Create one to get started."
                : "No feedback boards are available yet. Please contact an administrator."}
            </p>
          </div>

          {/* ✅ Admin-only Create Button */}
          {user?.role === "admin" && (
            <Button onClick={() => setShowCreateBoard(true)} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Create Board
            </Button>
          )}
        </div>

        {/* Dialog */}
        <CreateBoardDialog
          open={showCreateBoard}
          onOpenChange={setShowCreateBoard}
          onBoardCreated={handleBoardCreated}
        />
      </>
    );
  }

  // ✅ Fallback (if somehow boards exist but not redirected)
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <p className="text-gray-600">Redirecting to your board...</p>
    </div>
  );
}
