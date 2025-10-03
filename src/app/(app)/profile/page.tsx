import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockFeedback } from "@/lib/data";
import { FeedbackCard } from "../feedback/components/feedback-card";

export default function ProfilePage() {
  const user = {
    name: "Demo User",
    username: "demouser",
    email: "user@example.com",
    avatarUrl: "https://picsum.photos/seed/user-avatar/200/200",
    joinDate: "Joined in May 2024",
    bio: "Product enthusiast and feedback aficionado."
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
          <Avatar className="h-24 w-24">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-grow text-center md:text-left">
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-muted-foreground">@{user.username}</p>
            <p className="mt-2 text-sm max-w-prose">{user.bio}</p>
          </div>
          <Button variant="outline">Edit Profile</Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="submitted">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="submitted">Submitted</TabsTrigger>
          <TabsTrigger value="voted">Voted</TabsTrigger>
          <TabsTrigger value="comments">Comments</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="submitted" className="mt-6">
          <div className="space-y-4">
            {mockFeedback.slice(0, 2).map(fb => (
                <FeedbackCard key={fb.id} feedback={fb} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="voted" className="mt-6">
          <div className="space-y-4">
            {mockFeedback.slice(2, 4).map(fb => (
                <FeedbackCard key={fb.id} feedback={fb} />
            ))}
          </div>
        </TabsContent>
        <TabsContent value="comments" className="mt-6">
           <Card>
                <CardContent className="p-6">
                    <p className="text-muted-foreground">User comments will be displayed here.</p>
                </CardContent>
           </Card>
        </TabsContent>
        <TabsContent value="settings" className="mt-6">
           <Card>
                <CardHeader>
                    <CardTitle>Settings</CardTitle>
                    <CardDescription>Manage your account and notification preferences.</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Account and notification settings form will be here.</p>
                </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
