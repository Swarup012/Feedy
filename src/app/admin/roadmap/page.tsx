'use client';

import { useState, useEffect } from 'react';
import { roadmapService, RoadmapItem } from '@/services/roadmapService';
import { boardService } from '@/services/boardService';
import { useAuthContext } from '@/context/AuthContext';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { UpgradeDialog } from '@/components/UpgradeDialog';
import {
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Link2,
  MessageSquare,
  ArrowUpCircle,
} from 'lucide-react';

export default function AdminRoadmapPage() {
  const { user } = useAuthContext();
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showCreateRoadmapDialog, setShowCreateRoadmapDialog] = useState(false);
  const [showEditRoadmapDialog, setShowEditRoadmapDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<RoadmapItem | null>(null);
  const [selectedView, setSelectedView] = useState('all');
  const [boardSlug, setBoardSlug] = useState<string | null>(null);
  const [allBoards, setAllBoards] = useState<any[]>([]);
  const [selectedBoardFilter, setSelectedBoardFilter] = useState<string>('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roadmaps, setRoadmaps] = useState<any[]>([]);
  const [selectedRoadmap, setSelectedRoadmap] = useState<string | null>(null);
  const [loadingRoadmaps, setLoadingRoadmaps] = useState(false);
  const { toast } = useToast();
  
  // Check if user is admin or owner
  const isAdminOrOwner = user?.organization_role === 'admin' || user?.organization_role === 'owner';

  // Topbar actions live in the admin layout; listen for their intent events.
  useEffect(() => {
    const openCreateItem = () => setShowCreateDialog(true);
    const openCreateRoadmap = () => setShowCreateRoadmapDialog(true);
    window.addEventListener('roadmap:create-item', openCreateItem);
    window.addEventListener('roadmap:new-roadmap', openCreateRoadmap);
    return () => {
      window.removeEventListener('roadmap:create-item', openCreateItem);
      window.removeEventListener('roadmap:new-roadmap', openCreateRoadmap);
    };
  }, []);

  // Fetch all boards on mount
  useEffect(() => {
    const fetchBoards = async () => {
      try {
        const response = await boardService.getAllBoards();
        if (response.data.boards.length > 0) {
          setAllBoards(response.data.boards);
          setBoardSlug(response.data.boards[0].slug);
        } else {
          setAllBoards([]);
          setLoading(false);
          toast({
            title: 'No boards found',
            description: 'Please create a board first',
            variant: 'destructive',
          });
        }
      } catch (error: any) {
        setLoading(false);
        toast({
          title: 'Error',
          description: 'Failed to load boards',
          variant: 'destructive',
        });
      }
    };
    
    const fetchRoadmaps = async () => {
      try {
        setLoadingRoadmaps(true);
        const response = await api.get('/api/roadmaps');
        
        const roadmapsList = response.data.data?.roadmaps || [];
        setRoadmaps(roadmapsList);
        
        // Select first roadmap or default roadmap
        if (roadmapsList.length > 0) {
          const defaultRoadmap = roadmapsList.find((r: any) => r.is_default);
          setSelectedRoadmap(defaultRoadmap?.id || roadmapsList[0].id);
        }
      } catch (error) {
        console.error('Failed to fetch roadmaps:', error);
      } finally {
        setLoadingRoadmaps(false);
      }
    };
    
    fetchBoards();
    fetchRoadmaps();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (allBoards.length > 0 && boardSlug) {
      loadData();
    }
  }, [selectedBoardFilter, boardSlug, isAdminOrOwner, allBoards.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      setLoading(true);
      
      if (isAdminOrOwner) {
        // Admin/Owner: Get ALL roadmap items across all boards
        const filters: any = {};
        if (selectedBoardFilter && selectedBoardFilter !== 'all') {
          filters.boardSlug = selectedBoardFilter;
        }
        
        const itemsRes = await roadmapService.getAllRoadmapItems(filters);
        setItems(itemsRes.data.items);
      } else {
        // Member: Get roadmap items for current board only
        if (!boardSlug) {
          setLoading(false);
          return;
        }
        
        const itemsRes = await roadmapService.getRoadmapItems(boardSlug);
        setItems(itemsRes.data.items);
      }
      
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
    // Use the board slug from the form data, or fallback to current board
    const targetBoardSlug = data.boardSlug || boardSlug;
    
    if (!targetBoardSlug) {
      toast({
        title: 'Error',
        description: 'Please select a board',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      // Remove boardSlug from data before sending to API
      const { boardSlug: _, ...itemData } = data;
      await roadmapService.createRoadmapItem(targetBoardSlug, itemData);
      toast({
        title: 'Success',
        description: 'Roadmap item created successfully',
      });
      setShowCreateDialog(false);
      loadData();
    } catch (error: any) {
      // NOTE: Backend should NOT check roadmap limit when creating roadmap ITEMS
      // Only check when creating ROADMAPS (containers)
      // If you get ROADMAP_LIMIT_REACHED here, it's a backend bug
      
      toast({
        title: 'Error',
        description: error.response?.data?.message || error.message || 'Failed to create item',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (itemId: string, updates: Partial<RoadmapItem>) => {
    try {
      setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
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

  const handleCreateRoadmap = async (data: { name: string; description: string }) => {
    try {
      setIsSubmitting(true);
      const response = await api.post('/api/roadmaps', data);

      const result = response.data;

      toast({
        title: 'Success',
        description: 'Roadmap created successfully',
      });

      // Refresh roadmaps list
      const roadmapsRes = await api.get('/api/roadmaps');
      const roadmapsList = roadmapsRes.data.data?.roadmaps || [];
      setRoadmaps(roadmapsList);
      
      // Select the newly created roadmap
      const newRoadmap = result.data?.roadmap;
      if (newRoadmap) {
        setSelectedRoadmap(newRoadmap.id);
      }

      setShowCreateRoadmapDialog(false);
    } catch (error: any) {
      // Check for limit error
      if (error.response?.data?.error === 'ROADMAP_LIMIT_REACHED') {
        setShowCreateRoadmapDialog(false);
        setShowUpgradeDialog(true);
        return;
      }
      
      toast({
        title: 'Error',
        description: error.response?.data?.message || error.message || 'Failed to create roadmap',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditRoadmap = async (data: { name: string; description: string }) => {
    try {
      setIsSubmitting(true);
      
      if (!selectedRoadmap) {
        toast({
          title: 'Error',
          description: 'No roadmap selected',
          variant: 'destructive',
        });
        return;
      }

      await api.put(`/api/roadmaps/${selectedRoadmap}`, data);

      toast({
        title: 'Success',
        description: 'Roadmap updated successfully',
      });

      // Refresh roadmaps list
      const roadmapsRes = await api.get('/api/roadmaps');
      const roadmapsList = roadmapsRes.data.data?.roadmaps || [];
      setRoadmaps(roadmapsList);

      setShowEditRoadmapDialog(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || error.message || 'Failed to update roadmap',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = items.filter((item) => {
    // Filter by roadmap
    if (selectedRoadmap && (item as any).roadmap_id !== selectedRoadmap) return false;
    // Filter by board first
    if (selectedBoardFilter !== 'all') {
      if (item.board?.slug !== selectedBoardFilter) return false;
    }
    // Then filter by status
    if (selectedView === 'all') return true;
    return item.status === selectedView;
  });

  const groupedByStatus = {
    planned: items.filter((i) => {
      if (selectedRoadmap && (i as any).roadmap_id !== selectedRoadmap) return false;
      if (selectedBoardFilter !== 'all' && i.board?.slug !== selectedBoardFilter) return false;
      return i.status === 'planned';
    }),
    in_progress: items.filter((i) => {
      if (selectedRoadmap && (i as any).roadmap_id !== selectedRoadmap) return false;
      if (selectedBoardFilter !== 'all' && i.board?.slug !== selectedBoardFilter) return false;
      return i.status === 'in_progress';
    }),
    in_review: items.filter((i) => {
      if (selectedRoadmap && (i as any).roadmap_id !== selectedRoadmap) return false;
      if (selectedBoardFilter !== 'all' && i.board?.slug !== selectedBoardFilter) return false;
      return i.status === 'in_review';
    }),
    completed: items.filter((i) => {
      if (selectedRoadmap && (i as any).roadmap_id !== selectedRoadmap) return false;
      if (selectedBoardFilter !== 'all' && i.board?.slug !== selectedBoardFilter) return false;
      return i.status === 'completed';
    }),
    cancelled: items.filter((i) => {
      if (selectedRoadmap && (i as any).roadmap_id !== selectedRoadmap) return false;
      if (selectedBoardFilter !== 'all' && i.board?.slug !== selectedBoardFilter) return false;
      return i.status === 'cancelled';
    }),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary" />
      </div>
    );
  }

  // If no boards exist, show message
  if (allBoards.length === 0) {
    return (
      <div className="rm-page">
        <div className="rm-state">
          <h2 className="rm-state__title">No boards found</h2>
          <p className="rm-state__text">
            Please create a board first before managing roadmap items.
          </p>
          <Button className="text-[13px]" onClick={() => window.location.href = '/admin/feedback'}>
            Go to Boards
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rm-page">
      {/* Header */}
      <div className="rm-head">
        <div>
          <h1 className="rm-title">Roadmap</h1>
          <p className="rm-subtitle">Manage your product roadmap.</p>
        </div>

        {/* Roadmap switcher (admin/owner only) */}
        {isAdminOrOwner && roadmaps.length > 0 && (
          <div className="rm-context">
            <Select value={selectedRoadmap || ''} onValueChange={setSelectedRoadmap}>
              <SelectTrigger
                className="rm-context-select h-auto w-auto border-0 bg-transparent px-1.5 py-1 text-[13px] font-medium text-muted-foreground shadow-none hover:bg-muted"
                aria-label="Select roadmap"
              >
                <SelectValue placeholder="Select roadmap" />
              </SelectTrigger>
              <SelectContent>
                {roadmaps.map((roadmap: any) => (
                  <SelectItem key={roadmap.id} value={roadmap.id}>
                    <div className="flex items-center gap-2">
                      {roadmap.is_default && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                      {roadmap.name}
                      <span className="text-xs text-muted-foreground">{roadmap.item_count || 0}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedRoadmap && (
              <Button
                onClick={() => setShowEditRoadmapDialog(true)}
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                title="Edit roadmap"
                aria-label="Edit roadmap"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="rm-filters">
        {isAdminOrOwner ? (
          <>
            <Select value={selectedBoardFilter} onValueChange={setSelectedBoardFilter}>
              <SelectTrigger
                className="rm-select h-auto w-auto min-w-[160px] px-2.5 py-2 text-[13px] font-medium"
                aria-label="Filter by board"
              >
                <SelectValue placeholder="All boards" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All boards</SelectItem>
                {allBoards.map((board: any) => (
                  <SelectItem key={board.slug} value={board.slug}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: board.color }}
                      />
                      {board.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedView} onValueChange={setSelectedView}>
              <SelectTrigger
                className="rm-select h-auto w-auto min-w-[160px] px-2.5 py-2 text-[13px] font-medium"
                aria-label="Filter by status"
              >
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="planned">Planned</SelectItem>
                <SelectItem value="in_progress">In progress</SelectItem>
                <SelectItem value="in_review">In review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            {selectedBoardFilter !== 'all' && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-[13px] font-medium text-muted-foreground"
                onClick={() => setSelectedBoardFilter('all')}
              >
                Clear filter
              </Button>
            )}
          </>
        ) : (
          boardSlug && (
            <Select value={boardSlug} onValueChange={setBoardSlug}>
              <SelectTrigger
                className="rm-select h-auto w-auto min-w-[160px] px-2.5 py-2 text-[13px] font-medium"
                aria-label="Select board"
              >
                <SelectValue placeholder="Select a board" />
              </SelectTrigger>
              <SelectContent>
                {allBoards.map((board: any) => (
                  <SelectItem key={board.slug} value={board.slug}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: board.color }}
                      />
                      {board.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        )}
      </div>

      {/* Kanban / list view */}
      {selectedView === 'all' ? (
        <div className="rm-grid">
          <StatusColumn
            title="Planned"
            status="planned"
            items={groupedByStatus.planned}
            onStatusChange={handleStatusChange}
            onEdit={setEditingItem}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
            showBoardBadge={isAdminOrOwner}
          />
          <StatusColumn
            title="In progress"
            status="in_progress"
            items={groupedByStatus.in_progress}
            onStatusChange={handleStatusChange}
            onEdit={setEditingItem}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
            showBoardBadge={isAdminOrOwner}
          />
          <StatusColumn
            title="In review"
            status="in_review"
            items={groupedByStatus.in_review}
            onStatusChange={handleStatusChange}
            onEdit={setEditingItem}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
            showBoardBadge={isAdminOrOwner}
          />
          <StatusColumn
            title="Completed"
            status="completed"
            items={groupedByStatus.completed}
            onStatusChange={handleStatusChange}
            onEdit={setEditingItem}
            onDelete={handleDelete}
            onUpdate={handleUpdate}
            showBoardBadge={isAdminOrOwner}
          />
        </div>
      ) : (
        <ItemsList
          items={filteredItems}
          onStatusChange={handleStatusChange}
          onEdit={setEditingItem}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
          showBoardBadge={isAdminOrOwner}
        />
      )}

      {/* Create Dialog */}
      <CreateEditDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSave={handleCreate}
        title="Create Roadmap Item"
        boards={allBoards}
        defaultBoardSlug={boardSlug}
        isSubmitting={isSubmitting}
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
        isSubmitting={isSubmitting}
      />

      {/* Create Roadmap Dialog */}
      <Dialog open={showCreateRoadmapDialog} onOpenChange={setShowCreateRoadmapDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Roadmap</DialogTitle>
            <DialogDescription>
              Create a new roadmap to organize your product development timeline
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleCreateRoadmap({
                name: formData.get('name') as string,
                description: formData.get('description') as string,
              });
            }}
            className="space-y-4"
          >
            <div>
              <Label className="text-[13px] font-medium" htmlFor="roadmap-name">Roadmap Name *</Label>
              <Input
                id="roadmap-name"
                name="name"
                placeholder="E.g., Q1 2026 Roadmap"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label className="text-[13px] font-medium" htmlFor="roadmap-description">Description (Optional)</Label>
              <Textarea
                id="roadmap-description"
                name="description"
                placeholder="Brief description of this roadmap..."
                rows={3}
                disabled={isSubmitting}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="text-[13px]"
                onClick={() => setShowCreateRoadmapDialog(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="text-[13px]" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Roadmap
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Roadmap Dialog */}
      <Dialog open={showEditRoadmapDialog} onOpenChange={setShowEditRoadmapDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Roadmap</DialogTitle>
            <DialogDescription>
              Update the name and description of your roadmap
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleEditRoadmap({
                name: formData.get('name') as string,
                description: formData.get('description') as string,
              });
            }}
            className="space-y-4"
          >
            <div>
              <Label className="text-[13px] font-medium" htmlFor="edit-roadmap-name">Roadmap Name *</Label>
              <Input
                id="edit-roadmap-name"
                name="name"
                placeholder="E.g., Q1 2026 Roadmap"
                defaultValue={roadmaps.find(r => r.id === selectedRoadmap)?.name || ''}
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <Label className="text-[13px] font-medium" htmlFor="edit-roadmap-description">Description (Optional)</Label>
              <Textarea
                id="edit-roadmap-description"
                name="description"
                placeholder="Brief description of this roadmap..."
                defaultValue={roadmaps.find(r => r.id === selectedRoadmap)?.description || ''}
                rows={3}
                disabled={isSubmitting}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="text-[13px]"
                onClick={() => setShowEditRoadmapDialog(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" className="text-[13px]" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2"></div>
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Update Roadmap
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Upgrade Dialog */}
      <UpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        title="Upgrade to Create More Roadmap Items"
        description="You've reached the roadmap item limit for your current plan. Upgrade to create more roadmap items."
        feature="roadmap_items"
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
  showBoardBadge,
}: any) {
  return (
    <section className="rm-column">
      <div className="rm-column__head">
        <span className={`rm-dot rm-dot--${status}`} aria-hidden="true" />
        <h2 className="rm-column__title">{title}</h2>
        <span className="rm-column__count">{items.length}</span>
      </div>
      <div className="rm-column__items">
        {items.map((item: RoadmapItem) => (
          <RoadmapCard
            key={item.id}
            item={item}
            onStatusChange={onStatusChange}
            onEdit={onEdit}
            onDelete={onDelete}
            onUpdate={onUpdate}
            showBoardBadge={showBoardBadge}
          />
        ))}
        {items.length === 0 && (
          <div className="rm-empty">No items</div>
        )}
      </div>
    </section>
  );
}

// Items List Component (List View)
function ItemsList({ items, onStatusChange, onEdit, onDelete, onUpdate, showBoardBadge }: any) {
  return (
    <div className="rm-list">
      {items.map((item: RoadmapItem) => (
        <RoadmapCard
          key={item.id}
          item={item}
          onStatusChange={onStatusChange}
          onEdit={onEdit}
          onDelete={onDelete}
          onUpdate={onUpdate}
          showBoardBadge={showBoardBadge}
        />
      ))}
      {items.length === 0 && (
        <div className="rm-empty">No items found</div>
      )}
    </div>
  );
}

// Roadmap Card Component
function RoadmapCard({ item, onStatusChange, onEdit, onDelete, onUpdate, showBoardBadge }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(item.title);

  const handleQuickUpdate = async () => {
    if (editedTitle !== item.title) {
      await onUpdate(item.id, {
        title: editedTitle,
      });
    }
    setIsEditing(false);
  };

  return (
    <div className="rm-item">
      <div className="rm-item__body">
        {/* Title - Inline Editable */}
        {isEditing ? (
          <Input
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onBlur={handleQuickUpdate}
            onKeyDown={(e) => e.key === 'Enter' && handleQuickUpdate()}
            className="rm-item__input h-8 text-sm"
            autoFocus
          />
        ) : (
          <h4
            className="rm-item__title"
            onClick={() => setIsEditing(true)}
          >
            {item.title}
          </h4>
        )}

        {/* Description */}
        {item.description && (
          <p className="rm-item__desc">{item.description}</p>
        )}

        {/* Meta line: board, votes, comments, links */}
        <div className="rm-item__meta">
          {showBoardBadge && item.board && (
            <span className="rm-item__board">
              <span
                className="rm-board-dot"
                style={{ backgroundColor: item.board.color }}
              />
              {item.board.name}
            </span>
          )}
          <span className="rm-item__stat">
            <ArrowUpCircle />
            {item.vote_count}
          </span>
          <span className="rm-item__stat">
            <MessageSquare />
            {item.comment_count}
          </span>
          {item.linked_feedback?.length > 0 && (
            <span className="rm-item__stat">
              <Link2 />
              {item.linked_feedback.length}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground"
          >
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
          <DropdownMenuItem onClick={() => onDelete(item.id)} className="text-destructive">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Create/Edit Dialog Component
function CreateEditDialog({ open, onClose, onSave, title, initialData, boards = [], defaultBoardSlug = null, isSubmitting = false }: any) {
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
    boardSlug: defaultBoardSlug || '',
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
        boardSlug: initialData.board?.slug || defaultBoardSlug || '',
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
        boardSlug: defaultBoardSlug || '',
      });
    }
  }, [initialData, open, defaultBoardSlug]);

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
          {/* Board Selector - Only show when creating new item */}
          {!initialData && boards.length > 0 && (
            <div>
              <Label className="text-[13px] font-medium" htmlFor="boardSlug">Select Board *</Label>
              <Select 
                value={formData.boardSlug} 
                onValueChange={(v) => setFormData({ ...formData, boardSlug: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a board..." />
                </SelectTrigger>
                <SelectContent>
                  {boards.map((board: any) => (
                    <SelectItem key={board.slug} value={board.slug}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded" 
                          style={{ backgroundColor: board.color }}
                        />
                        {board.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label className="text-[13px] font-medium" htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="E.g., Dark Mode Support"
              disabled={isSubmitting}
            />
          </div>

          <div>
            <Label className="text-[13px] font-medium" htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={4}
              placeholder="Describe what this roadmap item is about..."
              disabled={isSubmitting}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[13px] font-medium" htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(v) => setFormData({ ...formData, status: v })}
                disabled={isSubmitting}
              >
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
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_public"
              checked={formData.is_public}
              onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
              disabled={isSubmitting}
            />
            <Label className="text-[13px] font-medium" htmlFor="is_public">Make this item public</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" className="text-[13px]" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="text-[13px]" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin mr-2"></div>
                  {initialData ? 'Saving...' : 'Creating...'}
                </>
              ) : (
                <>{initialData ? 'Save Changes' : 'Create Item'}</>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
