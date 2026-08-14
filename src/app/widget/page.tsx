"use client";

import { useEffect, useState, useRef, useCallback, useMemo, memo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, ThumbsUp, Plus, X, ChevronDown, ChevronUp } from "lucide-react";

const BACKEND_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

interface CurrentUser {
  id: string;
  name?: string;
  email?: string;
  [key: string]: unknown;
}

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

// --- Extracted outside component: no re-creation on render ---
function getStatusColor(status: string) {
  switch (status) {
    case "backlog":
      return "bg-muted text-muted-foreground";
    case "in-progress":
      return "bg-primary/10 text-primary";
    case "completed":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "backlog":
      return "Planned";
    case "in-progress":
      return "In Progress";
    case "completed":
      return "Done";
    default:
      return status;
  }
}

// --- Memoized feedback item: only re-renders when its own data changes ---
const FeedbackCard = memo(function FeedbackCard({
  item,
  showVoting,
  canVote,
  isExpanded,
  onVote,
  onToggleExpand,
}: {
  item: FeedbackItem;
  showVoting: boolean;
  canVote: boolean;
  isExpanded: boolean;
  onVote: (id: string) => void;
  onToggleExpand: (id: string) => void;
}) {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {showVoting && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onVote(item.id)}
            disabled={!canVote}
            className={`flex-shrink-0 ${
              item.voted ? "bg-primary/10 border-primary" : ""
            }`}
            aria-label={`Upvote ${item.title}. Current votes: ${item.vote_count}`}
            aria-pressed={item.voted}
          >
            <ThumbsUp className="h-4 w-4 mr-1" aria-hidden="true" />
            {item.vote_count}
          </Button>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-medium text-sm">{item.title}</h2>
            <Badge className={getStatusColor(item.status)}>{getStatusLabel(item.status)}</Badge>
          </div>

          {item.description && (
            <div
              id={`feedback-desc-${item.id}`}
              role="region"
              aria-hidden={!isExpanded}
              className={isExpanded ? "mt-2" : "mt-2 sr-only"}
            >
              <p className="text-sm text-muted-foreground">{item.description}</p>
            </div>
          )}

          {item.description && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onToggleExpand(item.id)}
              className="mt-2 h-6 px-2 text-xs"
              aria-expanded={isExpanded}
              aria-controls={`feedback-desc-${item.id}`}
              aria-label={
                isExpanded
                  ? `Collapse description for ${item.title}`
                  : `Expand description for ${item.title}`
              }
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" aria-hidden="true" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" aria-hidden="true" />
                  Show more
                </>
              )}
            </Button>
          )}

          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span>{item.user.name || "Anonymous"}</span>
            <span aria-hidden="true">&bull;</span>
            <time dateTime={item.created_at}>
              {new Date(item.created_at).toLocaleDateString()}
            </time>
          </div>
        </div>
      </div>
    </Card>
  );
});

export default function WidgetPage() {
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [feedback, setFeedback] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newFeedback, setNewFeedback] = useState({ title: "", description: "" });
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const titleInputRef = useRef<HTMLInputElement>(null);

  // --- Parse URL params once, not on every render ---
  const apiKey = useMemo(
    () => (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("apiKey") : ""),
    []
  );
  const widgetId = useMemo(
    () => (typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("widgetId") : ""),
    []
  );

  // --- Origin-validated postMessage ---
  const verifiedOriginRef = useRef<string | null>(null);
  const pendingMessagesRef = useRef<Array<{ message: Record<string, unknown>; targetOrigin: string }>>([]);

  const flushQueue = useCallback((origin: string) => {
    for (const { message } of pendingMessagesRef.current) {
      window.parent.postMessage(message, origin);
    }
    pendingMessagesRef.current = [];
  }, []);

  const postToParent = useCallback((message: Record<string, unknown>) => {
    const origin = verifiedOriginRef.current;
    if (origin) {
      window.parent.postMessage(message, origin);
    } else {
      pendingMessagesRef.current.push({ message, targetOrigin: "" });
    }
  }, []);

  const identifyUser = useCallback(
    async (user: CurrentUser) => {
      try {
        await fetch(`${BACKEND_API_URL}/api/widget/identify?apiKey=${apiKey}${widgetId ? `&widgetId=${widgetId}` : ""}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(user),
        });
      } catch {
        // Identification failure is non-critical; user data is still stored locally.
      }
    },
    [apiKey, widgetId]
  );

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      const { type, data } = event.data ?? {};
      if (typeof type !== "string") return;

      if (!verifiedOriginRef.current) {
        if (type !== "IDENTIFY") return;
        verifiedOriginRef.current = event.origin;
        flushQueue(event.origin);
        setCurrentUser(data);
        identifyUser(data);
        return;
      }

      if (event.origin !== verifiedOriginRef.current) return;

      switch (type) {
        case "IDENTIFY":
          setCurrentUser(data);
          identifyUser(data);
          break;
        case "SHOW_PROMPT": {
          const { title, description } = data ?? {};
          setNewFeedback({ title: title || "", description: description || "" });
          setShowCreateForm(true);
          break;
        }
      }
    },
    [flushQueue, identifyUser]
  );

  // --- Single init: load config + feedback in parallel, then mark loaded ---
  const init = useCallback(async () => {
    try {
      const [configRes, feedbackRes] = await Promise.all([
        fetch(`${BACKEND_API_URL}/api/widget/config?apiKey=${apiKey}${widgetId ? `&widgetId=${widgetId}` : ""}`),
        fetch(`${BACKEND_API_URL}/api/widget/feedback?apiKey=${apiKey}${widgetId ? `&widgetId=${widgetId}` : ""}`),
      ]);

      const [configData, feedbackData] = await Promise.all([
        configRes.json(),
        feedbackRes.json(),
      ]);

      if (configData.success) {
        setConfig(configData.data);
      } else {
        setError("This widget could not be loaded. Please try again later.");
      }

      if (feedbackData.success) {
        setFeedback(feedbackData.data.feedback);
      } else {
        setError("Feedback could not be loaded. Check your connection and try again.");
      }
    } catch {
      setError("Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  }, [apiKey, widgetId]);

  useEffect(() => {
    if (!apiKey) {
      setError("This widget is not configured. Contact the site owner to set it up.");
      setLoading(false);
      return;
    }

    init();

    window.parent.postMessage({ type: "READY" }, "*");

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [apiKey, widgetId, handleMessage, init]);

  // Auto-focus the title input when the create form opens
  useEffect(() => {
    if (showCreateForm) {
      titleInputRef.current?.focus();
    }
  }, [showCreateForm]);

  // --- Optimistic feedback update: avoids full re-fetch after create/vote ---
  const addFeedbackOptimistic = useCallback(
    (newItem: FeedbackItem) => {
      setFeedback((prev) => [newItem, ...prev]);
    },
    []
  );

  const updateVoteOptimistic = useCallback(
    (feedbackId: string) => {
      setFeedback((prev) =>
        prev.map((item) =>
          item.id === feedbackId
            ? { ...item, vote_count: item.vote_count + 1, voted: true }
            : item
        )
      );
    },
    []
  );

  const handleCreateFeedback = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!newFeedback.title.trim()) return;

      try {
        const response = await fetch(`${BACKEND_API_URL}/api/widget/feedback?apiKey=${apiKey}${widgetId ? `&widgetId=${widgetId}` : ""}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newFeedback.title,
            description: newFeedback.description,
            external_user_id: currentUser?.id,
          }),
        });

        const data = await response.json();

        if (data.success) {
          addFeedbackOptimistic(data.data.feedback);
          setNewFeedback({ title: "", description: "" });
          setShowCreateForm(false);
          postToParent({ type: "FEEDBACK_SUBMITTED", data: data.data.feedback });
        } else {
          setError("Your feedback could not be submitted. Please try again.");
        }
      } catch {
        setError("Your feedback could not be submitted. Check your connection and try again.");
      }
    },
    [newFeedback, currentUser, apiKey, widgetId, addFeedbackOptimistic, postToParent]
  );

  const handleVote = useCallback(
    async (feedbackId: string) => {
      if (!currentUser?.id) return;

      // Optimistic: update UI immediately, reconcile on success
      updateVoteOptimistic(feedbackId);

      try {
        const response = await fetch(`${BACKEND_API_URL}/api/widget/vote?apiKey=${apiKey}${widgetId ? `&widgetId=${widgetId}` : ""}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feedback_id: feedbackId, external_user_id: currentUser.id }),
        });

        const data = await response.json();
        if (!data.success) {
          // Revert optimistic update on failure
          setFeedback((prev) =>
            prev.map((item) =>
              item.id === feedbackId
                ? { ...item, vote_count: item.vote_count - 1, voted: false }
                : item
            )
          );
        }
      } catch {
        // Revert on network error
        setFeedback((prev) =>
          prev.map((item) =>
            item.id === feedbackId
              ? { ...item, vote_count: item.vote_count - 1, voted: false }
              : item
          )
        );
      }
    },
    [currentUser, apiKey, widgetId, updateVoteOptimistic]
  );

  const toggleExpand = useCallback((id: string) => {
    setExpandedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleDismissError = useCallback(() => setError(null), []);

  const handleToggleForm = useCallback(
    () => setShowCreateForm((prev) => !prev),
    []
  );

  const handleCancelForm = useCallback(
    () => setShowCreateForm(false),
    []
  );

  const handleRetry = useCallback(() => {
    setError(null);
    setLoading(true);
    init();
  }, [init]);

  // --- Memoized derived values ---
  const primaryColor = useMemo(
    () => config?.widget.branding.primaryColor || "#3b82f6",
    [config]
  );

  const showVoting = config?.widget.settings.show_voting ?? false;
  const canVote = !!currentUser?.id;

  // --- Loading state ---
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center" role="status" aria-label="Loading widget">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading feedback...</p>
        </div>
      </div>
    );
  }

  // --- Error state (before config loads — full-screen) ---
  if (error && !config) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="text-center p-6 max-w-sm">
          <p className="text-sm text-destructive mb-3">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            aria-label="Retry loading widget"
          >
            Try loading again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header
        className="p-4 border-b flex items-center justify-between"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="flex items-center gap-2">
          {config?.board?.icon && (
            <span className="text-2xl" aria-hidden="true">
              {config.board.icon}
            </span>
          )}
          <h1 className="text-white font-semibold text-lg">
            {config?.board?.name || "Feedback"}
          </h1>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => postToParent({ type: "CLOSE" })}
          className="text-white hover:bg-white/20"
          aria-label="Close widget"
        >
          <X className="h-4 w-4" />
        </Button>
      </header>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        {/* Inline error banner */}
        {error && config && (
          <div
            className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm text-destructive flex items-start justify-between gap-2"
            role="alert"
          >
            <span>{error}</span>
            <button
              onClick={handleDismissError}
              className="text-destructive hover:text-destructive/80 flex-shrink-0"
              aria-label="Dismiss error"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Create Button */}
        <Button
          onClick={handleToggleForm}
          className="w-full mb-4"
          style={{ backgroundColor: primaryColor }}
          aria-expanded={showCreateForm}
          aria-controls="feedback-form"
          aria-label={showCreateForm ? "Cancel new feedback" : "Share new feedback"}
        >
          <Plus className="h-4 w-4 mr-2" />
          {showCreateForm ? "Cancel" : "Share Feedback"}
        </Button>

        {/* Create Form */}
        {showCreateForm && (
          <Card
            id="feedback-form"
            className="p-4 mb-4"
            role="region"
            aria-label="Submit new feedback"
          >
            <form onSubmit={handleCreateFeedback} className="space-y-3">
              <div>
                <label htmlFor="feedback-title" className="sr-only">
                  Feedback title
                </label>
                <Input
                  id="feedback-title"
                  ref={titleInputRef}
                  placeholder="What would you like to see?"
                  value={newFeedback.title}
                  onChange={(e) =>
                    setNewFeedback({ ...newFeedback, title: e.target.value })
                  }
                  className="w-full"
                  required
                  aria-describedby="feedback-title-hint"
                />
                <p id="feedback-title-hint" className="sr-only">
                  A short summary of your feedback
                </p>
              </div>
              <div>
                <label htmlFor="feedback-description" className="sr-only">
                  Description (optional)
                </label>
                <Textarea
                  id="feedback-description"
                  placeholder="Describe your idea in more detail..."
                  value={newFeedback.description}
                  onChange={(e) =>
                    setNewFeedback({
                      ...newFeedback,
                      description: e.target.value,
                    })
                  }
                  className="w-full min-h-[80px]"
                  aria-describedby="feedback-description-hint"
                />
                <p id="feedback-description-hint" className="sr-only">
                  Optional detailed description of your feedback
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="flex-1"
                  style={{ backgroundColor: primaryColor }}
                  aria-label="Submit your feedback"
                >
                  Submit feedback
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancelForm}
                  aria-label="Cancel and close form"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Feedback List */}
        <section aria-label="Feedback list">
          {feedback.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare
                className="h-12 w-12 mx-auto mb-2 opacity-50"
                aria-hidden="true"
              />
              <p>No feedback yet. Be the first to share your ideas!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {feedback.map((item) => (
                <FeedbackCard
                  key={item.id}
                  item={item}
                  showVoting={showVoting}
                  canVote={canVote}
                  isExpanded={expandedItems.has(item.id)}
                  onVote={handleVote}
                  onToggleExpand={toggleExpand}
                />
              ))}
            </div>
          )}
        </section>
      </ScrollArea>
    </div>
  );
}
