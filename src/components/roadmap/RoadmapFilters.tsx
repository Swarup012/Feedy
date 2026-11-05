import { useState } from 'react';

interface RoadmapFiltersProps {
  filters: {
    status: string[];
    category: string;
  };
  onFilterChange: (filters: any) => void;
}

export default function RoadmapFilters({ filters, onFilterChange }: RoadmapFiltersProps) {
  const statuses = ['planned', 'in_progress', 'in_review', 'completed'];
  const categories = ['Feature', 'Bug Fix', 'Improvement', 'Integration'];

  const toggleStatus = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    onFilterChange({ ...filters, status: newStatus });
  };

  return (
    <div className="flex flex-wrap gap-2">
      <select
        value={filters.category}
        onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
        className="px-3 py-2 border rounded-lg text-sm"
      >
        <option value="">All Categories</option>
        {categories.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>

      <div className="flex gap-2">
        {statuses.map(status => (
          <button
            key={status}
            onClick={() => toggleStatus(status)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
              filters.status.includes(status)
                ? 'bg-primary text-primary-foreground'
                : 'border border-border bg-card text-foreground transition-colors hover:bg-muted'
            }`}
          >
            {status.replace('_', ' ')}
          </button>
        ))}
      </div>
    </div>
  );
}
