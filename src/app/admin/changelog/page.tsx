"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Search,
  Trash2,
  Bold,
  Italic,
  Code,
  ListOrdered,
  List,
  Link,
  Image,
  Sparkles,
  Wrench,
  CheckCircle2,
  X,
  Edit,
  Filter,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { changelogService, Changelog } from "@/services/changelogService";
import { formatDistanceToNow, format, parseISO } from "date-fns";
import ReactMarkdown from "react-markdown";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
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

export default function ChangelogPage() {
  const { toast } = useToast();
  const [changelogs, setChangelogs] = useState<Changelog[]>([]);
  const [filteredChangelogs, setFilteredChangelogs] = useState<Changelog[]>([]);
  const [selectedChangelog, setSelectedChangelog] = useState<Changelog | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState({
    new: true,
    improved: true,
    fixed: true,
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "new" as "new" | "improved" | "fixed",
    status: "draft" as "draft" | "published",
    labels: [] as string[],
  });
  const [newLabel, setNewLabel] = useState("");

  const changelogRefs = useRef<(HTMLElement | null)[]>([]);
  const dateHeaderRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    fetchChangelogs();
  }, []);

  useEffect(() => {
    let filtered = [...changelogs];

    if (searchQuery) {
      filtered = filtered.filter((changelog) =>
        changelog.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    filtered = filtered.filter((changelog) => {
      if (changelog.type === "new") return filterType.new;
      if (changelog.type === "improved") return filterType.improved;
      if (changelog.type === "fixed") return filterType.fixed;
      return false;
    });

    setFilteredChangelogs(filtered);
  }, [changelogs, searchQuery, filterType]);

  useEffect(() => {
    if (!loading && filteredChangelogs.length > 0) {
      // Staggered reveal animation
      gsap.fromTo(
        changelogRefs.current,
        {
          opacity: 0,
          y: 20,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.4,
          stagger: 0.08,
          ease: "power2.out",
          clearProps: "all",
        }
      );
    }
  }, [loading, filteredChangelogs]);

  const fetchChangelogs = async () => {
    try {
      setLoading(true);
      const response = await changelogService.getAllChangelogs();
      if (response && response.data && Array.isArray(response.data.changelogs)) {
        setChangelogs(response.data.changelogs);
      } else {
        setChangelogs([]);
      }
    } catch (error: any) {
      setChangelogs([]);
      toast({
        title: "Error",
        description: error.response?.data?.message || error.message || "Failed to load changelogs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setSelectedChangelog(null);
    setIsEditorOpen(true);
    setFormData({
      title: "",
      content: "",
      type: "new",
      status: "draft",
      labels: [],
    });
  };

  const handleEditChangelog = (changelog: Changelog) => {
    setIsCreating(false);
    setSelectedChangelog(changelog);
    setIsEditorOpen(true);
    setFormData({
      title: changelog.title,
      content: changelog.content,
      type: changelog.type,
      status: changelog.status,
      labels: changelog.labels || [],
    });
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setIsCreating(false);
  };

  const handleSave = async () => {
    try {
      if (!formData.title || !formData.content) {
        toast({
          title: "Validation Error",
          description: "Title and content are required",
          variant: "destructive",
        });
        return;
      }

      if (selectedChangelog) {
        await changelogService.updateChangelog(selectedChangelog.id, formData);
        toast({
          title: "Success",
          description: "Changelog updated successfully",
        });
      } else {
        const response = await changelogService.createChangelog(formData);
        toast({
          title: "Success",
          description: "Changelog created successfully",
        });
        setSelectedChangelog(response.data.changelog);
      }

      setIsCreating(false);
      setIsEditorOpen(false);
      fetchChangelogs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to save changelog",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedChangelog) return;
    if (!confirm("Are you sure you want to delete this changelog?")) return;

    try {
      await changelogService.deleteChangelog(selectedChangelog.id);
      toast({
        title: "Success",
        description: "Changelog deleted successfully",
      });
      setSelectedChangelog(null);
      setIsCreating(false);
      setIsEditorOpen(false);
      fetchChangelogs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete changelog",
        variant: "destructive",
      });
    }
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

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

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

  // Group changelogs by date
  const groupedChangelogs = filteredChangelogs.reduce((acc, changelog) => {
    const date = changelog.published_at
      ? format(parseISO(changelog.published_at), "MMMM yyyy")
      : "Draft";
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(changelog);
    return acc;
  }, {} as Record<string, Changelog[]>);

  const dateGroups = Object.entries(groupedChangelogs);

  return (
    <div className="flex-1 overflow-hidden bg-background">
      {/* Hero Header */}
      <div className="border-b border-border/50 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-3xl mx-auto px-4 py-10">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground mb-3">
                Changelog
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                New features, improvements, and fixes. Follow our journey as we build better tools for your team.
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex items-center gap-3 mt-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search updates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/60 border-border/50 focus:bg-background"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
            >
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button onClick={handleCreateNew} size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              New Entry
            </Button>
          </div>

          {/* Type Filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-2 mt-4 p-4 bg-muted/30 rounded-lg border border-border/50">
              {Object.entries(TYPE_CONFIG).map(([key, config]) => {
                const Icon = config.icon;
                const isActive = filterType[key as keyof typeof filterType];
                return (
                  <button
                    key={key}
                    onClick={() =>
                      setFilterType({
                        ...filterType,
                        [key]: !isActive,
                      })
                    }
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                      isActive
                        ? `${config.bgColor} ${config.textColor} ${config.borderColor} border`
                        : "bg-background/50 text-muted-foreground hover:bg-background"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {config.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Timeline Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-8">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="text-center">
                <div className="w-8 h-8 border-2 border-muted-foreground/20 border-t-foreground rounded-full animate-spin mx-auto mb-4" />
                <p className="text-sm text-muted-foreground">Loading changelog...</p>
              </div>
            </div>
          ) : filteredChangelogs.length === 0 ? (
            <div className="flex items-center justify-center py-24">
              <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">No updates yet</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Start documenting your product journey by creating your first changelog entry.
                </p>
                <Button onClick={handleCreateNew} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Entry
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline Spine */}
              <div className="absolute left-[19px] top-8 bottom-0 w-[2px] bg-gradient-to-b from-border via-border to-transparent" />

              {/* Changelog Entries */}
              <div className="space-y-8">
                {dateGroups.map(([date, logs], groupIndex) => (
                  <div key={date}>
                    {/* Date Header */}
                    <div
                      ref={(el) => (dateHeaderRefs.current[groupIndex] = el)}
                      className="sticky top-0 z-10 -mx-6 px-6 py-3 bg-background/80 backdrop-blur-sm border-b border-border/50 mb-8"
                    >
                      <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        {date}
                      </h2>
                    </div>

                    {/* Changelog Items */}
                    <div className="space-y-6">
                      {logs.map((changelog, index) => {
                        const config = TYPE_CONFIG[changelog.type];
                        const Icon = config.icon;
                        const globalIndex = groupIndex * 100 + index;

                        return (
                          <article
                            key={changelog.id}
                            ref={(el) => (changelogRefs.current[globalIndex] = el)}
                            className="relative pl-14 group transition-all duration-300 hover:translate-x-1"
                          >
                            {/* Timeline Node */}
                            <div className={`absolute left-0 top-0 w-10 h-10 rounded-full ${config.bgColor} border-2 ${config.borderColor} flex items-center justify-center shadow-sm`}>
                              <Icon className={`h-5 w-5 ${config.textColor}`} />
                            </div>

                            {/* Edit Button */}
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute -top-2 right-0 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleEditChangelog(changelog)}
                            >
                              <Edit className="h-4 w-4 text-muted-foreground" />
                            </Button>

                            {/* Header */}
                            <div className="mb-4">
                              <div className="flex items-start gap-3 mb-2">
                                <h3 className="text-lg font-semibold text-foreground leading-tight flex-1">
                                  {changelog.title}
                                </h3>
                                {changelog.status === "draft" && (
                                  <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-600 border-yellow-200">
                                    Draft
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${config.textColor} ${config.bgColor} ${config.borderColor} border`}
                                >
                                  {config.label}
                                </Badge>
                                <span>
                                  {changelog.published_at
                                    ? formatDistanceToNow(new Date(changelog.published_at), {
                                        addSuffix: true,
                                      })
                                    : "Not published"}
                                </span>
                              </div>
                            </div>

                            {/* Content */}
                            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:text-muted-foreground prose-headings:text-foreground prose-a:text-primary prose-strong:text-foreground">
                              <ReactMarkdown
                                components={{
                                  img: ({ node, ...props }) => (
                                    <img
                                      {...props}
                                      className="rounded-lg my-4 max-w-full h-auto"
                                      style={{ maxWidth: "388px", maxHeight: "388px", objectFit: "cover" }}
                                    />
                                  ),
                                }}
                              >
                                {changelog.content}
                              </ReactMarkdown>
                            </div>

                            {/* Labels */}
                            {changelog.labels && changelog.labels.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-4">
                                {changelog.labels.map((label, idx) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className="text-xs bg-muted/50 text-muted-foreground"
                                  >
                                    {label}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </article>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Editor Panel */}
      {isEditorOpen && (
        <div className="fixed top-0 right-0 w-[480px] h-screen border-l border-border flex flex-col bg-background shadow-2xl z-50">
          <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCloseEditor}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
              <h2 className="text-sm font-semibold">
                {isCreating ? "New Entry" : "Edit Entry"}
              </h2>
            </div>
            <Button
              onClick={handleSave}
              disabled={!formData.title || !formData.content}
              size="sm"
            >
              {formData.status === "published" ? "Publish" : "Save Draft"}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div>
              <Label className="text-sm font-medium mb-2 block">Title</Label>
              <Input
                placeholder="What's new?"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

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

            <div>
              <Label className="text-sm font-medium mb-2 block">Content</Label>
              <div className="border border-border rounded-lg overflow-hidden">
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
                  <div className="w-px h-4 bg-border mx-1" />
                  <Button variant="ghost" size="sm" onClick={handleImageUpload} className="h-7 w-7 p-0">
                    <Image className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Textarea
                  ref={textareaRef}
                  placeholder="Describe the update in detail..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={14}
                  className="border-0 resize-none focus-visible:ring-0 font-mono text-sm"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Markdown supported. <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl+B</kbd> bold, <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs">Ctrl+I</kbd> italic
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium mb-2 block">Labels (optional)</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add label..."
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addLabel();
                    }
                  }}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.labels.map((label, idx) => (
                  <Badge key={idx} variant="outline" className="gap-1">
                    {label}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-foreground"
                      onClick={() => removeLabel(label)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border">
              <Label className="text-sm font-medium">Status</Label>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setFormData({
                    ...formData,
                    status: formData.status === "published" ? "draft" : "published",
                  })
                }
              >
                {formData.status === "published" ? "Published" : "Draft"}
              </Button>
            </div>

            {selectedChangelog && (
              <Button
                onClick={handleDelete}
                variant="outline"
                className="w-full border-red-500/50 text-red-600 hover:bg-red-500/10"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Entry
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}