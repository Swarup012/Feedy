import { RoadmapItem } from '@/services/roadmapService';

interface RoadmapTimelineProps {
  items: { [quarter: string]: RoadmapItem[] };
  onVote: (itemId: string) => void;
  onRemoveVote: (itemId: string) => void;
  user: any;
}

export default function RoadmapTimeline({ items, onVote, onRemoveVote, user }: RoadmapTimelineProps) {
  const quarters = Object.keys(items).sort();

  return (
    <div className="space-y-8">
      {quarters.map(quarter => (
        <div key={quarter}>
          <div className="flex items-center mb-4">
            <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold">
              {quarter}
            </div>
            <div className="flex-1 h-px bg-gray-300 ml-4"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items[quarter].map(item => (
              <TimelineCard
                key={item.id}
                item={item}
                onVote={onVote}
                onRemoveVote={onRemoveVote}
                user={user}
              />
            ))}
          </div>
        </div>
      ))}

      {quarters.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No roadmap items available
        </div>
      )}
    </div>
  );
}

function TimelineCard({ item, onVote, onRemoveVote, user }: any) {
  const statusColors = {
    planned: 'border-l-gray-400',
    in_progress: 'border-l-blue-500',
    in_review: 'border-l-yellow-500',
    completed: 'border-l-green-500',
    cancelled: 'border-l-red-500',
  };

  const priorityIcons = {
    low: '▫️',
    medium: '◽',
    high: '🔶',
    critical: '🔴',
  };

  return (
    <div className={`bg-white dark:bg-background rounded-lg border-l-4 ${statusColors[item.status]} p-4 hover:shadow-md dark:hover:shadow-lg transition`}>
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-semibold text-gray-900">{item.title}</h4>
        <span className="text-lg">{priorityIcons[item.priority]}</span>
      </div>

      <p className="text-sm text-gray-600 mb-3">{item.description}</p>

      {item.category && (
        <span className="inline-block px-2 py-1 text-xs rounded bg-gray-100 text-gray-700 mb-3">
          {item.category}
        </span>
      )}

      <div className="flex items-center justify-between text-sm text-gray-500">
        <span className="capitalize">{item.status.replace('_', ' ')}</span>
        <span>{item.vote_count} votes</span>
      </div>
    </div>
  );
}
