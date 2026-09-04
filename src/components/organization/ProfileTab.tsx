"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/context/OrganizationContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit2, Save, ChevronRight, LogOut } from "lucide-react";
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
    <div className="space-y-8 max-w-2xl mx-auto pb-12">
      {/* Profile Picture */}
      <div className="space-y-4">
        <Label className="text-sm font-medium text-foreground">Profile picture</Label>
        <div className="flex flex-col sm:flex-row sm:items-center gap-5">
          <Avatar className="h-20 w-20 border border-border shadow-sm">
            <AvatarImage src={user.avatar_url || undefined} alt={user.name || "User"} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
              {user.name?.[0]?.toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                  className="gap-1.5"
                >
                  <Edit2 size={14} /> Edit Profile
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={logout}
                  className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <LogOut size={14} /> Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={loading}
                  className="gap-1.5"
                >
                  <Save size={14} /> {loading ? "Saving..." : "Save Changes"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <hr className="border-border" />

      {/* Profile Name */}
      <div className="space-y-2">
        <Label htmlFor="profile-name" className="text-sm font-medium text-foreground">
          Profile name
        </Label>
        <Input
          id="profile-name"
          disabled={!isEditing}
          value={profileData.name}
          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
          placeholder="Your full name"
          className="h-11"
        />
      </div>

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="profile-email" className="text-sm font-medium text-foreground">
          Email address
        </Label>
        <Input
          id="profile-email"
          disabled
          value={user.email}
          className="h-11 text-muted-foreground"
        />
        <p className="text-xs text-muted-foreground">Contact support to change your email address.</p>
      </div>

      <hr className="border-border" />

      {/* Job Role */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 flex items-center justify-center bg-muted rounded-full">
            <IconDisplay iconName={user.job_role_icon || "Briefcase"} className="h-4.5 w-4.5 text-muted-foreground" />
          </div>
          <div>
            <Label className="text-sm font-medium text-foreground">Role</Label>
            <p className="text-sm text-muted-foreground capitalize">
              {user.job_role_name || user.job_role?.replace('_', ' ') || 'Not specified'}
            </p>
          </div>
        </div>
        {(organizationRole === 'admin' || organizationRole === 'owner') && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRoleModal(true)}
            className="gap-1"
          >
            Change <ChevronRight size={14} />
          </Button>
        )}
      </div>

      <hr className="border-border" />

      {/* Bio */}
      <div className="space-y-2">
        <Label htmlFor="profile-bio" className="text-sm font-medium text-foreground">
          About me
        </Label>
        <Textarea
          id="profile-bio"
          disabled={!isEditing}
          value={profileData.bio}
          onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
          placeholder="Tell us a bit about yourself..."
          rows={4}
          className="resize-none h-auto"
        />
      </div>

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
