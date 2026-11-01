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
} from "lucide-react";

import { TrackedUsersLimitBanner } from "@/components/TrackedUsersLimitBanner";
import {
  ExpertView,
  RangePills,
  type ExpertRange,
} from "@/components/admin/ExpertView";

import "./admin.css";

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

  const [totalPosts, setTotalPosts] = useState<number | null>(null);
  const [totalBoards, setTotalBoards] = useState<number | null>(null);

  const [range, setRange] = useState<ExpertRange>("30d");

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
        <div className="dash" style={{ maxWidth: "var(--container)", marginInline: "auto", paddingInline: "var(--gutter)" }}>
          <section className="dash__head">
            <h1 className="dash__title">
              What needs your attention right now
            </h1>
            <div className="dash__actions">
              {!isEmpty && <RangePills range={range} onChange={setRange} />}
              <Button
                onClick={() => router.push("/dashboard")}
                variant="outline"
                className="gap-2 h-9 px-4 text-sm font-medium"
              >
                <Users className="h-4 w-4" aria-hidden="true" />
                Member view
              </Button>
            </div>
          </section>

          <TrackedUsersLimitBanner />

          {isEmpty ? (
            <div className="flex-1 overflow-y-auto min-h-0 pb-4">
              <div className="panel">
                <div className="flex flex-col items-start px-6 py-12 sm:py-16 max-w-lg">
                  <h2 className="text-xl font-semibold text-foreground">
                    No feedback yet
                  </h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    Create a board, connect Smartflow, and know what your
                    customers want.
                  </p>
                  <ol className="mt-8 pt-6 border-t border-border w-full flex flex-col gap-3 text-sm text-muted-foreground">
                    <li className="flex items-center gap-3">
                      <LayoutGrid className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                      Create board
                    </li>
                    <li className="flex items-center gap-3">
                      <Zap className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                      Connect Smartflow
                    </li>
                    <li className="flex items-center gap-3">
                      <ThumbsUp className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                      Know your customers
                    </li>
                  </ol>
                  <Button
                    onClick={() => router.push("/admin/feedback/welcome")}
                    className="h-11 px-6 gap-2 mt-8 font-semibold"
                  >
                    Create board
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="pb-2">
              <ExpertView
                organizationId={organization?.id}
                range={range}
                onRangeChange={setRange}
              />
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
