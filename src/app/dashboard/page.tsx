"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
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

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <ProtectedRoute allowedRoles={["user", "admin"]}>
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold font-headline mb-8">
          User Dashboard
        </h1>

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
              <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      My Feedback
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">12</div>
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
                    <div className="text-2xl font-bold">156</div>
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
                    <div className="text-2xl font-bold">3</div>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Feedback</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Votes</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Mobile App Improvement</TableCell>
                      <TableCell>
                        <Badge variant="default">Under Review</Badge>
                      </TableCell>
                      <TableCell>45</TableCell>
                      <TableCell>2 days ago</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>New Export Feature</TableCell>
                      <TableCell>
                        <Badge variant="secondary">Planned</Badge>
                      </TableCell>
                      <TableCell>23</TableCell>
                      <TableCell>1 week ago</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Bug Fix Request</TableCell>
                      <TableCell>
                        <Badge variant="destructive">Completed</Badge>
                      </TableCell>
                      <TableCell>18</TableCell>
                      <TableCell>2 weeks ago</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
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
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Votes</TableHead>
                      <TableHead>Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Dark Mode Implementation</TableCell>
                      <TableCell>Feature</TableCell>
                      <TableCell>
                        <Badge>Planned</Badge>
                      </TableCell>
                      <TableCell>128</TableCell>
                      <TableCell>Jan 15, 2024</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Performance Optimization</TableCell>
                      <TableCell>Improvement</TableCell>
                      <TableCell>
                        <Badge variant="secondary">In Progress</Badge>
                      </TableCell>
                      <TableCell>67</TableCell>
                      <TableCell>Feb 3, 2024</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Login Page Redesign</TableCell>
                      <TableCell>Design</TableCell>
                      <TableCell>
                        <Badge variant="outline">Completed</Badge>
                      </TableCell>
                      <TableCell>42</TableCell>
                      <TableCell>Mar 10, 2024</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>My Activity</CardTitle>
                <CardDescription>
                  Your voting history and interactions with other feedback.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Action</TableHead>
                      <TableHead>Feedback Item</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Upvoted</TableCell>
                      <TableCell>Slack Integration Feature</TableCell>
                      <TableCell>Today</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Commented</TableCell>
                      <TableCell>Mobile App Improvement</TableCell>
                      <TableCell>Yesterday</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Submitted</TableCell>
                      <TableCell>New Export Feature Request</TableCell>
                      <TableCell>3 days ago</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Upvoted</TableCell>
                      <TableCell>Dark Mode Implementation</TableCell>
                      <TableCell>1 week ago</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ProtectedRoute>
  );
}
