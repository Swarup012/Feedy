"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth"; // ← ADD THIS
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Filter, CalendarIcon, Lock, Globe } from "lucide-react";
import { Board } from "@/services/boardService";
import { cn } from "@/lib/utils";
import { CreateBoardDialog } from "./CreateBoardDialog";
import { toast } from "@/hooks/use-toast";

interface LeftSidebarProps {
  boards: Board[];
  currentBoardSlug: string;
  filters: any;
  onFilterChange: (filters: any) => void;
  onCreateBoard: (board: Board) => void;
  selectedBoards?: string[]; // Array of board IDs
  onBoardSelectionChange?: (boardIds: string[]) => void;
}

export function LeftSidebar({
  boards,
  currentBoardSlug,
  filters,
  onFilterChange,
  onCreateBoard,
  selectedBoards = [],
  onBoardSelectionChange,
}: LeftSidebarProps) {
  const router = useRouter();
  const { user } = useAuth(); // ← ADD THIS
  const [showFilters, setShowFilters] = useState(false);
  const [showoCreateDialog, setShowCreateDialog] = useState(false);

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

  return (
    <div className="w-80 border-r bg-white overflow-y-auto">
      {/* Header */}
      <div className="p-4 border-b sticky top-0 bg-white z-10">
        <h2 className="font-semibold text-lg mb-2">Boards</h2>

        {/* ✅ ONLY SHOW FOR ADMINS */}
        {user?.role === "admin" && (
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
          <div className="flex items-center gap-2 px-3 py-2 mb-2 border-b">
            <Checkbox
              id="select-all"
              checked={isAllSelected}
              onCheckedChange={handleSelectAll}
              className="data-[state=checked]:bg-blue-600"
            />
            <Label
              htmlFor="select-all"
              className="text-sm font-medium cursor-pointer flex-1"
            >
              {isAllSelected ? 'Deselect All' : 'Select All Boards'}
            </Label>
            <span className="text-xs text-gray-500">
              {selectedBoards.length}/{boards.length}
            </span>
          </div>
        )}

        {boards.map((board) => (
          <div
            key={board.id}
            className={cn(
              "w-full text-left p-3 rounded-lg mb-1 transition-colors",
              "hover:bg-gray-100 flex items-center gap-3",
              currentBoardSlug === board.slug &&
                "bg-blue-50 border-l-4 border-blue-500",
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
                className="h-10 w-10 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                style={{ backgroundColor: board.color + "20" }}
              >
                {board.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <p className="font-medium text-sm truncate">{board.name}</p>
                  {board.is_private ? (
                    <Lock className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  ) : (
                    <Globe className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-500">{board.post_count} posts</p>
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* Filters Section - Available to all users */}
      <div className="p-4 border-t mt-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center justify-between w-full mb-3"
        >
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </h3>
          <span className="text-xs text-gray-500">
            {showFilters ? "Hide" : "Show"}
          </span>
        </button>

        {showFilters && (
          <div className="space-y-3">
            {/* Status Filter */}
            <div>
              <Label className="text-xs">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) =>
                  onFilterChange({
                    ...filters,
                    status: value === "all" ? "" : value,
                  })
                }
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="under-review">Under Review</SelectItem>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div>
              <Label className="text-xs">Date Range</Label>
              <div className="space-y-2">
                <Input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    onFilterChange({ ...filters, startDate: e.target.value })
                  }
                  className="h-9 text-sm"
                  placeholder="Start date"
                />
                <Input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    onFilterChange({ ...filters, endDate: e.target.value })
                  }
                  className="h-9 text-sm"
                  placeholder="End date"
                />
              </div>
            </div>

            {/* Sort By */}
            <div>
              <Label className="text-xs">Sort By</Label>
              <Select
                value={filters.sortBy}
                onValueChange={(value) =>
                  onFilterChange({ ...filters, sortBy: value })
                }
              >
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Newest First</SelectItem>
                  <SelectItem value="upvotes">Most Upvoted</SelectItem>
                  <SelectItem value="comments">Most Commented</SelectItem>
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
    </div>
  );
}
