"use client";

import { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChevronDown, Loader2, Paperclip, X } from "lucide-react";
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
  const [labels, setLabels] = useState<{ id: string; name: string }[]>([]);
  const [catOpen, setCatOpen] = useState(false);
  const catRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!catOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (catRef.current && !catRef.current.contains(e.target as Node)) {
        setCatOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [catOpen]);

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
        // Prefer the server message (e.g. the VISITED org's post-limit 403)
        // over the generic axios error text.
        description:
          error?.response?.data?.message ||
          error.message ||
          "Failed to create post",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="fd post-dialog w-[min(92vw,760px)] max-w-none gap-0 border-0 bg-transparent p-0 shadow-none [&>button]:hidden"
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
                <X className="h-4 w-4" aria-hidden="true" />
              </DialogClose>
            </header>

            <div className="fd__body post-body">
              <div className="post-main">
                <div className="fd-field">
                  <div className="fd-field__top">
                    <label className="fd-label" htmlFor="post-title">
                      Title
                    </label>
                    <span className="fd-req">Required</span>
                  </div>
                  <input
                    id="post-title"
                    ref={titleInputRef}
                    className="fd-input post-title-input"
                    placeholder="A short, specific title"
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    maxLength={500}
                    aria-required="true"
                    aria-invalid={!!errors.title}
                    aria-describedby="post-title-help"
                  />
                  <div className="fd-help" id="post-title-help">
                    <span className={errors.title ? "fd-error" : undefined}>
                      {errors.title || "Name the change or problem in one line."}
                    </span>
                    <span className="fd-count">{formData.title.length}/500</span>
                  </div>
                </div>

                <div className="fd-field">
                  <div className="fd-field__top">
                    <label className="fd-label" htmlFor="post-description">
                      Description
                    </label>
                    <span className="fd-opt">Optional</span>
                  </div>
                  <textarea
                    id="post-description"
                    className="fd-textarea post-description"
                    placeholder="What happened, what you expected, and what would help."
                    value={formData.description}
                    onChange={(e) => handleChange("description", e.target.value)}
                    rows={7}
                    maxLength={5000}
                    aria-invalid={!!errors.description}
                    aria-describedby="post-description-help"
                  />
                  <div className="fd-help" id="post-description-help">
                    <span className={errors.description ? "fd-error" : undefined}>
                      {errors.description || "Add the detail that helps someone reproduce it."}
                    </span>
                    <span className="fd-count">{formData.description.length}/5000</span>
                  </div>
                </div>
              </div>

              <aside className="post-rail" aria-label="Post details">
                <div className="fd-field">
                  <div className="fd-field__top">
                    <span className="fd-label">Category</span>
                    <span className="fd-opt">Optional</span>
                  </div>
                  <div className="post-cat-select" ref={catRef}>
                    <button
                      type="button"
                      className="post-cat-trigger"
                      aria-haspopup="listbox"
                      aria-expanded={catOpen}
                      onClick={() => setCatOpen((o) => !o)}
                    >
                      <span className={
                        !formData.category && !showCustomCategory
                          ? "post-cat-placeholder"
                          : "post-cat-value"
                      }>
                        {showCustomCategory
                          ? (customCategory.trim() || "Custom…")
                          : formData.category || "No category"}
                      </span>
                      <ChevronDown
                        className="post-cat-chevron"
                        aria-hidden="true"
                      />
                    </button>

                    {catOpen && (
                      <ul className="post-cat-menu" role="listbox" aria-label="Category">
                        <li
                          role="option"
                          aria-selected={!formData.category && !showCustomCategory}
                          className="post-cat-option"
                          onClick={() => { handleCategoryChange(""); setCatOpen(false); }}
                        >
                          No category
                        </li>
                        {predefinedCategories.map((category) => (
                          <li
                            key={category.id}
                            role="option"                            aria-selected={!showCustomCategory && formData.category === category.name}
                            className="post-cat-option"
                            onClick={() => { handleCategoryChange(category.name); setCatOpen(false); }}
                          >
                            {category.name}
                          </li>
                        ))}
                        <li
                          role="option"
                          aria-selected={showCustomCategory}
                          className="post-cat-option"
                          onClick={() => { handleCategoryChange("custom"); setCatOpen(false); }}
                        >
                          Custom…
                        </li>
                      </ul>
                    )}
                  </div>
                  {showCustomCategory && (
                    <input
                      className="fd-input post-custom"
                      aria-label="Custom category"
                      placeholder="Name the category"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      maxLength={100}
                    />
                  )}
                </div>

                <div className="fd-field">
                  <div className="fd-field__top">
                    <span className="fd-label">Images</span>
                    <span className="fd-opt">Up to 5</span>
                  </div>
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
                          <X className="h-3 w-3" aria-hidden="true" />
                        </button>
                      </div>
                    ))}
                    {formData.images.length < 5 && (
                      <button
                        type="button"
                        className="post-add"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        aria-label="Add an image"
                      >
                        {uploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                        ) : (
                          <Paperclip className="h-4 w-4" aria-hidden="true" />
                        )}
                        <span>{uploading ? "Uploading" : "Add"}</span>
                      </button>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    tabIndex={-1}
                    onChange={(e) => handleFileUpload(e.target.files)}
                  />
                  <div className="fd-help">
                    <span>{formData.images.length} of 5 attached</span>
                  </div>
                  {fileError && (
                    <p className="fd-error post-file-error" role="alert">
                      {fileError}
                    </p>
                  )}
                </div>
              </aside>
            </div>

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
                disabled={creating}
                aria-busy={creating}
              >
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
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
