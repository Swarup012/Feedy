"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export function DocsCodeBlock({
  code,
  title,
  language = "html",
}: {
  code: string;
  title?: string;
  language?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (permissions/insecure context) — no-op.
    }
  };

  return (
    <div className="not-prose overflow-hidden rounded-lg border border-[var(--docs-border)] bg-[var(--docs-code-bg)]">
      <div className="flex items-center justify-between border-b border-[var(--docs-border)] px-4 py-2">
        <span className="text-xs font-medium text-[var(--docs-faint)]">
          {title ?? language}
        </span>
        <button
          type="button"
          onClick={copy}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-[var(--docs-muted)] transition-colors hover:bg-[var(--docs-accent-soft)] hover:text-[var(--docs-ink)]"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copied" : "Copy"}
          <span className="sr-only">Copy code to clipboard</span>
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-[13px] leading-relaxed">
        <code className="font-code text-[var(--docs-ink)]">{code}</code>
      </pre>
    </div>
  );
}
