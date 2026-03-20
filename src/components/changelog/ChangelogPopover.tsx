"use client";

import { useState, useEffect } from "react";
import { Bell, Sparkles, TrendingUp, Wrench, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { changelogService, Changelog } from "@/services/changelogService";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

const TYPE_CONFIG = {
  new: {
    label: "New",
    icon: Sparkles,
    color: "bg-blue-500",
    textColor: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  improved: {
    label: "Improved",
    icon: TrendingUp,
    color: "bg-green-500",
    textColor: "text-green-600",
    bgColor: "bg-green-50",
  },
  fixed: {
    label: "Fixed",
    icon: Wrench,
    color: "bg-purple-500",
    textColor: "text-purple-600",
    bgColor: "bg-purple-50",
  },
};

export function ChangelogPopover() {
  const [open, setOpen] = useState(false);
  const [changelogs, setChangelogs] = useState<Changelog[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (open) {
      fetchChangelogs();
    }
  }, [open]);

  const fetchChangelogs = async () => {
    try {
      setLoading(true);
      const fetchMethod = user 
        ? changelogService.getRecentChangelogs 
        : changelogService.getPublicRecentChangelogs;
      
      const response = await fetchMethod(5);
      setChangelogs(response.data.changelogs || []);

      // Check if there are new changelogs (published in last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const hasNewChangelogs = response.data.changelogs?.some(
        (c) => c.published_at && new Date(c.published_at) > sevenDaysAgo
      );
      setHasNew(hasNewChangelogs || false);
    } catch (error) {
      console.error("Failed to fetch changelogs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAll = () => {
    setOpen(false);
    router.push("/admin/changelog");
  };

  const handleViewChangelog = (slug: string) => {
    setOpen(false);
    router.push(`/admin/changelog/${slug}`);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <Bell className="h-5 w-5" />
          {hasNew && (
            <span className="absolute top-1 right-1 h-2 w-2 bg-blue-600 rounded-full animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[400px] p-0 shadow-xl border-gray-200 dark:border-border"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-gray-900 dark:text-white">
                What's New
              </h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleViewAll}
              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              View All
            </Button>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="h-[400px]">
          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : changelogs.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No updates yet
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                Check back later for new features and improvements
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {changelogs.map((changelog) => {
                const typeConfig = TYPE_CONFIG[changelog.type];
                const Icon = typeConfig.icon;

                return (
                  <div
                    key={changelog.id}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                    onClick={() => handleViewChangelog(changelog.slug)}
                  >
                    <div className="flex gap-3">
                      {/* Type Icon */}
                      <div
                        className={`flex-shrink-0 h-8 w-8 rounded-lg ${typeConfig.bgColor} flex items-center justify-center`}
                      >
                        <Icon className={`h-4 w-4 ${typeConfig.textColor}`} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
                            {changelog.title}
                          </h4>
                          <Badge
                            variant="secondary"
                            className={`${typeConfig.bgColor} ${typeConfig.textColor} text-xs flex-shrink-0`}
                          >
                            {typeConfig.label}
                          </Badge>
                        </div>

                        {changelog.description && (
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                            {changelog.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-500">
                          <span>
                            {changelog.published_at
                              ? formatDistanceToNow(new Date(changelog.published_at), {
                                  addSuffix: true,
                                })
                              : "Draft"}
                          </span>
                          {changelog.view_count > 0 && (
                            <>
                              <span>•</span>
                              <span>{changelog.view_count} views</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t border-gray-200 dark:border-border px-4 py-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleViewAll}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            See Full Changelog
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
