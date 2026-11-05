"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function PublicProfilePage() {
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/admin/profile");
    }
  }, [isAuthenticated, router]);

  return (
    <div className="bg-background text-foreground">
      <div className="container max-w-3xl py-12">
        <div className="rounded-lg border border-border bg-card p-8">
          <h1 className="font-headline text-2xl font-semibold tracking-tight text-foreground">
            Profile
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Redirecting to your profile…
          </p>
        </div>
      </div>
    </div>
  );
}
