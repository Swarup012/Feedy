import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PIPELINE_SEGMENT_CLASSES } from "@/lib/status";

interface PipelineSegments {
  open: number;
  underReview: number;
  planned: number;
  inProgress: number;
  shipped: number;
  closed: number;
}

const SEGMENTS: { key: keyof PipelineSegments; label: string; statusKey: string }[] = [
  { key: "open", label: "Open", statusKey: "open" },
  { key: "underReview", label: "Under review", statusKey: "under-review" },
  { key: "planned", label: "Planned", statusKey: "planned" },
  { key: "inProgress", label: "In progress", statusKey: "in-progress" },
  { key: "shipped", label: "Shipped", statusKey: "completed" },
];

/**
 * Segmented pipeline bar + legend. Closed posts are excluded from the bar
 * (5 segments per design) but shown as "N closed" next to the legend so
 * totals reconcile with "My feedback".
 */
export function PipelineCard({ pipeline }: { pipeline: PipelineSegments }) {
  const barTotal = SEGMENTS.reduce((sum, s) => sum + (pipeline[s.key] || 0), 0);

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-foreground">Your feedback pipeline</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="flex h-3 w-full overflow-hidden rounded-full bg-muted"
          role="img"
          aria-label="Feedback pipeline distribution"
        >
          {barTotal === 0 ? (
            <div className="h-full w-full bg-muted" />
          ) : (
            SEGMENTS.map((s) => {
              const count = pipeline[s.key] || 0;
              if (count === 0) return null;
              return (
                <div
                  key={s.key}
                  className={PIPELINE_SEGMENT_CLASSES[s.statusKey] || "bg-muted"}
                  style={{ width: `${(count / barTotal) * 100}%` }}
                  title={`${s.label}: ${count}`}
                />
              );
            })
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {SEGMENTS.map((s) => (
            <div key={s.key} className="flex items-center gap-1.5 text-xs">
              <span
                className={`h-2.5 w-2.5 rounded-full ${PIPELINE_SEGMENT_CLASSES[s.statusKey] || "bg-muted"}`}
              />
              <span className="text-muted-foreground">{s.label}</span>
              <span className="font-semibold text-foreground">{pipeline[s.key] || 0}</span>
            </div>
          ))}
          {pipeline.closed > 0 && (
            <span className="text-xs text-muted-foreground">· {pipeline.closed} closed</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
