"use client";

import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useErrorHandler } from "@/hooks/useErrorHandler";
import { useOrganization } from "@/context/OrganizationContext";
import { boardService } from "@/services/boardService";
import api from "@/lib/api";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

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

  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalBoards: 0,
    totalPosts: 0,
    totalVotes: 0,
    pendingPosts: 0,
    newThisWeek: 0,
    activeUsers: 0,
    totalComments: 0,
    statusDistribution: {},
  });

  const [boards, setBoards] = useState([]);

  const pageRef = useRef(null);

  /* =======================
     DATA LOADING (UNCHANGED)
     ======================= */

  useEffect(() => {
    loadDashboardData();
  }, []);

  useEffect(() => {
    if (!loading && pageRef.current) {
      gsap.fromTo(
        pageRef.current.children,
        { opacity: 0, y: 10 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.04,
          ease: "power2.out",
        },
      );
    }
  }, [loading]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const res = await api.get("/api/dashboard/stats");
      const data = res.data?.data || res.data;

      setStats({
        totalBoards: data.totalBoards || 0,
        totalPosts: data.totalPosts || 0,
        totalVotes: data.totalVotes || 0,
        pendingPosts: data.pendingPosts || 0,
        newThisWeek: data.newThisWeek || 0,
        activeUsers: data.activeUsers || 0,
        totalComments: data.totalComments || 0,
        statusDistribution: data.statusDistribution || {},
      });

      // Fetch boards separately for the board list (lightweight)
      try {
        const boardsRes = await boardService.getAllBoards();
        setBoards(boardsRes.data?.boards || []);
      } catch (boardErr) {
        console.warn("Board list fetch failed (non-critical):", boardErr);
      }
      setLoading(false);
    } catch (err) {
      handleError(err);
      setLoading(false);
    }
  };

  const isEmpty =
    !loading && stats.totalPosts === 0 && boards.length === 0;

  return (
    <ProtectedRoute allowedRoles={["owner", "admin"]}>
      <div
        ref={pageRef}
        className="bg-background flex flex-col min-h-full"
      >
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

          {loading ? (
            /* ===== LOADING SKELETON ===== */
            <div className="flex-1 overflow-y-auto min-h-0 pb-4 space-y-4">
              {/* Stat cards skeleton */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border bg-card p-4 flex items-start gap-3"
                  >
                    <Skeleton className="mt-0.5 w-9 h-9 rounded-lg flex-shrink-0" />
                    <div className="min-w-0 space-y-2 flex-1">
                      <Skeleton className="h-7 w-16" />
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                ))}
              </div>
              {/* Two-column skeleton */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="divide-y divide-border">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className="px-5 py-3 flex items-center gap-3"
                        >
                          <Skeleton className="w-2 h-2 rounded-full flex-shrink-0" />
                          <Skeleton className="h-3 w-16 flex-shrink-0" />
                          <Skeleton className="h-4 flex-1" />
                          <Skeleton className="h-3 w-8 flex-shrink-0" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <div className="px-5 py-4 space-y-4">
                      <div className="flex items-baseline gap-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="h-2 w-full rounded-full" />
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="rounded-lg bg-muted/40 py-2 text-center space-y-1">
                            <Skeleton className="h-3 w-10 mx-auto" />
                            <Skeleton className="h-4 w-8 mx-auto" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                      <div className="space-y-1.5">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="divide-y divide-border">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="px-5 py-3 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5">
                            <Skeleton className="w-2 h-2 rounded-full" />
                            <Skeleton className="h-4 w-32" />
                          </div>
                          <Skeleton className="h-3 w-12" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-border">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-40 mt-1.5" />
                    </div>
                    <div className="px-5 py-4 space-y-3">
                      {[0, 1, 2, 3].map((i) => (
                        <div key={i} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-3 w-12" />
                          </div>
                          <Skeleton className="h-1.5 w-full rounded-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </div>
                    <div className="px-5 py-4 space-y-4">
                      <div className="flex items-baseline gap-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="h-2 w-full rounded-full" />
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                        {[0, 1, 2].map((i) => (
                          <div key={i} className="rounded-lg bg-muted/40 py-2 text-center space-y-1">
                            <Skeleton className="h-3 w-10 mx-auto" />
                            <Skeleton className="h-4 w-8 mx-auto" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : isEmpty ? (
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
            /* ===== EXPERT VIEW ===== */
            <div className="pb-2">
              <ExpertView organizationId={organization?.id} />
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
