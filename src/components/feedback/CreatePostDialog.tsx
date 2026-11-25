"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ShellIcon } from "@/components/shell/ShellIcon";
import { Check, ChevronDown, Loader2, Paperclip, Tag, X } from "lucide-react";
import { postService, Post } from "@/services/postService";
import { useToast } from "@/hooks/use-toast";
import { TokenManager } from "@/lib/tokenManager";
import { useOrganization } from "@/context/OrganizationContext";
import api from "@/lib/api";
import "../ui/dialog-forms.css";

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
  const { organization } = useOrganization();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
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
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [labels, setLabels] = useState<{ id: string; name: string }[]>([]);
  const defaultCategories = [
    { id: "1", name: "Feature Request" },
    { id: "2", name: "Bug Report" },
    { id: "3", name: "General Feedback" },
  ];

  // Fetch labels from API when dialog opens, fall back to defaults
  useEffect(() => {
    if (!open || !organization?.id) return;

    let cancelled = false;
    api
      .get(`/api/organizations/${organization.id}/labels`)
      .then((res) => {
        if (!cancelled && res.data?.data?.labels?.length) {
          setLabels(res.data.data.labels);
        }
      })
      .catch(() => {
        // Fall back to defaults on error (auth failure, network, etc.)
      });

    return () => {
      cancelled = true;
    };
  }, [open, organization?.id]);

  const predefinedCategories = labels.length > 0 ? labels : defaultCategories;

  // Handle category selection
  const handleCategoryChange = (value: string) => {
    if (value === "custom") {
      setShowCustomCategory(true);
      setFormData({ ...formData, category: "" });
    } else if (value === "") {
      setShowCustomCategory(false);
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
    setSubmitError(null);

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
      setSubmitError(null);
    } catch (error: any) {
      // Prefer the server message (e.g. the VISITED org's post-limit 403)
      // over the generic axios error text.
      setSubmitError(
        error?.response?.data?.message ||
          error.message ||
          "Failed to create post"
      );
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
    if (submitError) {
      setSubmitError(null);
    }
  };

  // Handle file upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setFileError(null);

    if (formData.images.length + files.length > 5) {
      setFileError("You can attach up to 5 images per post.");
      return;
    }

    setUploading(true);

    try {
      const newImageUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!file.type.startsWith("image/")) {
          setFileError(`${file.name} is not an image. Attach JPG, PNG, GIF, or WebP.`);
          continue;
        }

        if (file.size > 5 * 1024 * 1024) {
          setFileError(`${file.name} exceeds the 5 MB limit. Try a smaller image.`);
          continue;
        }

        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        uploadFormData.append("folder", "posts");

        const token = TokenManager.getAccessToken();
        if (!token) throw new Error("Not authenticated");

        const response = await fetch("/api/upload/image", {
          method: "POST",
          body: uploadFormData,
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Upload failed");

        const data = await response.json();
        newImageUrls.push(data.data.url);
      }

      setFormData({ ...formData, images: [...formData.images, ...newImageUrls] });
      toast({ title: "Image uploaded", description: `${newImageUrls.length} file${newImageUrls.length > 1 ? 's' : ''} attached.` });
    } catch (error: any) {
      setFileError(error.message || "Could not upload the image. Try again.");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) });
  };

  const categoryLabel = showCustomCategory
    ? customCategory.trim() || "Custom…"
    : formData.category || "No category";
  const categoryIsSet = showCustomCategory
    ? Boolean(customCategory.trim())
    : Boolean(formData.category);
  const canCreate = Boolean(formData.title.trim());
  const inlineErrors = [
    errors.title,
    errors.description,
    fileError,
    submitError,
  ].filter((message): message is string => Boolean(message));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="fd post-dialog w-[560px] max-w-[calc(100vw-32px)] gap-0 border-0 bg-transparent p-0 shadow-none [&>button]:hidden"
        overlayClassName="bg-black/45"
        aria-describedby={undefined}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          titleInputRef.current?.focus();
        }}
      >
        <div className="fd__shell">
          <form onSubmit={handleSubmit} className="fd__form" noValidate>
            <header className="fd__head">
              <div className="fd__headtext">
                <DialogTitle className="fd__title">New post</DialogTitle>
                <p className="post-board">
                  Posting to <span>{boardSlug}</span>
                </p>
              </div>
              <DialogClose type="button" className="fd__close" aria-label="Close">
                <ShellIcon icon={X} />
              </DialogClose>
            </header>

            <div className="fd__body post-dialog__body">
              <div className="post-dialog__field">
                <input
                  id="post-title"
                  ref={titleInputRef}
                  className="post-title-input"
                  placeholder="A short, specific title"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  maxLength={500}
                  aria-label="Title (required)"
                  aria-required="true"
                  aria-invalid={!!errors.title}
                  aria-describedby="post-title-help"
                />
                <div className="post-dialog__hint" id="post-title-help">
                  <span className="post-dialog__count">{formData.title.length}/500</span>
                </div>
              </div>

              <div className="post-dialog__field">
                <textarea
                  id="post-description"
                  className="post-description"
                  placeholder="What happened, what you expected, and what would help."
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={5}
                  maxLength={5000}
                  aria-label="Description (optional)"
                  aria-invalid={!!errors.description}
                  aria-describedby="post-description-help"
                />
                <div className="post-dialog__hint" id="post-description-help">
                  <span className="post-dialog__count">{formData.description.length}/5000</span>
                </div>
              </div>

              <div className="post-chips">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="post-chip"
                      aria-label={`Category: ${categoryLabel}`}
                    >
                      <ShellIcon icon={Tag} />
                      <span
                        className={
                          categoryIsSet
                            ? "post-chip__value"
                            : "post-chip__value post-chip__value--muted"
                        }
                      >
                        {categoryLabel}
                      </span>
                      <ShellIcon icon={ChevronDown} className="post-chip__chevron" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    sideOffset={6}
                    className="post-cat-menu w-auto min-w-[220px] max-w-[min(280px,calc(100vw-32px))] p-1 rounded-md border border-border bg-popover shadow-none !z-[calc(var(--z-modal,400)+10)]"
                  >
                    <DropdownMenuItem
                      className={
                        !formData.category && !showCustomCategory
                          ? "post-cat-option is-selected"
                          : "post-cat-option"
                      }
                      onSelect={() => handleCategoryChange("")}
                    >
                      <span>No category</span>
                      {!formData.category && !showCustomCategory && (
                        <ShellIcon icon={Check} className="post-cat-option__check" />
                      )}
                    </DropdownMenuItem>
                    {predefinedCategories.map((category) => {
                      const selected =
                        !showCustomCategory && formData.category === category.name;
                      return (
                        <DropdownMenuItem
                          key={category.id}
                          className={
                            selected ? "post-cat-option is-selected" : "post-cat-option"
                          }
                          onSelect={() => handleCategoryChange(category.name)}
                        >
                          <span>{category.name}</span>
                          {selected && (
                            <ShellIcon icon={Check} className="post-cat-option__check" />
                          )}
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuItem
                      className={
                        showCustomCategory
                          ? "post-cat-option is-selected"
                          : "post-cat-option"
                      }
                      onSelect={() => handleCategoryChange("custom")}
                    >
                      <span>Custom…</span>
                      {showCustomCategory && (
                        <ShellIcon icon={Check} className="post-cat-option__check" />
                      )}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <button
                  type="button"
                  className="post-chip"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading || formData.images.length >= 5}
                  aria-label={`Attach images, ${formData.images.length} of 5`}
                >
                  {uploading ? (
                    <ShellIcon icon={Loader2} className="animate-spin" />
                  ) : (
                    <ShellIcon icon={Paperclip} />
                  )}
                  <span>Attach images</span>
                  <span className="post-chip__count">{formData.images.length} of 5</span>
                </button>
              </div>

              {showCustomCategory && (
                <input
                  className="post-custom"
                  aria-label="Custom category"
                  placeholder="Name the category"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  maxLength={100}
                />
              )}

              {formData.images.length > 0 && (
                <div className="post-images">
                  {formData.images.map((url, index) => (
                    <div className="post-thumb" key={`${url}-${index}`}>
                      <img src={url} alt={`Attachment ${index + 1}`} />
                      <button
                        type="button"
                        className="post-thumb__remove"
                        onClick={() => removeImage(index)}
                        aria-label={`Remove image ${index + 1}`}
                      >
                        <ShellIcon icon={X} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                tabIndex={-1}
                onChange={(e) => handleFileUpload(e.target.files)}
              />
            </div>

            {inlineErrors.length > 0 && (
              <div className="post-dialog__errors" role="alert">
                {inlineErrors.map((message, index) => (
                  <p key={`${index}-${message}`}>{message}</p>
                ))}
              </div>
            )}

            <footer className="fd__foot">
              <button
                type="button"
                className="fd-btn fd-btn--quiet"
                onClick={() => onOpenChange(false)}
                disabled={creating}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="fd-btn fd-btn--primary fd-btn--commit"
                disabled={creating || !canCreate}
                aria-busy={creating}
              >
                {creating ? (
                  <>
                    <ShellIcon icon={Loader2} className="animate-spin" />
                    Creating…
                  </>
                ) : (
                  "Create post"
                )}
              </button>
            </footer>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
