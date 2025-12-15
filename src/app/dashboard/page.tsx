"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { OrganizationSwitcher } from "@/components/organization/OrganizationSwitcher";
import { RoleSelectionModal } from "@/components/RoleSelectionModal";
import { Building2, Loader2, User, LogOut, Briefcase, Rocket, Palette, Code, TrendingUp, UserCircle, MessageSquare, ThumbsUp, Plus, ArrowRight, Lock, Globe } from "lucide-react";

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const { organization, organizationRole, loading: orgLoading } = useOrganization();
  const { toast } = useToast();

  const [boards, setBoards] = useState<Board[]>([]);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRoleModal, setShowRoleModal] = useState(false);
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

  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const getUserInitials = () => {
    if (user?.name) {
      return user.name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return user?.email?.[0]?.toUpperCase() || 'U';
  };

  const getJobRoleInfo = () => {
    const jobRole = user?.job_role;
    
    switch (jobRole) {
      case 'product_manager':
        return { label: 'Product Manager', icon: <Briefcase className="h-5 w-5" /> };
      case 'founder':
        return { label: 'Founder / CEO', icon: <Rocket className="h-5 w-5" /> };
      case 'designer':
        return { label: 'Designer', icon: <Palette className="h-5 w-5" /> };
      case 'developer':
        return { label: 'Developer', icon: <Code className="h-5 w-5" /> };
      case 'marketer':
        return { label: 'Marketer', icon: <TrendingUp className="h-5 w-5" /> };
      case 'other':
        return { label: 'Other', icon: <UserCircle className="h-5 w-5" /> };
      default:
        return { label: 'Not Set', icon: <UserCircle className="h-5 w-5" /> };
    }
  };

  const handleRoleModalComplete = async () => {
    setShowRoleModal(false);
    await refreshUser();
    toast({
      title: "Success!",
      description: "Your job role has been updated",
    });
  };

  return (
    <ProtectedRoute allowedRoles={["owner", "admin", "member", "user"]}>
      <div className="min-h-screen flex flex-col bg-gray-50">
        {/* Navbar */}
        <nav className="fixed top-0 left-0 right-0 bg-white border-b shadow-sm z-50">
          <div className="container mx-auto flex items-center justify-between px-6 py-4">
            {/* Left side - Brand + Org Switcher + Nav Links */}
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-xl font-bold tracking-tight text-gray-900">
                Dashboard
              </Link>

              {/* Organization Switcher */}
              <OrganizationSwitcher />

              {/* Navigation Links */}
              <div className="hidden md:flex items-center gap-4">
                <Link
                  href="/feedback"
                  className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                >
                  Feedback Boards
                </Link>
                {boards.length > 0 && (
                  <Link
                    href={`/roadmap/${boards[0]?.slug || 'general'}`}
                    className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    Roadmap
                  </Link>
                )}
              </div>
            </div>

            {/* Right side - Submit Button + Admin Button + Role Badge + User Menu */}
            <div className="flex items-center gap-4">
              {/* Admin Dashboard Button - Only for Admins/Owners */}
              {(organizationRole === 'owner' || organizationRole === 'admin') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => router.push('/admin')}
                  className="hidden md:flex gap-2"
                >
                  <Building2 className="h-4 w-4" />
                  Admin Dashboard
                </Button>
              )}

              {/* Submit Feedback Button */}
              {boards.length > 0 && (
                <Button
                  size="sm"
                  onClick={() => router.push(`/feedback/${boards[0]?.slug || 'general'}`)}
                  className="hidden md:flex"
                >
                  Submit Feedback
                </Button>
              )}

              {organization && (
                <div className="hidden lg:flex items-center gap-2 text-sm text-gray-600">
                  <Building2 className="h-4 w-4" />
                  <span>{organizationRole === 'owner' ? 'Owner' : organizationRole === 'admin' ? 'Admin' : 'Member'}</span>
                </div>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.avatar_url} alt={user?.name || user?.email} />
                      <AvatarFallback>{getUserInitials()}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user?.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/dashboard')} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <div className="container mx-auto py-8 mt-20">
          <h1 className="text-3xl font-bold font-headline mb-8">
            Welcome, {user?.name || 'User'}!
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

              {/* Job Role Profile Card */}
              <Card className="mt-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Your Profile</CardTitle>
                      <CardDescription>
                        Manage your job role and preferences
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                        {getJobRoleInfo().icon}
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Job Role</p>
                        <p className="font-semibold text-lg">{getJobRoleInfo().label}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRoleModal(true)}
                    >
                      {user?.job_role ? 'Change Role' : 'Set Role'}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-3">
                    Your job role helps us personalize your experience and show relevant content
                  </p>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>
                    Share your ideas and explore feedback boards.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-3">
                  {boards.length > 0 ? (
                    <>
                      <Button
                        onClick={() => router.push(`/feedback/${boards[0]?.slug || 'general'}`)}
                        className="flex-1 min-w-[200px]"
                      >
                        Submit Feedback
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push('/feedback')}
                        className="flex-1 min-w-[200px]"
                      >
                        View All Boards
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => router.push(`/roadmap/${boards[0]?.slug || 'general'}`)}
                        className="flex-1 min-w-[200px]"
                      >
                        View Roadmap
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-gray-500">No boards available yet.</p>
                  )}
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
              <div className="space-y-6">
                {/* Feedback Boards Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Feedback Boards</CardTitle>
                    <CardDescription>
                      Browse boards, submit feedback, and engage with your team's ideas
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
                          <Card 
                            key={board.id} 
                            className="hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200 group cursor-pointer"
                            style={{ borderColor: `${board.color}20` }}
                          >
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                  <div 
                                    className="text-3xl p-2 rounded-lg"
                                    style={{ backgroundColor: `${board.color}15` }}
                                  >
                                    {board.icon}
                                  </div>
                                  <div className="flex-1">
                                    <CardTitle className="text-base flex items-center gap-2">
                                      {board.name}
                                      {board.is_private ? (
                                        <Lock className="h-3 w-3 text-orange-500" />
                                      ) : (
                                        <Globe className="h-3 w-3 text-green-500" />
                                      )}
                                    </CardTitle>
                                    {board.category && (
                                      <Badge variant="secondary" className="mt-1 text-xs">
                                        {board.category}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <p className="text-sm text-gray-600 line-clamp-2 min-h-[40px]">
                                {board.description || 'Share your ideas and feedback for this board'}
                              </p>

                              {/* Board Stats */}
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <div className="flex items-center gap-1">
                                  <MessageSquare className="h-3.5 w-3.5" />
                                  <span>{board.post_count || 0} posts</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {board.is_private ? (
                                    <>
                                      <Lock className="h-3.5 w-3.5" />
                                      <span>Private</span>
                                    </>
                                  ) : (
                                    <>
                                      <Globe className="h-3.5 w-3.5" />
                                      <span>Public</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Action Buttons */}
                              <div className="flex gap-2 pt-2">
                                <Button
                                  size="sm"
                                  className="flex-1"
                                  style={{ backgroundColor: board.color }}
                                  onClick={() => router.push(`/admin/feedback/boards/${board.slug}`)}
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  Post Feedback
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => router.push(`/admin/feedback/boards/${board.slug}`)}
                                >
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* My Submissions Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>My Submissions</CardTitle>
                    <CardDescription>
                      Track all your feedback submissions and their status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {myPosts.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No feedback submitted yet</p>
                        <p className="text-sm mt-2">Start by posting your first feedback on any board above!</p>
                        {boards.length > 0 && (
                          <Button 
                            className="mt-4"
                            onClick={() => router.push(`/admin/feedback/boards/${boards[0].slug}`)}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Submit Your First Feedback
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {myPosts.map((post) => (
                          <Card 
                            key={post.id} 
                            className="hover:shadow-md transition-all cursor-pointer"
                            onClick={() => router.push(`/admin/feedback/boards/${post.board?.slug}`)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-semibold text-sm">{post.title}</h4>
                                    {getStatusBadge(post.status)}
                                  </div>
                                  {post.description && (
                                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                      {post.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <span 
                                        className="text-base"
                                        style={{ color: post.board?.color }}
                                      >
                                        {post.board?.icon}
                                      </span>
                                      {post.board?.name || 'Unknown Board'}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <ThumbsUp className="h-3 w-3" />
                                      {post.upvotes || 0} votes
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MessageSquare className="h-3 w-3" />
                                      {post.comment_count || 0} comments
                                    </span>
                                    <span>{formatDate(post.created_at)}</span>
                                  </div>
                                </div>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/admin/feedback/boards/${post.board?.slug}`);
                                  }}
                                >
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
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
      </div>

      {/* Role Selection Modal */}
      <RoleSelectionModal
        open={showRoleModal}
        organizationId={organization?.id}
        organizationName={organization?.name}
        isChangingRole={true}
        onComplete={handleRoleModalComplete}
      />
    </ProtectedRoute>
  );
}
