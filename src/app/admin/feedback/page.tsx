"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { boardService, Board } from "@/services/boardService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

export default function FeedbackPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [boards, setBoards] = useState<Board[]>([]);

  // Fetch boards and redirect
  useEffect(() => {
    const checkBoards = async () => {
      try {
        // First time or no history - fetch boards
        setLoading(true);
        const response = await boardService.getAllBoards();
        const fetchedBoards = response.data.boards;
        setBoards(fetchedBoards);

        if (fetchedBoards.length > 0) {
          // 🔥 Check localStorage for last visited board
          const lastBoardSlug = localStorage.getItem('lastVisitedBoard');
          
          // Verify the last board still exists
          const lastBoardExists = lastBoardSlug && fetchedBoards.some(b => b.slug === lastBoardSlug);
          
          if (lastBoardExists) {
            // Instant redirect to last visited board
            console.log('🚀 Instant redirect to last board:', lastBoardSlug);
            router.replace(`/admin/feedback/boards/${lastBoardSlug}`);
          } else {
            // Last board doesn't exist anymore, use first board
            localStorage.setItem('lastVisitedBoard', fetchedBoards[0].slug);
            router.replace(`/admin/feedback/boards/${fetchedBoards[0].slug}`);
          }
        } else {
          // No boards exist - redirect to welcome page
          localStorage.removeItem('lastVisitedBoard');
          router.replace('/admin/feedback/welcome');
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load boards",
          variant: "destructive",
        });
        // On error, redirect to welcome page for board creation
        localStorage.removeItem('lastVisitedBoard');
        router.replace('/admin/feedback/welcome');
      } finally {
        setLoading(false);
      }
    };

    checkBoards();
  }, [router, toast]);

  // 🔄 Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Loading your boards...</p>
      </div>
    );
  }

  // ✅ Fallback (if somehow no redirect happened)
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
      <p className="text-gray-600">Redirecting...</p>
    </div>
  );
}
