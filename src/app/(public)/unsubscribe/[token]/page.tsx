"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertCircle, BellOff, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "idle" | "submitting" | "success" | "error";

export default function UnsubscribePage() {
  const params = useParams();
  const token = typeof params.token === "string" ? params.token : "";
  const [status, setStatus] = useState<Status>("idle");

  const handleUnsubscribe = async () => {
    if (!token) {
      setStatus("error");
      return;
    }

    setStatus("submitting");
    try {
      // Same-origin call; Next rewrites /api/* to the Express backend.
      const response = await fetch(
        `/api/notifications/unsubscribe/${encodeURIComponent(token)}`,
        { method: "POST" }
      );
      setStatus(response.ok ? "success" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="bg-background text-foreground">
      <div className="container max-w-xl py-12">
        <div className="rounded-lg border border-border bg-card p-8 text-center sm:p-10">
          {status === "success" ? (
            <>
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
                <CheckCircle2 className="h-7 w-7 text-success" strokeWidth={2} />
              </div>
              <h1 className="font-headline text-2xl font-semibold tracking-tight text-foreground">
                You&apos;re unsubscribed
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                All notification emails sent through Faddy to this email address
                are now stopped — completion, progress, and comment emails from
                every organization. You can still browse the roadmap and feedback
                boards anytime.
              </p>
              <Button asChild size="lg" className="mt-8">
                <Link href="/">Back to Home</Link>
              </Button>
            </>
          ) : status === "error" ? (
            <>
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/15">
                <AlertCircle className="h-7 w-7 text-destructive" strokeWidth={2} />
              </div>
              <h1 className="font-headline text-2xl font-semibold tracking-tight text-foreground">
                Couldn&apos;t unsubscribe
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                This unsubscribe link is invalid or has expired. If you keep
                receiving emails you don&apos;t want, reply to one of them and
                we&apos;ll remove you manually.
              </p>
              <Button asChild size="lg" variant="outline" className="mt-8">
                <Link href="/">Back to Home</Link>
              </Button>
            </>
          ) : (
            <>
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                <BellOff className="h-7 w-7 text-muted-foreground" strokeWidth={2} />
              </div>
              <h1 className="font-headline text-2xl font-semibold tracking-tight text-foreground">
                Unsubscribe from notifications
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
                Confirming will stop all notification emails sent through Faddy
                to this email address — completion, progress, and comment
                emails — from every organization.
              </p>
              <Button
                size="lg"
                variant="destructive"
                className="mt-8"
                disabled={status === "submitting"}
                onClick={handleUnsubscribe}
              >
                {status === "submitting" && (
                  <Loader2 className="h-4 w-4 animate-spin" />
                )}
                {status === "submitting" ? "Unsubscribing…" : "Yes, unsubscribe"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
