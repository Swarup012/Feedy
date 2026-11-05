"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Board } from "@/services/boardService";
import { postService } from "@/services/postService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";
import { saveReturnUrl } from "@/lib/returnUrl";
import { useToast } from "@/hooks/use-toast";
import { IconDisplay } from "@/components/ui/icon-picker";

interface SubmitFeedbackProps {
  boards?: Board[];
  buttonText?: string;
  variant?: "default" | "outline";
}

export function SubmitFeedback({
  boards = [],
  buttonText = "Submit Feedback",
  variant = "default",
}: SubmitFeedbackProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    boardSlug: boards[0]?.slug || "",
    title: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      saveReturnUrl();
      setOpen(false);
      router.push("/login");
      return;
    }

    if (!formData.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your feedback.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.boardSlug) {
      toast({
        title: "Board required",
        description: "Please select a board for your feedback.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await postService.createPost(formData.boardSlug, {
        title: formData.title,
        description: formData.description,
      });

      toast({
        title: "Feedback submitted!",
        description: "Thank you for your feedback.",
      });

      // Reset form
      setFormData({
        boardSlug: boards[0]?.slug || "",
        title: "",
        description: "",
      });

      setOpen(false);

      // Refresh the page to show the new post
      router.refresh();
    } catch (error: any) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message ||
          "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          className={
            variant === "outline"
              ? "border-border bg-background text-primary hover:bg-muted hover:text-primary"
              : ""
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          {buttonText}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle className="font-headline text-xl font-semibold tracking-tight">
            Submit Feedback
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {isAuthenticated
              ? "Share your ideas, suggestions, or report issues."
              : "Please sign in to submit feedback."}
          </DialogDescription>
        </DialogHeader>

        {!isAuthenticated ? (
          <div className="py-4">
            <Button
              onClick={() => {
                saveReturnUrl();
                setOpen(false);
                router.push("/login");
              }}
              className="w-full"
            >
              Sign In to Submit Feedback
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Board Selection */}
            <div className="space-y-2">
              <Label htmlFor="board" className="text-sm font-medium">
                Board *
              </Label>
              <Select
                value={formData.boardSlug}
                onValueChange={(value) =>
                  setFormData({ ...formData, boardSlug: value })
                }
                disabled={boards.length === 0}
              >
                <SelectTrigger id="board">
                  <SelectValue placeholder="Select a board" />
                </SelectTrigger>
                <SelectContent>
                  {boards.map((board) => (
                    <SelectItem key={board.id} value={board.slug}>
                      <div className="flex items-center gap-2">
                        <IconDisplay
                          iconName={board.icon}
                          className="h-4 w-4"
                        />
                        <span>{board.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {boards.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No boards available
                </p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Title *
              </Label>
              <Input
                id="title"
                placeholder="Enter a clear, concise title…"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                maxLength={200}
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description (optional)
              </Label>
              <Textarea
                id="description"
                placeholder="Provide more details about your feedback…"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                maxLength={5000}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-primary text-primary-foreground"
                disabled={isSubmitting || boards.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />
                    Submitting…
                  </>
                ) : (
                  "Submit Feedback"
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
