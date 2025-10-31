
"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

export default function PublicProfilePage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/admin/profile");
    }
  }, [isAuthenticated, router]);

  return (
    <div className="flex justify-center items-center h-[60vh]">
      <p>Redirecting to your profile...</p>
    </div>
  );
}
