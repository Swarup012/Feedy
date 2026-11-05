import { RoadmapStats as Stats } from '@/services/roadmapService';

interface RoadmapStatsProps {
  stats: Stats;
}

export default function RoadmapStats({ stats }: RoadmapStatsProps) {
  const items = [
    { label: 'Total', value: stats.total },
    { label: 'Planned', value: stats.planned },
    { label: 'In Progress', value: stats.in_progress },
    { label: 'In Review', value: stats.in_review },
    { label: 'Completed', value: stats.completed },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
      {items.map(item => (
        <div key={item.label} className="rounded-lg border border-border bg-card p-4">
          <div className="mb-1 text-sm text-muted-foreground">{item.label}</div>
          <div className="font-headline text-3xl font-semibold tabular-nums text-foreground">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
