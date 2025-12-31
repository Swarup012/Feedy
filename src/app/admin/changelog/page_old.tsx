"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Settings,
  MoreVertical,
  Trash2,
  Calendar,
  Tag,
  Link as LinkIcon,
  Image as ImageIcon,
  CheckCircle2,
  FileEdit,
  Wrench,
  Sparkles,
  ListOrdered,
  List,
  Bold,
  Italic,
  Code,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { changelogService, Changelog } from "@/services/changelogService";
import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";

const TYPE_CONFIG = {
  new: {
    label: "New",
    icon: Sparkles,
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    badgeColor: "bg-blue-500",
  },
  improved: {
    label: "Improved",
    icon: Wrench,
    color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    badgeColor: "bg-purple-500",
  },
  fixed: {
    label: "Fixed",
    icon: CheckCircle2,
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    badgeColor: "bg-green-500",
  },
};

const STATUS_CONFIG = {
  draft: {
    label: "Draft",
    color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  },
  published: {
    label: "Published",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  },
};

export default function ChangelogPage() {
  const { toast } = useToast();
  const [changelogs, setChangelogs] = useState<Changelog[]>([]);
  const [filteredChangelogs, setFilteredChangelogs] = useState<Changelog[]>([]);
  const [selectedChangelog, setSelectedChangelog] = useState<Changelog | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isCreating, setIsCreating] = useState(false);

  // Form state for editor
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    content: "",
    type: "new" as "new" | "improved" | "fixed",
    status: "draft" as "draft" | "published",
    featured_image: "",
    labels: [] as string[],
  });
  const [newLabel, setNewLabel] = useState("");

  useEffect(() => {
    fetchChangelogs();
  }, []);

  useEffect(() => {
    filterChangelogs();
  }, [changelogs, searchQuery, filterType, filterStatus]);

  const fetchChangelogs = async () => {
    try {
      setLoading(true);
      const response = await changelogService.getAllChangelogs();
      setChangelogs(response.data.changelogs);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to load changelogs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterChangelogs = () => {
    let filtered = [...changelogs];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(
        (changelog) =>
          changelog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          changelog.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter((changelog) => changelog.type === filterType);
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((changelog) => changelog.status === filterStatus);
    }

    setFilteredChangelogs(filtered);
  };

  const handleCreateOrUpdate = async () => {
    try {
      if (!formData.title || !formData.content) {
        toast({
          title: "Validation Error",
          description: "Title and content are required",
          variant: "destructive",
        });
        return;
      }

      if (editingChangelog) {
        await changelogService.updateChangelog(editingChangelog.id, formData);
        toast({
          title: "Success",
          description: "Changelog updated successfully",
        });
      } else {
        await changelogService.createChangelog(formData);
        toast({
          title: "Success",
          description: "Changelog created successfully",
        });
      }

      setShowCreateDialog(false);
      resetForm();
      fetchChangelogs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to save changelog",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this changelog?")) return;

    try {
      await changelogService.deleteChangelog(id);
      toast({
        title: "Success",
        description: "Changelog deleted successfully",
      });
      fetchChangelogs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.error || "Failed to delete changelog",
        variant: "destructive",
      });
    }
  };

  const handleCreateNew = () => {
    setIsCreating(true);
    setSelectedChangelog(null);
    setFormData({
      title: "",
      description: "",
      content: "",
      type: "new",
      status: "draft",
      featured_image: "",
      labels: [],
    });
  };

  const handleSelectChangelog = (changelog: Changelog) => {
    setIsCreating(false);
    setSelectedChangelog(changelog);
    setFormData({
      title: changelog.title,
      description: changelog.description || "",
      content: changelog.content,
      type: changelog.type,
      status: changelog.status,
      featured_image: changelog.featured_image || "",
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

  return (
    <div className="flex h-screen bg-[#0f1117]">
      {/* Left Sidebar - Changelog List */}
      <div className="w-80 border-r border-gray-800 flex flex-col bg-[#0f1117]">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Changelog
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Keep your users informed about new features, improvements, and bug fixes
              </p>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowCreateDialog(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Entry
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search changelogs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="improved">Improved</SelectItem>
                <SelectItem value="fixed">Fixed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Changelogs List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading changelogs...</div>
          </div>
        ) : filteredChangelogs.length === 0 ? (
          <Card className="p-12 text-center">
            <FileEdit className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              No changelogs yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Start creating changelog entries to keep your users informed
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Entry
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredChangelogs.map((changelog) => {
              const TypeIcon = TYPE_CONFIG[changelog.type].icon;
              return (
                <Card
                  key={changelog.id}
                  className="p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex gap-6">
                    {/* Left side - Type indicator */}
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          TYPE_CONFIG[changelog.type].color
                        }`}
                      >
                        <TypeIcon className="h-6 w-6" />
                      </div>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                        {TYPE_CONFIG[changelog.type].label}
                      </span>
                    </div>

                    {/* Main content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                              {changelog.title}
                            </h3>
                            <Badge
                              className={STATUS_CONFIG[changelog.status].color}
                            >
                              {STATUS_CONFIG[changelog.status].label}
                            </Badge>
                          </div>
                          {changelog.description && (
                            <p className="text-gray-600 dark:text-gray-400 mb-3">
                              {changelog.description}
                            </p>
                          )}
                        </div>

                        {/* Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(changelog)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handlePublish(changelog)}>
                              <Eye className="mr-2 h-4 w-4" />
                              {changelog.status === "published" ? "Unpublish" : "Publish"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(changelog.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Labels */}
                      {changelog.labels && changelog.labels.length > 0 && (
                        <div className="flex gap-2 mb-3">
                          {changelog.labels.map((label, index) => (
                            <Badge
                              key={index}
                              variant="outline"
                              className="text-xs"
                            >
                              <Tag className="mr-1 h-3 w-3" />
                              {label}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {changelog.published_at
                            ? formatDistanceToNow(new Date(changelog.published_at), {
                                addSuffix: true,
                              })
                            : "Not published"}
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-4 w-4" />
                          {changelog.view_count || 0} views
                        </div>
                        {changelog.author && (
                          <div>by {changelog.author.name || changelog.author.email}</div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingChangelog ? "Edit Changelog" : "Create New Changelog"}
            </DialogTitle>
            <DialogDescription>
              Share updates, improvements, and fixes with your users
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Title */}
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Dark Mode Support"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Short Description</Label>
              <Input
                id="description"
                placeholder="Brief summary for the changelog entry"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            {/* Type and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-blue-600" />
                        New
                      </div>
                    </SelectItem>
                    <SelectItem value="improved">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-purple-600" />
                        Improved
                      </div>
                    </SelectItem>
                    <SelectItem value="fixed">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                        Fixed
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: any) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Content */}
            <div>
              <Label htmlFor="content">Content *</Label>
              <Textarea
                id="content"
                placeholder="This is a new saas call faddy it's also a feedback management saas like Canny."
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supports plain text and markdown
              </p>
            </div>

            {/* Featured Image */}
            <div>
              <Label htmlFor="featured_image">Featured Image URL</Label>
              <div className="flex gap-2">
                <Input
                  id="featured_image"
                  placeholder="https://example.com/image.jpg or YouTube URL"
                  value={formData.featured_image}
                  onChange={(e) =>
                    setFormData({ ...formData, featured_image: e.target.value })
                  }
                />
                <Button variant="outline" size="icon">
                  <ImageIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Labels */}
            <div>
              <Label>Labels</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="Add label (e.g., mobile, api, ui)"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addLabel();
                    }
                  }}
                />
                <Button onClick={addLabel} variant="outline">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.labels.map((label, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="cursor-pointer"
                    onClick={() => removeLabel(label)}
                  >
                    {label}
                    <span className="ml-1">×</span>
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateOrUpdate}>
              {editingChangelog ? "Update" : "Create"} Changelog
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
