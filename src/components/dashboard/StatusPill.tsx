import { cn } from "@/lib/utils";
import { statusLabel, statusPillClasses } from "@/lib/status";

/** Status pill with a text label — never color alone. */
export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium",
        statusPillClasses(status),
      )}
    >
      {statusLabel(status)}
    </span>
  );
}
