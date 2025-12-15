'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { boardService, Board } from '@/services/boardService';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/context/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  LayoutDashboard,
  FileText,
  ThumbsUp,
  ArrowLeft,
} from 'lucide-react';
import { LoadingAnimation } from '@/components/LoadingAnimation';
import { IconPicker, IconDisplay } from '@/components/ui/icon-picker';

export default function BoardsManagementPage() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { toast } = useToast();
  
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [showIconPicker, setShowIconPicker] = useState(false); // Icon picker state
  const [iconPickerMode, setIconPickerMode] = useState<'create' | 'edit'>('create'); // Track which form is using picker
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_private: false,
    color: '#3B82F6',
    icon: 'Lightbulb', // Default to Lucide icon name
  });

  // Check if user is admin or owner
  const isAdminOrOwner = user?.organization_role === 'admin' || user?.organization_role === 'owner';

  useEffect(() => {
    loadBoards();
  }, []);

  const loadBoards = async () => {
    try {
      setLoading(true);
      const response = await boardService.getAllBoards();
      setBoards(response.data.boards);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load boards',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      if (!formData.name.trim()) {
        toast({
          title: 'Error',
          description: 'Board name is required',
          variant: 'destructive',
        });
        return;
      }

      await boardService.createBoard(formData);
      toast({
        title: 'Success',
        description: 'Board created successfully',
      });
      setShowCreateDialog(false);
      resetForm();
      loadBoards();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create board',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = async () => {
    try {
      if (!selectedBoard) return;

      if (!formData.name.trim()) {
        toast({
          title: 'Error',
          description: 'Board name is required',
          variant: 'destructive',
        });
        return;
      }

      await boardService.updateBoard(selectedBoard.id, formData);
      toast({
        title: 'Success',
        description: 'Board updated successfully',
      });
      setShowEditDialog(false);
      setSelectedBoard(null);
      resetForm();
      loadBoards();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update board',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    try {
      if (!selectedBoard) return;

      await boardService.deleteBoard(selectedBoard.id);
      toast({
        title: 'Success',
        description: 'Board deleted successfully',
      });
      setShowDeleteDialog(false);
      setSelectedBoard(null);
      loadBoards();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete board',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (board: Board) => {
    setSelectedBoard(board);
    setFormData({
      name: board.name,
      description: board.description || '',
      is_private: board.is_private,
      color: board.color,
      icon: board.icon,
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (board: Board) => {
    setSelectedBoard(board);
    setShowDeleteDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      is_private: false,
      color: '#3B82F6',
      icon: '📋',
    });
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingAnimation width={64} height={64} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/admin')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Board Management</h1>
            <p className="text-gray-500 mt-1">Create and manage feedback boards</p>
          </div>
        </div>
        {isAdminOrOwner && (
          <Button onClick={() => setShowCreateDialog(true)} size="lg">
            <Plus className="h-4 w-4 mr-2" />
            Create Board
          </Button>
        )}
      </div>

      {/* Boards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {boards.map((board) => (
          <Card key={board.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${board.color}20` }}
                  >
                    <IconDisplay iconName={board.icon} className="h-6 w-6" style={{ color: board.color }} />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{board.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={board.is_private ? 'secondary' : 'default'}>
                        {board.is_private ? (
                          <>
                            <EyeOff className="h-3 w-3 mr-1" />
                            Private
                          </>
                        ) : (
                          <>
                            <Eye className="h-3 w-3 mr-1" />
                            Public
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                </div>
                {isAdminOrOwner && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/admin/feedback/boards/${board.slug}`)}>
                        <LayoutDashboard className="h-4 w-4 mr-2" />
                        View Board
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openEditDialog(board)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => openDeleteDialog(board)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {board.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {board.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  {board.post_count || 0} posts
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {boards.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <LayoutDashboard className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No boards yet</h3>
              <p className="text-gray-500 mb-6">
                Create your first feedback board to start collecting user input
              </p>
              {isAdminOrOwner && (
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Board
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Board</DialogTitle>
            <DialogDescription>
              Set up a new feedback board for your organization
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Board Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Feature Requests, Bug Reports, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="What is this board for?"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="icon">Icon</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIconPickerMode('create');
                    setShowIconPicker(true);
                  }}
                  className="w-full justify-start"
                >
                  <IconDisplay iconName={formData.icon} className="h-4 w-4 mr-2" />
                  {formData.icon || "Choose Icon"}
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <Label htmlFor="is_private" className="text-base font-medium">
                  Private Board
                </Label>
                <p className="text-sm text-gray-500">
                  Only organization members can view this board
                </p>
              </div>
              <Switch
                id="is_private"
                checked={formData.is_private}
                onCheckedChange={(checked) => handleInputChange('is_private', checked)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create Board</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Board</DialogTitle>
            <DialogDescription>
              Update board settings and information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Board Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Feature Requests, Bug Reports, etc."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="What is this board for?"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-icon">Icon</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIconPickerMode('edit');
                    setShowIconPicker(true);
                  }}
                  className="w-full justify-start"
                >
                  <IconDisplay iconName={formData.icon} className="h-4 w-4 mr-2" />
                  {formData.icon || "Choose Icon"}
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-color">Color</Label>
                <Input
                  id="edit-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg border">
              <div>
                <Label htmlFor="edit-is_private" className="text-base font-medium">
                  Private Board
                </Label>
                <p className="text-sm text-gray-500">
                  Only organization members can view this board
                </p>
              </div>
              <Switch
                id="edit-is_private"
                checked={formData.is_private}
                onCheckedChange={(checked) => handleInputChange('is_private', checked)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Board</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedBoard?.name}"? This action cannot be
              undone and will delete all posts within this board.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Icon Picker Dialog */}
      <IconPicker
        open={showIconPicker}
        onOpenChange={setShowIconPicker}
        onSelectIcon={(iconName) => handleInputChange('icon', iconName)}
        currentIcon={formData.icon}
      />
    </div>
  );
}
