"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Post } from "@/services/postService";
import { Board } from "@/services/boardService";
import { Skeleton } from "@/components/ui/skeleton";

// PostDetails (~1.6k lines) is loaded on demand when a post is opened in the sheet
const PostDetails = dynamic(
  () => import("@/components/feedback/PostDetails").then((m) => m.PostDetails),
  {
    ssr: false,
    loading: () => (
      <div className="p-6 space-y-3">
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    ),
  }
);

export interface PostDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post: Post | null;
  currentBoard: Board | null;
  boards?: Board[];
  onPostUpdated: (post: Post) => void;
  onPostDeleted: (postId: string) => void;
  onClose?: () => void;
  title?: string;
  isMobile?: boolean;
}

/**
 * PostDetailSheet — unified drawer presentation for post details.
 *
 * Features:
 * - Clean `<SheetHeader>` with title and border separating controls from content.
 * - The drawer close button (✕) sits naturally inside the header bar, avoiding
 *   collision with post titles, upvote buttons, or rail fields.
 * - Responsive sizing: full-width on mobile (< 640px) and 70vw (up to 880px) on
 *   tablets, laptops, and desktop screens.
 * - Single-column responsive collapse on narrow containers (< 680px).
 */
export function PostDetailSheet({
  open,
  onOpenChange,
  post,
  currentBoard,
  boards,
  onPostUpdated,
  onPostDeleted,
  onClose,
  title = "Post Details",
  isMobile = false,
}: PostDetailSheetProps) {
  const handleBack = () => {
    onOpenChange(false);
    onClose?.();
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:w-[70vw] sm:max-w-[840px] md:max-w-[880px] p-0 overflow-hidden flex flex-col"
      >
        <SheetHeader className="px-6 pt-5 pb-3 border-b border-border flex-shrink-0">
          <SheetTitle className="text-base font-semibold text-foreground">
            {title}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-hidden">
          {post ? (
            <PostDetails
              post={post}
              currentBoard={currentBoard}
              boards={boards}
              onPostUpdated={onPostUpdated}
              onPostDeleted={onPostDeleted}
              onBack={handleBack}
              className="pd pd--sheet"
              isMobile={isMobile}
            />
          ) : (
            <div className="p-6 space-y-3">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-96 max-w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/6" />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
