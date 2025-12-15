"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth"; // ← ADD THIS
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Filter, CalendarIcon, Lock, Globe, MoreVertical, Edit2, Trash2 } from "lucide-react";
import { Board, boardService } from "@/services/boardService";
import { cn } from "@/lib/utils";
import { CreateBoardDialog } from "./CreateBoardDialog";
import { toast, useToast } from "@/hooks/use-toast";
import { IconPicker, IconDisplay } from "@/components/ui/icon-picker";

interface LeftSidebarProps {
  boards: Board[];
  currentBoardSlug: string;
  filters: any;
  onFilterChange: (filters: any) => void;
  onCreateBoard: (board: Board) => void;
  onDeleteBoard?: (boardId: string) => void; // Add delete callback
  selectedBoards?: string[]; // Array of board IDs
  onBoardSelectionChange?: (boardIds: string[]) => void;
}

export function LeftSidebar({
  boards,
  currentBoardSlug,
  filters,
  onFilterChange,
  onCreateBoard,
  onDeleteBoard,
  selectedBoards = [],
  onBoardSelectionChange,
}: LeftSidebarProps) {
  const router = useRouter();
  const { user } = useAuth(); // ← ADD THIS
  const { toast } = useToast();
  const [showFilters, setShowFilters] = useState(false);
  const [showoCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [showAllBoards, setShowAllBoards] = useState(false); // View All toggle
  const [showIconPicker, setShowIconPicker] = useState(false); // Icon picker state
  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    is_private: false,
    color: '#3B82F6',
    icon: 'Lightbulb', // Default to Lucide icon name
  });

  // Show first 5 boards by default, all if "View All" is clicked
  const INITIAL_BOARDS_LIMIT = 2;
  const displayedBoards = showAllBoards ? boards : boards.slice(0, INITIAL_BOARDS_LIMIT);
  const hasMoreBoards = boards.length > INITIAL_BOARDS_LIMIT;

  const isAllSelected = selectedBoards.length === boards.length && boards.length > 0;
  const isSomeSelected = selectedBoards.length > 0 && selectedBoards.length < boards.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      onBoardSelectionChange?.([]);
    } else {
      onBoardSelectionChange?.(boards.map((b) => b.id));
    }
  };

  const handleBoardToggle = (boardId: string) => {
    if (selectedBoards.includes(boardId)) {
      onBoardSelectionChange?.(selectedBoards.filter((id) => id !== boardId));
    } else {
      onBoardSelectionChange?.([...selectedBoards, boardId]);
    }
  };

  const openEditDialog = (board: Board) => {
    setSelectedBoard(board);
    setEditFormData({
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

  const handleEdit = async () => {
    if (!selectedBoard) return;

    if (!editFormData.name.trim()) {
      toast({
        title: 'Error',
        description: 'Board name is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      await boardService.updateBoard(selectedBoard.id, editFormData);
      toast({
        title: 'Success',
        description: 'Board updated successfully',
      });
      setShowEditDialog(false);
      setSelectedBoard(null);
      // Reload the page to refresh boards list
      window.location.reload();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update board',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedBoard) return;

    try {
      await boardService.deleteBoard(selectedBoard.id);
      
      // Call the parent callback to update the boards list
      if (onDeleteBoard) {
        onDeleteBoard(selectedBoard.id);
      }
      
      toast({
        title: 'Success',
        description: 'Board deleted successfully',
      });
      setShowDeleteDialog(false);
      setSelectedBoard(null);
      
      // If we're currently on the deleted board, navigate to first available board
      if (currentBoardSlug === selectedBoard.slug) {
        const remainingBoards = boards.filter(b => b.id !== selectedBoard.id);
        if (remainingBoards.length > 0) {
          router.push(`/admin/feedback/boards/${remainingBoards[0].slug}`);
        } else {
          router.push('/admin/feedback');
        }
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete board',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="w-70 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-y-auto" style={{ width: '280px' }}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-900 z-10">
        <h2 className="font-semibold text-lg mb-2 text-gray-900 dark:text-white">Boards</h2>

        {/* ✅ SHOW FOR OWNERS AND ADMINS */}
        {(user?.organization_role === "owner" || user?.organization_role === "admin") && (
          <Button
            onClick={() => setShowCreateDialog(true)}
            size="sm"
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" />
            New Board
          </Button>
        )}
      </div>

      {/* Boards List */}
      <div className="p-2">
        {/* Select All Option */}
        {onBoardSelectionChange && boards.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-2 mb-2 border-b border-gray-200 dark:border-gray-700">
            <Checkbox
              id="select-all"
              checked={isAllSelected}
              onCheckedChange={handleSelectAll}
              className="data-[state=checked]:bg-blue-600 dark:data-[state=checked]:bg-blue-500"
            />
            <Label
              htmlFor="select-all"
              className="text-sm font-medium cursor-pointer flex-1 text-gray-900 dark:text-white"
            >
              {isAllSelected ? 'Deselect All' : 'Select All Boards'}
            </Label>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {selectedBoards.length}/{boards.length}
            </span>
          </div>
        )}

        {displayedBoards.map((board) => (
          <div
            key={board.id}
            className={cn(
              "w-full text-left p-3 rounded-lg mb-1 transition-colors",
              "hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-3",
              currentBoardSlug === board.slug &&
                "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500",
            )}
          >
            {/* Checkbox for filtering */}
            {onBoardSelectionChange && (
              <Checkbox
                id={`board-${board.id}`}
                checked={selectedBoards.includes(board.id)}
                onCheckedChange={() => handleBoardToggle(board.id)}
                onClick={(e) => e.stopPropagation()}
                className="data-[state=checked]:bg-blue-600"
              />
            )}

            {/* Board Info - Clickable */}
            <button
              onClick={() => router.push(`/admin/feedback/boards/${board.slug}`)}
              className="flex items-center gap-3 flex-1 min-w-0"
            >
              <div
                className="h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: board.color + "20" }}
              >
                <IconDisplay iconName={board.icon} className="h-5 w-5" style={{ color: board.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="font-medium text-sm truncate text-gray-900 dark:text-white">{board.name}</p>
                  {board.is_private ? (
                    <Lock className="h-3 w-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  ) : (
                    <Globe className="h-3 w-3 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{board.post_count} posts</p>
              </div>
            </button>

            {/* Edit/Delete Menu - Admin/Owner only */}
            {(user?.organization_role === "owner" || user?.organization_role === "admin") && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-gray-200 dark:hover:bg-gray-700"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <DropdownMenuItem onClick={() => openEditDialog(board)} className="dark:text-white dark:hover:bg-gray-700">
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit Board
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="dark:bg-gray-700" />
                  <DropdownMenuItem
                    onClick={() => openDeleteDialog(board)}
                    className="text-red-600 dark:text-red-400 dark:hover:bg-gray-700"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Board
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        ))}

        {/* View All / View Less Button */}
        {hasMoreBoards && (
          <Button
            variant="ghost"
            onClick={() => setShowAllBoards(!showAllBoards)}
            className="w-full mt-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
          >
            {showAllBoards ? (
              <>Show Less</>
            ) : (
              <>View All Boards ({boards.length - INITIAL_BOARDS_LIMIT} more)</>
            )}
          </Button>
        )}
      </div>

      {/* Filters Section - Available to all users */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center justify-between w-full mb-3 text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300"
        >
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {showFilters ? "Hide" : "Show"}
          </span>
        </button>

        {showFilters && (
          <div className="space-y-3">
            {/* Status Filter */}
            <div>
              <Label className="text-xs text-gray-700 dark:text-gray-300">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  onFilterChange({
                    ...filters,
                    status: value === "all" ? "" : value,
                  })
                }
              >
                <SelectTrigger className="h-9 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="all" className="dark:text-white dark:hover:bg-gray-700">All statuses</SelectItem>
                  <SelectItem value="open" className="dark:text-white dark:hover:bg-gray-700">Open</SelectItem>
                  <SelectItem value="under-review" className="dark:text-white dark:hover:bg-gray-700">Under Review</SelectItem>
                  <SelectItem value="planned" className="dark:text-white dark:hover:bg-gray-700">Planned</SelectItem>
                  <SelectItem value="in-progress" className="dark:text-white dark:hover:bg-gray-700">In Progress</SelectItem>
                  <SelectItem value="completed" className="dark:text-white dark:hover:bg-gray-700">Completed</SelectItem>
                  <SelectItem value="closed" className="dark:text-white dark:hover:bg-gray-700">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div>
              <Label className="text-xs text-gray-700 dark:text-gray-300">Date Range</Label>
              <div className="space-y-2">
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    onFilterChange({ ...filters, startDate: e.target.value })
                  }
                  className="h-9 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  placeholder="Start date"
                />
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    onFilterChange({ ...filters, endDate: e.target.value })
                  }
                  className="h-9 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                  placeholder="End date"
                />
              </div>
            </div>

            {/* Sort By */}
            <div>
              <Label className="text-xs text-gray-700 dark:text-gray-300">Sort By</Label>
              <Select
                value={filters.sortBy}
                onValueChange={(value) =>
                  onFilterChange({ ...filters, sortBy: value })
                }
              >
                <SelectTrigger className="h-9 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                  <SelectItem value="created_at" className="dark:text-white dark:hover:bg-gray-700">Newest First</SelectItem>
                  <SelectItem value="upvotes" className="dark:text-white dark:hover:bg-gray-700">Most Upvoted</SelectItem>
                  <SelectItem value="comments" className="dark:text-white dark:hover:bg-gray-700">Most Commented</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Clear Filters */}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() =>
                onFilterChange({
                  status: "",
                  search: "",
                  startDate: "",
                  endDate: "",
                  sortBy: "created_at",
                  sortOrder: "desc",
                })
              }
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>
      <CreateBoardDialog
        open={showoCreateDialog}
        onOpenChange={setShowCreateDialog}
        onBoardCreated={(board) => {
          onCreateBoard(board);
          toast({
            title: "Board created",
            description: `Board "${board.name}" has been added`,
          });
        }}
      />

      {/* Edit Board Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="dark:bg-gray-900 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="dark:text-white">Edit Board</DialogTitle>
            <DialogDescription className="dark:text-gray-400">
              Update your board's information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-name" className="dark:text-gray-300">Name *</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="Board name"
                className="mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>
            <div>
              <Label htmlFor="edit-description" className="dark:text-gray-300">Description</Label>
              <Textarea
                id="edit-description"
                value={editFormData.description}
                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                placeholder="Board description"
                rows={3}
                className="mt-1 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-color" className="dark:text-gray-300">Color</Label>
                <Input
                  id="edit-color"
                  type="color"
                  value={editFormData.color}
                  onChange={(e) => setEditFormData({ ...editFormData, color: e.target.value })}
                  className="mt-1 h-10 dark:bg-gray-800 dark:border-gray-700"
                />
              </div>
              <div>
                <Label htmlFor="edit-icon" className="dark:text-gray-300">Icon</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowIconPicker(true)}
                  className="w-full mt-1 justify-start dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700"
                >
                  <IconDisplay iconName={editFormData.icon} className="h-4 w-4 mr-2" />
                  {editFormData.icon || "Choose Icon"}
                </Button>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-private"
                checked={editFormData.is_private}
                onCheckedChange={(checked) => setEditFormData({ ...editFormData, is_private: checked })}
              />
              <Label htmlFor="edit-private" className="dark:text-gray-300">Private Board</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)} className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700">
              Cancel
            </Button>
            <Button onClick={handleEdit}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Board Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="dark:bg-gray-900 dark:border-gray-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="dark:text-white">Delete Board?</AlertDialogTitle>
            <AlertDialogDescription className="dark:text-gray-400">
              Are you sure you want to delete "{selectedBoard?.name}"? This action cannot be undone and will delete all posts in this board.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:hover:bg-gray-700">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Icon Picker Dialog */}
      <IconPicker
        open={showIconPicker}
        onOpenChange={setShowIconPicker}
        onSelectIcon={(iconName) => setEditFormData({ ...editFormData, icon: iconName })}
        currentIcon={editFormData.icon}
      />
    </div>
  );
}
