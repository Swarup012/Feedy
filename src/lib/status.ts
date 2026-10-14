/**
 * Shared post-status vocabulary for the member portal.
 *
 * Uses brand theme tokens (primary / success / warning / destructive /
 * muted) instead of hardcoded palette colors, so pills follow the active
 * theme. Labels are always rendered next to color — never color alone.
 */

export const STATUS_LABELS: Record<string, string> = {
  open: "Open",
  "under-review": "Under review",
  planned: "Planned",
  "in-progress": "In progress",
  completed: "Shipped",
  complete: "Shipped", // legacy value, same as completed
  closed: "Closed",
};

/** Tailwind classes built from theme tokens (see tailwind.config.ts). */
export const STATUS_PILL_CLASSES: Record<string, string> = {
  open: "bg-muted text-muted-foreground",
  "under-review": "bg-primary/10 text-primary",
  planned: "bg-warning/15 text-warning",
  "in-progress": "bg-progress/15 text-progress",
  completed: "bg-success/15 text-success",
  complete: "bg-success/15 text-success",
  closed: "bg-destructive/10 text-destructive",
};

/**
 * Segment colors for the pipeline bar (theme tokens).
 * in-progress uses --progress (violet): the old bg-accent was nearly
 * identical to bg-muted in light mode (L 94% vs 92%) and too close in
 * dark mode (both dark navy-grays) — indistinguishable in a 3px bar.
 */
export const PIPELINE_SEGMENT_CLASSES: Record<string, string> = {
  open: "bg-muted",
  "under-review": "bg-primary",
  planned: "bg-warning",
  "in-progress": "bg-progress",
  completed: "bg-success",
};

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] || status;
}

export function statusPillClasses(status: string): string {
  return STATUS_PILL_CLASSES[status] || "bg-muted text-muted-foreground";
}
