"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/context/OrganizationContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Check, Edit2, X, Save, Lock, ChevronRight, LogOut } from "lucide-react";
import { IconDisplay } from "@/components/ui/icon-picker";
import { RoleSelectionModal } from "@/components/RoleSelectionModal";

export function ProfileTab() {
  const { user, refreshUser, logout } = useAuth();
  const { toast } = useToast();
  const { organization, organizationRole } = useOrganization();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    bio: user?.bio || "",
  });

  useEffect(() => {
    if (user) {
      setProfileData({ name: user.name || "", email: user.email || "", bio: user.bio || "" });
    }
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    try {
      toast({ title: "Success", description: "Profile updated" });
      setIsEditing(false);
    } catch (error: any) {
      toast({ title: "Error", description: "Update failed", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Profile Header / Banner */}
      <div className="relative rounded-2xl overflow-hidden shadow-sm border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="h-32 w-full bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-900 dark:to-indigo-900"></div>
        <div className="px-6 sm:px-10 pb-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 -mt-12 mb-6">
            <div className="flex items-end gap-5">
              <Avatar className="h-28 w-28 border-4 border-white dark:border-slate-900 shadow-xl bg-white dark:bg-slate-800">
                <AvatarImage src={user.avatar_url || undefined} alt={user.name || "User"} />
                <AvatarFallback className="bg-primary/5 text-primary text-3xl font-bold">
                  {user.name?.[0]?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </div>
            <div className="pb-2 flex-shrink-0">
              {!isEditing ? (
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={logout} className="gap-2 rounded-full px-5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20">
                    <LogOut size={14} /> Sign Out
                  </Button>
                  <Button onClick={() => setIsEditing(true)} className="gap-2 rounded-full px-6 shadow-sm hover:shadow transition-all bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700">
                    <Edit2 size={14} /> Edit Profile
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setIsEditing(false)} className="rounded-full px-5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={loading} className="gap-2 rounded-full px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all">
                    <Save size={14} /> {loading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100 dark:border-slate-800/60">
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">Full Name</Label>
                <Input 
                  disabled={!isEditing} 
                  value={profileData.name} 
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} 
                  className="h-12 bg-slate-50 dark:bg-slate-800/50 border-transparent focus-visible:ring-blue-500 focus-visible:bg-white dark:focus-visible:bg-slate-800 transition-all rounded-xl font-medium" 
                />
              </div>
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">Email Address</Label>
                <div className="relative">
                  <Input 
                    disabled 
                    value={user.email} 
                    className="h-12 bg-slate-50 dark:bg-slate-800/50 border-transparent text-slate-500 dark:text-slate-400 rounded-xl font-medium pr-28" 
                  />
                  <Badge className="absolute right-2 top-1/2 -translate-y-1/2 bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 hover:bg-emerald-50 border-0 rounded-md px-2 py-0.5 font-semibold text-xs shadow-none">
                    <Check size={12} className="mr-1" /> Verified
                  </Badge>
                </div>
              </div>
            </div>
            <div>
              <Label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 block">Biography</Label>
              <Textarea 
                disabled={!isEditing} 
                value={profileData.bio} 
                onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })} 
                placeholder="Tell us a bit about yourself..."
                className="min-h-[128px] resize-none bg-slate-50 dark:bg-slate-800/50 border-transparent focus-visible:ring-blue-500 focus-visible:bg-white dark:focus-visible:bg-slate-800 transition-all rounded-xl p-4 font-medium" 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Role Card */}
      <Card className="border-slate-200/60 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden group hover:shadow-md transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 text-slate-700 dark:text-slate-300 rounded-full shadow-inner ring-1 ring-slate-900/5 dark:ring-white/5">
                <IconDisplay iconName={user.job_role_icon || "Briefcase"} className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                  {user.job_role_name || user.job_role?.replace('_', ' ') || 'Not specified'}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {user.job_role ? 'Current active role' : 'No role selected'}
                </p>
              </div>
            </div>
            {(organizationRole === 'admin' || organizationRole === 'owner') && (
              <Button 
                variant="outline" 
                onClick={() => setShowRoleModal(true)} 
                className="rounded-full shadow-sm hover:shadow hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 dark:hover:bg-blue-900/20 dark:hover:text-blue-300 dark:hover:border-blue-800 transition-all gap-1 pl-5 pr-4"
              >
                Change <ChevronRight size={16} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Role Selection Modal */}
      {(organizationRole === 'admin' || organizationRole === 'owner') && (
        <RoleSelectionModal
          open={showRoleModal}
          organizationId={organization?.id}
          isNewOrganization={false}
          isChangingRole={!!user?.job_role}
          onComplete={async () => {
            setShowRoleModal(false);
            await refreshUser();
            toast({ title: "Updated", description: "Role updated successfully." });
          }}
        />
      )}
    </div>
  );
}
