import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, ThumbsUp, Rocket, GitPullRequestArrow } from "lucide-react";
import type { MyOverviewStats } from "@/hooks/useFeedbackData";

/**
 * Four overview stat cards. "In the pipeline" is derived from the SAME
 * stats object as the pipeline bar (single /my-overview query), so the
 * card and bar can never disagree.
 */
export function StatCards({ stats }: { stats: MyOverviewStats }) {
  const inPipeline = stats.pipeline.underReview + stats.pipeline.planned + stats.pipeline.inProgress;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">My feedback</CardTitle>
          <MessageSquare className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{stats.myPosts}</div>
          <p className="text-xs text-muted-foreground mt-1">{stats.newThisMonth} new this month</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Votes received</CardTitle>
          <ThumbsUp className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{stats.votesReceived}</div>
          <p className="text-xs text-muted-foreground mt-1">+{stats.votesThisWeek} this week</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">In the pipeline</CardTitle>
          <GitPullRequestArrow className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{inPipeline}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats.pipeline.underReview} under review · {stats.pipeline.planned} planned · {stats.pipeline.inProgress} in progress
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Shipped</CardTitle>
          <Rocket className="h-4 w-4 text-success" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{stats.pipeline.shipped}</div>
          <p className="text-xs text-muted-foreground mt-1">{stats.shippedPercent}% of your suggestions</p>
        </CardContent>
      </Card>
    </div>
  );
}
