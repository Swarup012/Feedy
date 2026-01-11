"use client";

import { useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { X, AlertTriangle, AlertCircle, Info } from "lucide-react";
import { trackedUsersService } from "@/services/tracked-users.service";
import Link from "next/link";

interface UsageData {
  count: number;
  limit: number;
  usage_percent: number;
  current_period: string;
}

export function TrackedUsersLimitBanner() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsage();
  }, []);

  const loadUsage = async () => {
    try {
      const data = await trackedUsersService.getCount();
      setUsage(data);
    } catch (error) {
      console.error("Failed to load usage:", error);
    } finally {
      setLoading(false);
    }
  };

  // Don't show banner if dismissed, loading, or usage is below 80%
  if (dismissed || loading || !usage || usage.usage_percent < 80) {
    return null;
  }

  const percent = usage.usage_percent;
  const isAtLimit = percent >= 100;
  const isNearLimit = percent >= 90;
  const isApproaching = percent >= 80;

  // Determine banner style and message
  let variant: "default" | "destructive" = "default";
  let Icon = Info;
  let title = "";
  let message = "";
  let bgColor = "bg-blue-50 dark:bg-blue-950";
  let borderColor = "border-blue-200 dark:border-blue-800";
  let textColor = "text-blue-900 dark:text-blue-100";

  if (isAtLimit) {
    variant = "destructive";
    Icon = AlertCircle;
    title = "Tracked Users Limit Reached";
    message = `You've reached your limit of ${usage.limit.toLocaleString()} tracked users for ${usage.current_period}. New users won't be tracked until next month or you upgrade your plan.`;
    bgColor = "bg-red-50 dark:bg-red-950";
    borderColor = "border-red-200 dark:border-red-800";
    textColor = "text-red-900 dark:text-red-100";
  } else if (isNearLimit) {
    Icon = AlertTriangle;
    title = "Approaching Tracked Users Limit";
    message = `You're at ${percent.toFixed(0)}% of your ${usage.limit.toLocaleString()} tracked users limit (${usage.count.toLocaleString()} tracked). Consider upgrading to avoid tracking interruptions.`;
    bgColor = "bg-yellow-50 dark:bg-yellow-950";
    borderColor = "border-yellow-200 dark:border-yellow-800";
    textColor = "text-yellow-900 dark:text-yellow-100";
  } else if (isApproaching) {
    Icon = Info;
    title = "Tracked Users Usage Notice";
    message = `You've used ${percent.toFixed(0)}% of your ${usage.limit.toLocaleString()} tracked users limit (${usage.count.toLocaleString()} tracked this month).`;
    bgColor = "bg-blue-50 dark:bg-blue-950";
    borderColor = "border-blue-200 dark:border-blue-800";
    textColor = "text-blue-900 dark:text-blue-100";
  }

  return (
    <Alert
      className={`relative ${bgColor} ${borderColor} border-2 mb-6`}
      variant={variant}
    >
      <Icon className="h-5 w-5" />
      <AlertTitle className="mb-2 pr-8 font-semibold">{title}</AlertTitle>
      <AlertDescription className={`${textColor} space-y-3`}>
        <p>{message}</p>
        
        <div className="flex flex-wrap gap-2 mt-3">
          <Link href="/admin/tracked-users">
            <Button size="sm" variant="outline">
              View Details
            </Button>
          </Link>
          
          {(isAtLimit || isNearLimit) && (
            <Link href="/admin/settings/billing">
              <Button size="sm" variant={isAtLimit ? "default" : "outline"}>
                Upgrade Plan
              </Button>
            </Link>
          )}
          
          {isApproaching && !isNearLimit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setDismissed(true)}
            >
              Dismiss
            </Button>
          )}
        </div>
      </AlertDescription>
      
      {/* Dismiss button (always visible for non-critical warnings) */}
      {!isAtLimit && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-6 w-6"
          onClick={() => setDismissed(true)}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </Alert>
  );
}
