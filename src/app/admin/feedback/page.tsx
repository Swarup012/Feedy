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
  const [error, setError] = useState<string | null>(null);

  // Fetch boards and redirect
  useEffect(() => {
    let cancelled = false;

    const checkBoards = async (retryCount = 0) => {
      try {
        setLoading(true);
        setError(null);
        const response = await boardService.getAllBoards();
        const fetchedBoards = response.data.boards;

        if (cancelled) return;
        setBoards(fetchedBoards);

        if (fetchedBoards.length > 0) {
          const lastBoardSlug = localStorage.getItem('lastVisitedBoard');
          const lastBoardExists = lastBoardSlug && fetchedBoards.some(b => b.slug === lastBoardSlug);

          if (lastBoardExists) {
            router.replace(`/admin/feedback/boards/${lastBoardSlug}`);
          } else {
            localStorage.setItem('lastVisitedBoard', fetchedBoards[0].slug);
            router.replace(`/admin/feedback/boards/${fetchedBoards[0].slug}`);
          }
        } else {
          localStorage.removeItem('lastVisitedBoard');
          router.replace('/admin/feedback/welcome');
        }
      } catch (err: any) {
        if (cancelled) return;

        // Retry once on transient errors
        if (retryCount < 1) {
          setTimeout(() => checkBoards(retryCount + 1), 1000);
          return;
        }

        setError(err.message || "Failed to load boards");
        toast({
          title: "Error",
          description: err.message || "Failed to load boards",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    checkBoards();

    return () => { cancelled = true; };
  }, [router, toast]);

  // Error State
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  // Loading State
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
        <p className="text-gray-600">Loading your boards...</p>
      </div>
    );
  }

  // Fallback (if somehow no redirect happened)
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
      <p className="text-gray-600">Redirecting...</p>
    </div>
  );
}
