"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Sparkles,
  Wrench,
  CheckCircle2,
  Bold,
  Italic,
  Code,
  Link,
  List,
  ListOrdered,
  Image as ImageIcon,
} from "lucide-react";
import { changelogService } from "@/services/changelogService";
import { useToast } from "@/hooks/use-toast";

interface CompletionChangelogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postTitle: string;
  postDescription?: string;
  postId: string;
  onChangelogCreated?: (changelogId: string) => void;
  onSkip?: () => void;
}

const TYPE_CONFIG = {
  new: {
    label: "New",
    icon: Sparkles,
    badgeColor: "bg-blue-500",
    textColor: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-50 dark:bg-blue-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
  },
  improved: {
    label: "Improved",
    icon: Wrench,
    badgeColor: "bg-purple-500",
    textColor: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-50 dark:bg-purple-950/30",
    borderColor: "border-purple-200 dark:border-purple-800",
  },
  fixed: {
    label: "Fixed",
    icon: CheckCircle2,
    badgeColor: "bg-green-500",
    textColor: "text-green-600 dark:text-green-400",
    bgColor: "bg-green-50 dark:bg-green-950/30",
    borderColor: "border-green-200 dark:border-green-800",
  },
};

export function CompletionChangelogDialog({
  open,
  onOpenChange,
  postTitle,
  postDescription,
  postId,
  onChangelogCreated,
  onSkip,
}: CompletionChangelogDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Pre-populate form with post data
  const [formData, setFormData] = useState({
    title: postTitle,
    content: postDescription 
      ? `We're excited to announce that **${postTitle}** is now complete!\n\n${postDescription}\n\nThank you for your feedback and support!`
      : `We're excited to announce that **${postTitle}** is now complete!\n\nThank you for your feedback and support!`,
    type: "new" as "new" | "improved" | "fixed",
    status: "published" as "draft" | "published",
    labels: [] as string[],
    linked_posts: [postId],
  });

  const [newLabel, setNewLabel] = useState("");

  const insertMarkdown = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.content.substring(start, end);
    const newText =
      formData.content.substring(0, start) +
      before +
      selectedText +
      after +
      formData.content.substring(end);

    setFormData({ ...formData, content: newText });

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleBold = () => insertMarkdown("**", "**");
  const handleItalic = () => insertMarkdown("*", "*");
  const handleCode = () => insertMarkdown("`", "`");
  const handleLink = () => {
    const url = prompt("Enter URL:");
    if (url) insertMarkdown("[", `](${url})`);
  };
  const handleList = () => insertMarkdown("\n- ", "");
  const handleOrderedList = () => insertMarkdown("\n1. ", "");

  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      toast({
        title: "Uploading image...",
        description: "Please wait while we upload your image",
      });

      try {
        const { uploadService } = await import("@/services/uploadService");
        const imageUrl = await uploadService.uploadImage(file, "changelog");
        insertMarkdown(`\n![Image](${imageUrl})\n`, "");
        toast({
          title: "Success",
          description: "Image uploaded successfully",
        });
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.response?.data?.error || "Failed to upload image",
          variant: "destructive",
        });
      }
    };
    input.click();
  };

  const addLabel = () => {
    if (newLabel && !formData.labels.includes(newLabel)) {
      setFormData({
        ...formData,
        labels: [...formData.labels, newLabel],
      });
      setNewLabel("");
    }
  };

  const removeLabel = (label: string) => {
    setFormData({
      ...formData,
      labels: formData.labels.filter((l) => l !== label),
    });
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for the changelog",
        variant: "destructive",
      });
      return;
    }

    if (!formData.content.trim()) {
      toast({
        title: "Content required",
        description: "Please enter content for the changelog",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await changelogService.createChangelog(formData);

      if (response.success) {
        toast({
          title: "Changelog created!",
          description: "The changelog entry has been published successfully.",
        });

        if (onChangelogCreated) {
          onChangelogCreated(response.data.changelog.id);
        }

        onOpenChange(false);
      }
    } catch (error: any) {
      console.error("Error creating changelog:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create changelog",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (onSkip) {
      onSkip();
    }
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed top-0 right-0 w-[480px] h-screen border-l border-border flex flex-col bg-background shadow-2xl z-50">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-sm font-semibold">Create Changelog Entry</h2>
            <p className="text-xs text-muted-foreground">Post marked as completed</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            disabled={loading}
          >
            Skip
          </Button>
          <Button
            onClick={handleSave}
            disabled={!formData.title || !formData.content || loading}
            size="sm"
          >
            {loading
              ? "Saving..."
              : formData.status === "published"
              ? "Publish"
              : "Save Draft"}
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Title */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Title</Label>
          <Input
            placeholder="What's new?"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
        </div>

        {/* Type */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Type</Label>
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(TYPE_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              const isSelected = formData.type === key;
              return (
                <button
                  key={key}
                  onClick={() => setFormData({ ...formData, type: key as any })}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                    isSelected
                      ? `${config.bgColor} ${config.borderColor} border-2`
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${isSelected ? config.textColor : "text-muted-foreground"}`} />
                  <span className={`text-xs font-medium ${isSelected ? config.textColor : "text-muted-foreground"}`}>
                    {config.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content with Markdown Toolbar */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Content</Label>
          <div className="border border-border rounded-lg overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/30">
              <Button variant="ghost" size="sm" onClick={handleBold} className="h-7 w-7 p-0">
                <Bold className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleItalic} className="h-7 w-7 p-0">
                <Italic className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleCode} className="h-7 w-7 p-0">
                <Code className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLink} className="h-7 w-7 p-0">
                <Link className="h-3.5 w-3.5" />
              </Button>
              <div className="w-px h-4 bg-border mx-1" />
              <Button variant="ghost" size="sm" onClick={handleList} className="h-7 w-7 p-0">
                <List className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleOrderedList} className="h-7 w-7 p-0">
                <ListOrdered className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleImageUpload} className="h-7 w-7 p-0">
                <ImageIcon className="h-3.5 w-3.5" />
              </Button>
            </div>
            {/* Textarea */}
            <Textarea
              ref={textareaRef}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Describe what's new, improved, or fixed..."
              className="border-0 focus-visible:ring-0 min-h-[200px] resize-none"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">Supports markdown formatting</p>
        </div>

        {/* Labels */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Labels (optional)</Label>
          <div className="flex gap-2">
            <Input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addLabel();
                }
              }}
              placeholder="Add a label..."
              className="text-sm"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={addLabel}
              disabled={!newLabel.trim()}
            >
              Add
            </Button>
          </div>
          {formData.labels.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.labels.map((label) => (
                <Badge key={label} variant="outline" className="text-xs gap-1">
                  {label}
                  <button
                    onClick={() => removeLabel(label)}
                    className="ml-1 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Status */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Status</Label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setFormData({ ...formData, status: "draft" })}
              className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                formData.status === "draft"
                  ? "bg-muted border-primary text-primary"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              Save as Draft
            </button>
            <button
              onClick={() => setFormData({ ...formData, status: "published" })}
              className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                formData.status === "published"
                  ? "bg-primary/10 border-primary text-primary"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              Publish Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
