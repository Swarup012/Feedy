"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BillingSection } from "@/components/BillingSection";
import { useToast } from "@/hooks/use-toast";
import {
  User, Mail, Shield, Settings, Activity, LogOut, Edit2, Save, X,
  Camera, Calendar, MapPin, Link2, Github, Twitter, Globe,
  Briefcase, Rocket, Palette, Code, TrendingUp, UserCircle,
  CreditCard, ExternalLink, ChevronRight, Bell, AlertTriangle, Lock, Check
} from "lucide-react";
import { RoleSelectionModal } from "@/components/RoleSelectionModal";
import gsap from "gsap";

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  
  const mainContentRef = useRef(null);

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    bio: user?.bio || "",
    location: user?.location || "",
    website: user?.website || "",
    twitter: user?.twitter || "",
    github: user?.github || "",
    avatar_url: user?.avatar_url || "",
  });

  // Sync state when user data changes
  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || "",
        email: user.email || "",
        bio: user.bio || "",
        location: user.location || "",
        website: user.website || "",
        twitter: user.twitter || "",
        github: user.github || "",
        avatar_url: user.avatar_url || "",
      });
    }
  }, [user]);

  // Content Entrance Animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".animate-content",
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
      );
    }, mainContentRef);
    return () => ctx.revert();
  }, [activeTab]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: "Error", description: "Please upload an image file", variant: "destructive" });
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/upload-avatar`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      setProfileData(prev => ({ ...prev, avatar_url: data.data.avatar_url }));
      await refreshUser();
      toast({ title: "Success", description: "Avatar updated successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to upload avatar", variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // Logic for profile update API would go here
      toast({ title: "Success", description: "Profile updated" });
      setIsEditing(false);
    } catch (error: any) {
      toast({ title: "Error", description: "Update failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { id: "profile", label: "General", icon: User },
    { id: "settings", label: "Preferences", icon: Settings },
    { id: "billing", label: "Billing", icon: CreditCard },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Account Settings
              </h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-gray-400">
                Manage your profile, preferences, and account settings
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* SIDEBAR */}
          <aside className="lg:col-span-3">
            <Card className="border-slate-200/60 dark:border-border shadow-sm overflow-hidden">
              <CardContent className="p-6">
                {/* Profile Avatar Section */}
                <div className="flex flex-col items-center space-y-4 mb-6">
                  <div className="relative group">
                    <Avatar className="relative h-24 w-24 border-4 border-white dark:border-gray-800 shadow-lg">
                      <AvatarImage src={profileData.avatar_url} className="object-cover" />
                      <AvatarFallback className="bg-blue-600 text-white font-bold text-2xl">
                        {user.name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                    
                    <input 
                      type="file" 
                      id="avatar-input" 
                      className="hidden" 
                      onChange={handleAvatarUpload} 
                      accept="image/*" 
                    />
                    <label 
                      htmlFor="avatar-input"
                      className="absolute bottom-0 right-0 p-2 bg-white dark:bg-gray-800 border-2 border-white dark:border-gray-800 rounded-full shadow-lg text-slate-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 transition-all cursor-pointer"
                    >
                      {uploadingAvatar ? (
                        <div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera size={16} />
                      )}
                    </label>
                  </div>
                  
                  <div className="text-center">
                    <h2 className="font-bold text-lg text-slate-900 dark:text-white">{user.name}</h2>
                    <Badge variant="secondary" className="mt-1.5 text-xs font-semibold bg-slate-100 dark:bg-gray-800 text-slate-600 dark:text-gray-300">
                      {user.job_role?.replace('_', ' ') || 'New Member'}
                    </Badge>
                  </div>
                </div>

                <Separator className="my-6" />

                {/* Navigation */}
                <nav className="space-y-1">
                  {navItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); setIsEditing(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        activeTab === item.id 
                          ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" 
                          : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <item.icon size={18} strokeWidth={2} />
                      <span>{item.label}</span>
                      {activeTab === item.id && (
                        <ChevronRight size={16} className="ml-auto" />
                      )}
                    </button>
                  ))}
                </nav>

                <Separator className="my-6" />

                {/* Logout Button */}
                <button 
                  onClick={() => logout()}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all"
                >
                  <LogOut size={18} strokeWidth={2} />
                  <span>Sign Out</span>
                </button>
              </CardContent>
            </Card>
          </aside>

        {/* CONTENT */}
        <main ref={mainContentRef} className="lg:col-span-9 space-y-6">
          
          {activeTab === "profile" && (
            <div className="space-y-6">
              {/* Profile Information Card */}
              <Card className="border-slate-200/60 dark:border-border shadow-sm">
                <CardHeader className="border-b border-slate-100 dark:border-border bg-slate-50/50 dark:bg-gray-800/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Profile Information</CardTitle>
                      <CardDescription className="mt-1">Update your personal details and how others see you</CardDescription>
                    </div>
                    {!isEditing ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setIsEditing(true)}
                        className="gap-2 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                      >
                        <Edit2 size={16} />
                        <span>Edit Profile</span>
                      </Button>
                    ) : (
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setIsEditing(false)}
                          className="text-slate-600 dark:text-gray-400"
                        >
                          <X size={16} className="mr-2" />
                          Cancel
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={handleSave} 
                          disabled={loading}
                          className="bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-md shadow-blue-600/20"
                        >
                          <Save size={16} />
                          {loading ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-gray-300 flex items-center gap-2">
                      <User size={16} className="text-slate-400 dark:text-gray-500" />
                      Full Name
                    </Label>
                    <Input 
                      disabled={!isEditing} 
                      value={profileData.name} 
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      placeholder="Enter your full name"
                      className="h-11 border-slate-200 dark:border-border focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:bg-slate-50 dark:disabled:bg-gray-800 disabled:cursor-not-allowed" 
                    />
                  </div>

                  {/* Email (Read-only) */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-gray-300 flex items-center gap-2">
                      <Mail size={16} className="text-slate-400 dark:text-gray-500" />
                      Email Address
                    </Label>
                    <div className="relative">
                      <Input 
                        disabled
                        value={user.email}
                        className="h-11 border-slate-200 dark:border-border bg-slate-50 dark:bg-gray-800 cursor-not-allowed pr-24" 
                      />
                      <Badge className="absolute right-3 top-1/2 -translate-y-1/2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800 gap-1">
                        <Check size={12} />
                        Verified
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-gray-500">Your email is verified and cannot be changed</p>
                  </div>

                  {/* Bio */}
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 dark:text-gray-300 flex items-center gap-2">
                      <User size={16} className="text-slate-400 dark:text-gray-500" />
                      Bio
                    </Label>
                    <Textarea 
                      disabled={!isEditing} 
                      value={profileData.bio}
                      onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                      placeholder="Tell us about yourself..."
                      className="min-h-[120px] border-slate-200 dark:border-border focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all resize-none disabled:bg-slate-50 dark:disabled:bg-gray-800 disabled:cursor-not-allowed" 
                    />
                    <p className="text-xs text-slate-500 dark:text-gray-500">Brief description for your profile. Max 160 characters.</p>
                  </div>
                </CardContent>
              </Card>

              {/* Role Card */}
              <Card className="border-slate-200/60 dark:border-border shadow-sm">
                <CardHeader className="border-b border-slate-100 dark:border-border bg-slate-50/50 dark:bg-gray-800/50">
                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Professional Role</CardTitle>
                  <CardDescription>Your role helps us personalize your experience</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between p-5 rounded-xl border-2 border-slate-100 dark:border-border bg-white dark:bg-gray-800 hover:border-blue-200 dark:hover:border-blue-800 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-600 text-white rounded-xl shadow-md">
                        {user.job_role === 'developer' ? <Code size={24} /> : <Briefcase size={24} />}
                      </div>
                      <div>
                        <p className="text-base font-bold text-slate-900 dark:text-white capitalize">
                          {user.job_role?.replace('_', ' ') || 'Not specified'}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-gray-400">
                          {user.job_role ? 'Current role' : 'Select your professional role'}
                        </p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowRoleModal(true)}
                      className="gap-2 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
                    >
                      Change Role
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Security Card */}
              <Card className="border-slate-200/60 dark:border-border shadow-sm">
                <CardHeader className="border-b border-slate-100 dark:border-border bg-slate-50/50 dark:bg-gray-800/50">
                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Security</CardTitle>
                  <CardDescription>Manage your account security and authentication</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <button className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 hover:border-slate-300 dark:hover:border-gray-600 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-slate-100 dark:bg-gray-700 rounded-lg">
                        <Lock size={20} className="text-slate-600 dark:text-gray-300" />
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Password</p>
                        <p className="text-xs text-slate-500 dark:text-gray-400">Last updated 30 days ago</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-400 dark:text-gray-500 group-hover:translate-x-1 transition-transform" />
                  </button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "billing" && (
            <div className="space-y-6">
              {/* Subscription Card */}
              <Card className="border-slate-200/60 dark:border-border shadow-sm overflow-hidden">
                <CardHeader className="border-b border-slate-100 dark:border-border bg-blue-50 dark:bg-blue-950/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Subscription Plan</CardTitle>
                      <CardDescription className="mt-1">Manage your current plan and billing</CardDescription>
                    </div>
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-md">
                      <Rocket size={24} className="text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between p-5 rounded-xl border-2 border-slate-100 dark:border-border bg-white dark:bg-gray-800">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-gray-400 mb-1">Current Plan</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-white capitalize">
                        {user.plan || 'Free'}
                      </p>
                    </div>
                    <Badge className="bg-blue-600 text-white border-none shadow-md text-sm px-4 py-2">
                      Active
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Billing Section */}
              <Card className="border-slate-200/60 dark:border-border shadow-sm">
                <CardHeader className="border-b border-slate-100 dark:border-border bg-slate-50/50 dark:bg-gray-800/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-gray-700 rounded-lg">
                      <CreditCard size={20} className="text-slate-600 dark:text-gray-300" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Billing & Payments</CardTitle>
                      <CardDescription>Manage your payment methods and invoices</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <BillingSection />
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "settings" && (
            <div className="space-y-6">
              <Card className="border-slate-200/60 dark:border-border shadow-sm">
                <CardHeader className="border-b border-slate-100 dark:border-border bg-slate-50/50 dark:bg-gray-800/50">
                  <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">Preferences</CardTitle>
                  <CardDescription>Configure your notification and app preferences</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {/* Email Notifications */}
                  <div className="flex items-center justify-between p-5 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                        <Bell size={20} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Email Notifications</p>
                        <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Receive email updates for activity</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Push Notifications */}
                  <div className="flex items-center justify-between p-5 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                        <Bell size={20} className="text-purple-600 dark:text-purple-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Push Notifications</p>
                        <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Get browser notifications</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Weekly Summary */}
                  <div className="flex items-center justify-between p-5 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-gray-800 hover:bg-slate-50 dark:hover:bg-gray-700 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                        <TrendingUp size={20} className="text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Weekly Summary</p>
                        <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">Receive weekly activity digest</p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-200 dark:bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
      </div>

      <RoleSelectionModal
        open={showRoleModal}
        isNewOrganization={false}
        isChangingRole={!!user.job_role}
        onComplete={async () => {
          setShowRoleModal(false);
          await refreshUser();
          toast({ title: "Updated", description: "Role updated successfully." });
        }}
      />
    </div>
  );
}
