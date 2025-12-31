"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Search,
  Settings,
  Trash2,
  Bold,
  Italic,
  Code,
  ListOrdered,
  List,
  Link as LinkIcon,
  Image as ImageIcon,
  Sparkles,
  Wrench,
  CheckCircle2,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { changelogService, Changelog } from "@/services/changelogService";
import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";

const TYPE_CONFIG = {
  new: {
    label: "New",
    icon: Sparkles,
    badgeColor: "bg-blue-500",
    textColor: "text-blue-500",
  },
  improved: {
    label: "Improved",
    icon: Wrench,
    badgeColor: "bg-purple-500",
    textColor: "text-purple-500",
  },
  fixed: {
    label: "Fixed",
    icon: CheckCircle2,
    badgeColor: "bg-green-500",
    textColor: "text-green-500",
  },
};

export default function ChangelogPage() {
  console.log("ChangelogPage component mounted");
  
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

  // Form state for editor
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "new" as "new" | "improved" | "fixed",
    status: "draft" as "draft" | "published",
    labels: [] as string[],
  });
  const [newLabel, setNewLabel] = useState("");

  useEffect(() => {
    console.log("useEffect running - about to fetch changelogs");
    fetchChangelogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Filter changelogs whenever dependencies change
    let filtered = [...changelogs];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((changelog) =>
        changelog.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    const typeNew = filterType.new;
    const typeImproved = filterType.improved;
    const typeFixed = filterType.fixed;
    
    filtered = filtered.filter(
      (changelog) => {
        if (changelog.type === 'new') return typeNew;
        if (changelog.type === 'improved') return typeImproved;
        if (changelog.type === 'fixed') return typeFixed;
        return false;
      }
    );

    setFilteredChangelogs(filtered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changelogs, searchQuery, filterType.new, filterType.improved, filterType.fixed]);

  const fetchChangelogs = async () => {
    try {
      setLoading(true);
      console.log("Fetching changelogs...");
      const response = await changelogService.getAllChangelogs();
      console.log("Changelogs response:", response);
      setChangelogs(response.data.changelogs || []);
    } catch (error: any) {
      console.error("Error fetching changelogs:", error);
      setChangelogs([]); // Set empty array on error
      toast({
        title: "Error",
        description: error.response?.data?.error || error.message || "Failed to load changelogs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setSelectedChangelog(null);
    setFormData({
      title: "",
      content: "",
      type: "new",
      status: "draft",
      labels: [],
    });
  };

  const handleSelectChangelog = (changelog: Changelog) => {
    setIsCreating(false);
    setSelectedChangelog(changelog);
    setFormData({
      title: changelog.title,
      content: changelog.content,
      type: changelog.type,
      status: changelog.status,
      labels: changelog.labels || [],
    });
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

  // Textarea ref for cursor position
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Insert markdown formatting
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

    // Reset cursor position
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Toolbar actions
  const handleBold = () => insertMarkdown("**", "**");
  const handleItalic = () => insertMarkdown("*", "*");
  const handleCode = () => insertMarkdown("`", "`");
  const handleLink = () => {
    const url = prompt("Enter URL:");
    if (url) insertMarkdown("[", `](${url})`);
  };
  const handleList = () => insertMarkdown("\n- ", "");
  const handleOrderedList = () => insertMarkdown("\n1. ", "");

  // Image upload handler
  const handleImageUpload = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      // Show loading toast
      toast({
        title: "Uploading image...",
        description: "Please wait while we upload your image",
      });

      try {
        // Import upload service
        const { uploadService } = await import("@/services/uploadService");
        const imageUrl = await uploadService.uploadImage(file, "changelog");
        
        // Insert markdown image
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

  const displayData = isCreating || selectedChangelog ? formData : null;

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[#0f1117]">
      {/* Left Sidebar - Changelog List */}
      <div className="w-80 border-r border-gray-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-medium text-white">Linked posts</h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <Search className="h-4 w-4" />
              Search
            </Button>
          </div>

          {/* Type Filters */}
          <div className="space-y-2">
            <Label className="text-xs text-gray-400 uppercase">Type</Label>
            <div className="space-y-2">
              {Object.entries(TYPE_CONFIG).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <div key={key} className="flex items-center space-x-2">
                    <Checkbox
                      id={key}
                      checked={filterType[key as keyof typeof filterType]}
                      onCheckedChange={(checked) =>
                        setFilterType({
                          ...filterType,
                          [key]: checked as boolean,
                        })
                      }
                    />
                    <label
                      htmlFor={key}
                      className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer"
                    >
                      <Icon className={`h-4 w-4 ${config.textColor}`} />
                      {config.label}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Labels Section */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-xs text-gray-400 uppercase">Labels</Label>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Settings className="h-3 w-3 text-gray-400" />
              </Button>
            </div>
          </div>
        </div>

        {/* Changelog List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : filteredChangelogs.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No changelogs found</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {filteredChangelogs.map((changelog) => (
                <div
                  key={changelog.id}
                  onClick={() => handleSelectChangelog(changelog)}
                  className={`p-4 cursor-pointer hover:bg-gray-900/50 transition-colors ${
                    selectedChangelog?.id === changelog.id ? "bg-gray-900" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center gap-1 mt-1">
                      <Badge
                        className={`${
                          TYPE_CONFIG[changelog.type].badgeColor
                        } text-white text-xs px-2 py-0.5`}
                      >
                        {TYPE_CONFIG[changelog.type].label}
                      </Badge>
                      {changelog.status === "draft" && (
                        <Badge className="bg-yellow-500/20 text-yellow-500 text-xs px-2 py-0.5">
                          Draft
                        </Badge>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-white truncate">
                        {changelog.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {changelog.status === "published"
                          ? "Unpublished"
                          : changelog.status === "draft"
                          ? "Unpublished"
                          : ""}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* New Entry Button */}
        <div className="p-4 border-t border-gray-800">
          <Button
            onClick={handleCreateNew}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Entry
          </Button>
        </div>
      </div>

      {/* Middle - Preview */}
      <div className="flex-1 overflow-y-auto bg-[#16181e] p-8">
        {displayData ? (
          <div className="max-w-3xl mx-auto">
            {/* Status Badge */}
            <div className="mb-4">
              <Badge
                className={`${
                  displayData.status === "published"
                    ? "bg-green-500/20 text-green-500"
                    : "bg-yellow-500/20 text-yellow-500"
                } text-xs px-2 py-1`}
              >
                {displayData.status === "published" ? "Published" : "Draft"}
              </Badge>
            </div>

            {/* Title */}
            <div className="flex items-start gap-3 mb-6">
              {TYPE_CONFIG[displayData.type] && (
                <div
                  className={`w-10 h-10 rounded-lg ${TYPE_CONFIG[displayData.type].badgeColor} flex items-center justify-center flex-shrink-0`}
                >
                  {React.createElement(TYPE_CONFIG[displayData.type].icon, {
                    className: "h-5 w-5 text-white",
                  })}
                </div>
              )}
              <h1 className="text-3xl font-bold text-white flex-1">
                {displayData.title || "Entry title"}
              </h1>
            </div>

            {/* Content */}
            <div className="prose prose-invert max-w-none">
              {displayData.content ? (
                <ReactMarkdown className="text-gray-300 leading-relaxed">
                  {displayData.content}
                </ReactMarkdown>
              ) : (
                <p className="text-gray-500">
                  Share recent product changes. Markdown supported.
                </p>
              )}
            </div>

            {/* Labels */}
            {displayData.labels && displayData.labels.length > 0 && (
              <div className="flex gap-2 mt-6">
                {displayData.labels.map((label, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs border-gray-700 text-gray-400"
                  >
                    {label}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <p className="mb-4">Select a changelog or create a new one</p>
              <Button onClick={handleCreateNew} className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="mr-2 h-4 w-4" />
                Create New Entry
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Right Sidebar - Editor */}
      <div className="w-96 border-l border-gray-800 flex flex-col">
        {/* Editor Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h2 className="text-sm font-medium text-white">Entry title</h2>
          <Button
            onClick={handleSave}
            disabled={!isCreating && !selectedChangelog}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4"
          >
            PUBLISH NOW
          </Button>
        </div>

        {/* Editor Content */}
        {(isCreating || selectedChangelog) && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Title Input */}
            <Input
              placeholder="Entry title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="bg-[#1a1d24] border-gray-700 text-white placeholder:text-gray-500"
            />

            {/* Toolbar */}
            <div className="flex items-center gap-1 border-b border-gray-800 pb-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                onClick={handleBold}
                type="button"
                title="Bold (Ctrl+B)"
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                onClick={handleItalic}
                type="button"
                title="Italic (Ctrl+I)"
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                onClick={handleCode}
                type="button"
                title="Code"
              >
                <Code className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                onClick={handleLink}
                type="button"
                title="Insert Link"
              >
                <LinkIcon className="h-4 w-4" />
              </Button>
              <div className="w-px h-6 bg-gray-700 mx-1" />
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                onClick={handleList}
                type="button"
                title="Bullet List"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                onClick={handleOrderedList}
                type="button"
                title="Numbered List"
              >
                <ListOrdered className="h-4 w-4" />
              </Button>
              <div className="w-px h-6 bg-gray-700 mx-1" />
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                onClick={handleImageUpload}
                type="button"
                title="Upload Image"
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
            </div>

            {/* Content Textarea */}
            <Textarea
              ref={textareaRef}
              placeholder="Share recent product changes. Markdown supported."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              rows={12}
              className="bg-[#1a1d24] border-gray-700 text-white placeholder:text-gray-500 resize-none font-mono text-sm"
              onKeyDown={(e) => {
                // Keyboard shortcuts
                if (e.ctrlKey || e.metaKey) {
                  if (e.key === 'b') {
                    e.preventDefault();
                    handleBold();
                  } else if (e.key === 'i') {
                    e.preventDefault();
                    handleItalic();
                  }
                }
              }}
            />
            <p className="text-xs text-gray-500 mt-1">
              Supports markdown. Use toolbar or keyboard shortcuts: <kbd className="text-xs bg-gray-800 px-1 rounded">Ctrl+B</kbd> for bold, <kbd className="text-xs bg-gray-800 px-1 rounded">Ctrl+I</kbd> for italic
            </p>

            {/* Type Selection */}
            <div>
              <Label className="text-xs text-gray-400 mb-2 block">Type</Label>
              <div className="space-y-2">
                {Object.entries(TYPE_CONFIG).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <div
                      key={key}
                      onClick={() => setFormData({ ...formData, type: key as any })}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                        formData.type === key
                          ? "bg-gray-800 border border-gray-700"
                          : "hover:bg-gray-900/50"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded ${config.badgeColor} flex items-center justify-center`}
                      >
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm text-white">{config.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Labels */}
            <div>
              <Label className="text-xs text-gray-400 mb-2 block">Labels (optional)</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add label"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addLabel();
                    }
                  }}
                  className="bg-[#1a1d24] border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.labels.map((label, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="text-xs border-gray-700 text-gray-300 flex items-center gap-1"
                  >
                    {label}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-white"
                      onClick={() => removeLabel(label)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Status Toggle */}
            <div className="pt-4 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-gray-300">Publish status</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      status: formData.status === "published" ? "draft" : "published",
                    })
                  }
                  className="border-gray-700 text-gray-300"
                >
                  {formData.status === "published" ? "Published" : "Draft"}
                </Button>
              </div>
            </div>

            {/* Delete Button */}
            {selectedChangelog && (
              <Button
                onClick={handleDelete}
                variant="outline"
                className="w-full border-red-500/50 text-red-500 hover:bg-red-500/10"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Entry
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
