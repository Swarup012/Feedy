'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Copy, Check, Lock, BookOpen } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

// ─────────────────────────────────────────────────────────────
// Copy button
// ─────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="text-muted-foreground hover:text-foreground transition-colors">
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────
// Code block
// ─────────────────────────────────────────────────────────────

function CodeBlock({ title, children }: { title?: string; children: string }) {
  return (
    <div className="rounded-lg border bg-muted/50 overflow-hidden">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/80">
          <span className="text-xs font-medium text-muted-foreground">{title}</span>
          <CopyButton text={children} />
        </div>
      )}
      <pre className="p-4 text-xs overflow-x-auto">
        <code>{children}</code>
      </pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Language-aware code block
// ─────────────────────────────────────────────────────────────

type Language = 'curl' | 'node' | 'typescript';

const LANGUAGE_LABELS: Record<Language, string> = {
  curl: 'cURL',
  node: 'Node.js',
  typescript: 'TypeScript',
};

function CodeBlockMulti({
  title,
  examples,
  language,
}: {
  title?: string;
  examples: Record<Language, string>;
  language: Language;
}) {
  return (
    <div className="rounded-lg border bg-muted/50 overflow-hidden">
      {title && (
        <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/80">
          <span className="text-xs font-medium text-muted-foreground">{title}</span>
          <CopyButton text={examples[language]} />
        </div>
      )}
      <pre className="p-4 text-xs overflow-x-auto">
        <code>{examples[language]}</code>
      </pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Endpoint row
// ─────────────────────────────────────────────────────────────

function Endpoint({
  method,
  path,
  description,
  scopes,
  examples,
  response,
  language,
}: {
  method: string;
  path: string;
  description: string;
  scopes: string[];
  examples: Record<Language, string>;
  response: string;
  language: Language;
}) {
  const methodColors: Record<string, string> = {
    GET: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    POST: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    PATCH: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-muted/30">
        <Badge className={`font-mono text-xs ${methodColors[method] || ''}`} variant="outline">
          {method}
        </Badge>
        <code className="text-sm font-mono">{path}</code>
        <div className="ml-auto flex gap-1">
          {scopes.map((s) => (
            <Badge key={s} variant="secondary" className="text-xs">
              {s}
            </Badge>
          ))}
        </div>
      </div>
      <div className="px-4 py-3 space-y-3">
        <p className="text-sm text-muted-foreground">{description}</p>
        <CodeBlockMulti title="Request" examples={examples} language={language} />
        <CodeBlock title="Response">{response}</CodeBlock>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Examples
// ─────────────────────────────────────────────────────────────

const BASE = 'https://api.faddy.site';
const KEY = 'fdy_live_YOUR_KEY';

function examples(get: string, post?: { body: string; patch?: boolean }): Record<Language, string> {
  const curlGet = `curl -H "Authorization: Bearer ${KEY}" \\
  ${BASE}${get}`;

  const nodeGet = `const res = await fetch('${BASE}${get}', {
  headers: { 'Authorization': 'Bearer ${KEY}' }
});
const data = await res.json();
console.log(data);`;

  const tsGet = `interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const res = await fetch('${BASE}${get}', {
  headers: { 'Authorization': 'Bearer ${KEY}' }
});
const data: ApiResponse<unknown> = await res.json();
console.log(data);`;

  if (!post) {
    return { curl: curlGet, node: nodeGet, typescript: tsGet };
  }

  const method = post.patch ? 'PATCH' : 'POST';
  const curlPost = `curl -X ${method} \\
  -H "Authorization: Bearer ${KEY}" \\
  -H "Content-Type: application/json" \\
  -d '${post.body}' \\
  ${BASE}${get}`;

  const nodePost = `const res = await fetch('${BASE}${get}', {
  method: '${method}',
  headers: {
    'Authorization': 'Bearer ${KEY}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(${post.body})
});
const data = await res.json();
console.log(data);`;

  const tsPost = `interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const res = await fetch('${BASE}${get}', {
  method: '${method}',
  headers: {
    'Authorization': 'Bearer ${KEY}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(${post.body} as const)
});
const data: ApiResponse<unknown> = await res.json();
console.log(data);`;

  return { curl: curlPost, node: nodePost, typescript: tsPost };
}

// ─────────────────────────────────────────────────────────────
// Page data
// ─────────────────────────────────────────────────────────────

const endpoints = [
  {
    method: 'GET',
    path: '/api/v1/boards',
    description: 'List all boards in your organization.',
    scopes: ['read'],
    examples: examples('/api/v1/boards'),
    response: `{
  "success": true,
  "message": "Boards retrieved",
  "data": {
    "boards": [
      {
        "id": "abc-123",
        "name": "Feature Requests",
        "slug": "feature-requests",
        "description": "Suggest new features",
        "is_private": false,
        "icon": "💡",
        "created_at": "2026-01-15T10:00:00Z"
      }
    ]
  }
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/posts',
    description: 'List posts with optional filters. Supports pagination.',
    scopes: ['read'],
    examples: {
      curl: `# List all posts
curl -H "Authorization: Bearer ${KEY}" \\
  ${BASE}/api/v1/posts

# Filter by board and status, paginated
curl -H "Authorization: Bearer ${KEY}" \\
  "${BASE}/api/v1/posts?boardId=abc-123&status=open&limit=10&offset=0"`,
      node: `// List all posts
let res = await fetch('${BASE}/api/v1/posts', {
  headers: { 'Authorization': 'Bearer ${KEY}' }
});
let data = await res.json();
console.log(data);

// Filter by board and status, paginated
const params = new URLSearchParams({
  boardId: 'abc-123',
  status: 'open',
  limit: '10',
  offset: '0'
});
res = await fetch(\`${BASE}/api/v1/posts?\${params}\`, {
  headers: { 'Authorization': 'Bearer ${KEY}' }
});
data = await res.json();
console.log(data);`,
      typescript: `interface Post {
  id: string;
  title: string;
  status: string;
  upvotes: number;
  board: { id: string; name: string; slug: string };
  created_at: string;
}

interface ListResponse {
  success: boolean;
  message: string;
  data: { posts: Post[]; limit: number; offset: number };
}

// List all posts
let res = await fetch('${BASE}/api/v1/posts', {
  headers: { 'Authorization': 'Bearer ${KEY}' }
});
let data: ListResponse = await res.json();
console.log(data);

// Filter by board and status, paginated
const params = new URLSearchParams({
  boardId: 'abc-123',
  status: 'open',
  limit: '10',
  offset: '0'
});
res = await fetch(\`${BASE}/api/v1/posts?\${params}\`, {
  headers: { 'Authorization': 'Bearer ${KEY}' }
});
data = await res.json();
console.log(data);`,
    },
    response: `{
  "success": true,
  "message": "Posts retrieved",
  "data": {
    "posts": [
      {
        "id": "post-456",
        "title": "Dark mode support",
        "description": "Would love a dark theme",
        "status": "open",
        "upvotes": 42,
        "comment_count": 5,
        "board": { "id": "abc-123", "name": "Feature Requests", "slug": "feature-requests" },
        "created_at": "2026-08-10T14:30:00Z"
      }
    ],
    "limit": 10,
    "offset": 0
  }
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/posts/:id',
    description: 'Get a single post by ID.',
    scopes: ['read'],
    examples: examples('/api/v1/posts/post-456'),
    response: `{
  "success": true,
  "message": "Post retrieved",
  "data": {
    "post": {
      "id": "post-456",
      "title": "Dark mode support",
      "description": "Would love a dark theme",
      "status": "open",
      "upvotes": 42,
      "comment_count": 5,
      "board": { "id": "abc-123", "name": "Feature Requests", "slug": "feature-requests" },
      "author": { "id": "user-789", "name": "Jane" },
      "created_at": "2026-08-10T14:30:00Z"
    }
  }
}`,
  },
  {
    method: 'GET',
    path: '/api/v1/posts/:id/comments',
    description: 'Get all comments for a post.',
    scopes: ['read'],
    examples: examples('/api/v1/posts/post-456/comments'),
    response: `{
  "success": true,
  "message": "Comments retrieved",
  "data": {
    "comments": [
      {
        "id": "cmt-001",
        "content": "Great idea!",
        "is_admin": false,
        "created_at": "2026-08-11T09:00:00Z",
        "author": { "id": "user-789", "name": "Jane" }
      }
    ]
  }
}`,
  },
  {
    method: 'POST',
    path: '/api/v1/posts',
    description: 'Create a new post. Webhooks fire automatically (post.created).',
    scopes: ['write'],
    examples: examples('/api/v1/posts', {
      body: `{
  "board_id": "abc-123",
  "title": "New feature",
  "description": "Details here"
}`,
    }),
    response: `{
  "success": true,
  "message": "Post created",
  "data": {
    "post": {
      "id": "post-789",
      "title": "New feature",
      "description": "Details here",
      "status": "open",
      "upvotes": 0,
      "source": "api",
      "board": { "id": "abc-123", "name": "Feature Requests", "slug": "feature-requests" },
      "created_at": "2026-08-20T12:00:00Z"
    }
  }
}`,
  },
  {
    method: 'PATCH',
    path: '/api/v1/posts/:id/status',
    description: 'Update a post\'s status. Webhooks fire automatically (post.status_changed).',
    scopes: ['write'],
    examples: examples('/api/v1/posts/post-456/status', {
      body: `{
  "status": "in_progress",
  "note": "Starting work on this"
}`,
      patch: true,
    }),
    response: `{
  "success": true,
  "message": "Post status updated",
  "data": {
    "post": {
      "id": "post-456",
      "title": "Dark mode support",
      "status": "in_progress"
    }
  }
}`,
  },
  {
    method: 'POST',
    path: '/api/v1/posts/:id/comments',
    description: 'Add a comment to a post. Webhooks fire automatically (comment.created).',
    scopes: ['write'],
    examples: examples('/api/v1/posts/post-456/comments', {
      body: `{
  "content": "Thanks for the feedback!"
}`,
    }),
    response: `{
  "success": true,
  "message": "Comment added",
  "data": {
    "comment": {
      "id": "cmt-002",
      "content": "Thanks for the feedback!",
      "is_admin": false,
      "created_at": "2026-08-20T12:05:00Z"
    }
  }
}`,
  },
  {
    method: 'POST',
    path: '/api/v1/users/identify',
    description: 'Upsert an end user identity into your organization.',
    scopes: ['write'],
    examples: examples('/api/v1/users/identify', {
      body: `{
  "external_user_id": "usr_abc",
  "email": "jane@example.com",
  "name": "Jane"
}`,
    }),
    response: `{
  "success": true,
  "message": "User identified",
  "data": {
    "user": {
      "id": "uuid-123",
      "organization_id": "org-456",
      "external_user_id": "usr_abc",
      "email": "jane@example.com",
      "name": "Jane",
      "identity_type": "verified"
    }
  }
}`,
  },
];

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────

export default function ApiDocsPage() {
  const [lang, setLang] = useState<Language>('curl');

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl mx-auto py-10 px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold">Faddy REST API v1</h1>
          </div>
          <p className="text-muted-foreground">
            Programmatic access to your feedback data. Requires a Pro plan and an API key.
          </p>
        </div>

        {/* Auth section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Lock className="h-4 w-4" />
              Authentication
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              All requests require a Bearer token in the <code>Authorization</code> header.
              Generate keys in <Link href="/admin/organization?tab=api-keys" className="text-primary underline">Organization Settings → API Keys</Link>.
            </p>
            <CodeBlock title="Header format">{`Authorization: Bearer fdy_live_YOUR_API_KEY`}</CodeBlock>
            <div className="grid grid-cols-2 gap-4 mt-3">
              <div>
                <p className="font-medium text-xs mb-1">Key formats</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li><code>fdy_live_*</code> — Production key</li>
                  <li><code>fdy_test_*</code> — Sandbox key</li>
                </ul>
              </div>
              <div>
                <p className="font-medium text-xs mb-1">Scopes</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li><code>read</code> — List and retrieve data</li>
                  <li><code>write</code> — Create and update (implies read)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rate limits */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base">Rate Limits</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>API keys are rate limited per organization. Limits are returned in response headers:</p>
            <div className="grid grid-cols-3 gap-4 mt-2">
              <div>
                <code className="text-xs">X-RateLimit-Limit</code>
                <p className="text-xs text-muted-foreground">Max requests per window</p>
              </div>
              <div>
                <code className="text-xs">X-RateLimit-Remaining</code>
                <p className="text-xs text-muted-foreground">Remaining in window</p>
              </div>
              <div>
                <code className="text-xs">X-RateLimit-Reset</code>
                <p className="text-xs text-muted-foreground">Unix timestamp when window resets</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Pro plan: 600 requests per minute. Returns 429 when exceeded.
            </p>
          </CardContent>
        </Card>

        {/* Endpoints */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Endpoints</h2>
            <Select value={lang} onValueChange={(v) => setLang(v as Language)}>
              <SelectTrigger className="h-8 w-[130px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="curl">cURL</SelectItem>
                <SelectItem value="node">Node.js</SelectItem>
                <SelectItem value="typescript">TypeScript</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="read">
            <TabsList>
              <TabsTrigger value="read">Read</TabsTrigger>
              <TabsTrigger value="write">Write</TabsTrigger>
            </TabsList>

            <TabsContent value="read" className="space-y-4 mt-4">
              {endpoints
                .filter((e) => e.method === 'GET')
                .map((ep, i) => (
                  <Endpoint key={i} {...ep} language={lang} />
                ))}
            </TabsContent>

            <TabsContent value="write" className="space-y-4 mt-4">
              {endpoints
                .filter((e) => e.method !== 'GET')
                .map((ep, i) => (
                  <Endpoint key={i} {...ep} language={lang} />
                ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t text-center text-xs text-muted-foreground">
          API version: v1 · Base URL: <code>{BASE}</code>
        </div>
      </div>
    </div>
  );
}
