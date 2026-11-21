import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Skeleton — token-driven loading placeholder.
 *
 * Uses `--surface-raised` / `--surface-sunken` shimmer pair so it
 * adapts to light and dark themes without hardcoded colours.
 * Animation is suppressed for `prefers-reduced-motion: reduce`.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // Base shape
        "rounded-md",
        // Token-driven background — matches surface hierarchy
        "bg-muted",
        // Shimmer pulse — uses Tailwind's `animate-pulse`.
        // `motion-safe:` ensures it only runs when user has not
        // requested reduced motion (WCAG 2.3.3).
        "motion-safe:animate-pulse",
        className
      )}
      aria-hidden="true"
      {...props}
    />
  )
}

export { Skeleton }
