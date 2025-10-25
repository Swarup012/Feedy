"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Board } from "@/services/boardService";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface SubmitFeedbackProps {
  boards?: Board[];
}

export function SubmitFeedback({ boards = [] }: SubmitFeedbackProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const handleSubmit = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }

    // Redirect to admin dashboard to submit feedback
    router.push("/admin/feedback");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Submit Feedback
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Submit Feedback</DialogTitle>
          <DialogDescription>
            {isAuthenticated
              ? "You will be redirected to the feedback dashboard to submit your feedback."
              : "Please sign in to submit feedback."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {boards.length > 0 && (
            <div className="text-sm text-gray-600">
              Available boards:{" "}
              {boards.map((b) => b.icon + " " + b.name).join(", ")}
            </div>
          )}
          <Button onClick={handleSubmit} className="w-full">
            {isAuthenticated ? "Go to Dashboard" : "Sign In"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
