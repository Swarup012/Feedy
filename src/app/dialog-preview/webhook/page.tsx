"use client";

import { useState } from "react";
import { WebhookFormDialog } from "@/components/webhooks/WebhookFormDialog";

export default function WebhookDialogPreview() {
  const [open, setOpen] = useState(true);

  return (
    <main className="min-h-dvh bg-background p-10 text-foreground">
      <button className="rounded-md border px-3 py-2" onClick={() => setOpen(true)}>
        Open webhook dialog
      </button>
      <WebhookFormDialog open={open} onClose={() => setOpen(false)} onSaved={() => {}} />
    </main>
  );
}
