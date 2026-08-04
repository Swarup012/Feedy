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
import { IconDisplay } from "@/components/ui/icon-picker";
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
import { Building2, Loader2, User, LogOut, Briefcase, Rocket, Palette, Code, TrendingUp, UserCircle, MessageSquare, ThumbsUp, Plus, ArrowRight, Lock, Globe, LayoutDashboard, Activity, CheckCircle2 } from "lucide-react";

export default function DashboardPage() {
  const { user, refreshUser } = useAuth();
  const { organization, organizationRole, loading: orgLoading } = useOrganization();
  const { toast } = useToast();

  const [boards, setBoards] = useState<Board[]>([]);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
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
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-450 hover:bg-yellow-100">Under Review</Badge>;
      case 'planned':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-450 hover:bg-blue-100">Planned</Badge>;
      case 'in-progress':
        return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-450 hover:bg-purple-100">In Progress</Badge>;
      case 'completed':
      case 'complete':
        return <Badge variant="outline" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-450 hover:bg-green-100 border-none">Completed</Badge>;
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

  return (
    <ProtectedRoute allowedRoles={["owner", "admin", "member", "user"]}>
      <div className="h-screen flex flex-col bg-gray-50 dark:bg-background overflow-hidden">
        {/* Navbar */}
        <nav className="fixed top-0 left-0 right-0 bg-primary border-b border-primary shadow-sm z-50 flex-shrink-0">
            <div className="container mx-auto flex items-center justify-between px-4 py-4">
            {/* Left side - Brand + Org Switcher + Nav Links */}
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="text-xl font-bold tracking-tight text-white">
                Dashboard
              </Link>

              {/* Organization Switcher */}
              <OrganizationSwitcher />

              {/* Navigation Links */}
              <div className="hidden md:flex items-center gap-4">
                <Link
                  href="/feedback"
                  className="text-sm font-medium text-white/80 hover:text-white transition-colors"
                >
                  Feedback Boards
                </Link>
                {boards.length > 0 && (
                  <Link
                    href={`/roadmap/${boards[0]?.slug || 'general'}`}
                    className="text-sm font-medium text-white/80 hover:text-white transition-colors"
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
                <div className="hidden lg:flex items-center gap-2 text-sm text-white/80">
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

        {/* Main Content & Sidebar */}
        {loading || orgLoading ? (
          <div className="flex-1 flex justify-center items-center h-full mt-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 mt-[72px] overflow-hidden">
            {/* Notion-style Sidebar */}
            <div className="w-52 border-r border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 flex flex-col justify-between shrink-0 h-full overflow-y-auto">
              <div className="space-y-6">
                {/* Workspace Header */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider">Workspace</p>
                  <div className="flex items-center gap-3 p-1.5 rounded-lg border border-gray-100 dark:border-zinc-900 bg-gray-50/50 dark:bg-zinc-900/20">
                    <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
                      {organization?.name?.[0]?.toUpperCase() || "W"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate text-gray-900 dark:text-white">
                        {organization?.name || "My Organization"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {organizationRole === 'owner' ? 'Owner' : organizationRole === 'admin' ? 'Admin' : 'Member'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sidebar Navigation */}
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase tracking-wider mb-2">Menu</p>
                  <TabsList className="flex flex-col space-y-1 bg-transparent p-0 w-full h-auto">
                    <TabsTrigger
                      value="overview"
                      className="w-full justify-start gap-3 px-3 py-2 h-10 rounded-md transition-all text-left text-sm font-medium border-0 bg-transparent text-gray-600 dark:text-gray-400 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white hover:bg-gray-50 dark:hover:bg-zinc-900/50 hover:text-gray-900 dark:hover:text-white shrink-0 shadow-none"
                    >
                      <LayoutDashboard className="h-4 w-4 shrink-0" />
                      <span>Overview</span>
                    </TabsTrigger>
                    
                    <TabsTrigger
                      value="my-feedback"
                      className="w-full justify-start gap-3 px-3 py-2 h-10 rounded-md transition-all text-left text-sm font-medium border-0 bg-transparent text-gray-600 dark:text-gray-400 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white hover:bg-gray-50 dark:hover:bg-zinc-900/50 hover:text-gray-900 dark:hover:text-white shrink-0 shadow-none"
                    >
                      <MessageSquare className="h-4 w-4 shrink-0" />
                      <span>My Feedback</span>
                    </TabsTrigger>

                    <TabsTrigger
                      value="activity"
                      className="w-full justify-start gap-3 px-3 py-2 h-10 rounded-md transition-all text-left text-sm font-medium border-0 bg-transparent text-gray-600 dark:text-gray-400 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-zinc-900 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white hover:bg-gray-50 dark:hover:bg-zinc-900/50 hover:text-gray-900 dark:hover:text-white shrink-0 shadow-none"
                    >
                      <Activity className="h-4 w-4 shrink-0" />
                      <span>Activity</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>

              {/* Sidebar Footer Info */}
              <div className="pt-4 border-t border-gray-100 dark:border-zinc-900">
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-900/40">
                  <div className="p-2 rounded-md bg-primary/10 text-primary shrink-0">
                    <IconDisplay iconName={user?.job_role_icon || "UserCircle"} className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase font-bold text-gray-400 dark:text-zinc-500">Job Role</p>
                    <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                      {user?.job_role_name || user?.job_role?.replace('_', ' ') || "Not Set"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-zinc-900/10 h-full">
              <div className="max-w-[1200px] mx-auto py-5 px-5 space-y-5">
                {/* Header Title */}
                <div className="flex justify-between items-center">
                  <div>
                    <h1 className="text-xl font-bold font-headline text-gray-900 dark:text-white">
                      Welcome, {user?.name || user?.email || 'User'}!
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Here's your personal dashboard, quick stats, and feedback overview.
                    </p>
                  </div>
                </div>

                {/* Overview Tab Content */}
                <TabsContent value="overview" className="mt-0 space-y-6 focus-visible:outline-none">
                  {/* Stats Cards */}
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Organization Boards
                        </CardTitle>
                        <Building2 className="h-4 w-4 text-blue-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalBoards}</div>
                        <p className="text-xs text-gray-500 dark:text-gray-450 mt-1">
                          Total active boards
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          My Feedback
                        </CardTitle>
                        <MessageSquare className="h-4 w-4 text-indigo-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.myPosts}</div>
                        <p className="text-xs text-gray-500 dark:text-gray-455 mt-1">
                          Total submissions
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Total Votes
                        </CardTitle>
                        <ThumbsUp className="h-4 w-4 text-amber-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.totalVotes}</div>
                        <p className="text-xs text-gray-500 dark:text-gray-455 mt-1">
                          Across all submissions
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                          Implemented
                        </CardTitle>
                        <Rocket className="h-4 w-4 text-emerald-500" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-xl font-bold text-gray-900 dark:text-white">{stats.implementedPosts}</div>
                        <p className="text-xs text-gray-500 dark:text-gray-455 mt-1">
                          Your suggestions completed
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    {/* Profile & Quick Actions */}
                    <div className="md:col-span-1 space-y-6">
                      {/* Job Role Profile Card */}
                      <Card className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg font-bold">Your Profile</CardTitle>
                          <CardDescription className="text-xs text-gray-500">
                            Manage your job role and preferences
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="flex items-center justify-between p-3 border border-gray-100 dark:border-zinc-800 rounded-lg bg-gray-50 dark:bg-zinc-950">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                                <IconDisplay iconName={user?.job_role_icon || "UserCircle"} className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] uppercase text-gray-400 font-bold tracking-wider">Job Role</p>
                                <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                                  {user?.job_role_name || user?.job_role?.replace('_', ' ') || "Not Set"}
                                </p>
                              </div>
                            </div>
                            {(organizationRole === 'admin' || organizationRole === 'owner') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowRoleModal(true)}
                                className="h-8 text-xs"
                              >
                                Change
                              </Button>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 leading-normal">
                            Your job role helps us personalize your experience and show relevant content.
                          </p>
                        </CardContent>
                      </Card>

                      {/* Quick Actions */}
                      <Card className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg font-bold">Quick Actions</CardTitle>
                          <CardDescription className="text-xs text-gray-500">
                            Explore feedback boards and roadmap
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2.5">
                          {boards.length > 0 ? (
                            <>
                              <Button
                                onClick={() => router.push(`/feedback/${boards[0]?.slug || 'general'}`)}
                                className="w-full text-xs h-9"
                              >
                                Submit Feedback
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => router.push('/feedback')}
                                className="w-full text-xs h-9 hover:bg-gray-50 dark:hover:bg-zinc-800"
                              >
                                View All Boards
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => router.push(`/roadmap/${boards[0]?.slug || 'general'}`)}
                                className="w-full text-xs h-9 hover:bg-gray-50 dark:hover:bg-zinc-800"
                              >
                                View Roadmap
                              </Button>
                            </>
                          ) : (
                            <p className="text-sm text-gray-500">No boards available yet.</p>
                          )}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Recent Activity Table */}
                    <div className="md:col-span-2">
                      <Card className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm h-full flex flex-col">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-lg font-bold">Recent Activity</CardTitle>
                          <CardDescription className="text-xs text-gray-500">
                            Your latest feedback submissions and interactions
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-auto">
                          {myPosts.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              <p className="font-semibold text-sm">No feedback submissions yet.</p>
                              <p className="text-xs text-gray-400 mt-1">Start by creating your first post!</p>
                            </div>
                          ) : (
                            <Table>
                              <TableHeader>
                                <TableRow className="hover:bg-transparent border-gray-150 dark:border-zinc-800">
                                  <TableHead className="text-xs text-gray-400 font-bold uppercase tracking-wider">Feedback</TableHead>
                                  <TableHead className="text-xs text-gray-400 font-bold uppercase tracking-wider">Board</TableHead>
                                  <TableHead className="text-xs text-gray-400 font-bold uppercase tracking-wider">Status</TableHead>
                                  <TableHead className="text-xs text-gray-400 font-bold uppercase tracking-wider text-right">Votes</TableHead>
                                  <TableHead className="text-xs text-gray-400 font-bold uppercase tracking-wider text-right">Date</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {myPosts.slice(0, 5).map((post) => (
                                  <TableRow key={post.id} className="border-gray-100 dark:border-zinc-850 hover:bg-gray-50/50 dark:hover:bg-zinc-800/40">
                                    <TableCell className="font-semibold text-sm text-gray-900 dark:text-white max-w-[200px] truncate">{post.title}</TableCell>
                                    <TableCell className="text-xs text-gray-600 dark:text-gray-300">
                                      <span className="inline-flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: post.board?.color || '#3b82f6' }} />
                                        {post.board?.name || 'N/A'}
                                      </span>
                                    </TableCell>
                                    <TableCell>{getStatusBadge(post.status)}</TableCell>
                                    <TableCell className="text-right text-xs font-semibold text-gray-900 dark:text-white">{post.upvotes || 0}</TableCell>
                                    <TableCell className="text-right text-xs text-gray-400 dark:text-gray-500">{formatDate(post.created_at)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </TabsContent>

                {/* My Feedback Tab Content */}
                <TabsContent value="my-feedback" className="mt-0 space-y-6 focus-visible:outline-none">
                  <div className="space-y-6">
                    {/* Feedback Boards Section */}
                    <Card className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg font-bold">Feedback Boards</CardTitle>
                        <CardDescription className="text-xs text-gray-500">
                          Browse boards, submit feedback, and engage with your team's ideas
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {boards.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <p className="text-lg font-medium">No boards available</p>
                            <p className="text-sm mt-2">Contact an admin to create boards</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {boards.map((board) => (
                              <Card 
                                key={board.id} 
                                className="hover:shadow-lg transition-all duration-200 border border-gray-250 dark:border-zinc-800 hover:border-blue-200 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900 group cursor-pointer"
                                style={{ borderLeftWidth: '4px', borderLeftColor: board.color }}
                                onClick={() => router.push(`/admin/feedback/boards/${board.slug}`)}
                              >
                                <CardHeader className="pb-3 px-4 pt-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                      <div 
                                        className="p-2 rounded-lg"
                                        style={{ backgroundColor: `${board.color}15` }}
                                      >
                                        <IconDisplay iconName={board.icon} className="h-5 w-5" style={{ color: board.color }} />
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-900 dark:text-white truncate">
                                          {board.name}
                                        </CardTitle>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                          {board.is_private ? (
                                            <span className="flex items-center gap-1 text-[10px] text-orange-500 font-medium">
                                              <Lock className="h-2.5 w-2.5" />
                                              Private
                                            </span>
                                          ) : (
                                            <span className="flex items-center gap-1 text-[10px] text-green-500 font-medium">
                                              <Globe className="h-2.5 w-2.5" />
                                              Public
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </CardHeader>
                                <CardContent className="space-y-3 px-4 pb-4">
                                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 min-h-[32px]">
                                    {board.description || 'Share your ideas and feedback for this board'}
                                  </p>

                                  {/* Board Stats & Action */}
                                  <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-zinc-800/60">
                                    <div className="flex items-center gap-1 font-medium">
                                      <MessageSquare className="h-3 w-3" />
                                      <span>{board.post_count || 0} posts</span>
                                    </div>
                                    <span className="text-primary group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5 text-xs font-semibold">
                                      Open Board <ArrowRight className="h-3 w-3" />
                                    </span>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* My Submissions Section */}
                    <Card className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm">
                      <CardHeader>
                        <CardTitle className="text-lg font-bold">My Submissions</CardTitle>
                        <CardDescription className="text-xs text-gray-500">
                          Track all your feedback submissions and their status
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {myPosts.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-zinc-705" />
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">No feedback submitted yet</p>
                            <p className="text-xs text-gray-400 mt-1">Start by posting your first feedback on any board above!</p>
                            {boards.length > 0 && (
                              <Button 
                                className="mt-4 text-xs h-9"
                                onClick={() => router.push(`/admin/feedback/boards/${boards[0].slug}`)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Submit Feedback
                              </Button>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {myPosts.map((post) => (
                              <Card 
                                key={post.id} 
                                className="hover:shadow-md transition-all cursor-pointer bg-white dark:bg-zinc-900 border border-gray-150 dark:border-zinc-800 hover:border-gray-300 dark:hover:border-zinc-700"
                                onClick={() => router.push(`/admin/feedback/boards/${post.board?.slug}`)}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{post.title}</h4>
                                        {getStatusBadge(post.status)}
                                      </div>
                                      {post.description && (
                                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1 mb-2">
                                          {post.description}
                                        </p>
                                      )}
                                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                        <span className="flex items-center gap-1">
                                          <span 
                                            className="w-2.5 h-2.5 rounded-full inline-block"
                                            style={{ backgroundColor: post.board?.color }}
                                          />
                                          {post.board?.name || 'Unknown Board'}
                                        </span>
                                        <span className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-300">
                                          <ThumbsUp className="h-3 w-3" />
                                          {post.upvotes || 0}
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <MessageSquare className="h-3 w-3" />
                                          {post.comment_count || 0}
                                        </span>
                                        <span>{formatDate(post.created_at)}</span>
                                      </div>
                                    </div>
                                    <Button 
                                      size="sm" 
                                      variant="ghost"
                                      className="h-8 w-8 p-0 hover:bg-gray-105 dark:hover:bg-zinc-800"
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

                {/* Activity Tab Content */}
                <TabsContent value="activity" className="mt-0 space-y-6 focus-visible:outline-none">
                  <Card className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold">Organization Boards</CardTitle>
                      <CardDescription className="text-xs text-gray-500">
                        All feedback boards in {organization?.name || 'your organization'}.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {boards.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          <p className="text-lg font-medium">No boards available</p>
                          <p className="text-sm mt-2">Contact an admin to create boards</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {boards.map((board) => (
                            <Card key={board.id} className="hover:shadow-lg transition-shadow border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer" onClick={() => router.push(`/admin/feedback/boards/${board.slug}`)}>
                              <CardHeader>
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg" style={{ backgroundColor: `${board.color}15` }}>
                                    <IconDisplay iconName={board.icon} className="h-6 w-6" style={{ color: board.color }} />
                                  </div>
                                  <div>
                                    <CardTitle className="text-base text-gray-900 dark:text-white">{board.name}</CardTitle>
                                    <CardDescription className="text-xs">
                                      {board.is_private ? '🔒 Private' : '🌐 Public'}
                                    </CardDescription>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent>
                                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 min-h-[32px]">
                                  {board.description || 'No description'}
                                </p>
                                <div className="mt-3 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-zinc-800/60">
                                  <span>Category: {board.category || 'General'}</span>
                                  <span>{board.post_count || 0} posts</span>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </div>
          </Tabs>
        )}
      </div>

      {/* Role Selection Modal — admin/owner only */}
      {(organizationRole === 'admin' || organizationRole === 'owner') && (
        <RoleSelectionModal
          open={showRoleModal}
          organizationId={organization?.id}
          organizationName={organization?.name}
          isChangingRole={true}
          onComplete={async () => {
            setShowRoleModal(false);
            await refreshUser();
            toast({ title: "Success!", description: "Job role updated." });
          }}
        />
      )}
    </ProtectedRoute>
  );
}
