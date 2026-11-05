'use client';

import { useState, useEffect, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { roadmapService, RoadmapItem } from '@/services/roadmapService';
import RoadmapStats from '@/components/roadmap/RoadmapStats';
import RoadmapFilters from '@/components/roadmap/RoadmapFilters';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useIsCustomHost } from '@/context/CustomHostContext';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://faddy.site";
import { LoadingAnimation } from '@/components/LoadingAnimation';
import {
  ArrowUpCircle,
  MessageSquare,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowLeft,
  ClipboardList,
} from 'lucide-react';

export default function RoadmapPage() {
  const params = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const isCustomHost = useIsCustomHost();
  const [items, setItems] = useState<RoadmapItem[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: [] as string[],
    category: '',
  });
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');
  const [votedItems, setVotedItems] = useState<Set<string>>(new Set());

  // Get boardSlug from params - don't default to 'general'
  const boardSlug = params?.boardSlug as string;

  useEffect(() => {
    if (boardSlug) {
      loadRoadmap();
    } else {
      setError('No board specified. Please navigate from a feedback board.');
      setLoading(false);
    }
  }, [boardSlug, filters]);

  useEffect(() => {
    if (user) {
      loadUserVotes();
    }
  }, [user, items]);

  const loadRoadmap = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch posts from the specific board with roadmap statuses
      const postsResponse = await api.get(`/api/public/boards/${boardSlug}/posts`, {
        params: {
          status: filters.status.length > 0 ? filters.status.join(',') : 'planned,in-progress,under-review,completed',
          category: filters.category || undefined,
        }
      });

      const posts = postsResponse.data.data || [];

      // Calculate stats from posts
      const calculatedStats = {
        total: posts.length,
        planned: posts.filter((p: any) => p.status === 'planned').length,
        in_progress: posts.filter((p: any) => p.status === 'in-progress').length,
        in_review: posts.filter((p: any) => p.status === 'under-review').length,
        completed: posts.filter((p: any) => p.status === 'completed').length,
      };
      setStats(calculatedStats);

      // Transform posts to roadmap items format
      const transformedItems: RoadmapItem[] = posts.map((post: any) => ({
        id: post.id,
        title: post.title,
        description: post.description || '',
        status: post.status === 'under-review' ? 'in_review' : post.status.replace('-', '_'),
        priority: 'medium' as any,
        category: post.category,
        target_quarter: '',
        target_date: '',
        progress: post.status === 'completed' ? 100 : post.status === 'in-progress' ? 50 : 0,
        order_index: 0,
        is_public: true,
        board_id: post.board_id,
        vote_count: post.upvotes || 0,
        comment_count: post.comment_count || 0,
        created_at: post.created_at,
        updated_at: post.updated_at,
      }));

      setItems(transformedItems);
    } catch (error: any) {
      console.error('Error loading roadmap:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load roadmap';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUserVotes = async () => {
    if (!user) return;
    
    try {
      const voted = new Set<string>();
      for (const item of items) {
        const res = await roadmapService.hasUserVoted(item.id);
        if (res.data.hasVoted) {
          voted.add(item.id);
        }
      }
      setVotedItems(voted);
    } catch (error) {
      console.error('Error loading votes:', error);
    }
  };

  const handleVote = async (itemId: string) => {
    if (!user) {
      if (isCustomHost) {
        // Read-only custom host: vote needs a main-app session.
        window.location.href = `${APP_URL}/login`;
        return;
      }
      toast({
        title: 'Login Required',
        description: 'Please login to vote on roadmap items',
        variant: 'destructive',
      });
      return;
    }

    try {
      await roadmapService.voteRoadmapItem(itemId);
      
      // Update local state
      const newVotedItems = new Set(votedItems);
      if (votedItems.has(itemId)) {
        newVotedItems.delete(itemId);
      } else {
        newVotedItems.add(itemId);
      }
      setVotedItems(newVotedItems);
      
      // Reload to get updated counts
      loadRoadmap();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to vote',
        variant: 'destructive',
      });
    }
  };

  const groupedByQuarter = items.reduce((acc: any, item) => {
    const quarter = item.target_quarter || 'Unscheduled';
    if (!acc[quarter]) acc[quarter] = [];
    acc[quarter].push(item);
    return acc;
  }, {});

  const groupedByStatus = {
    planned: items.filter((i) => i.status === 'planned'),
    in_progress: items.filter((i) => i.status === 'in_progress'),
    in_review: items.filter((i) => i.status === 'in_review'),
    completed: items.filter((i) => i.status === 'completed'),
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoadingAnimation width={64} height={64} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <ClipboardList className="h-6 w-6 text-muted-foreground" />
          </div>
          <h2 className="mt-4 font-headline text-lg font-semibold tracking-tight text-foreground break-words">
            {error}
          </h2>
          <p className="mt-2 text-sm text-foreground">
            {error.includes('not found') 
              ? 'The board you are looking for does not exist or has no roadmap items yet.'
              : 'Please try again or contact support if the problem persists.'}
          </p>
          <Button className="mt-6 focus-visible:ring-2 focus-visible:ring-offset-2" onClick={() => window.location.href = '/feedback'}>
            Go to Feedback Boards
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {user && (
        <div className="border-b border-border bg-secondary">
          <div className="container py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/dashboard'}
              className="gap-2 text-secondary-foreground transition-colors hover:bg-background hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      )}

      <div className="container px-4 py-10 md:py-14">
        {/* Masthead — left aligned */}
        <header className="border-b border-border pb-8">
          <h1 className="font-headline text-3xl font-semibold tracking-tight text-foreground">
            Product Roadmap
          </h1>
          <p className="mt-3 max-w-[70ch] text-base text-foreground">
            See what we&rsquo;re working on and what&rsquo;s coming next
          </p>
          <p className="mt-2 text-sm tabular-nums text-muted-foreground">
            Board {boardSlug}
          </p>
        </header>

        {/* Stats */}
        <div className="mt-8">
          {stats && <RoadmapStats stats={stats} />}
        </div>

        {/* Filters */}
        <div className="mt-8 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <RoadmapFilters filters={filters} onFilterChange={setFilters} />

          <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
            <TabsList>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="list">Board</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        <div className="mt-8">
          {viewMode === 'timeline' ? (
            <TimelineView
              groupedByQuarter={groupedByQuarter}
              votedItems={votedItems}
              onVote={handleVote}
              user={user}
            />
          ) : (
            <BoardView
              groupedByStatus={groupedByStatus}
              votedItems={votedItems}
              onVote={handleVote}
              user={user}
            />
          )}
        </div>

        {items.length === 0 && (
          <div className="py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
              <ClipboardList className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm text-foreground">
              No roadmap items available
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// Lane head — one idiom for both views: name, count, hairline.
function LaneHead({
  icon,
  title,
  count,
  tint,
}: {
  icon?: ReactNode;
  title: string;
  count: number;
  tint?: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-3 border-b border-border pb-3">
      {icon ? (
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full bg-secondary ${
            tint || 'text-muted-foreground'
          }`}
          aria-hidden="true"
        >
          {icon}
        </span>
      ) : null}
      <h2 className="font-headline text-lg font-semibold tracking-tight text-foreground">
        {title}
      </h2>
      <span className="text-sm tabular-nums text-muted-foreground">{count}</span>
    </div>
  );
}

// Timeline View Component
function TimelineView({ groupedByQuarter, votedItems, onVote, user }: any) {
  const quarters = Object.keys(groupedByQuarter).sort();

  return (
    <div className="space-y-10">
      {quarters.map((quarter) => (
        <section key={quarter}>
          <LaneHead title={quarter} count={groupedByQuarter[quarter].length} />

          <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
            {groupedByQuarter[quarter].map((item: RoadmapItem) => (
              <RoadmapCard
                key={item.id}
                item={item}
                hasVoted={votedItems.has(item.id)}
                onVote={onVote}
                user={user}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

// Board View Component — status swimlanes
function BoardView({ groupedByStatus, votedItems, onVote, user }: any) {
  return (
    <div className="space-y-10">
      <StatusColumn
        title="Planned"
        icon={<Clock className="h-4 w-4" />}
        color="gray"
        items={groupedByStatus.planned}
        votedItems={votedItems}
        onVote={onVote}
        user={user}
      />
      <StatusColumn
        title="In Progress"
        icon={<TrendingUp className="h-4 w-4" />}
        color="blue"
        items={groupedByStatus.in_progress}
        votedItems={votedItems}
        onVote={onVote}
        user={user}
      />
      <StatusColumn
        title="In Review"
        icon={<AlertCircle className="h-4 w-4" />}
        color="yellow"
        items={groupedByStatus.in_review}
        votedItems={votedItems}
        onVote={onVote}
        user={user}
      />
      <StatusColumn
        title="Completed"
        icon={<CheckCircle2 className="h-4 w-4" />}
        color="green"
        items={groupedByStatus.completed}
        votedItems={votedItems}
        onVote={onVote}
        user={user}
      />
    </div>
  );
}

// Status Column Component
function StatusColumn({ title, icon, color, items, votedItems, onVote, user }: any) {
  const tints: any = {
    gray: 'text-muted-foreground',
    blue: 'text-primary',
    yellow: 'text-warning',
    green: 'text-success',
  };

  return (
    <section>
      <LaneHead
        icon={icon}
        title={title}
        count={items.length}
        tint={tints[color]}
      />

      {items.length === 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-secondary/30 px-4 py-6">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
            {icon}
          </span>
          <p className="text-sm text-foreground">No items</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
          {items.map((item: RoadmapItem) => (
            <RoadmapCard
              key={item.id}
              item={item}
              hasVoted={votedItems.has(item.id)}
              onVote={onVote}
              user={user}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// Roadmap Card Component
function RoadmapCard({ item, hasVoted, onVote, user }: any) {
  const statusAccents: any = {
    planned: 'border-l-border',
    in_progress: 'border-l-primary',
    in_review: 'border-l-warning',
    completed: 'border-l-success',
  };

  const priorityBadges: any = {
    low: { color: 'border-border bg-secondary text-secondary-foreground', label: 'Low' },
    medium: { color: 'border-transparent bg-primary/10 text-primary', label: 'Medium' },
    high: { color: 'border-transparent bg-warning/15 text-foreground', label: 'High' },
    critical: { color: 'border-transparent bg-destructive/15 text-foreground', label: 'Critical' },
  };

  return (
    <article
      className={cn(
        "flex h-full cursor-pointer flex-col rounded-lg border border-border bg-card p-4 transition-colors hover:bg-secondary/40",
        "border-l-4",
        statusAccents[item.status]
      )}
    >
      {/* Header */}
      <div className="min-w-0">
        <h3 className="text-[15px] font-medium leading-snug text-foreground break-words">
          {item.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-foreground">
          {item.description}
        </p>
      </div>

      {/* Meta */}
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-medium",
            priorityBadges[item.priority].color
          )}
        >
          {priorityBadges[item.priority].label}
        </Badge>
        {item.category && (
          <Badge
            variant="outline"
            className="rounded-full border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
          >
            {item.category}
          </Badge>
        )}
        {item.target_quarter && (
          <Badge
            variant="outline"
            className="rounded-full border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
          >
            <Calendar className="mr-1 h-3 w-3" />
            {item.target_quarter}
          </Badge>
        )}
      </div>

      {/* Progress */}
      {item.progress > 0 && (
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs tabular-nums text-muted-foreground">
            <span>Progress</span>
            <span>{item.progress}%</span>
          </div>
          <Progress value={item.progress} className="h-1.5" />
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between pt-4">
        <Button
          variant={hasVoted ? 'default' : 'outline'}
          size="sm"
          onClick={() => onVote(item.id)}
          className="gap-1 tabular-nums"
        >
          <ArrowUpCircle className={`h-4 w-4 ${hasVoted ? 'fill-current' : ''}`} />
          {item.vote_count}
        </Button>

        <span className="flex items-center gap-1.5 text-sm tabular-nums text-muted-foreground">
          <MessageSquare className="h-4 w-4" />
          {item.comment_count}
        </span>
      </div>
    </article>
  );
}
