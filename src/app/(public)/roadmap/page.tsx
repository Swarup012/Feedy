'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { roadmapService } from '@/services/roadmapService';

export default function RoadmapPage() {
  const params = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Get boardSlug from params or use default
  const boardSlug = params?.boardSlug as string || 'general';

  useEffect(() => {
    loadRoadmap();
  }, [boardSlug]);

  const loadRoadmap = async () => {
    try {
      setLoading(true);
      const response = await roadmapService.getPublicRoadmap(boardSlug);
      setItems(response.data.items);
    } catch (error) {
      console.error('Error loading roadmap:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center">Loading roadmap...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-8">Product Roadmap</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Planned */}
        <RoadmapColumn 
          title="Planned" 
          items={items.filter(i => i.status === 'planned')} 
        />
        
        {/* In Progress */}
        <RoadmapColumn 
          title="In Progress" 
          items={items.filter(i => i.status === 'in_progress')} 
        />
        
        {/* In Review */}
        <RoadmapColumn 
          title="In Review" 
          items={items.filter(i => i.status === 'in_review')} 
        />
        
        {/* Completed */}
        <RoadmapColumn 
          title="Completed" 
          items={items.filter(i => i.status === 'completed')} 
        />
      </div>
    </div>
  );
}

function RoadmapColumn({ title, items }: any) {
  return (
    <div>
      <h2 className="font-semibold text-lg mb-4 flex items-center justify-between">
        {title}
        <span className="text-sm text-gray-500">{items.length}</span>
      </h2>
      <div className="space-y-3">
        {items.map((item: any) => (
          <div key={item.id} className="bg-white p-4 rounded-lg border hover:shadow-md transition">
            <h3 className="font-semibold mb-2">{item.title}</h3>
            <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
            
            {item.progress > 0 && (
              <div className="mb-3">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span>👍 {item.vote_count}</span>
              <span>💬 {item.comment_count}</span>
              {item.target_quarter && (
                <span className="ml-auto text-xs">{item.target_quarter}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
