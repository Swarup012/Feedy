"use client";

import { useState } from "react";
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
import { Loader2 } from "lucide-react";
import { postService, Post } from "@/services/postService";
import { useToast } from "@/hooks/use-toast";

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardSlug: string;
  onPostCreated: (post: Post) => void;
}

export function CreatePostDialog({
  open,
  onOpenChange,
  boardSlug,
  onPostCreated,
}: CreatePostDialogProps) {
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 5) {
      newErrors.title = "Title must be at least 5 characters";
    } else if (formData.title.length > 500) {
      newErrors.title = "Title must be less than 500 characters";
    }

    if (formData.description && formData.description.length > 5000) {
      newErrors.description = "Description must be less than 5000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setCreating(true);
      const response = await postService.createPost(boardSlug, formData);

      onPostCreated(response.data.post);

      // Reset form
      setFormData({ title: "", description: "" });
      setErrors({});
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  // Handle input change
  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
            <DialogDescription>
              Share your feedback, ideas, or report issues
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Brief description of your feedback"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                maxLength={500}
                className={errors.title ? "border-red-500" : ""}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title}</p>
              )}
              <p className="text-xs text-gray-500">
                {formData.title.length}/500 characters
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Provide more details about your feedback..."
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={6}
                maxLength={5000}
                className={errors.description ? "border-red-500" : ""}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
              <p className="text-xs text-gray-500">
                {formData.description.length}/5000 characters
              </p>
            </div>

            {/* Tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800 font-medium mb-1">
                💡 Tips for good feedback:
              </p>
              <ul className="text-xs text-blue-700 space-y-1 ml-4 list-disc">
                <li>Be clear and specific</li>
                <li>Explain why this matters to you</li>
                <li>Include examples if relevant</li>
              </ul>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Post"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
