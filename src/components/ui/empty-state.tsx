import * as React from "react"
import { type LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface EmptyStateProps {
  /** Lucide icon component to render at the top */
  icon?: LucideIcon
  /** Short, descriptive heading */
  heading: string
  /** Supporting sentence explaining what to do next */
  body?: string
  /** Optional primary CTA element, e.g. <Button>Add first post</Button> */
  action?: React.ReactNode
  /** Optional secondary link or hint below the action */
  hint?: React.ReactNode
  /** Additional className applied to the outer wrapper */
  className?: string
  /** Center-align the content (default: left-aligned to match admin.css .state-empty) */
  centered?: boolean
}

/**
 * EmptyState — standardised placeholder used across feedback boards,
 * roadmap, tracked users, and any list that can be empty.
 *
 * Usage:
 *   <EmptyState
 *     icon={Inbox}
 *     heading="No feedback yet"
 *     body="Share your board link to start collecting feedback."
 *     action={<Button size="sm">Get the link</Button>}
 *   />
 *
 * Design tokens: uses CSS custom properties from tokens.css so it
 * works identically in light and dark themes without hardcoded colours.
 */
export function EmptyState({
  icon: Icon,
  heading,
  body,
  action,
  hint,
  className,
  centered = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 py-10 px-6",
        centered ? "items-center text-center" : "items-start text-left",
        className
      )}
    >
      {Icon && (
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-lg",
            "bg-muted text-muted-foreground"
          )}
          aria-hidden="true"
        >
          <Icon className="h-5 w-5" strokeWidth={1.5} />
        </div>
      )}

      <div className={cn("flex flex-col gap-1", centered && "items-center")}>
        <p className="text-sm font-semibold leading-snug text-foreground">
          {heading}
        </p>
        {body && (
          <p className="max-w-[42ch] text-sm leading-relaxed text-muted-foreground">
            {body}
          </p>
        )}
      </div>

      {action && <div className="mt-1">{action}</div>}

      {hint && (
        <p className="text-xs text-muted-foreground/70">{hint}</p>
      )}
    </div>
  )
}
