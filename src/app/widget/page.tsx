"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, ThumbsUp, Plus, X, ChevronDown, ChevronUp } from "lucide-react";

// Backend API URL - widget needs to call Express backend directly
const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface FeedbackItem {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string;
  vote_count: number;
  created_at: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  voted?: boolean;
}

interface WidgetConfig {
  widget: {
    id: string;
    name: string;
    branding: {
      primaryColor?: string;
      logo?: string;
    };
    settings: {
      show_voting: boolean;
      allow_anonymous: boolean;
      show_roadmap: boolean;
    };
  };
  board: {
    id: string;
    name: string;
    slug: string;
    icon: string;
  } | null;
}

export default function WidgetPage() {
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFeedback, setNewFeedback] = useState({ title: "", description: "" });
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  // Get API key and widget ID from URL
  const apiKey = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("apiKey") : "";
  const widgetId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("widgetId") : "";

  useEffect(() => {
    if (!apiKey) {
      console.error("❌ No API key provided");
      setLoading(false);
      return;
    }

    loadConfig();
    loadFeedback();

    // Listen for messages from parent
    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, [apiKey, widgetId]);

  const handleMessage = (event: MessageEvent) => {
    // Verify origin (in production, check against your domain)
    if (event.data.type === "IDENTIFY") {
      console.log("👤 User identified:", event.data.data);
      setCurrentUser(event.data.data);
      identifyUser(event.data.data);
    } else if (event.data.type === "OPEN") {
      console.log("📖 Widget opened");
    } else if (event.data.type === "CLOSE") {
      console.log("📕 Widget closed");
    } else if (event.data.type === "SHOW_PROMPT") {
      console.log("📝 Show feedback prompt requested", event.data.data);
      const { title, description, category } = event.data.data || {};
      
      // Pre-fill the form and open it
      setNewFeedback({
        title: title || "",
        description: description || ""
      });
      setShowCreateForm(true);
    } else if (event.data.type === "TRACK") {
      console.log("📊 Track event:", event.data.data);
      // In a real app, you would send this to your backend analytics endpoint
    }
  };

  const loadConfig = async () => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/widget/config?apiKey=${apiKey}${widgetId ? `&widgetId=${widgetId}` : ""}`);
      const data = await response.json();

      if (data.success) {
        setConfig(data.data);
        // Notify parent that widget is ready
        window.parent.postMessage({ type: "READY" }, "*");
      }
    } catch (error) {
      console.error("❌ Failed to load widget config:", error);
    }
  };

  const loadFeedback = async () => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/widget/feedback?apiKey=${apiKey}${widgetId ? `&widgetId=${widgetId}` : ""}`);
      const data = await response.json();

      if (data.success) {
        setFeedback(data.data.feedback);
      }
    } catch (error) {
      console.error("❌ Failed to load feedback:", error);
    } finally {
      setLoading(false);
    }
  };

  const identifyUser = async (user: any) => {
    try {
      const response = await fetch(`${BACKEND_API_URL}/api/widget/identify?apiKey=${apiKey}${widgetId ? `&widgetId=${widgetId}` : ""}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });

      const data = await response.json();
      console.log("✅ User identified:", data);
    } catch (error) {
      console.error("❌ Failed to identify user:", error);
    }
  };

  const handleCreateFeedback = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newFeedback.title.trim()) {
      return;
    }

    try {
      const response = await fetch(`${BACKEND_API_URL}/api/widget/feedback?apiKey=${apiKey}${widgetId ? `&widgetId=${widgetId}` : ""}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: newFeedback.title,
          description: newFeedback.description,
          external_user_id: currentUser?.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Reload feedback list
        await loadFeedback();
        // Reset form
        setNewFeedback({ title: "", description: "" });
        setShowCreateForm(false);
        // Notify parent
        window.parent.postMessage(
          {
            type: "FEEDBACK_SUBMITTED",
            data: data.data.feedback,
          },
          "*"
        );
      }
    } catch (error) {
      console.error("❌ Failed to create feedback:", error);
    }
  };

  const handleVote = async (feedbackId: string) => {
    if (!currentUser?.id) {
      alert("Please identify yourself first");
      return;
    }

    try {
      const response = await fetch(`${BACKEND_API_URL}/api/widget/vote?apiKey=${apiKey}${widgetId ? `&widgetId=${widgetId}` : ""}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feedback_id: feedbackId,
          external_user_id: currentUser.id,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Reload feedback list
        await loadFeedback();
      }
    } catch (error) {
      console.error("❌ Failed to vote:", error);
    }
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "backlog":
        return "bg-gray-100 text-gray-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const primaryColor = config?.widget.branding.primaryColor || "#3b82f6";

  return (
    <div className="h-screen bg-white flex flex-col">
      {/* Header */}
      <div
        className="p-4 border-b flex items-center justify-between"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center gap-2">
          {config?.board?.icon && <span className="text-2xl">{config.board.icon}</span>}
          <h1 className="text-white font-semibold text-lg">{config?.board?.name || "Feedback"}</h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.parent.postMessage({ type: "CLOSE" }, "*")}
          className="text-white hover:bg-white/20"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        {/* Create Button */}
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="w-full mb-4"
          style={{ backgroundColor: primaryColor }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Feedback
        </Button>

        {/* Create Form */}
        {showCreateForm && (
          <Card className="p-4 mb-4">
            <form onSubmit={handleCreateFeedback} className="space-y-3">
              <Input
                placeholder="What would you like to see?"
                value={newFeedback.title}
                onChange={(e) => setNewFeedback({ ...newFeedback, title: e.target.value })}
                className="w-full"
              />
              <Textarea
                placeholder="Describe your idea in more detail..."
                value={newFeedback.description}
                onChange={(e) => setNewFeedback({ ...newFeedback, description: e.target.value })}
                className="w-full min-h-[80px]"
              />
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" style={{ backgroundColor: primaryColor }}>
                  Submit
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Feedback List */}
        <div className="space-y-3">
          {feedback.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No feedback yet. Be the first to share your ideas!</p>
            </div>
          ) : (
            feedback.map((item) => (
              <Card key={item.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3">
                  {/* Vote Button */}
                  {config?.widget.settings.show_voting && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleVote(item.id)}
                      className={`flex-shrink-0 ${
                        item.voted ? "bg-blue-50 border-blue-500" : ""
                      }`}
                    >
                      <ThumbsUp className="h-4 w-4 mr-1" />
                      {item.vote_count}
                    </Button>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-sm">{item.title}</h3>
                      <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                    </div>

                    {expandedItems.has(item.id) && item.description && (
                      <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                    )}

                    {item.description && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(item.id)}
                        className="mt-2 h-6 px-2 text-xs"
                      >
                        {expandedItems.has(item.id) ? (
                          <>
                            <ChevronUp className="h-3 w-3 mr-1" />
                            Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-3 w-3 mr-1" />
                            Show more
                          </>
                        )}
                      </Button>
                    )}

                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      <span>{item.user.name || "Anonymous"}</span>
                      <span>•</span>
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
