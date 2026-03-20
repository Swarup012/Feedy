import { RoadmapStats as Stats } from '@/services/roadmapService';

interface RoadmapStatsProps {
  stats: Stats;
}

export default function RoadmapStats({ stats }: RoadmapStatsProps) {
  const items = [
    { label: 'Total', value: stats.total, color: 'bg-gray-100 text-gray-700' },
    { label: 'Planned', value: stats.planned, color: 'bg-purple-100 text-purple-700' },
    { label: 'In Progress', value: stats.in_progress, color: 'bg-blue-100 text-blue-700' },
    { label: 'In Review', value: stats.in_review, color: 'bg-yellow-100 text-yellow-700' },
    { label: 'Completed', value: stats.completed, color: 'bg-green-100 text-green-700' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
      {items.map(item => (
        <div key={item.label} className="bg-white dark:bg-background rounded-lg border dark:border-border p-4">
          <div className="text-sm text-gray-600 mb-1">{item.label}</div>
          <div className="text-3xl font-bold text-gray-900">{item.value}</div>
        </div>
      ))}
    </div>
  );
}
