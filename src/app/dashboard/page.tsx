"use client";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/context/OrganizationContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { boardService, Board } from "@/services/boardService";
import { postService, Post } from "@/services/postService";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Building2, Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuth();
  const { organization, organizationRole, loading: orgLoading } = useOrganization();
  const { toast } = useToast();

  const [boards, setBoards] = useState<Board[]>([]);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalBoards: 0,
    myPosts: 0,
    totalVotes: 0,
    implementedPosts: 0
  });

  useEffect(() => {
    if (!orgLoading) {
      fetchDashboardData();
    }
  }, [orgLoading, user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Fetch boards
      const boardsResponse = await boardService.getAllBoards();
      const fetchedBoards = boardsResponse.data.boards || [];
      setBoards(fetchedBoards);

      // Fetch user's posts from all boards
      let allMyPosts: Post[] = [];
      for (const board of fetchedBoards) {
        try {
          const postsResponse = await postService.getPostsByBoard(board.slug);
          const boardPosts = postsResponse.data.posts || [];
          
          // Filter posts created by current user
          const userPosts = boardPosts.filter(p => p.author_id === user?.id);
          allMyPosts = [...allMyPosts, ...userPosts];
        } catch (error) {
          console.error(`Failed to fetch posts for board ${board.slug}:`, error);
        }
      }

      setMyPosts(allMyPosts);

      // Calculate stats
      const totalVotes = allMyPosts.reduce((sum, post) => sum + (post.upvotes || 0), 0);
      const implementedCount = allMyPosts.filter(post => 
        post.status === 'completed' || post.status === 'complete'
      ).length;

      setStats({
        totalBoards: fetchedBoards.length,
        myPosts: allMyPosts.length,
        totalVotes: totalVotes,
        implementedPosts: implementedCount
      });

    } catch (error: any) {
      console.error('Dashboard error:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'open':
      case 'under-review':
        return <Badge variant="default">Under Review</Badge>;
      case 'planned':
        return <Badge variant="secondary">Planned</Badge>;
      case 'in-progress':
        return <Badge>In Progress</Badge>;
      case 'completed':
      case 'complete':
        return <Badge variant="outline">Completed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <ProtectedRoute allowedRoles={["owner", "admin", "member", "user"]}>
      <div className="container mx-auto py-8">
        {/* Organization Header */}
        {organization && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-3">
              <Building2 className="h-6 w-6 text-blue-600" />
              <div>
                <h2 className="text-lg font-semibold text-gray-900">{organization.name}</h2>
                <p className="text-sm text-gray-600">
                  {organization.subdomain}.fady.com • {organizationRole === 'owner' ? 'Owner' : organizationRole === 'admin' ? 'Admin' : 'Member'}
                </p>
              </div>
            </div>
          </div>
        )}

        <h1 className="text-3xl font-bold font-headline mb-8">
          User Dashboard
        </h1>

        {loading || orgLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="my-feedback">My Feedback</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>Welcome, {user?.name || user?.email}!</CardTitle>
                  <CardDescription>
                    Here's your personal dashboard and quick stats.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Organization Boards
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalBoards}</div>
                      <p className="text-xs text-muted-foreground">
                        Total boards
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        My Feedback
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.myPosts}</div>
                      <p className="text-xs text-muted-foreground">
                        Total submissions
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Total Votes
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalVotes}</div>
                      <p className="text-xs text-muted-foreground">
                        Across all feedback
                      </p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Implemented
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.implementedPosts}</div>
                      <p className="text-xs text-muted-foreground">
                        Your suggestions
                      </p>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>
                    Your latest feedback and interactions.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {myPosts.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No feedback submissions yet.</p>
                      <p className="text-sm mt-2">Start by creating your first post!</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Feedback</TableHead>
                          <TableHead>Board</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Votes</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {myPosts.slice(0, 5).map((post) => (
                          <TableRow key={post.id}>
                            <TableCell className="font-medium">{post.title}</TableCell>
                            <TableCell>{post.board?.name || 'N/A'}</TableCell>
                            <TableCell>{getStatusBadge(post.status)}</TableCell>
                            <TableCell>{post.upvotes || 0}</TableCell>
                            <TableCell>{formatDate(post.created_at)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="my-feedback">
              <Card>
                <CardHeader>
                  <CardTitle>My Feedback Submissions</CardTitle>
                  <CardDescription>
                    All feedback you've submitted and their current status.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {myPosts.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-lg font-medium">No feedback submitted yet</p>
                      <p className="text-sm mt-2">Create your first post to get started!</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Board</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Votes</TableHead>
                          <TableHead>Submitted</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {myPosts.map((post) => (
                          <TableRow key={post.id}>
                            <TableCell className="font-medium">{post.title}</TableCell>
                            <TableCell>{post.board?.name || 'N/A'}</TableCell>
                            <TableCell>{getStatusBadge(post.status)}</TableCell>
                            <TableCell>{post.upvotes || 0}</TableCell>
                            <TableCell>{formatDate(post.created_at)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Organization Boards</CardTitle>
                  <CardDescription>
                    All boards in {organization?.name || 'your organization'}.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {boards.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p className="text-lg font-medium">No boards available</p>
                      <p className="text-sm mt-2">Contact an admin to create boards</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {boards.map((board) => (
                        <Card key={board.id} className="hover:shadow-lg transition-shadow">
                          <CardHeader>
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{board.icon}</span>
                              <div>
                                <CardTitle className="text-lg">{board.name}</CardTitle>
                                <CardDescription className="text-xs">
                                  {board.is_private ? '🔒 Private' : '🌐 Public'}
                                </CardDescription>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-gray-600 line-clamp-2">
                              {board.description || 'No description'}
                            </p>
                            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                              <span>Category: {board.category || 'General'}</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </ProtectedRoute>
  );
}
