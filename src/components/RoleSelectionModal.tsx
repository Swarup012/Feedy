"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { useJobRoles } from "@/hooks/useJobRoles";
import { IconDisplay } from "@/components/ui/icon-picker";

interface RoleSelectionModalProps {
  open: boolean;
  organizationName?: string;
  organizationId?: string;
  isNewOrganization?: boolean;
  isChangingRole?: boolean; // Flag to indicate user is changing existing role
  onComplete: () => void;
}

export function RoleSelectionModal({
  open,
  organizationName,
  organizationId,
  isNewOrganization = false,
  isChangingRole = false,
  onComplete,
}: RoleSelectionModalProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const { roles: jobRoles, loading: rolesLoading } = useJobRoles(organizationId);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!selectedRole) {
      toast({
        title: "Role Required",
        description: "Please select your role to continue",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Update user role via API
      await api.put("/api/auth/update-role", {
        role: selectedRole,
        organizationId,
      });

      toast({
        title: isChangingRole ? "Role Updated!" : "Welcome!",
        description: organizationName
          ? `You've joined ${organizationName} successfully`
          : isChangingRole
          ? "Your job role has been updated successfully"
          : "Your profile has been completed",
      });

      // Call the onComplete callback
      onComplete();

      // Only redirect when onboarding — NOT when simply changing an existing role
      if (!isChangingRole) {
        if (isNewOrganization) {
          router.push("/onboarding");
        } else {
          router.push("/dashboard");
        }
      }
    } catch (error: any) {
      console.error("Failed to set role:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to set role. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      // Allow closing only when changing role (not during initial setup)
      if (!open && isChangingRole) {
        onComplete();
      }
    }}>
      <DialogContent
        className="sm:max-w-2xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => {
          // Prevent closing during initial setup
          if (!isChangingRole) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          // Prevent closing during initial setup
          if (!isChangingRole) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {isChangingRole
              ? "Update Your Role"
              : organizationName
              ? `Welcome to ${organizationName}! 🎉`
              : "One More Step! 🎉"}
          </DialogTitle>
          <DialogDescription className="text-base">
            {isChangingRole
              ? "Select your new role to update your profile"
              : organizationName
              ? "Choose your role to get started with the team"
              : "Help us personalize your experience by selecting your role"}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-4">
          {rolesLoading ? (
            <p className="text-center text-sm text-gray-500 col-span-2 py-8">Loading roles...</p>
          ) : (
            jobRoles.map((option) => (
              <Card
                key={option.key}
                className={`p-4 cursor-pointer transition-all hover:shadow-md border-2 ${
                  selectedRole === option.key
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedRole(option.key)}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    selectedRole === option.key 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    <IconDisplay iconName={option.icon} className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-base">{option.name}</h3>
                      {selectedRole === option.key && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={!selectedRole || loading}
            className="w-full"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isChangingRole ? "Updating..." : "Setting up..."}
              </>
            ) : isChangingRole ? (
              "Update Role"
            ) : (
              "Continue →"
            )}
          </Button>
          {!isChangingRole && (
            <p className="text-xs text-center text-gray-500">
              You can change your role later in profile settings
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
