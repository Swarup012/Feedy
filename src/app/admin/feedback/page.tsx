"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { boardService, Board } from "@/services/boardService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth"; // ← ADD THIS
import { CreateBoardDialog } from "@/components/feedback/CreateBoardDialog";
import {
  Plus,
  Lock,
  Globe,
  MessageSquare,
  Settings,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import FeedbackClient from "./FeedbackClient";

export default function FeedbackPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth(); // ← ADD THIS
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const fetchBoards = async () => {
    try {
      setLoading(true);
      const response = await boardService.getAllBoards();
      setBoards(response.data.boards);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load boards",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoards();
  }, []);

  const handleBoardCreated = (board: Board) => {
    setBoards([board, ...boards]);
    toast({
      title: "Success!",
      description: `Board "${board.name}" created successfully`,
    });
  };

  const handleDeleteBoard = async (boardId: string, boardName: string) => {
    if (
      !confirm(
        `Are you sure you want to delete "${boardName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      await boardService.deleteBoard(boardId);
      setBoards(boards.filter((b) => b.id !== boardId));
      toast({
        title: "Success",
        description: `Board "${boardName}" deleted successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete board",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Empty state
  if (boards.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-screen space-y-6 p-6">
          <div className="text-center space-y-2">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-2xl font-bold">No boards yet!</h2>
            <p className="text-gray-500 max-w-md">
              {user?.role === "admin"
                ? "Create your first feedback board to start collecting and organizing feedback from your users."
                : "No feedback boards are available yet. Please contact an administrator."}
            </p>
          </div>

          {/* ✅ ONLY SHOW FOR ADMINS */}
          {user?.role === "admin" && (
            <Button onClick={() => setShowCreateDialog(true)} size="lg">
              <Plus className="mr-2 h-5 w-5" />
              Create Your First Board
            </Button>
          )}

          {user?.role === "admin" && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl">
              <Card>
                <CardHeader>
                  <div className="text-3xl mb-2">💡</div>
                  <CardTitle className="text-sm">Feature Requests</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-500">
                    Collect ideas and feature suggestions from users
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="text-3xl mb-2">🐛</div>
                  <CardTitle className="text-sm">Bug Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-500">
                    Track and manage bugs reported by users
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="text-3xl mb-2">💬</div>
                  <CardTitle className="text-sm">General Feedback</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-500">
                    Gather general thoughts and feedback
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <CreateBoardDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onBoardCreated={handleBoardCreated}
        />
      </>
    );
  }

  // Boards list
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Feedback Boards</h1>
          <p className="text-gray-500">
            {user?.role === "admin"
              ? "Manage your feedback boards and posts"
              : "View and contribute to feedback boards"}
          </p>
        </div>

        {/* ✅ ONLY SHOW FOR ADMINS */}
        {user?.role === "admin" && (
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Board
          </Button>
        )}
      </div>

      {/* Boards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {boards.map((board) => (
          <Card
            key={board.id}
            className="hover:shadow-lg transition-shadow cursor-pointer group"
            style={{ borderTopColor: board.color, borderTopWidth: "4px" }}
            onClick={() => router.push(`/admin/feedback/boards/${board.slug}`)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-12 w-12 rounded-lg flex items-center justify-center text-2xl"
                    style={{ backgroundColor: board.color + "20" }}
                  >
                    {board.icon}
                  </div>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {board.name}
                      {board.is_private ? (
                        <Lock className="h-3 w-3 text-gray-400" />
                      ) : (
                        <Globe className="h-3 w-3 text-gray-400" />
                      )}
                    </CardTitle>
                    <p className="text-xs text-gray-500">/board/{board.slug}</p>
                  </div>
                </div>

                {/* ✅ ONLY SHOW ACTIONS FOR ADMINS */}
                {user?.role === "admin" && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(
                          `/admin/feedback/boards/${board.slug}/settings`,
                        );
                      }}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBoard(board.id, board.name);
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <CardDescription className="mb-4">
                {board.description || "No description"}
              </CardDescription>

              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  <span>{board.post_count} posts</span>
                </div>
                <div className="flex items-center gap-1">
                  {board.is_private ? (
                    <>
                      <Lock className="h-4 w-4" />
                      <span>Private</span>
                    </>
                  ) : (
                    <>
                      <Globe className="h-4 w-4" />
                      <span>Public</span>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Board Dialog */}
      <CreateBoardDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onBoardCreated={handleBoardCreated}
      />
    </div>
  );
}
