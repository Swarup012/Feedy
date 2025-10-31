'use client';

import { useState, useEffect } from 'react';
import { roadmapService } from '@/services/roadmapService';

export default function AdminRoadmapPage() {
  const [items, setItems] = useState([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const boardSlug = 'general'; // or get from context

  useEffect(() => {
    loadRoadmap();
  }, []);

  const loadRoadmap = async () => {
    try {
      const response = await roadmapService.getRoadmapItems(boardSlug);
      setItems(response.data.items);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleCreate = async (data: any) => {
    try {
      await roadmapService.createRoadmapItem(boardSlug, data);
      setShowCreateDialog(false);
      loadRoadmap();
    } catch (error) {
      alert('Failed to create roadmap item');
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Delete this item?')) return;
    
    try {
      await roadmapService.deleteRoadmapItem(itemId);
      loadRoadmap();
    } catch (error) {
      alert('Failed to delete');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Roadmap</h1>
        <button 
          onClick={() => setShowCreateDialog(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + Create Item
        </button>
      </div>

      <div className="space-y-4">
        {items.map((item: any) => (
          <div key={item.id} className="bg-white rounded-lg border p-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{item.title}</h3>
                <p className="text-gray-600 mt-1">{item.description}</p>
                <div className="flex gap-4 mt-3 text-sm text-gray-500">
                  <span>Status: {item.status}</span>
                  <span>Priority: {item.priority}</span>
                  <span>👍 {item.vote_count}</span>
                </div>
              </div>
              <button 
                onClick={() => handleDelete(item.id)}
                className="text-red-600 hover:text-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCreateDialog && (
        <CreateDialog 
          onClose={() => setShowCreateDialog(false)} 
          onCreate={handleCreate} 
        />
      )}
    </div>
  );
}

function CreateDialog({ onClose, onCreate }: any) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'planned',
    priority: 'medium',
    target_quarter: '',
    progress: 0,
    is_public: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full p-6">
        <h2 className="text-xl font-bold mb-4">Create Roadmap Item</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Title"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
            className="w-full px-3 py-2 border rounded-lg"
          />
          
          <textarea
            placeholder="Description"
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required
            rows={4}
            className="w-full px-3 py-2 border rounded-lg"
          />

          <div className="grid grid-cols-2 gap-4">
            <select
              value={formData.status}
              onChange={(e) => setFormData({...formData, status: e.target.value})}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="planned">Planned</option>
              <option value="in_progress">In Progress</option>
              <option value="in_review">In Review</option>
              <option value="completed">Completed</option>
            </select>

            <select
              value={formData.priority}
              onChange={(e) => setFormData({...formData, priority: e.target.value})}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <input
            type="text"
            placeholder="Target Quarter (e.g., Q1 2025)"
            value={formData.target_quarter}
            onChange={(e) => setFormData({...formData, target_quarter: e.target.value})}
            className="w-full px-3 py-2 border rounded-lg"
          />

          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
