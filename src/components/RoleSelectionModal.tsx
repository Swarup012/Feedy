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
import { Check, Loader2, Briefcase, Rocket, Palette, Code, TrendingUp, UserCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

export type Role = "product_manager" | "founder" | "designer" | "developer" | "marketer" | "other";

interface RoleOption {
  value: Role;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const roleOptions: RoleOption[] = [
  {
    value: "product_manager",
    label: "Product Manager",
    description: "I manage product development and roadmaps",
    icon: <Briefcase className="h-6 w-6" />,
  },
  {
    value: "founder",
    label: "Founder / CEO",
    description: "I lead the company and make strategic decisions",
    icon: <Rocket className="h-6 w-6" />,
  },
  {
    value: "designer",
    label: "Designer",
    description: "I design user experiences and interfaces",
    icon: <Palette className="h-6 w-6" />,
  },
  {
    value: "developer",
    label: "Developer",
    description: "I build and maintain software products",
    icon: <Code className="h-6 w-6" />,
  },
  {
    value: "marketer",
    label: "Marketer",
    description: "I handle marketing and growth strategies",
    icon: <TrendingUp className="h-6 w-6" />,
  },
  {
    value: "other",
    label: "Other",
    description: "I have a different role",
    icon: <UserCircle className="h-6 w-6" />,
  },
];

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
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
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
        title: "Welcome!",
        description: organizationName
          ? `You've joined ${organizationName} successfully`
          : "Your profile has been completed",
      });

      // Call the onComplete callback
      onComplete();

      // Redirect based on context
      if (isNewOrganization) {
        // New user who needs to create organization
        router.push("/onboarding");
      } else if (organizationId) {
        // User joined existing organization
        router.push("/dashboard");
      } else {
        // Fallback
        router.push("/dashboard");
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
          {roleOptions.map((option) => (
            <Card
              key={option.value}
              className={`p-4 cursor-pointer transition-all hover:shadow-md border-2 ${
                selectedRole === option.value
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => setSelectedRole(option.value)}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  selectedRole === option.value 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {option.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-base">{option.label}</h3>
                    {selectedRole === option.value && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                </div>
              </div>
            </Card>
          ))}
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
