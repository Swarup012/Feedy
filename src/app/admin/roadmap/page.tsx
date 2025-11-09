'use client';

import { useState, useEffect } from 'react';
import { roadmapService, RoadmapItem } from '@/services/roadmapService';
import { boardService } from '@/services/boardService';
import RoadmapStats from '@/components/roadmap/RoadmapStats';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Link2,
  MessageSquare,
  TrendingUp,
  Calendar,
  GripVertical,
  ArrowUpCircle,
} from 'lucide-react';

export default function AdminRoadmapPage() {
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<RoadmapItem | null>(null);
  const [selectedView, setSelectedView] = useState('all');
  const [boardSlug, setBoardSlug] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch first board on mount
  useEffect(() => {
    const fetchBoard = async () => {
      try {
        const response = await boardService.getAllBoards();
        if (response.data.boards.length > 0) {
          setBoardSlug(response.data.boards[0].slug);
        } else {
          toast({
            title: 'No boards found',
            description: 'Please create a board first',
            variant: 'destructive',
          });
        }
      } catch (error: any) {
        toast({
          title: 'Error',
          description: 'Failed to load boards',
          variant: 'destructive',
        });
      }
    };
    fetchBoard();
  }, []);

  useEffect(() => {
    if (boardSlug) {
      loadData();
    }
  }, [boardSlug]);

  const loadData = async () => {
    if (!boardSlug) return;
    
    try {
      setLoading(true);
      const [itemsRes, statsRes] = await Promise.all([
        roadmapService.getRoadmapItems(boardSlug),
        roadmapService.getRoadmapStats(boardSlug),
      ]);
      setItems(itemsRes.data.items);
      setStats(statsRes.data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load roadmap',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data: any) => {
    if (!boardSlug) return;
    
    try {
      await roadmapService.createRoadmapItem(boardSlug, data);
      toast({
        title: 'Success',
        description: 'Roadmap item created successfully',
      });
      setShowCreateDialog(false);
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create item',
        variant: 'destructive',
      });
    }
  };

  const handleUpdate = async (itemId: string, updates: Partial<RoadmapItem>) => {
    try {
      await roadmapService.updateRoadmapItem(itemId, updates);
      toast({
        title: 'Success',
        description: 'Roadmap item updated successfully',
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update item',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this roadmap item?')) return;

    try {
      await roadmapService.deleteRoadmapItem(itemId);
      toast({
        title: 'Success',
        description: 'Roadmap item deleted successfully',
      });
      loadData();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete item',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (itemId: string, newStatus: string) => {
    await handleUpdate(itemId, { status: newStatus as any });
  };

  const filteredItems = items.filter((item) => {
    if (selectedView === 'all') return true;
    return item.status === selectedView;
  });

  const groupedByStatus = {
    planned: items.filter((i) => i.status === 'planned'),
    in_progress: items.filter((i) => i.status === 'in_progress'),
    in_review: items.filter((i) => i.status === 'in_review'),
    completed: items.filter((i) => i.status === 'completed'),
    cancelled: items.filter((i) => i.status === 'cancelled'),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-gray-500">Loading roadmap...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Roadmap Management</h1>
          <p className="text-gray-500 mt-1">Manage your product roadmap like Canny</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} size="lg">
          <Plus className="h-4 w-4 mr-2" />
          Create Item
        </Button>
      </div>

      {/* Stats */}
      {stats && <RoadmapStats stats={stats} />}

      {/* Tabs for different views */}
      <Tabs value={selectedView} onValueChange={setSelectedView}>
        <TabsList>
          <TabsTrigger value="all">All ({items.length})</TabsTrigger>
          <TabsTrigger value="planned">Planned ({groupedByStatus.planned.length})</TabsTrigger>
          <TabsTrigger value="in_progress">In Progress ({groupedByStatus.in_progress.length})</TabsTrigger>
          <TabsTrigger value="in_review">In Review ({groupedByStatus.in_review.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({groupedByStatus.completed.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={selectedView} className="mt-6">
          {/* Kanban Board View */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {selectedView === 'all' ? (
              <>
                <StatusColumn
                  title="Planned"
                  status="planned"
                  items={groupedByStatus.planned}
                  onStatusChange={handleStatusChange}
                  onEdit={setEditingItem}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                />
                <StatusColumn
                  title="In Progress"
                  status="in_progress"
                  items={groupedByStatus.in_progress}
                  onStatusChange={handleStatusChange}
                  onEdit={setEditingItem}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                />
                <StatusColumn
                  title="In Review"
                  status="in_review"
                  items={groupedByStatus.in_review}
                  onStatusChange={handleStatusChange}
                  onEdit={setEditingItem}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                />
                <StatusColumn
                  title="Completed"
                  status="completed"
                  items={groupedByStatus.completed}
                  onStatusChange={handleStatusChange}
                  onEdit={setEditingItem}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                />
              </>
            ) : (
              <div className="col-span-4">
                <ItemsList
                  items={filteredItems}
                  onStatusChange={handleStatusChange}
                  onEdit={setEditingItem}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                />
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <CreateEditDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSave={handleCreate}
        title="Create Roadmap Item"
      />

      {/* Edit Dialog */}
      <CreateEditDialog
        open={!!editingItem}
        onClose={() => setEditingItem(null)}
        onSave={(data) => {
          if (editingItem) {
            handleUpdate(editingItem.id, data);
            setEditingItem(null);
          }
        }}
        title="Edit Roadmap Item"
        initialData={editingItem || undefined}
      />
    </div>
  );
}

// Status Column Component (Kanban View)
function StatusColumn({
  title,
  status,
  items,
  onStatusChange,
  onEdit,
  onDelete,
  onUpdate,
}: any) {
  const statusColors: any = {
    planned: 'bg-gray-100 border-gray-300',
    in_progress: 'bg-blue-50 border-blue-300',
    in_review: 'bg-yellow-50 border-yellow-300',
    completed: 'bg-green-50 border-green-300',
  };

  return (
    <div className={`rounded-lg border-2 ${statusColors[status]} p-4`}>
      <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-700 mb-4">
        {title} ({items.length})
      </h3>
      <div className="space-y-3">
        {items.map((item: RoadmapItem) => (
          <RoadmapCard
            key={item.id}
            item={item}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
            onDelete={onDelete}
            onUpdate={onUpdate}
          />
        ))}
        {items.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">No items</div>
        )}
      </div>
    </div>
  );
}

// Items List Component (List View)
function ItemsList({ items, onStatusChange, onEdit, onDelete, onUpdate }: any) {
  return (
    <div className="space-y-3">
      {items.map((item: RoadmapItem) => (
        <RoadmapCard
          key={item.id}
          item={item}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdate={onUpdate}
          isListView
        />
      ))}
      {items.length === 0 && (
        <div className="text-center py-12 text-gray-400">No items found</div>
      )}
    </div>
  );
}

// Roadmap Card Component
function RoadmapCard({ item, onStatusChange, onEdit, onDelete, onUpdate, isListView }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(item.title);
  const [editedProgress, setEditedProgress] = useState(item.progress);

  const statusColors: any = {
    planned: 'bg-gray-500',
    in_progress: 'bg-blue-500',
    in_review: 'bg-yellow-500',
    completed: 'bg-green-500',
    cancelled: 'bg-red-500',
  };

  const priorityColors: any = {
    low: 'bg-gray-200 text-gray-700',
    medium: 'bg-blue-200 text-blue-700',
    high: 'bg-orange-200 text-orange-700',
    critical: 'bg-red-200 text-red-700',
  };

  const handleQuickUpdate = async () => {
    if (editedTitle !== item.title || editedProgress !== item.progress) {
      await onUpdate(item.id, {
        title: editedTitle,
        progress: editedProgress,
      });
    }
    setIsEditing(false);
  };

  return (
    <Card className={`hover:shadow-md transition-shadow ${isListView ? 'w-full' : ''}`}>
      <CardContent className="p-4">
        {/* Drag Handle */}
        <div className="flex items-start gap-3">
          <GripVertical className="h-4 w-4 text-gray-400 mt-1 cursor-move" />
          
          <div className="flex-1 min-w-0">
            {/* Title - Inline Editable */}
            {isEditing ? (
              <Input
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                onBlur={handleQuickUpdate}
                onKeyDown={(e) => e.key === 'Enter' && handleQuickUpdate()}
                className="font-semibold text-sm mb-2"
                autoFocus
              />
            ) : (
              <h4
                className="font-semibold text-sm mb-2 cursor-pointer hover:text-blue-600"
                onClick={() => setIsEditing(true)}
              >
                {item.title}
              </h4>
            )}

            {/* Description */}
            <p className="text-xs text-gray-600 mb-3 line-clamp-2">{item.description}</p>

            {/* Metadata */}
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="outline" className={`text-xs ${priorityColors[item.priority]}`}>
                {item.priority}
              </Badge>
              {item.category && (
                <Badge variant="outline" className="text-xs">
                  {item.category}
                </Badge>
              )}
              {item.target_quarter && (
                <Badge variant="outline" className="text-xs">
                  <Calendar className="h-3 w-3 mr-1" />
                  {item.target_quarter}
                </Badge>
              )}
            </div>

            {/* Progress Bar */}
            {item.progress > 0 && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Progress</span>
                  <span>{item.progress}%</span>
                </div>
                <Progress value={item.progress} className="h-2" />
              </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <ArrowUpCircle className="h-3 w-3" />
                  {item.vote_count}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {item.comment_count}
                </span>
                {item.linked_feedback?.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Link2 className="h-3 w-3" />
                    {item.linked_feedback.length}
                  </span>
                )}
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(item)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Details
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onStatusChange(item.id, 'planned')}>
                    Move to Planned
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(item.id, 'in_progress')}>
                    Move to In Progress
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(item.id, 'in_review')}>
                    Move to In Review
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(item.id, 'completed')}>
                    Move to Completed
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onUpdate(item.id, { is_public: !item.is_public })}
                  >
                    {item.is_public ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-2" />
                        Make Private
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-2" />
                        Make Public
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className={`absolute top-0 left-0 w-1 h-full ${statusColors[item.status]} rounded-l`} />
      </CardContent>
    </Card>
  );
}

// Create/Edit Dialog Component
function CreateEditDialog({ open, onClose, onSave, title, initialData }: any) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'planned',
    priority: 'medium',
    category: '',
    target_quarter: '',
    target_date: '',
    progress: 0,
    is_public: true,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        status: initialData.status || 'planned',
        priority: initialData.priority || 'medium',
        category: initialData.category || '',
        target_quarter: initialData.target_quarter || '',
        target_date: initialData.target_date || '',
        progress: initialData.progress || 0,
        is_public: initialData.is_public ?? true,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        status: 'planned',
        priority: 'medium',
        category: '',
        target_quarter: '',
        target_date: '',
        progress: 0,
        is_public: true,
      });
    }
  }, [initialData, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clean up empty strings to undefined/null for optional fields
    const cleanedData = {
      ...formData,
      category: formData.category || undefined,
      target_quarter: formData.target_quarter || undefined,
      target_date: formData.target_date || undefined,
    };
    
    onSave(cleanedData);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Fill in the details for your roadmap item
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="E.g., Dark Mode Support"
            />
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={4}
              placeholder="Describe what this roadmap item is about..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="priority">Priority</Label>
              <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="E.g., Feature, Bug Fix"
              />
            </div>

            <div>
              <Label htmlFor="target_quarter">Target Quarter</Label>
              <Input
                id="target_quarter"
                value={formData.target_quarter}
                onChange={(e) => setFormData({ ...formData, target_quarter: e.target.value })}
                placeholder="E.g., Q1 2025"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="progress">Progress ({formData.progress}%)</Label>
            <input
              type="range"
              id="progress"
              min="0"
              max="100"
              value={formData.progress}
              onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_public"
              checked={formData.is_public}
              onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
            />
            <Label htmlFor="is_public">Make this item public</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {initialData ? 'Save Changes' : 'Create Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
