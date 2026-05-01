"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Plus, Trash2, Edit, Code, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface Widget {
  id: string;
  name: string;
  api_key: string;
  default_board_id: string;
  allowed_domains: string[];
  branding: {
    primaryColor?: string;
    logo?: string;
  };
  settings: {
    show_voting: boolean;
    allow_anonymous: boolean;
    show_roadmap: boolean;
  };
  created_at: string;
}

interface Board {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

export default function WidgetManagementPage() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [copiedApiKey, setCopiedApiKey] = useState<string | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    default_board_id: "",
    allowed_domains: "",
    primaryColor: "#3b82f6",
    show_voting: true,
    allow_anonymous: false,
    show_roadmap: true,
  });

  useEffect(() => {
    loadWidgets();
    loadBoards();
  }, []);

  const loadWidgets = async () => {
    try {
      const response = await api.get("/api/admin/widgets");
      const data = response.data;

      if (data.success) {
        setWidgets(data.data.widgets);
      }
    } catch (error) {
      console.error("❌ Failed to load widgets:", error);
      toast({
        title: "Error",
        description: "Failed to load widgets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBoards = async () => {
    try {
      const response = await api.get("/api/boards");
      const data = response.data;

      console.log('📋 Boards response:', data);

      if (data.success) {
        setBoards(data.data.boards || data.boards || []);
      }
    } catch (error) {
      console.error("❌ Failed to load boards:", error);
    }
  };

  const handleCreateWidget = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await api.post("/api/admin/widgets", {
        name: formData.name,
        default_board_id: formData.default_board_id,
        allowed_domains: formData.allowed_domains
          .split(",")
          .map((d) => d.trim())
          .filter((d) => d),
        branding: {
          primaryColor: formData.primaryColor,
        },
        settings: {
          show_voting: formData.show_voting,
          allow_anonymous: formData.allow_anonymous,
          show_roadmap: formData.show_roadmap,
        },
      });

      const data = response.data;

      if (data.success) {
        toast({
          title: "Success",
          description: "Widget created successfully",
        });
        setShowCreateDialog(false);
        resetForm();
        loadWidgets();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to create widget",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("❌ Failed to create widget:", error);
      toast({
        title: "Error",
        description: "Failed to create widget",
        variant: "destructive",
      });
    }
  };

  const handleUpdateWidget = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedWidget) return;

    try {
      const response = await api.put(`/api/admin/widgets/${selectedWidget.id}`, {
        name: formData.name,
        default_board_id: formData.default_board_id,
        allowed_domains: formData.allowed_domains
          .split(",")
          .map((d) => d.trim())
          .filter((d) => d),
        branding: {
          primaryColor: formData.primaryColor,
        },
        settings: {
          show_voting: formData.show_voting,
          allow_anonymous: formData.allow_anonymous,
          show_roadmap: formData.show_roadmap,
        },
      });

      const data = response.data;

      if (data.success) {
        toast({
          title: "Success",
          description: "Widget updated successfully",
        });
        setShowEditDialog(false);
        setSelectedWidget(null);
        resetForm();
        loadWidgets();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to update widget",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("❌ Failed to update widget:", error);
      toast({
        title: "Error",
        description: "Failed to update widget",
        variant: "destructive",
      });
    }
  };

  const handleDeleteWidget = async (widgetId: string) => {
    if (!confirm("Are you sure you want to delete this widget?")) {
      return;
    }

    try {
      const response = await api.delete(`/api/admin/widgets/${widgetId}`);
      const data = response.data;

      if (data.success) {
        toast({
          title: "Success",
          description: "Widget deleted successfully",
        });
        loadWidgets();
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to delete widget",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("❌ Failed to delete widget:", error);
      toast({
        title: "Error",
        description: "Failed to delete widget",
        variant: "destructive",
      });
    }
  };

  const copyApiKey = (apiKey: string) => {
    navigator.clipboard.writeText(apiKey);
    setCopiedApiKey(apiKey);
    setTimeout(() => setCopiedApiKey(null), 2000);
    toast({
      title: "Copied",
      description: "API key copied to clipboard",
    });
  };

  const copyEmbedSnippet = (widget: Widget) => {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const snippet = `<!-- Feedy Widget -->
<script src="${backendUrl}/widget.js"></script>
<script>
  FeedyWidget.init({
    apiKey: '${widget.api_key}',
    color: '${widget.branding.primaryColor || '#3b82f6'}'
  });
</script>`;

    navigator.clipboard.writeText(snippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
    toast({
      title: "Copied",
      description: "Embed snippet copied to clipboard",
    });
  };

  const openEditDialog = (widget: Widget) => {
    setSelectedWidget(widget);
    setFormData({
      name: widget.name,
      default_board_id: widget.default_board_id,
      allowed_domains: widget.allowed_domains.join(", "),
      primaryColor: widget.branding.primaryColor || "#3b82f6",
      show_voting: widget.settings.show_voting,
      allow_anonymous: widget.settings.allow_anonymous,
      show_roadmap: widget.settings.show_roadmap,
    });
    setShowEditDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      default_board_id: "",
      allowed_domains: "",
      primaryColor: "#3b82f6",
      show_voting: true,
      allow_anonymous: false,
      show_roadmap: true,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Widget Management</h1>
          <p className="text-sm text-gray-600 mt-1">
            Create and manage embeddable feedback widgets for your products
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Widget
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Widget</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateWidget} className="space-y-4">
              <div>
                <Label htmlFor="name">Widget Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Product Feedback Widget"
                  required
                />
              </div>

              <div>
                <Label htmlFor="default_board_id">Default Board</Label>
                <select
                  id="default_board_id"
                  value={formData.default_board_id}
                  onChange={(e) => setFormData({ ...formData, default_board_id: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border rounded-md"
                  required
                >
                  <option value="">Select a board</option>
                  {boards.map((board) => (
                    <option key={board.id} value={board.id}>
                      {board.icon} {board.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="allowed_domains">Allowed Domains (comma-separated)</Label>
                <Input
                  id="allowed_domains"
                  value={formData.allowed_domains}
                  onChange={(e) => setFormData({ ...formData, allowed_domains: e.target.value })}
                  placeholder="e.g., yourapp.com, app.yourapp.com"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave empty to allow all domains (not recommended for production)
                </p>
              </div>

              <div>
                <Label htmlFor="primaryColor">Primary Color</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="primaryColor"
                    type="color"
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={formData.primaryColor}
                    onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Settings</Label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.show_voting}
                      onChange={(e) => setFormData({ ...formData, show_voting: e.target.checked })}
                    />
                    <span className="text-sm">Show voting</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.allow_anonymous}
                      onChange={(e) => setFormData({ ...formData, allow_anonymous: e.target.checked })}
                    />
                    <span className="text-sm">Allow anonymous feedback</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.show_roadmap}
                      onChange={(e) => setFormData({ ...formData, show_roadmap: e.target.checked })}
                    />
                    <span className="text-sm">Show roadmap view</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" className="flex-1">
                  Create Widget
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateDialog(false);
                    resetForm();
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Widgets List */}
      {widgets.length === 0 ? (
        <Card className="p-12 text-center">
          <Code className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">No widgets yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first widget to start collecting feedback from external applications
          </p>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Widget
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {widgets.map((widget) => (
            <Card key={widget.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{widget.name}</h3>
                    <Badge variant="outline">Active</Badge>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">API Key:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {widget.api_key.substring(0, 20)}...
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyApiKey(widget.api_key)}
                        className="h-6 px-2"
                      >
                        {copiedApiKey === widget.api_key ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>

                    <div>
                      <span className="font-medium">Allowed Domains:</span>{" "}
                      {widget.allowed_domains.length > 0 ? (
                        widget.allowed_domains.map((d, i) => (
                          <Badge key={i} variant="secondary" className="ml-1">
                            {d}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-yellow-600">All domains (not secure)</span>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded"
                          style={{ backgroundColor: widget.branding.primaryColor }}
                        />
                        <span>{widget.branding.primaryColor}</span>
                      </div>
                      <span>•</span>
                      <span>Created {new Date(widget.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyEmbedSnippet(widget)}
                  >
                    <Code className="h-4 w-4 mr-2" />
                    {copiedSnippet ? "Copied!" : "Copy Embed Code"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(widget)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteWidget(widget.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Widget</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateWidget} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Widget Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="edit-default_board_id">Default Board</Label>
              <select
                id="edit-default_board_id"
                value={formData.default_board_id}
                onChange={(e) => setFormData({ ...formData, default_board_id: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md"
                required
              >
                {boards.map((board) => (
                  <option key={board.id} value={board.id}>
                    {board.icon} {board.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="edit-allowed_domains">Allowed Domains (comma-separated)</Label>
              <Input
                id="edit-allowed_domains"
                value={formData.allowed_domains}
                onChange={(e) => setFormData({ ...formData, allowed_domains: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-primaryColor">Primary Color</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  id="edit-primaryColor"
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="w-20 h-10"
                />
                <Input
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Settings</Label>
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.show_voting}
                    onChange={(e) => setFormData({ ...formData, show_voting: e.target.checked })}
                  />
                  <span className="text-sm">Show voting</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.allow_anonymous}
                    onChange={(e) => setFormData({ ...formData, allow_anonymous: e.target.checked })}
                  />
                  <span className="text-sm">Allow anonymous feedback</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.show_roadmap}
                    onChange={(e) => setFormData({ ...formData, show_roadmap: e.target.checked })}
                  />
                  <span className="text-sm">Show roadmap view</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" className="flex-1">
                Update Widget
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowEditDialog(false);
                  setSelectedWidget(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
