"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { boardService, Board } from "@/services/boardService";
import { 
  Sparkles, 
  MessageSquare, 
  Target, 
  Lightbulb,
  Loader2,
  CheckCircle2
} from "lucide-react";

interface FirstBoardWelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function FirstBoardWelcomeDialog({
  open,
  onOpenChange,
}: FirstBoardWelcomeDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState<"welcome" | "create">("welcome");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
  });

  const handleCreateBoard = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Board name required",
        description: "Please enter a name for your board",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await boardService.createBoard({
        name: formData.name,
        description: formData.description || undefined,
      });

      const newBoard = response.data.board;

      toast({
        title: "Success!",
        description: `Board "${newBoard.name}" created successfully`,
      });

      // Save to localStorage and redirect
      localStorage.setItem("lastVisitedBoard", newBoard.slug);
      router.push(`/admin/feedback/boards/${newBoard.slug}`);
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create board",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    setStep("create");
  };

  const handleBack = () => {
    setStep("welcome");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        {step === "welcome" ? (
          <>
            <DialogHeader>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <DialogTitle className="text-center text-2xl">
                Welcome to Your Feedback Hub! 🎉
              </DialogTitle>
              <DialogDescription className="text-center text-base pt-2">
                Let's create your first feedback board to start collecting valuable insights from your users.
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Feature 1 */}
                <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900">
                  <div className="flex-shrink-0 mt-1">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                      Collect Feedback
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Let users submit ideas, bugs, and feature requests
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="flex items-start gap-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900">
                  <div className="flex-shrink-0 mt-1">
                    <Target className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                      Track Progress
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Manage status from planned to completed
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="flex items-start gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-100 dark:border-green-900">
                  <div className="flex-shrink-0 mt-1">
                    <Lightbulb className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                      Prioritize Ideas
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      See what your users want most with voting
                    </p>
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="flex items-start gap-3 p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900">
                  <div className="flex-shrink-0 mt-1">
                    <CheckCircle2 className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                      Engage Users
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Keep your community updated and involved
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mt-6">
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  💡 <strong>Pro tip:</strong> You can create multiple boards for different products, features, or teams!
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                onClick={handleNext}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                size="lg"
              >
                Create Your First Board
                <Sparkles className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Create Your First Board</DialogTitle>
              <DialogDescription>
                Give your board a name and description. You can always change these later.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="board-name">
                  Board Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="board-name"
                  placeholder="e.g., Feature Requests, Bug Reports, Product Ideas"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  disabled={loading}
                  autoFocus
                />
                <p className="text-xs text-gray-500">
                  Choose a clear name that describes what feedback you'll collect
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="board-description">
                  Description <span className="text-gray-400">(optional)</span>
                </Label>
                <Textarea
                  id="board-description"
                  placeholder="Help users understand what kind of feedback to submit..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  disabled={loading}
                  rows={3}
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-lg p-3">
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  <strong>Examples:</strong> "Feature Requests", "Bug Reports", "Mobile App Feedback", "Customer Support Ideas"
                </p>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={loading}
              >
                Back
              </Button>
              <Button
                onClick={handleCreateBoard}
                disabled={loading || !formData.name.trim()}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    Create Board
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
