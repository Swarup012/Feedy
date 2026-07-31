'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PaidFeatureGate } from '@/components/PaidFeatureGate';
import { useOrganization } from '@/context/OrganizationContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Sparkles, Send, RotateCcw, ChevronRight, AlertCircle,
  Layers, FileText, Zap, Plus, Trash2, MessageSquare, Loader2,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface DbMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface UiMessage {
  id: string;
  role: 'user' | 'model';
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  { icon: Zap,      label: 'Critical issues', prompt: 'What are the most critical issues users are reporting right now?' },
  { icon: Layers,   label: 'Top clusters',    prompt: 'Summarize the top feedback clusters and what I should prioritize.' },
  { icon: FileText, label: 'Draft changelog', prompt: 'Based on recent completed feedback, draft a public changelog entry.' },
  { icon: Sparkles, label: 'Sentiment check', prompt: 'What is the overall sentiment of feedback?' },
];

function dbToUi(m: DbMessage): UiMessage {
  return { id: m.id, role: m.role === 'assistant' ? 'model' : 'user', text: m.content };
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (typeof window === 'undefined') return headers;
  const tok = localStorage.getItem('access_token') || localStorage.getItem('token');
  if (tok) headers['Authorization'] = `Bearer ${tok}`;
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  if (parts.length >= 3 && !hostname.includes('localhost')) headers['x-subdomain'] = parts[0];
  else if (hostname.includes('localhost') && parts.length > 1 && parts[0] !== 'localhost') headers['x-subdomain'] = parts[0];
  return headers;
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function renderMarkdown(text: string) {
  const lines = text.split('\n');
  const out: React.ReactNode[] = [];
  let k = 0;
  for (const line of lines) {
    if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* '))
      out.push(<li key={k++} className="ml-4 list-disc text-sm leading-relaxed">{inline(line.slice(2))}</li>);
    else if (/^\d+\.\s/.test(line))
      out.push(<li key={k++} className="ml-4 list-decimal text-sm leading-relaxed">{inline(line.replace(/^\d+\.\s/, ''))}</li>);
    else if (line.startsWith('### '))
      out.push(<h3 key={k++} className="font-semibold text-sm mt-3 mb-1">{line.slice(4)}</h3>);
    else if (line.startsWith('## '))
      out.push(<h2 key={k++} className="font-bold text-sm mt-4 mb-1">{line.slice(3)}</h2>);
    else if (line === '')
      out.push(<div key={k++} className="h-2" />);
    else
      out.push(<p key={k++} className="text-sm leading-relaxed">{inline(line)}</p>);
  }
  return out;
}

function inline(text: string): React.ReactNode {
  return text.split(/(\*\*.*?\*\*|`.*?`)/g).map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={i} className="font-semibold">{p.slice(2, -2)}</strong>;
    if (p.startsWith('`') && p.endsWith('`')) return <code key={i} className="font-mono text-xs bg-muted px-1 py-0.5 rounded text-amber-700 dark:text-amber-400">{p.slice(1, -1)}</code>;
    return p;
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0,1,2].map(i => (
        <span key={i} className="w-1.5 h-1.5 rounded-full bg-current opacity-60 animate-bounce"
          style={{ animationDelay: `${i*0.15}s`, animationDuration: '0.9s' }} />
      ))}
    </div>
  );
}

function MessageBubble({ msg }: { msg: UiMessage }) {
  if (msg.role === 'user') {
    return (
      <div className="flex justify-end mb-4">
        <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-primary text-primary-foreground px-4 py-3 shadow-sm">
          <p className="text-sm leading-relaxed">{msg.text}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex justify-start mb-4">
      <div className="flex gap-3 max-w-[85%]">
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm mt-0.5">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm ${msg.isError ? 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800' : 'bg-card border border-border'}`}>
            {msg.isStreaming && msg.text === '' ? <TypingDots /> :
             msg.isError ? (
               <div className="flex items-start gap-2">
                 <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                 <p className="text-sm text-red-700 dark:text-red-400">{msg.text}</p>
               </div>
             ) : (
               <div className={`text-foreground ${msg.isStreaming ? 'after:content-["▋"] after:animate-pulse after:ml-0.5 after:text-primary' : ''}`}>
                 {renderMarkdown(msg.text)}
               </div>
             )}
          </div>
          {msg.contextMeta && !msg.isStreaming && (
            <div className="flex items-center gap-2 mt-1.5 ml-1">
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"><Layers className="w-2.5 h-2.5" />{msg.contextMeta.clustersUsed} clusters</span>
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground"><FileText className="w-2.5 h-2.5" />{msg.contextMeta.postsUsed} posts</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WelcomeState({ orgName, onSuggest }: { orgName: string; onSuggest: (t: string) => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12 space-y-8">
      <div className="relative">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-blue-600 flex items-center justify-center shadow-xl shadow-violet-200 dark:shadow-violet-900/40">
          <Sparkles className="w-9 h-9 text-white" />
        </div>
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-background flex items-center justify-center">
          <span className="text-[8px] text-white font-bold">AI</span>
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground tracking-tight">Your Feedback Intelligence</h2>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          Ask anything about <span className="font-medium text-foreground">{orgName}</span>'s user feedback.
        </p>
      </div>
      <div className="w-full max-w-sm space-y-2">
        {SUGGESTIONS.map(({ icon: Icon, label, prompt }) => (
          <button key={label} onClick={() => onSuggest(prompt)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border border-border bg-card hover:bg-accent hover:border-primary/30 transition-all duration-200 text-left group">
            <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
              <Icon className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">{label}</p>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">{prompt}</p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function ConversationSidebar({
  conversations, activeId, loading,
  onSelect, onNew, onDelete,
}: {
  conversations: Conversation[];
  activeId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="w-60 flex-shrink-0 border-r border-border bg-card/40 flex flex-col h-full">
      <div className="p-3 border-b border-border">
        <Button onClick={onNew} size="sm" className="w-full gap-2 justify-start">
          <Plus className="w-3.5 h-3.5" /> New Chat
        </Button>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : conversations.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">No conversations yet</p>
        ) : (
          conversations.map(c => (
            <div key={c.id}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                activeId === c.id ? 'bg-primary/10 text-primary' : 'hover:bg-accent text-foreground'
              }`}
              onClick={() => onSelect(c.id)}
            >
              <MessageSquare className="w-3.5 h-3.5 flex-shrink-0 opacity-60" />
              <span className="flex-1 text-xs font-medium truncate">{c.title || 'Untitled'}</span>
              <button
                onClick={e => { e.stopPropagation(); onDelete(c.id); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:text-red-500"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── Main Content ─────────────────────────────────────────────────────────────

function AiChatContent() {
  const { organization } = useOrganization();
  const orgId = organization?.id;
  const orgName = organization?.name || 'your organization';

  // Conversations
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [convLoading, setConvLoading] = useState(true);

  // Messages
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [msgsLoading, setMsgsLoading] = useState(false);

  // Input + streaming
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const isCreatingConvRef = useRef(false);
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  // Auto-scroll
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ── Load conversations on mount / org change ──────────────────────────────
  useEffect(() => {
    if (!orgId) return;
    setConvLoading(true);
    setConversations([]);
    setActiveConvId(null);
    setMessages([]);

    api.get(`/api/organizations/${orgId}/ai-chat/conversations`)
      .then(res => {
        const convs: Conversation[] = res.data?.data?.conversations || [];
        setConversations(convs);
        if (convs.length > 0) {
          setActiveConvId(convs[0].id);
        }
      })
      .catch(err => console.error('Failed to load conversations:', err))
      .finally(() => setConvLoading(false));
  }, [orgId]);

  // ── Load messages when active conversation changes ────────────────────────
  useEffect(() => {
    if (!activeConvId || !orgId) { setMessages([]); return; }
    
    // Skip DB fetch if we literally just created it (prevents overwriting the optimistic streaming UI)
    if (isCreatingConvRef.current) {
      isCreatingConvRef.current = false;
      return;
    }

    setMsgsLoading(true);
    api.get(`/api/organizations/${orgId}/ai-chat/conversations/${activeConvId}/messages`)
      .then(res => {
        const dbMsgs: DbMessage[] = res.data?.data?.messages || [];
        setMessages(dbMsgs.map(dbToUi));
      })
      .catch(err => console.error('Failed to load messages:', err))
      .finally(() => setMsgsLoading(false));
  }, [activeConvId, orgId]);

  // ── Create a new conversation ─────────────────────────────────────────────
  const createConversation = useCallback(async (firstMessage: string): Promise<string | null> => {
    if (!orgId) return null;
    try {
      isCreatingConvRef.current = true;
      const res = await api.post(`/api/organizations/${orgId}/ai-chat/conversations`, { firstMessage });
      const conv: Conversation = res.data?.data?.conversation;
      setConversations(prev => [conv, ...prev]);
      setActiveConvId(conv.id);
      return conv.id;
    } catch (err) {
      console.error('Failed to create conversation:', err);
      return null;
    }
  }, [orgId]);

  // ── Send message (stream display + DB persist) ────────────────────────────
  const sendMessage = useCallback(async (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!messageText || isStreaming || !orgId) return;

    setRateLimitError(null);
    setInput('');
    if (inputRef.current) inputRef.current.style.height = 'auto';

    // Ensure we have an active conversation
    let convId = activeConvId;
    if (!convId) {
      convId = await createConversation(messageText);
      if (!convId) return;
    }

    const userMsg: UiMessage = { id: crypto.randomUUID(), role: 'user', text: messageText };
    const aiMsgId = crypto.randomUUID();
    const aiMsg: UiMessage = { id: aiMsgId, role: 'model', text: '', isStreaming: true };

    const history = messages.map(m => ({ role: m.role, text: m.text }));
    setMessages(prev => [...prev, userMsg, aiMsg]);
    setIsStreaming(true);

    abortRef.current = new AbortController();
    let accumulated = '';
    let contextMeta: UiMessage['contextMeta'] = undefined;

    try {
      const response = await fetch(
        `${backendUrl}/api/organizations/${orgId}/feedback-chat`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream', ...getAuthHeaders() },
          credentials: 'include',
          body: JSON.stringify({ messages: [...history, { role: 'user', text: messageText }] }),
          signal: abortRef.current.signal,
        }
      );

      if (response.status === 429) {
        const json = await response.json().catch(() => ({}));
        setRateLimitError(`Rate limit reached. Wait ~${Math.ceil((json.resetIn || 3600) / 60)} min.`);
        setMessages(prev => prev.filter(m => m.id !== aiMsgId));
        return;
      }
      if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const lines = decoder.decode(value, { stream: true }).split('\n');
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.event === 'context') contextMeta = parsed.data;
            else if (parsed.event === 'chunk') {
              accumulated += parsed.data;
              setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: accumulated, isStreaming: true } : m));
            } else if (parsed.event === 'done') {
              setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: accumulated, isStreaming: false, contextMeta } : m));
            } else if (parsed.event === 'error') {
              setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, text: parsed.data, isStreaming: false, isError: true } : m));
            }
          } catch { /* malformed SSE */ }
        }
      }

      // ── Persist to DB after streaming completes ──────────────────────────
      if (accumulated && convId) {
        try {
          await api.post(
            `/api/organizations/${orgId}/ai-chat/conversations/${convId}/messages`,
            {
              userText: messageText,
              assistantText: accumulated,
              // pass last 8 history items for context (AI already answered, just saving)
            }
          );
          // Update conversation's position in sidebar (it will have fresh updated_at)
          setConversations(prev => {
            const idx = prev.findIndex(c => c.id === convId);
            if (idx < 0) return prev;
            const updated = { ...prev[idx], updated_at: new Date().toISOString() };
            return [updated, ...prev.filter(c => c.id !== convId)];
          });
        } catch (saveErr) {
          console.warn('Message streamed OK but DB save failed:', saveErr);
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setMessages(prev => prev.map(m => m.id === aiMsgId
        ? { ...m, text: 'Something went wrong. Please try again.', isStreaming: false, isError: true } : m));
    } finally {
      setIsStreaming(false);
    }
  }, [input, messages, isStreaming, orgId, activeConvId, createConversation, backendUrl]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleNewChat = () => {
    if (isStreaming) { abortRef.current?.abort(); setIsStreaming(false); }
    setActiveConvId(null);
    setMessages([]);
    setRateLimitError(null);
  };

  const handleDeleteConversation = async (id: string) => {
    if (!orgId) return;
    try {
      await api.delete(`/api/organizations/${orgId}/ai-chat/conversations/${id}`);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConvId === id) { setActiveConvId(null); setMessages([]); }
    } catch (err) { console.error('Delete failed:', err); }
  };

  return (
    <PaidFeatureGate featureName="AI Feedback Chat">
    <div className="h-full flex bg-background overflow-hidden">
      {/* Sidebar */}
      <ConversationSidebar
        conversations={conversations}
        activeId={activeConvId}
        loading={convLoading}
        onSelect={id => setActiveConvId(id)}
        onNew={handleNewChat}
        onDelete={handleDeleteConversation}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex-shrink-0 border-b border-border bg-card/50 backdrop-blur-sm px-6 py-4">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-semibold text-foreground leading-tight tracking-tight">AI Feedback Chat</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Grounded in <span className="font-medium text-foreground">{orgName}</span>'s cluster data
                </p>
              </div>
            </div>
            {messages.length > 0 && (
              <Button variant="ghost" size="sm" onClick={handleNewChat} className="text-muted-foreground hover:text-foreground gap-1.5">
                <RotateCcw className="w-3.5 h-3.5" /> New chat
              </Button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="max-w-3xl mx-auto px-4 py-6">
            {msgsLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <WelcomeState orgName={orgName} onSuggest={p => sendMessage(p)} />
            ) : (
              messages.map(msg => <MessageBubble key={msg.id} msg={msg} />)
            )}
            {rateLimitError && (
              <div className="flex items-start gap-2 mt-2 p-3 rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-400">{rateLimitError}</p>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div className="flex-shrink-0 border-t border-border bg-card/50 backdrop-blur-sm px-4 py-4">
          <div className="max-w-3xl mx-auto">
            <div className={`flex items-end gap-2 rounded-2xl border transition-all duration-200 ${isStreaming ? 'border-primary/40 bg-primary/5' : 'border-border bg-background'} shadow-sm px-4 py-3`}>
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px'; }}
                onKeyDown={handleKeyDown}
                disabled={isStreaming}
                placeholder={isStreaming ? 'AI is thinking…' : 'Ask about your feedback, clusters, or priorities…'}
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none leading-relaxed min-h-[24px] max-h-[160px] disabled:opacity-50"
              />
              <Button size="sm" onClick={() => sendMessage()} disabled={!input.trim() || isStreaming} className="flex-shrink-0 h-8 w-8 p-0 rounded-xl">
                <Send className="w-3.5 h-3.5" />
              </Button>
            </div>
            <p className="text-center text-[10px] text-muted-foreground/60 mt-2">
              History saved automatically. Press Enter to send, Shift+Enter for new line.
            </p>
          </div>
        </div>
      </div>
    </div>
    </PaidFeatureGate>
  );
}

export default function AiChatPage() {
  return (
    <ProtectedRoute allowedRoles={['owner', 'admin']}>
      <AiChatContent />
    </ProtectedRoute>
  );
}
