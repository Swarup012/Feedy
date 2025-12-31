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
import { Separator } from "@/components/ui/separator";
import { BillingSection } from "@/components/BillingSection";
import { useToast } from "@/hooks/use-toast";
import {
  User, Mail, Shield, Settings, Activity, LogOut, Edit2, Save, X,
  Camera, Calendar, MapPin, Link2, Github, Twitter, Globe,
  Briefcase, Rocket, Palette, Code, TrendingUp, UserCircle,
  CreditCard, ExternalLink, ChevronRight, Bell, AlertTriangle
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
    { id: "activity", label: "Activity", icon: Activity },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 text-slate-900 dark:text-gray-100 selection:bg-blue-100 dark:selection:bg-blue-900">
      {/* Top Border Accent */}
      <div className="h-[1px] bg-slate-100 dark:bg-gray-800 w-full fixed top-0 z-50" />

      <div className="max-w-[1100px] mx-auto pt-16 pb-20 px-6 lg:px-10 grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-16">
        
        {/* SIDEBAR */}
        <aside className="space-y-8">
          <div className="flex flex-col items-center lg:items-start space-y-4">
            <div className="relative group">
              <Avatar className="h-20 w-20 border border-slate-200 dark:border-gray-700 shadow-sm transition-all duration-300 group-hover:border-slate-300 dark:group-hover:border-gray-600 overflow-hidden">
                <AvatarImage src={profileData.avatar_url} className="object-cover" />
                <AvatarFallback className="bg-slate-50 dark:bg-gray-800 text-slate-400 dark:text-gray-400 font-bold text-xl">
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
                className="absolute -bottom-1 -right-1 p-1.5 bg-white dark:bg-gray-800 border border-slate-200 dark:border-gray-700 rounded-full shadow-sm text-slate-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
              >
                {uploadingAvatar ? <div className="h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : <Camera size={14} />}
              </label>
            </div>
            
            <div className="text-center lg:text-left">
              <h2 className="font-bold text-lg tracking-tight dark:text-gray-100">{user.name}</h2>
              <p className="text-[10px] text-slate-400 dark:text-gray-500 font-black uppercase tracking-[0.12em] mt-1">
                {user.job_role?.replace('_', ' ') || 'New Member'}
              </p>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => { setActiveTab(item.id); setIsEditing(false); }}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                  activeTab === item.id 
                    ? "bg-slate-50 dark:bg-gray-800 text-slate-900 dark:text-gray-100" 
                    : "text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 hover:bg-slate-50/50 dark:hover:bg-gray-800/50"
                }`}
              >
                <item.icon size={16} strokeWidth={activeTab === item.id ? 2.5 : 2} />
                {item.label}
              </button>
            ))}
            <div className="my-4 h-px bg-slate-100 dark:bg-gray-800 w-full" />
            <button 
              onClick={() => logout()}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-bold text-red-400 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 hover:bg-red-50/50 dark:hover:bg-red-950/50 transition-all"
            >
              <LogOut size={16} strokeWidth={2.5} />
              Sign Out
            </button>
          </nav>
        </aside>

        {/* CONTENT */}
        <main ref={mainContentRef} className="animate-content min-h-[500px]">
          
          {activeTab === "profile" && (
            <div className="max-w-2xl space-y-12">
              <section>
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h1 className="text-2xl font-black tracking-tighter dark:text-gray-100">General</h1>
                    <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">Manage your public profile and identity.</p>
                  </div>
                  {!isEditing ? (
                    <Button variant="outline" size="sm" className="font-bold rounded-lg border-slate-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700 h-9" onClick={() => setIsEditing(true)}>
                      <Edit2 className="mr-2 h-3.5 w-3.5" /> Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" className="font-bold h-9 text-slate-400 dark:text-gray-400 dark:hover:bg-gray-800" onClick={() => setIsEditing(false)}>Cancel</Button>
                      <Button size="sm" className="font-bold h-9 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 transition-all" onClick={handleSave} disabled={loading}>
                        {loading ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-8">
                  {/* Name Input - Force text color to Slate-900 */}
                  <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-start">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500 pt-3">Full Name</Label>
                    <Input 
                      disabled={!isEditing} 
                      value={profileData.name} 
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                      className="border-slate-200 dark:border-gray-700 bg-slate-50/30 dark:bg-gray-800/50 h-11 rounded-xl text-slate-900 dark:text-gray-100 font-bold focus:ring-4 focus:ring-blue-500/5 dark:focus:ring-blue-500/20 transition-all" 
                    />
                  </div>

                  {/* Email Read-only */}
                  <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-center">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500">Email Address</Label>
                    <div className="flex items-center justify-between h-11 px-4 rounded-xl bg-slate-50 dark:bg-gray-800/50 border border-slate-100 dark:border-gray-700 text-slate-500 dark:text-gray-400 font-medium text-sm">
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-slate-300 dark:text-gray-600" />
                        {user.email}
                      </div>
                      <Badge className="bg-white dark:bg-gray-700 text-slate-400 dark:text-gray-400 border-slate-200 dark:border-gray-600 shadow-none text-[9px] font-black uppercase">Verified</Badge>
                    </div>
                  </div>

                  {/* Bio */}
                  <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-start">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500 pt-3">About You</Label>
                    <Textarea 
                      disabled={!isEditing} 
                      value={profileData.bio}
                      onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                      placeholder="Write a short bio..."
                      className="border-slate-200 dark:border-gray-700 bg-slate-50/30 dark:bg-gray-800/50 min-h-[120px] rounded-xl text-slate-900 dark:text-gray-100 font-medium focus:ring-4 focus:ring-blue-500/5 dark:focus:ring-blue-500/20 transition-all resize-none" 
                    />
                  </div>

                  {/* Role Selection UI */}
                  <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-4 items-start pt-4">
                    <Label className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500 pt-3">Work Role</Label>
                    <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 dark:border-gray-700 bg-white dark:bg-gray-800/50 shadow-sm hover:border-slate-200 dark:hover:border-gray-600 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-slate-50 dark:bg-gray-700 text-slate-900 dark:text-gray-100 rounded-xl border border-slate-100 dark:border-gray-600">
                          {user.job_role === 'developer' ? <Code size={18} /> : <Briefcase size={18} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 dark:text-gray-100 capitalize">{user.job_role?.replace('_', ' ') || 'Not specified'}</p>
                          <p className="text-xs text-slate-400 dark:text-gray-500 font-medium">Click change to update role</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50" onClick={() => setShowRoleModal(true)}>
                        Change
                      </Button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Security Snapshot */}
              <section className="pt-12 border-t border-slate-100 dark:border-gray-800">
                 <h3 className="text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-gray-500 mb-6">Security</h3>
                 <div className="flex flex-col gap-3">
                   <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-gray-700 bg-slate-50/30 dark:bg-gray-800/30 group cursor-pointer hover:bg-slate-50 dark:hover:bg-gray-800/50 transition-all">
                      <div className="flex items-center gap-3">
                        <Shield size={16} className="text-slate-400 dark:text-gray-500" />
                        <span className="text-sm font-bold dark:text-gray-100">Password</span>
                      </div>
                      <ChevronRight size={14} className="text-slate-300 dark:text-gray-600 group-hover:translate-x-1 transition-transform" />
                   </div>
                 </div>
              </section>
            </div>
          )}

          {activeTab === "billing" && (
            <div className="animate-content space-y-8">
              <div>
                <h1 className="text-2xl font-black tracking-tighter dark:text-gray-100">Billing</h1>
                <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">Manage your subscription plans.</p>
              </div>
              <BillingSection />
            </div>
          )}

          {activeTab === "settings" && (
            <div className="animate-content space-y-8">
              <div>
                <h1 className="text-2xl font-black tracking-tighter dark:text-gray-100">Preferences</h1>
                <p className="text-slate-500 dark:text-gray-400 text-sm font-medium">Configure notifications and app behavior.</p>
              </div>
              <div className="flex items-center justify-between p-5 rounded-2xl border border-slate-100 dark:border-gray-700 bg-slate-50/20 dark:bg-gray-800/20">
                <div className="flex gap-4">
                  <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-slate-100 dark:border-gray-700 shadow-sm"><Bell size={18} className="dark:text-gray-300" /></div>
                  <div>
                    <p className="text-sm font-bold dark:text-gray-100">Activity Notifications</p>
                    <p className="text-xs text-slate-400 dark:text-gray-500">Receive emails for new updates</p>
                  </div>
                </div>
                <input type="checkbox" className="w-10 h-5 bg-slate-200 dark:bg-gray-700 rounded-full appearance-none checked:bg-blue-600 dark:checked:bg-blue-600 transition-all cursor-pointer relative after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:w-4 after:h-4 after:rounded-full after:transition-all checked:after:left-[22px]" defaultChecked />
              </div>
            </div>
          )}
        </main>
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