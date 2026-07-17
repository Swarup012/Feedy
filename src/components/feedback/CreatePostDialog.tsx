"use client";

import { useState, useRef, useEffect } from "react";
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
import { Loader2, Paperclip, X, Sparkles } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { boardService, BoardCategory } from "@/services/boardService";
import { postService, Post } from "@/services/postService";
import { useToast } from "@/hooks/use-toast";
import { TokenManager } from "@/lib/tokenManager";

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "",
    images: [] as string[],
  });
  const [customCategory, setCustomCategory] = useState("");
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  const predefinedCategories = [
    { id: "1", name: "Feature Request" },
    { id: "2", name: "Bug Report" },
    { id: "3", name: "General Feedback" }
  ];

  // Handle category selection
  const handleCategoryChange = (value: string) => {
    if (value === "custom") {
      setShowCustomCategory(true);
      setFormData({ ...formData, category: "" });
    } else {
      setShowCustomCategory(false);
      setFormData({ ...formData, category: value });
    }
  };
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

    const finalCategory =
      showCustomCategory && customCategory.trim()
        ? customCategory.trim()
        : formData.category || undefined;

    try {
      setCreating(true);
      const response = await postService.createPost(boardSlug, {
        ...formData,
        category: finalCategory,
      });

      onPostCreated(response.data.post);

      // Reset form
      setFormData({ title: "", description: "", category: "", images: [] });
      setCustomCategory("");
      setShowCustomCategory(false);
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

  // Handle file upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    if (formData.images.length + files.length > 5) {
      toast({
        title: "Too many images",
        description: "Maximum 5 images allowed",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const newImageUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file.type.startsWith("image/")) {
          toast({ title: "Invalid file", description: `${file.name} is not an image`, variant: "destructive" });
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          toast({ title: "File too large", description: `${file.name} exceeds 5MB`, variant: "destructive" });
          continue;
        }

        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        uploadFormData.append("folder", "posts");

        const token = TokenManager.getAccessToken();
        if (!token) throw new Error("Not authenticated");

        const response = await fetch("http://localhost:3000/api/upload/image", {
          method: "POST",
          body: uploadFormData,
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Upload failed");

        const data = await response.json();
        newImageUrls.push(data.data.url);
      }

      setFormData({ ...formData, images: [...formData.images, ...newImageUrls] });
      toast({ title: "Success", description: `${newImageUrls.length} image(s) uploaded` });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) });
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

            {/* ✅ CATEGORY SELECTION */}
            <div className="space-y-2">
              <Label htmlFor="category">
                Category{" "}
                <span className="text-gray-500 text-sm font-normal">
                  (optional)
                </span>
              </Label>
              <Select
                value={showCustomCategory ? "custom" : formData.category}
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="null">No Category</SelectItem>
                      {predefinedCategories.map((category) => (
                        <SelectItem key={category.id} value={category.name}>
                          <span>{category.name}</span>
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          <span>Custom Category</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

              {/* Custom Category Input */}
              {showCustomCategory && (
                <Input
                  placeholder="Enter custom category"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  maxLength={100}
                />
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <div className="relative">
                <Textarea
                  id="description"
                  placeholder="Provide more details about your feedback..."
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={4}
                  maxLength={5000}
                  className={errors.description ? "border-red-500 pr-12" : "pr-12"}
                />
                {/* Attachment Button */}
                <div className="absolute bottom-2 right-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || formData.images.length >= 5}
                  >
                    {uploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Paperclip className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    )}
                  </Button>
                </div>
              </div>
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description}</p>
              )}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{formData.description.length}/5000 characters</span>
                {formData.images.length > 0 && (
                  <span>{formData.images.length}/5 images attached</span>
                )}
              </div>
            </div>

            {/* Image Previews */}
            {formData.images.length > 0 && (
              <div className="space-y-2">
                <Label>Attached Images</Label>
                <div className="grid grid-cols-4 gap-2">
                  {formData.images.map((url, index) => (
                    <div
                      key={index}
                      className="relative group aspect-square rounded-lg overflow-hidden border border-border"
                    >
                      <img
                        src={url}
                        alt={`Attachment ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
