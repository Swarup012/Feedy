'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoadingAnimation } from '@/components/LoadingAnimation';
import api from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import RoadmapStats from '@/components/roadmap/RoadmapStats';
import RoadmapFilters from '@/components/roadmap/RoadmapFilters';
import {
  ArrowUpCircle,
  MessageSquare,
  Calendar,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: 'planned' | 'in_progress' | 'in_review' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category?: string;
  target_quarter?: string;
  target_date?: string;
  progress: number;
  order_index: number;
  is_public: boolean;
  board_id: string;
  vote_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
}

export default function RoadmapIndexPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
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
  const [organizationName, setOrganizationName] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [filters.status.join(','), filters.category]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (user && items.length > 0) {
      loadUserVotes();
    }
  }, [user, items.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get organization info from subdomain
      const subdomain = window.location.hostname.split('.')[0];
      
      // Fetch public roadmap posts (posts with roadmap statuses from public boards)
      const postsResponse = await api.get('/api/public/roadmap', {
        params: {
          status: filters.status.length > 0 ? filters.status.join(',') : undefined,
          category: filters.category || undefined,
        }
      });

      const posts = postsResponse.data.data.posts || [];

      // Get organization name from subdomain
      setOrganizationName(subdomain);

      // Calculate stats from posts
      const combinedStats = {
        total: posts.length,
        planned: posts.filter(p => p.status === 'planned').length,
        in_progress: posts.filter(p => p.status === 'in-progress').length,
        in_review: posts.filter(p => p.status === 'under-review').length,
        completed: posts.filter(p => p.status === 'completed').length,
        total_votes: posts.reduce((sum, p) => sum + (p.upvotes || 0), 0),
        total_comments: posts.reduce((sum, p) => sum + (p.comment_count || 0), 0),
      };
      setStats(combinedStats);

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
      setError('Failed to load roadmap');
      toast({
        title: 'Error',
        description: 'Failed to load roadmap data',
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
        try {
          const res = await api.get(`/api/roadmap/${item.id}/voted`);
          if (res.data.data.hasVoted) {
            voted.add(item.id);
          }
        } catch (err) {
          // Silently fail for individual items
        }
      }
      setVotedItems(voted);
    } catch (error) {
      console.error('Error loading votes:', error);
    }
  };

  const handleVote = async (itemId: string) => {
    if (!user) {
      toast({
        title: 'Login Required',
        description: 'Please login to vote on roadmap items',
        variant: 'destructive',
      });
      return;
    }

    try {
      await api.post(`/api/roadmap/${itemId}/vote`);
      
      // Update local state
      const newVotedItems = new Set(votedItems);
      if (votedItems.has(itemId)) {
        newVotedItems.delete(itemId);
      } else {
        newVotedItems.add(itemId);
      }
      setVotedItems(newVotedItems);
      
      // Reload to get updated counts
      loadData();
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingAnimation />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="text-4xl">📋</div>
            <h2 className="text-lg font-switzer font-medium text-gray-900">No Roadmap Available</h2>
            <p className="text-gray-600">
              There are no public roadmap items to display at this time.
            </p>
            <Button onClick={() => router.push('/feedback')}>
              Go to Feedback
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 space-y-6">
        {/* Back Button - Only for logged-in users */}
        {user && (
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>
        )}

        {/* Header */}
        <div className="text-center space-y-2 mb-5">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-switzer font-medium text-gray-900">{organizationName} Roadmap</h1>
          </div>
          <p className="text-base text-gray-600">
            See what we're working on and what's coming next
          </p>
        </div>

        {/* Stats */}
        {stats && <RoadmapStats stats={stats} />}

        {/* Filters & View Toggle */}
        <div className="flex items-center justify-between">
          <RoadmapFilters filters={filters} onFilterChange={setFilters} />
          
          <Tabs value={viewMode} onValueChange={(v: any) => setViewMode(v)}>
            <TabsList>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="list">Board</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
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

        {items.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No roadmap items available
          </div>
        )}
      </div>
    </div>
  );
}

// Timeline View Component
function TimelineView({ groupedByQuarter, votedItems, onVote, user }: any) {
  const quarters = Object.keys(groupedByQuarter).sort();

  return (
    <div className="space-y-5">
      {quarters.map((quarter) => (
        <div key={quarter}>
          <div className="flex items-center mb-4">
            <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-lg">
              {quarter}
            </div>
            <div className="flex-1 h-px bg-gray-300 ml-4"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
        </div>
      ))}
    </div>
  );
}

// Board View Component
function BoardView({ groupedByStatus, votedItems, onVote, user }: any) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      <StatusColumn
        title="Planned"
        icon={<Clock className="h-5 w-5" />}
        color="gray"
        items={groupedByStatus.planned}
        votedItems={votedItems}
        onVote={onVote}
        user={user}
      />
      <StatusColumn
        title="In Progress"
        icon={<TrendingUp className="h-5 w-5" />}
        color="blue"
        items={groupedByStatus.in_progress}
        votedItems={votedItems}
        onVote={onVote}
        user={user}
      />
      <StatusColumn
        title="In Review"
        icon={<AlertCircle className="h-5 w-5" />}
        color="yellow"
        items={groupedByStatus.in_review}
        votedItems={votedItems}
        onVote={onVote}
        user={user}
      />
      <StatusColumn
        title="Completed"
        icon={<CheckCircle2 className="h-5 w-5" />}
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
  const colorClasses: any = {
    gray: 'bg-gray-100 border-gray-300 text-gray-700',
    blue: 'bg-blue-50 border-blue-300 text-blue-700',
    yellow: 'bg-yellow-50 border-yellow-300 text-yellow-700',
    green: 'bg-green-50 border-green-300 text-green-700',
  };

  return (
    <div className={`rounded-lg border-2 ${colorClasses[color]} p-4`}>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="font-semibold text-sm uppercase tracking-wide">
          {title} ({items.length})
        </h2>
      </div>

      <div className="space-y-3">
        {items.map((item: RoadmapItem) => (
          <RoadmapCard
            key={item.id}
            item={item}
            hasVoted={votedItems.has(item.id)}
            onVote={onVote}
            user={user}
          />
        ))}
        {items.length === 0 && (
          <div className="text-center py-8 text-gray-400 text-sm">No items</div>
        )}
      </div>
    </div>
  );
}

// Roadmap Card Component
function RoadmapCard({ item, hasVoted, onVote, user }: any) {
  const statusColors: any = {
    planned: 'border-l-gray-500',
    in_progress: 'border-l-blue-500',
    in_review: 'border-l-yellow-500',
    completed: 'border-l-green-500',
  };

  const priorityBadges: any = {
    low: { color: 'bg-gray-100 text-gray-700', label: 'Low' },
    medium: { color: 'bg-blue-100 text-blue-700', label: 'Medium' },
    high: { color: 'bg-orange-100 text-orange-700', label: 'High' },
    critical: { color: 'bg-red-100 text-red-700', label: 'Critical' },
  };

  return (
    <Card
      className={`hover:shadow-lg transition-all cursor-pointer border-l-4 ${statusColors[item.status]}`}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div>
            <h3 className="font-semibold text-base mb-1">{item.title}</h3>
            <p className="text-sm text-gray-600 line-clamp-2">{item.description}</p>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            <Badge className={priorityBadges[item.priority].color}>
              {priorityBadges[item.priority].label}
            </Badge>
            {item.category && (
              <Badge variant="outline" className="text-xs">
                {item.category}
              </Badge>
            )}
            {item.target_quarter && (
              <Badge variant="outline" className="text-xs">
                <Calendar className="h-3 w-3 mr-1" />
                {item.target_quarter}
              </Badge>
            )}
          </div>

          {/* Progress */}
          {item.progress > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Progress</span>
                <span>{item.progress}%</span>
              </div>
              <Progress value={item.progress} className="h-2" />
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant={hasVoted ? 'default' : 'outline'}
              size="sm"
              onClick={() => onVote(item.id)}
              className="flex items-center gap-1"
            >
              <ArrowUpCircle className={`h-4 w-4 ${hasVoted ? 'fill-current' : ''}`} />
              {item.vote_count}
            </Button>

            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <MessageSquare className="h-4 w-4" />
                {item.comment_count}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
