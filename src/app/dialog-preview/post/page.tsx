"use client";

import { useState } from "react";
import { CreatePostDialog } from "@/components/feedback/CreatePostDialog";

export default function PostDialogPreview() {
  const [open, setOpen] = useState(true);

  return (
    <main className="min-h-dvh bg-background p-10 text-foreground">
      <button className="rounded-md border px-3 py-2" onClick={() => setOpen(true)}>
        Open post dialog
      </button>
      <CreatePostDialog
        open={open}
        onOpenChange={setOpen}
        boardSlug="feature-requests"
        onPostCreated={() => {}}
      />
    </main>
  );
}
