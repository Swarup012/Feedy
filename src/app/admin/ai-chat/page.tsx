"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PaidFeatureGate } from "@/components/PaidFeatureGate";
import { useOrganization } from "@/context/OrganizationContext";
import api, { isPlanUpgradeRequired } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Send,
  AlertCircle,
  Layers,
  FileText,
  Plus,
  Trash2,
  MessageSquare,
  Loader2,
  Menu,
  X,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DbMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

interface UiMessage {
  id: string;
  role: "user" | "model";
  text: string;
  contextMeta?: { clustersUsed: number; postsUsed: number };
  isStreaming?: boolean;
  isError?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  user_id: string;
  updated_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  "What are the most critical issues users are reporting right now?",
  "Summarize the top feedback clusters and what I should prioritize.",
  "Based on recent completed feedback, draft a public changelog entry.",
  "What is the overall sentiment of feedback?",
];

function dbToUi(m: DbMessage): UiMessage {
  return {
    id: m.id,
    role: m.role === "assistant" ? "model" : "user",
    text: m.content,
  };
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (typeof window === "undefined") return headers;
  const tok =
    localStorage.getItem("access_token") || localStorage.getItem("token");
  if (tok) headers["Authorization"] = `Bearer ${tok}`;
  const hostname = window.location.hostname;
  const parts = hostname.split(".");
  if (parts.length >= 3 && !hostname.includes("localhost"))
    headers["x-subdomain"] = parts[0];
  else if (
    hostname.includes("localhost") &&
    parts.length > 1 &&
    parts[0] !== "localhost"
  )
    headers["x-subdomain"] = parts[0];
  return headers;
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderMarkdown(text: string) {
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];
  let k = 0;
  for (const line of lines) {
    if (line.startsWith("• ") || line.startsWith("- ") || line.startsWith("* "))
      out.push(
        <li key={k++} className="ml-4 list-disc text-sm leading-relaxed">
          {inline(line.slice(2))}
        </li>,
      );
    else if (/^\d+\.\s/.test(line))
      out.push(
        <li key={k++} className="ml-4 list-decimal text-sm leading-relaxed">
          {inline(line.replace(/^\d+\.\s/, ""))}
        </li>,
      );
    else if (line.startsWith("### "))
      out.push(
        <h3 key={k++} className="font-semibold text-sm mt-3 mb-1">
          {line.slice(4)}
        </h3>,
      );
    else if (line.startsWith("## "))
      out.push(
        <h2 key={k++} className="font-bold text-sm mt-4 mb-1">
          {line.slice(3)}
        </h2>,
      );
    else if (line === "") out.push(<div key={k++} className="h-2" />);
    else
      out.push(
        <p key={k++} className="text-sm leading-relaxed">
          {inline(line)}
        </p>,
      );
  }
  return out;
}

function inline(text: string): React.ReactNode {
  return text.split(/(\*\*.*?\*\*|`.*?`)/g).map((p, i) => {
    if (p.startsWith("**") && p.endsWith("**"))
      return (
        <strong key={i} className="font-semibold">
          {p.slice(2, -2)}
        </strong>
      );
    if (p.startsWith("`") && p.endsWith("`"))
      return (
        <code
          key={i}
          className="font-mono text-xs bg-muted px-1 py-0.5 rounded text-amber-700 dark:text-amber-400"
        >
          {p.slice(1, -1)}
        </code>
      );
    return p;
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div
      className="flex items-center gap-1 py-1"
      role="status"
      aria-label="Faddy is typing"
    >
      <span className="sr-only">Faddy is typing a response</span>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-current opacity-60 animate-pulse"
          style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

const MessageBubble = React.memo(function MessageBubble({ msg }: { msg: UiMessage }) {
  if (msg.role === "user") {
    return (
      <div className="flex justify-end mb-4" style={{ animation: "msg-enter 150ms cubic-bezier(0.16, 1, 0.3, 1) both" }}>
        <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-card border border-border text-foreground px-3 py-2 shadow-sm">
          <p className="text-sm leading-relaxed">{msg.text}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start mb-4" style={{ animation: "msg-enter 200ms cubic-bezier(0.16, 1, 0.3, 1) both" }}>
      <div className="flex gap-3 max-w-[85%]">
        <div className="flex-shrink-0 w-8 h-8 mt-0.5">
          <img
            src="/images/ai chat logo/faddy.png"
            alt="Faddy AI"
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div
            className={`rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm ${msg.isError ? "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800" : "bg-card border border-border"}`}
          >
            {msg.isStreaming && msg.text === "" ? (
              <TypingDots />
            ) : msg.isError ? (
              <div className="flex items-start gap-2" style={{ animation: "msg-enter 200ms cubic-bezier(0.16, 1, 0.3, 1) both" }}>
                <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-400">
                  {msg.text}
                </p>
              </div>
            ) : (
              <div
                className={`text-foreground ${msg.isStreaming ? 'after:content-["▋"] after:animate-pulse after:ml-0.5 after:text-primary' : ""}`}
              >
                {renderMarkdown(msg.text)}
              </div>
            )}
          </div>
          {msg.contextMeta && !msg.isStreaming && (
            <div className="flex items-center gap-2 mt-1.5 ml-1" style={{ animation: "meta-enter 300ms cubic-bezier(0.16, 1, 0.3, 1) 100ms both" }}>
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <Layers className="w-2.5 h-2.5" />
                {msg.contextMeta.clustersUsed} clusters
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <FileText className="w-2.5 h-2.5" />
                {msg.contextMeta.postsUsed} posts
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

function WelcomeState({
  orgName,
  onSuggest,
}: {
  orgName: string;
  onSuggest: (t: string) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8 space-y-5">
      <div className="relative">
        <div className="w-14 h-14">
          <img
            src="/images/ai chat logo/faddy.png"
            alt="Faddy AI"
            className="w-full h-full object-contain"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <h2 className="text-lg font-semibold text-foreground tracking-tight">
          Your Feedback Intelligence
        </h2>
        <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
          Ask anything about{" "}
          <span className="font-medium text-foreground">{orgName}</span>'s user
          feedback.
        </p>
      </div>
      <div className="w-full max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {SUGGESTIONS.map((prompt, i) => (
          <button
            key={i}
            onClick={() => onSuggest(prompt)}
            aria-label={prompt}
            className="px-3 py-2.5 min-h-[44px] rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/30 transition-all duration-200 text-left group"
          >
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              {prompt}
            </p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function ConversationSidebar({
  conversations,
  activeId,
  loading,
  onSelect,
  onNew,
  onDelete,
  isOpen,
  onClose,
}: {
  conversations: Conversation[];
  activeId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  isOpen: boolean;
  onClose: () => void;
}) {
  const handleKeyDown = (e: React.KeyboardEvent, id: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(id);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 flex-shrink-0 border-r border-border bg-card flex flex-col h-full
        transform transition-transform duration-200 ease-out
        lg:relative lg:translate-x-0 lg:z-auto
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="p-2.5 border-b border-border flex items-center justify-between">
          <Button
            onClick={onNew}
            size="sm"
            className="flex-1 gap-2 justify-start min-h-[44px]"
          >
            <Plus className="w-3.5 h-3.5" /> New chat
          </Button>
          <button
            onClick={onClose}
            className="ml-2 p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-accent transition-colors lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : conversations.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">
              No conversations yet
            </p>
          ) : (
            conversations.map((c) => (
              <div
                key={c.id}
                role="button"
                tabIndex={0}
                aria-label={`Open conversation: ${c.title || "Untitled"}`}
                aria-current={activeId === c.id ? "true" : undefined}
                className={`group flex items-center gap-2 px-2.5 py-2 min-h-[44px] rounded-lg cursor-pointer transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  activeId === c.id
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-accent text-foreground"
                }`}
                onClick={() => onSelect(c.id)}
                onKeyDown={(e) => handleKeyDown(e, c.id)}
              >
                <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
                <span className="flex-1 text-xs font-medium truncate">
                  {c.title || "Untitled"}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(c.id);
                  }}
                  aria-label={`Delete conversation: ${c.title || "Untitled"}`}
                  className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity p-2.5 min-w-[44px] min-h-[44px] flex items-center justify-center rounded hover:text-red-500"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────

function AiChatContent() {
  const { organization } = useOrganization();
  const orgId = organization?.id;
  const orgName = organization?.name || "your organization";

  // Conversations
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [convLoading, setConvLoading] = useState(true);

  // Messages
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(false);

  // Input + streaming
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  // Sidebar mobile toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isCreatingConvRef = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const accumulatedTextRef = useRef("");
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  // Auto-scroll only if user is near bottom
  const isNearBottom = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return true;
    const threshold = 120;
    return container.scrollHeight - container.scrollTop - container.clientHeight < threshold;
  }, []);

  useEffect(() => {
    if (isNearBottom()) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // ── Load conversations on mount / org change ──────────────────────────────
  useEffect(() => {
    if (!orgId) return;
    setConvLoading(true);
    setConversations([]);
    setActiveConvId(null);
    setMessages([]);

    api
      .get(`/api/organizations/${orgId}/ai-chat/conversations`)
      .then((res) => {
        const convs: Conversation[] = res.data?.data?.conversations || [];
        setConversations(convs);
        if (convs.length > 0) {
          setActiveConvId(convs[0].id);
        }
      })
      .catch((err) => {
        if (!isPlanUpgradeRequired(err)) {
          console.error("Failed to load conversations:", err);
        }
      })
      .finally(() => setConvLoading(false));
  }, [orgId]);

  // ── Load messages when active conversation changes ────────────────────────
  useEffect(() => {
    if (!activeConvId || !orgId) {
      setMessages([]);
      return;
    }

    // Skip DB fetch if we literally just created it (prevents overwriting the optimistic streaming UI)
    if (isCreatingConvRef.current) {
      isCreatingConvRef.current = false;
      return;
    }

    setMsgsLoading(true);
    api
      .get(
        `/api/organizations/${orgId}/ai-chat/conversations/${activeConvId}/messages`,
      )
      .then((res) => {
        const dbMsgs: DbMessage[] = res.data?.data?.messages || [];
        setMessages(dbMsgs.map(dbToUi));
      })
      .catch((err) => console.error("Failed to load messages:", err))
      .finally(() => setMsgsLoading(false));
  }, [activeConvId, orgId]);

  // ── Create a new conversation ─────────────────────────────────────────────
  const createConversation = useCallback(
    async (firstMessage: string): Promise<string | null> => {
      if (!orgId) return null;
      try {
        isCreatingConvRef.current = true;
        const res = await api.post(
          `/api/organizations/${orgId}/ai-chat/conversations`,
          { firstMessage },
        );
        const conv: Conversation = res.data?.data?.conversation;
        setConversations((prev) => [conv, ...prev]);
        setActiveConvId(conv.id);
        return conv.id;
      } catch (err) {
        console.error("Failed to create conversation:", err);
        return null;
      }
    },
    [orgId],
  );

  // ── Send message (stream display + DB persist) ────────────────────────────
  const sendMessage = useCallback(
    async (text?: string) => {
      const messageText = (text ?? input).trim();
      if (!messageText || isStreaming || !orgId) return;

      setRateLimitError(null);
      setInput("");
      if (inputRef.current) inputRef.current.style.height = "auto";

      // Ensure we have an active conversation
      let convId = activeConvId;
      if (!convId) {
        convId = await createConversation(messageText);
        if (!convId) return;
      }

      const userMsg: UiMessage = {
        id: crypto.randomUUID(),
        role: "user",
        text: messageText,
      };
      const aiMsgId = crypto.randomUUID();
      const aiMsg: UiMessage = {
        id: aiMsgId,
        role: "model",
        text: "",
        isStreaming: true,
      };

      const history = messages.map((m) => ({ role: m.role, text: m.text }));
      setMessages((prev) => [...prev, userMsg, aiMsg]);
      setIsStreaming(true);

      abortRef.current = new AbortController();
      accumulatedTextRef.current = "";
      let contextMeta: UiMessage["contextMeta"] = undefined;
      let rafPending = false;

      const flushUpdate = () => {
        rafPending = false;
        const text = accumulatedTextRef.current;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? { ...m, text, isStreaming: true }
              : m,
          ),
        );
      };

      try {
        const response = await fetch(
          `${backendUrl}/api/organizations/${orgId}/feedback-chat`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "text/event-stream",
              ...getAuthHeaders(),
            },
            credentials: "include",
            body: JSON.stringify({
              messages: [...history, { role: "user", text: messageText }],
            }),
            signal: abortRef.current.signal,
          },
        );

        if (response.status === 429) {
          const json = await response.json().catch(() => ({}));
          const minutes = Math.ceil((json.resetIn || 3600) / 60);
          setRateLimitError(
            `You've sent a lot of messages. Try again in about ${minutes} minute${minutes === 1 ? "" : "s"}.`,
          );
          setMessages((prev) => prev.filter((m) => m.id !== aiMsgId));
          return;
        }
        if (!response.ok || !response.body)
          throw new Error(`HTTP ${response.status}`);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const lines = decoder.decode(value, { stream: true }).split("\n");
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const parsed = JSON.parse(line.slice(6));
              if (parsed.event === "context") contextMeta = parsed.data;
              else if (parsed.event === "chunk") {
                accumulatedTextRef.current += parsed.data;
                if (!rafPending) {
                  rafPending = true;
                  rafRef.current = requestAnimationFrame(flushUpdate);
                }
              } else if (parsed.event === "done") {
                cancelAnimationFrame(rafRef.current);
                const finalText = accumulatedTextRef.current;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMsgId
                      ? {
                          ...m,
                          text: finalText,
                          isStreaming: false,
                          contextMeta,
                        }
                      : m,
                  ),
                );
              } else if (parsed.event === "error") {
                cancelAnimationFrame(rafRef.current);
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === aiMsgId
                      ? {
                          ...m,
                          text: parsed.data,
                          isStreaming: false,
                          isError: true,
                        }
                      : m,
                  ),
                );
              }
            } catch {
              /* malformed SSE */
            }
          }
        }

        // ── Persist to DB after streaming completes ──────────────────────────
        const finalText = accumulatedTextRef.current;
        if (finalText && convId) {
          try {
            await api.post(
              `/api/organizations/${orgId}/ai-chat/conversations/${convId}/messages`,
              {
                userText: messageText,
                assistantText: finalText,
              },
            );
            // Update conversation's position in sidebar (it will have fresh updated_at)
            setConversations((prev) => {
              const idx = prev.findIndex((c) => c.id === convId);
              if (idx < 0) return prev;
              const updated = {
                ...prev[idx],
                updated_at: new Date().toISOString(),
              };
              return [updated, ...prev.filter((c) => c.id !== convId)];
            });
          } catch (saveErr) {
            console.warn("Message streamed OK but DB save failed:", saveErr);
          }
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? {
                  ...m,
                  text: " couldn't send your message. Check your connection and try again.",
                  isStreaming: false,
                  isError: true,
                }
              : m,
          ),
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [
      input,
      messages,
      isStreaming,
      orgId,
      activeConvId,
      createConversation,
      backendUrl,
    ],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleNewChat = () => {
    if (isStreaming) {
      abortRef.current?.abort();
      setIsStreaming(false);
    }
    setActiveConvId(null);
    setMessages([]);
    setRateLimitError(null);
    setSidebarOpen(false);
  };

  const handleSelectConversation = (id: string) => {
    setActiveConvId(id);
    setSidebarOpen(false);
  };

  const handleDeleteConversation = async (id: string) => {
    if (!orgId) return;
    try {
      await api.delete(
        `/api/organizations/${orgId}/ai-chat/conversations/${id}`,
      );
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConvId === id) {
        setActiveConvId(null);
        setMessages([]);
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  return (
    <PaidFeatureGate featureName="AI Feedback Chat">
      <style>{`
        @keyframes msg-enter {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes meta-enter {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
      <div className="h-full flex bg-background overflow-hidden">
        {/* Mobile sidebar toggle */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed bottom-4 left-4 z-30 p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors lg:hidden"
          aria-label="Open conversation sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Sidebar */}
        <ConversationSidebar
          conversations={conversations}
          activeId={activeConvId}
          loading={convLoading}
          onSelect={handleSelectConversation}
          onNew={handleNewChat}
          onDelete={handleDeleteConversation}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto min-h-0">
            <div className="max-w-3xl mx-auto px-4 py-4">
              {msgsLoading ? (
                <div
                  className="flex items-center justify-center py-10"
                  role="status"
                >
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  <span className="sr-only">Loading messages</span>
                </div>
              ) : messages.length === 0 ? (
                <WelcomeState
                  orgName={orgName}
                  onSuggest={(p) => sendMessage(p)}
                />
              ) : (
                messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
              )}
            {rateLimitError && (
              <div className="flex items-start gap-2 mt-2 p-2.5 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800" style={{ animation: "msg-enter 200ms cubic-bezier(0.16, 1, 0.3, 1) both" }}>
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  {rateLimitError}
                </p>
              </div>
            )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          <div className="flex-shrink-0 bg-card/50 backdrop-blur-sm px-3 py-3">
            <div className="max-w-3xl mx-auto">
              <div
                className={`flex items-end gap-2 rounded-2xl border transition-all duration-200 ${isStreaming ? "border-primary/40 bg-primary/5" : "border-border bg-background"} shadow-sm px-3 py-2.5`}
              >
                <label htmlFor="chat-input" className="sr-only">
                  Type your message
                </label>
                <textarea
                  id="chat-input"
                  ref={inputRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height =
                      Math.min(e.target.scrollHeight, 160) + "px";
                  }}
                  onKeyDown={handleKeyDown}
                  disabled={isStreaming}
                  placeholder={
                    isStreaming
                      ? "AI is thinking…"
                      : "Ask about your feedback, clusters, or priorities…"
                  }
                  rows={1}
                  className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-0 leading-relaxed min-h-[24px] max-h-[160px] disabled:opacity-50"
                />
                <Button
                  size="sm"
                  onClick={() => sendMessage()}
                  disabled={!input.trim() || isStreaming}
                  className="flex-shrink-0 min-w-[44px] min-h-[44px] p-0 rounded-xl"
                  aria-label="Send message"
                >
                  <Send className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PaidFeatureGate>
  );
}

export default function AiChatPage() {
  return (
    <ProtectedRoute allowedRoles={["owner", "admin"]}>
      <AiChatContent />
    </ProtectedRoute>
  );
}
