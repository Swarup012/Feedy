"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { boardService, Board } from "@/services/boardService";
import usageService from "@/services/usageService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { CreateBoardDialog } from "@/components/feedback/CreateBoardDialog";
import { UpgradeDialog } from "@/components/UpgradeDialog";
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
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [boards, setBoards] = useState<Board[]>([]);
  const [canCreateBoard, setCanCreateBoard] = useState(true); // Pre-load this

  // Pre-load usage data
  useEffect(() => {
    const loadUsage = async () => {
      try {
        const { allowed } = await usageService.canCreateBoard();
        setCanCreateBoard(allowed);
      } catch (error) {
        console.error('Error loading usage:', error);
        setCanCreateBoard(true); // Default to allowed on error
      }
    };
    loadUsage();
  }, []);

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
          // No boards exist - open dialog immediately
          setShowCreateBoard(true);
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load boards",
          variant: "destructive",
        });
        // On error, also open dialog for creation
        setShowCreateBoard(true);
      } finally {
        setLoading(false);
      }
    };

    checkBoards();
  }, [router, toast]);

  // Handle create board button click - check limits first
  const handleCreateBoardClick = async () => {
    // Use pre-loaded data for instant response
    if (!canCreateBoard) {
      setShowUpgradeDialog(true);
    } else {
      setShowCreateBoard(true);
    }
  };

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

  // 🆕 No boards - show dialog directly (no empty state UI)
  if (boards.length === 0) {
    return (
      <>
        {/* Create Board Dialog - opens automatically */}
        <CreateBoardDialog
          open={showCreateBoard}
          onOpenChange={setShowCreateBoard}
          onBoardCreated={handleBoardCreated}
        />

        {/* Upgrade Dialog */}
        <UpgradeDialog
          open={showUpgradeDialog}
          onOpenChange={setShowUpgradeDialog}
          feature="boards"
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
