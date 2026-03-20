'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Minus, Loader2 } from 'lucide-react';
import api from '@/lib/api';

interface Roadmap {
  id: string;
  name: string;
  slug: string;
  description?: string;
  is_default: boolean;
  item_count: number;
}

interface RoadmapItem {
  id: string;
  roadmap_id: string;
}

interface AddToRoadmapModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  postTitle: string;
  organizationId: string;
}

export default function AddToRoadmapModal({
  isOpen,
  onClose,
  postId,
  postTitle,
  organizationId,
}: AddToRoadmapModalProps) {
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [linkedRoadmaps, setLinkedRoadmaps] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchRoadmaps();
    }
  }, [isOpen, postId]);

  const fetchRoadmaps = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all roadmaps for the organization
      const roadmapsRes = await api.get('/api/roadmaps');
      setRoadmaps(roadmapsRes.data.data?.roadmaps || []);

      // Fetch roadmap items to see which roadmaps this post is already in
      const itemsRes = await api.get(`/api/roadmap/all?postId=${postId}`);

      const itemsData = itemsRes.data;
      const items = itemsData.data?.items || [];
      
      // Get roadmap IDs that contain this post
      const linkedIds = new Set(
        items
          .filter((item: RoadmapItem) => item.roadmap_id)
          .map((item: RoadmapItem) => item.roadmap_id)
      );
      setLinkedRoadmaps(linkedIds);
    } catch (err) {
      console.error('Error fetching roadmaps:', err);
      setError('Failed to load roadmaps');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRoadmap = async (roadmapId: string, isCurrentlyLinked: boolean) => {
    try {
      setActionLoading(roadmapId);
      setError(null);

      if (isCurrentlyLinked) {
        // Remove from roadmap
        await api.delete(`/api/posts/${postId}/roadmap/${roadmapId}`);

        setLinkedRoadmaps((prev) => {
          const newSet = new Set(prev);
          newSet.delete(roadmapId);
          return newSet;
        });
      } else {
        // Add to roadmap
        await api.post(`/api/posts/${postId}/roadmap/${roadmapId}`, {
          eta: null,
          notes: null,
        });

        setLinkedRoadmaps((prev) => new Set([...prev, roadmapId]));
      }
    } catch (err: any) {
      console.error('Error toggling roadmap:', err);
      
      // Check if it's a limit error
      if (err.response?.data?.error === 'ROADMAP_LIMIT_REACHED') {
        setError('ROADMAP_LIMIT_REACHED');
        return;
      }
      
      setError(err.response?.data?.message || err.message || 'Failed to update roadmap');
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-md rounded-lg bg-white shadow-xl dark:bg-card">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6 dark:border-border">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Add to Roadmap
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Select roadmaps to include <strong>{postTitle}</strong>
          </p>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : roadmaps.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No roadmaps found. Create a roadmap first.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {roadmaps.map((roadmap) => {
                const isLinked = linkedRoadmaps.has(roadmap.id);
                const isLoading = actionLoading === roadmap.id;

                return (
                  <button
                    key={roadmap.id}
                    onClick={() => handleToggleRoadmap(roadmap.id, isLinked)}
                    disabled={isLoading}
                    className={`w-full rounded-lg border p-4 text-left transition-all ${
                      isLinked
                        ? 'border-indigo-500 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-900/20'
                        : 'border-gray-200 bg-white hover:border-gray-300 dark:border-border dark:bg-card dark:hover:border-gray-600'
                    } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {roadmap.name}
                          </h3>
                          {roadmap.is_default && (
                            <span className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">
                              Default
                            </span>
                          )}
                        </div>
                        {roadmap.description && (
                          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {roadmap.description}
                          </p>
                        )}
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                          {roadmap.item_count} {roadmap.item_count === 1 ? 'item' : 'items'}
                        </p>
                      </div>
                      <div className="ml-4">
                        {isLoading ? (
                          <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                        ) : isLinked ? (
                          <div className="rounded-full bg-indigo-600 p-1 text-white">
                            <Minus className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="rounded-full border-2 border-gray-300 p-1 text-gray-400 dark:border-gray-600">
                            <Plus className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 dark:border-border">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
