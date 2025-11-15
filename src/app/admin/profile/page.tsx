'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Mail,
  Shield,
  Settings,
  Activity,
  LogOut,
  Edit2,
  Save,
  X,
  Camera,
  Calendar,
  MapPin,
  Link2,
  Github,
  Twitter,
  Globe,
  AlertTriangle,
  Briefcase,
  Rocket,
  Palette,
  Code,
  TrendingUp,
  UserCircle,
} from 'lucide-react';
import { RoleSelectionModal } from '@/components/RoleSelectionModal';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    bio: user?.bio || '',
    location: user?.location || '',
    website: user?.website || '',
    twitter: user?.twitter || '',
    github: user?.github || '',
    avatar_url: user?.avatar_url || '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || '',
        website: user.website || '',
        twitter: user.twitter || '',
        github: user.github || '',
        avatar_url: user.avatar_url || '',
      });
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Implement API call to update user profile
      // await updateProfile(profileData);
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully',
      });
      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // TODO: Implement logout
    router.push('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'moderator':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // Check if job_role is missing
  const hasIncompleteProfile = !user.job_role;

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Profile Settings</h1>
        <p className="text-gray-500 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Incomplete Profile Alert */}
      {hasIncompleteProfile && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Action Required</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              Please complete your profile by selecting your role to access all features
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRoleModal(true)}
              className="ml-4"
            >
              Choose Role
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Avatar */}
                <div className="relative group">
                  <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                    <AvatarImage src={profileData.avatar_url} alt={user.name} />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                      {getInitials(user.name || 'U')}
                    </AvatarFallback>
                  </Avatar>
                  {isEditing && (
                    <button className="absolute bottom-0 right-0 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition">
                      <Camera className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Name & Role */}
                <div className="w-full">
                  <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                  <p className="text-gray-500 mt-1">{user.email}</p>
                  
                  {/* Job Role Badge */}
                  <div className="mt-3 flex flex-col gap-2">
                    {user.job_role ? (
                      <Badge variant="secondary" className="justify-center">
                        {user.job_role === 'product_manager' && <Briefcase className="h-3 w-3 mr-1" />}
                        {user.job_role === 'founder' && <Rocket className="h-3 w-3 mr-1" />}
                        {user.job_role === 'designer' && <Palette className="h-3 w-3 mr-1" />}
                        {user.job_role === 'developer' && <Code className="h-3 w-3 mr-1" />}
                        {user.job_role === 'marketer' && <TrendingUp className="h-3 w-3 mr-1" />}
                        {user.job_role === 'other' && <UserCircle className="h-3 w-3 mr-1" />}
                        {user.job_role === 'product_manager' && 'Product Manager'}
                        {user.job_role === 'founder' && 'Founder'}
                        {user.job_role === 'designer' && 'Designer'}
                        {user.job_role === 'developer' && 'Developer'}
                        {user.job_role === 'marketer' && 'Marketer'}
                        {user.job_role === 'other' && 'Other'}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="justify-center border-yellow-500 text-yellow-700">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Role Not Set
                      </Badge>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 w-full text-center">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">0</p>
                    <p className="text-xs text-gray-500">Posts</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">0</p>
                    <p className="text-xs text-gray-500">Comments</p>
                  </div>
                </div>

                <Separator />

                {/* Quick Info */}
                <div className="w-full space-y-2 text-left">
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                  {profileData.location && (
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      <span>{profileData.location}</span>
                    </div>
                  )}
                </div>

                {/* Logout Button */}
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Content - Tabs */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="activity">
                <Activity className="h-4 w-4 mr-2" />
                Activity
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Personal Information</CardTitle>
                      <CardDescription>
                        Update your personal details and social links
                      </CardDescription>
                    </div>
                    {!isEditing ? (
                      <Button onClick={() => setIsEditing(true)} variant="outline">
                        <Edit2 className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setIsEditing(false)}
                          variant="outline"
                          size="sm"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={loading} size="sm">
                          <Save className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    {isEditing ? (
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) =>
                          setProfileData({ ...profileData, name: e.target.value })
                        }
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <p className="text-base text-gray-900">{profileData.name}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <p className="text-base text-gray-900">{profileData.email}</p>
                      <Badge variant="outline" className="ml-auto">
                        Verified
                      </Badge>
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label htmlFor="bio">Bio</Label>
                    {isEditing ? (
                      <Textarea
                        id="bio"
                        value={profileData.bio}
                        onChange={(e) =>
                          setProfileData({ ...profileData, bio: e.target.value })
                        }
                        placeholder="Tell us about yourself..."
                        rows={4}
                      />
                    ) : (
                      <p className="text-base text-gray-600">
                        {profileData.bio || 'No bio added yet'}
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* Role */}
                  <div className="space-y-2">
                    <Label htmlFor="role">Your Role</Label>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          {user.job_role === 'product_manager' && <Briefcase className="h-5 w-5 text-primary" />}
                          {user.job_role === 'founder' && <Rocket className="h-5 w-5 text-primary" />}
                          {user.job_role === 'designer' && <Palette className="h-5 w-5 text-primary" />}
                          {user.job_role === 'developer' && <Code className="h-5 w-5 text-primary" />}
                          {user.job_role === 'marketer' && <TrendingUp className="h-5 w-5 text-primary" />}
                          {user.job_role === 'other' && <UserCircle className="h-5 w-5 text-primary" />}
                          {!user.job_role && <AlertTriangle className="h-5 w-5 text-yellow-600" />}
                        </div>
                        <div>
                          <p className="text-base font-medium text-gray-900">
                            {user.job_role === 'product_manager' && 'Product Manager'}
                            {user.job_role === 'founder' && 'Founder / CEO'}
                            {user.job_role === 'designer' && 'Designer'}
                            {user.job_role === 'developer' && 'Developer'}
                            {user.job_role === 'marketer' && 'Marketer'}
                            {user.job_role === 'other' && 'Other'}
                            {!user.job_role && 'Not Set'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {user.job_role === 'product_manager' && 'Managing product development and roadmaps'}
                            {user.job_role === 'founder' && 'Leading the company and making strategic decisions'}
                            {user.job_role === 'designer' && 'Designing user experiences and interfaces'}
                            {user.job_role === 'developer' && 'Building and maintaining software products'}
                            {user.job_role === 'marketer' && 'Handling marketing and growth strategies'}
                            {user.job_role === 'other' && 'Contributing in other ways'}
                            {!user.job_role && 'Select your role to personalize your experience'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowRoleModal(true)}
                      >
                        {user.job_role ? 'Change Role' : 'Choose Role'}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Location */}
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    {isEditing ? (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <Input
                          id="location"
                          value={profileData.location}
                          onChange={(e) =>
                            setProfileData({ ...profileData, location: e.target.value })
                          }
                          placeholder="e.g., San Francisco, CA"
                        />
                      </div>
                    ) : (
                      <p className="text-base text-gray-900">
                        {profileData.location || 'Not specified'}
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* Social Links */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Social Links</h3>

                    {/* Website */}
                    <div className="space-y-2">
                      <Label htmlFor="website">Website</Label>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-gray-400" />
                          <Input
                            id="website"
                            value={profileData.website}
                            onChange={(e) =>
                              setProfileData({ ...profileData, website: e.target.value })
                            }
                            placeholder="https://yourwebsite.com"
                          />
                        </div>
                      ) : (
                        profileData.website && (
                          <a
                            href={profileData.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-2"
                          >
                            <Link2 className="h-4 w-4" />
                            {profileData.website}
                          </a>
                        )
                      )}
                    </div>

                    {/* GitHub */}
                    <div className="space-y-2">
                      <Label htmlFor="github">GitHub</Label>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Github className="h-4 w-4 text-gray-400" />
                          <Input
                            id="github"
                            value={profileData.github}
                            onChange={(e) =>
                              setProfileData({ ...profileData, github: e.target.value })
                            }
                            placeholder="github.com/username"
                          />
                        </div>
                      ) : (
                        profileData.github && (
                          <a
                            href={`https://${profileData.github}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-2"
                          >
                            <Github className="h-4 w-4" />
                            {profileData.github}
                          </a>
                        )
                      )}
                    </div>

                    {/* Twitter */}
                    <div className="space-y-2">
                      <Label htmlFor="twitter">Twitter</Label>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Twitter className="h-4 w-4 text-gray-400" />
                          <Input
                            id="twitter"
                            value={profileData.twitter}
                            onChange={(e) =>
                              setProfileData({ ...profileData, twitter: e.target.value })
                            }
                            placeholder="@username"
                          />
                        </div>
                      ) : (
                        profileData.twitter && (
                          <a
                            href={`https://twitter.com/${profileData.twitter.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline flex items-center gap-2"
                          >
                            <Twitter className="h-4 w-4" />
                            {profileData.twitter}
                          </a>
                        )
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                  <CardDescription>
                    Manage your account preferences and security
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold">Email Notifications</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Post Updates</p>
                          <p className="text-sm text-gray-500">
                            Get notified about posts you've voted on
                          </p>
                        </div>
                        <input type="checkbox" className="toggle" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Roadmap Changes</p>
                          <p className="text-sm text-gray-500">
                            Get notified when roadmap items are updated
                          </p>
                        </div>
                        <input type="checkbox" className="toggle" defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Weekly Digest</p>
                          <p className="text-sm text-gray-500">
                            Receive a weekly summary of activity
                          </p>
                        </div>
                        <input type="checkbox" className="toggle" />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold">Security</h3>
                    <Button variant="outline" className="w-full justify-start">
                      Change Password
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      Enable Two-Factor Authentication
                    </Button>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="font-semibold text-red-600">Danger Zone</h3>
                    <Button variant="destructive" className="w-full">
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Your recent interactions and contributions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-center text-gray-500 py-8">No recent activity</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Role Selection Modal - shown for incomplete profiles or role changes */}
      <RoleSelectionModal
        open={showRoleModal}
        isNewOrganization={false}
        isChangingRole={!!user.job_role} // If user already has a job_role, they're changing it
        onComplete={async () => {
          setShowRoleModal(false);
          // Refresh user data from backend
          await refreshUser();
          toast({
            title: "Profile Updated",
            description: user.job_role ? "Your role has been updated successfully" : "Your role has been set successfully",
          });
        }}
      />
    </div>
  );
}
