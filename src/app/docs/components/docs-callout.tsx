import { Info, Lightbulb, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

const variants = {
  note: { icon: Info, label: "Note" },
  tip: { icon: Lightbulb, label: "Tip" },
  warning: { icon: TriangleAlert, label: "Important" },
} as const;

export function DocsCallout({
  variant = "note",
  title,
  children,
}: {
  variant?: keyof typeof variants;
  title?: string;
  children: ReactNode;
}) {
  const v = variants[variant];
  const Icon = v.icon;
  return (
    <div className="flex gap-3 rounded-lg border border-[var(--docs-border)] bg-[var(--docs-surface)] p-4 not-prose">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--docs-accent)]" />
      <div className="min-w-0 text-[0.875rem] leading-relaxed text-[var(--docs-muted)]">
        <p className="mb-1 font-semibold text-[var(--docs-ink)]">{title ?? v.label}</p>
        {children}
      </div>
    </div>
  );
}
