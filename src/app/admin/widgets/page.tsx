"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Copy, Plus, Trash2, Edit, Code, Check } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import "./widgets.css";

interface Widget {
  id: string;
  name: string;
  api_key: string;
  has_api_secret?: boolean;
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
    require_sdk_identity?: boolean;
  };
  created_at: string;
}

interface Board {
  id: string;
  name: string;
  slug: string;
  icon: string;
}

interface WidgetFormState {
  name: string;
  default_board_id: string;
  allowed_domains: string;
  primaryColor: string;
  show_voting: boolean;
  allow_anonymous: boolean;
  show_roadmap: boolean;
  require_sdk_identity: boolean;
}

function WidgetToggles({
  formData,
  setFormData,
}: {
  formData: WidgetFormState;
  setFormData: React.Dispatch<React.SetStateAction<WidgetFormState>>;
}) {
  const rows: Array<{
    key: keyof WidgetFormState;
    title: string;
    description: string;
  }> = [
    { key: "show_voting", title: "Show voting", description: "Allow users to upvote posts" },
    { key: "allow_anonymous", title: "Allow anonymous", description: "Let users submit without signing in" },
    { key: "show_roadmap", title: "Show roadmap", description: "Display public roadmap view" },
    { key: "require_sdk_identity", title: "Require Secure Identity", description: "HMAC signature verification" },
  ];

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div key={row.key} className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">{row.title}</p>
            <p className="text-xs text-muted-foreground">{row.description}</p>
          </div>
          <Switch
            checked={formData[row.key] as boolean}
            onCheckedChange={(checked) => setFormData({ ...formData, [row.key]: checked })}
          />
        </div>
      ))}
    </div>
  );
}

export default function WidgetManagementPage() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [copiedApiKey, setCopiedApiKey] = useState<string | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);
  const [apiSecretDialog, setApiSecretDialog] = useState<string | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState<WidgetFormState>({
    name: "",
    default_board_id: "",
    allowed_domains: "",
    primaryColor: "#3b82f6",
    show_voting: true,
    allow_anonymous: false,
    show_roadmap: true,
    require_sdk_identity: true,
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
          require_sdk_identity: formData.require_sdk_identity,
        },
      });

      const data = response.data;

      if (data.success) {
        if (data.data.api_secret) {
          setApiSecretDialog(data.data.api_secret);
        }
        toast({
          title: "Success",
          description: data.data.api_secret
            ? "Widget created, copy the API secret now (shown once)"
            : "Widget created successfully",
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
          require_sdk_identity: formData.require_sdk_identity,
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

  const handleRotateSecret = async (widgetId: string) => {
    if (!confirm("Rotate API secret? Existing server-side signing code must be updated.")) {
      return;
    }

    try {
      const response = await api.post(`/api/admin/widgets/${widgetId}/rotate-secret`);
      const data = response.data;

      if (data.success && data.data.api_secret) {
        setApiSecretDialog(data.data.api_secret);
        toast({
          title: "Secret rotated",
          description: "Copy the new API secret now. It will not be shown again.",
        });
        loadWidgets();
      }
    } catch (error) {
      console.error("❌ Failed to rotate secret:", error);
      toast({
        title: "Error",
        description: "Failed to rotate API secret",
        variant: "destructive",
      });
    }
  };

  const handleEnsureSecret = async (widgetId: string) => {
    try {
      const response = await api.post(`/api/admin/widgets/${widgetId}/ensure-secret`);
      const data = response.data;

      if (data.success) {
        if (data.data.api_secret) {
          setApiSecretDialog(data.data.api_secret);
          toast({
            title: "API secret ready",
            description: "Copy the API secret now. It will not be shown again.",
          });
        } else {
          toast({ title: "Already configured", description: "This widget already has an API secret." });
        }
        loadWidgets();
      }
    } catch (error) {
      console.error("❌ Failed to ensure secret:", error);
      toast({
        title: "Error",
        description: "Failed to generate API secret",
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
    setCopiedSnippet(widget.id);
    setTimeout(() => setCopiedSnippet(null), 2000);
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
      require_sdk_identity: widget.settings.require_sdk_identity ?? true,
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
      require_sdk_identity: true,
    });
  };

  if (loading) {
    return (
      <div className="wdg" aria-busy="true">
        <div className="wdg__head">
          <div>
            <h1 className="wdg__title">Widget Management</h1>
            <p className="wdg__lede">
              Create and manage embeddable feedback widgets for your products
            </p>
          </div>
          <Button disabled className="gap-1.5">
            <Plus className="h-4 w-4" />
            Create Widget
          </Button>
        </div>
        <div className="wdg__skel">
          {[0, 1, 2].map((i) => (
            <div key={i} className="wdg__skel-row">
              <div className="wdg__skel-bar" />
              <div className="wdg__skel-bar" />
              <div className="wdg__skel-bar" />
              <div className="wdg__skel-bar" />
              <div className="wdg__skel-bar" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="wdg">
      {/* Head */}
      <div className="wdg__head">
        <div>
          <h1 className="wdg__title">Widget Management</h1>
          <p className="wdg__lede">
            Create and manage embeddable feedback widgets for your products
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Create Widget
        </Button>
      </div>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Create Widget</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Set up a new embeddable feedback widget for your product.
            </p>
          </DialogHeader>
          <form onSubmit={handleCreateWidget} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Product Feedback Widget"
                className="h-10"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allowed_domains" className="text-sm font-medium">Allowed domains</Label>
              <Input
                id="allowed_domains"
                value={formData.allowed_domains}
                onChange={(e) => setFormData({ ...formData, allowed_domains: e.target.value })}
                placeholder="e.g., yourapp.com, app.yourapp.com"
                className="h-10"
              />
            </div>

            <div className="wdg__dialog-grid">
              <div className="wdg__selectwrap">
                <select
                  id="default_board_id"
                  aria-label="Boards"
                  value={formData.default_board_id}
                  onChange={(e) => setFormData({ ...formData, default_board_id: e.target.value })}
                  className="wdg__control w-full"
                  required
                >
                  <option value="">Boards</option>
                  {boards.map((board) => (
                    <option key={board.id} value={board.id}>
                      {board.icon} {board.name}
                    </option>
                  ))}
                </select>
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="wdg__control w-full justify-start text-sm font-normal"
                  >
                    Permissions
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-72 p-0">
                  <div className="space-y-3 p-3">
                    <WidgetToggles formData={formData} setFormData={setFormData} />
                  </div>
                </PopoverContent>
              </Popover>

              <label className="wdg__swatchfield">
                <span>Colour</span>
                <span
                  className="wdg__swatch"
                  style={{ backgroundColor: formData.primaryColor }}
                  aria-hidden="true"
                />
                <input
                  type="color"
                  aria-label="Colour"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                />
              </label>

              <Input
                aria-label="Color code"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                className="wdg__control wdg__mono h-10"
              />
            </div>

            <div className="flex gap-3 pt-2">
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

      {/* Widgets list */}
      {widgets.length === 0 ? (
        <div className="wdg__empty">
          <Code className="h-6 w-6 text-muted-foreground" aria-hidden="true" />
          <h3 className="wdg__empty-title">No widgets yet</h3>
          <p className="wdg__empty-copy">
            Create your first widget to start collecting feedback from external applications
          </p>
          <Button variant="outline" onClick={() => setShowCreateDialog(true)} className="gap-1.5">
            <Plus className="h-4 w-4" />
            Create Widget
          </Button>
        </div>
      ) : (
        <div className="wdg__table">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Widget</TableHead>
                <TableHead>API key</TableHead>
                <TableHead>API secret</TableHead>
                <TableHead>Allowed domains</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {widgets.map((widget) => {
                const perms = [
                  widget.settings.show_voting && "Voting",
                  widget.settings.allow_anonymous && "Anonymous submissions",
                  widget.settings.show_roadmap && "Roadmap",
                  (widget.settings.require_sdk_identity ?? true) && "Secure identity",
                ].filter(Boolean) as string[];

                return (
                  <TableRow key={widget.id}>
                    <TableCell data-label="Widget" className="max-w-72">
                      <p className="wdg__name">{widget.name}</p>
                      <p className="wdg__created">
                        Created {new Date(widget.created_at).toLocaleDateString()}
                      </p>
                      <span className="wdg__branding">
                        <span
                          className="wdg__swatch"
                          style={{ backgroundColor: widget.branding.primaryColor }}
                          aria-hidden="true"
                        />
                        <span className="wdg__hex">{widget.branding.primaryColor}</span>
                      </span>
                      {perms.length > 0 && (
                        <ul className="wdg__perms">
                          {perms.map((p) => (
                            <li key={p}>{p}</li>
                          ))}
                        </ul>
                      )}
                    </TableCell>

                    <TableCell data-label="API key">
                      <div className="wdg__keyrow">
                        <span className="wdg__key" title={widget.api_key}>
                          {widget.api_key.substring(0, 20)}...
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => copyApiKey(widget.api_key)}
                          aria-label="Copy API key"
                        >
                          {copiedApiKey === widget.api_key ? (
                            <Check className="wdg__check h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>

                    <TableCell data-label="API secret">
                      <div className="wdg__secretcell">
                        {widget.has_api_secret ? (
                          <span className="wdg__state wdg__state--ok">Configured</span>
                        ) : (
                          <span className="wdg__state wdg__state--bad">Missing, SDK disabled</span>
                        )}
                        {widget.has_api_secret ? (
                          <Button variant="outline" size="sm" onClick={() => handleRotateSecret(widget.id)}>
                            Rotate secret
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => handleEnsureSecret(widget.id)}>
                            Generate secret
                          </Button>
                        )}
                      </div>
                    </TableCell>

                    <TableCell data-label="Allowed domains">
                      {widget.allowed_domains.length > 0 ? (
                        <div className="wdg__domains">
                          {widget.allowed_domains.map((d, i) => (
                            <span key={i} className="wdg__domain">
                              {d}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="wdg__open-domains">All domains, not secure</span>
                      )}
                    </TableCell>

                    <TableCell data-label="Actions" className="text-right">
                      <div className="wdg__actions">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyEmbedSnippet(widget)}
                        >
                          <Code className="h-4 w-4 mr-2" />
                          {copiedSnippet === widget.id ? "Copied!" : "Copy Embed Code"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(widget)}
                          aria-label={`Edit ${widget.name}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="wdg__delete h-8 w-8"
                          onClick={() => handleDeleteWidget(widget.id)}
                          aria-label={`Delete ${widget.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Edit Widget</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Update your widget configuration.
            </p>
          </DialogHeader>
          <form onSubmit={handleUpdateWidget} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-sm font-medium">Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-10"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-allowed_domains" className="text-sm font-medium">Allowed domains</Label>
              <Input
                id="edit-allowed_domains"
                value={formData.allowed_domains}
                onChange={(e) => setFormData({ ...formData, allowed_domains: e.target.value })}
                placeholder="Comma-separated domains"
                className="h-10"
              />
            </div>

            <div className="wdg__dialog-grid">
              <div className="wdg__selectwrap">
                <select
                  id="edit-default_board_id"
                  aria-label="Boards"
                  value={formData.default_board_id}
                  onChange={(e) => setFormData({ ...formData, default_board_id: e.target.value })}
                  className="wdg__control w-full"
                  required
                >
                  <option value="">Boards</option>
                  {boards.map((board) => (
                    <option key={board.id} value={board.id}>
                      {board.icon} {board.name}
                    </option>
                  ))}
                </select>
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    className="wdg__control w-full justify-start text-sm font-normal"
                  >
                    Permissions
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-72 p-0">
                  <div className="space-y-3 p-3">
                    <WidgetToggles formData={formData} setFormData={setFormData} />
                  </div>
                </PopoverContent>
              </Popover>

              <label className="wdg__swatchfield">
                <span>Colour</span>
                <span
                  className="wdg__swatch"
                  style={{ backgroundColor: formData.primaryColor }}
                  aria-hidden="true"
                />
                <input
                  type="color"
                  aria-label="Colour"
                  value={formData.primaryColor}
                  onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                />
              </label>

              <Input
                aria-label="Color code"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                className="wdg__control wdg__mono h-10"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1">
                Save Changes
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

      <Dialog open={Boolean(apiSecretDialog)} onOpenChange={() => setApiSecretDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">API Secret</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Copy this secret now. It will not be shown again.
            </p>
          </DialogHeader>
          <div className="wdg__caution">
            <p className="wdg__caution-text">
              Use this server-side only to sign SDK identity (HMAC).
            </p>
            <div className="wdg__secret mt-3">
              <code className="select-all">{apiSecretDialog}</code>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0"
                onClick={() => {
                  if (apiSecretDialog) {
                    navigator.clipboard.writeText(apiSecretDialog);
                    toast({ title: "Copied", description: "API secret copied to clipboard" });
                  }
                }}
                aria-label="Copy API secret"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button
            className="w-full"
            onClick={() => setApiSecretDialog(null)}
          >
            I’ve saved my secret. Close
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
