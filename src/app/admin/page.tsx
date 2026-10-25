"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useOrganization } from "@/context/OrganizationContext";
import api from "@/lib/api";

import { Button } from "@/components/ui/button";

import {
  Users,
  ThumbsUp,
  Zap,
  LayoutGrid,
  ArrowRight,
} from "lucide-react";

import { TrackedUsersLimitBanner } from "@/components/TrackedUsersLimitBanner";
import { ExpertView } from "@/components/admin/ExpertView";

/* ======================================================
   MAIN PAGE
====================================================== */

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const handleError = useErrorHandler({
    context: "loadDashboard",
    showToast: true,
    logError: true,
  });
  const { organization, organizationRole } = useOrganization();

  // Only the isEmpty gate is consumed: totalPosts (non-archived posts)
  // and totalBoards (boards table count), both from dashboard/stats.
  // Stays false while stats is loading or failed → ExpertView shows.
  const [totalPosts, setTotalPosts] = useState<number | null>(null);
  const [totalBoards, setTotalBoards] = useState<number | null>(null);

  const isEmpty =
    totalPosts !== null &&
    totalPosts === 0 &&
    totalBoards !== null &&
    totalBoards === 0;

  /* =======================
     DATA LOADING
     ======================= */

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // dashboard/stats feeds the isEmpty gate (totalPosts + totalBoards);
      // ExpertView's expert-stats does not return either.
      const res = await api.get("/api/dashboard/stats");
      const data = res.data?.data || res.data;
      setTotalPosts(data.totalPosts || 0);
      setTotalBoards(data.totalBoards || 0);
    } catch (err) {
      handleError(err);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["owner", "admin"]}>
      <div className="bg-background flex flex-col min-h-full">
        <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col space-y-4">
          {/* HEADER */}
          <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shrink-0">
            <div>
              <h1 className="text-xl sm:text-2xl font-switzer font-medium tracking-tight text-foreground">
                What needs your attention right now
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                An AI-assisted read on your feedback, so you know where to look
                first.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => router.push("/dashboard")}
                variant="outline"
                className="gap-2 h-9 px-4 text-sm font-medium"
              >
                <Users className="h-4 w-4" />
                Member view
              </Button>
            </div>
          </section>
          {/* TRACKED USERS LIMIT WARNING */}
          <TrackedUsersLimitBanner />

          {isEmpty ? (
            /* ===== EMPTY STATE — first-run ===== */
            <div className="flex-1 overflow-y-auto min-h-0 pb-4">
              <div className="rounded-xl border border-border bg-card">
                <div className="flex flex-col items-center text-center px-6 py-12 sm:py-16">
                  <img
                    src="/images/dashboard/undraw_generating-response_y0h5.svg"
                    alt=""
                    aria-hidden="true"
                    className="w-[260px] sm:w-[320px] h-auto mb-8 select-none"
                  />
                  <h2 className="text-xl font-switzer font-semibold text-foreground">
                    No feedback yet
                  </h2>
                  <p className="text-sm text-muted-foreground mt-2 max-w-md">
                    Create a board, connect Autopilot, and know what your
                    customers want.
                  </p>
                  <Button
                    onClick={() => router.push("/admin/feedback/welcome")}
                    className="h-11 px-6 gap-2 mt-6 font-switzer font-semibold"
                  >
                    Create board
                  </Button>
                  <div className="flex items-center gap-3 sm:gap-4 mt-10 pt-8 border-t border-border w-full max-w-md justify-center text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <LayoutGrid className="w-3.5 h-3.5 text-primary" />
                      Create board
                    </span>
                    <ArrowRight className="w-3 h-3 opacity-40" />
                    <span className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-primary" />
                      Connect Autopilot
                    </span>
                    <ArrowRight className="w-3 h-3 opacity-40" />
                    <span className="flex items-center gap-1.5">
                      <ThumbsUp className="w-3.5 h-3.5 text-primary" />
                      Know your customers
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="pb-2">
              <ExpertView organizationId={organization?.id} />
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
