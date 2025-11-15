"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LoadingAnimation } from "@/components/LoadingAnimation";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    // Only check when loading is complete
    if (loading) {
      setShouldRender(false);
      return;
    }

    // Not authenticated - redirect to login
    if (!isAuthenticated) {
      console.log("ProtectedRoute: Not authenticated, redirecting to login");
      router.push("/login");
      setShouldRender(false);
      return;
    }

    // If no role restriction, allow access
    if (!allowedRoles || allowedRoles.length === 0) {
      console.log("ProtectedRoute: No role restriction, allowing access");
      setShouldRender(true);
      return;
    }

    // Check role - Use organization_role from organization_members table
    if (user) {
      // Get organization_role (owner/admin/member) from organization_members table
      const userOrgRole = user.organization_role;
      
      // If no organization_role, user is not a member of any organization
      if (!userOrgRole) {
        console.log("ProtectedRoute: No organization_role found, redirecting to unauthorized");
        router.push("/unauthorized");
        setShouldRender(false);
        return;
      }
      
      const hasRole = allowedRoles.includes(userOrgRole);
      
      console.log("ProtectedRoute: User org role:", userOrgRole, "Required:", allowedRoles, "Has access:", hasRole);
      
      if (hasRole) {
        setShouldRender(true);
      } else {
        console.log("ProtectedRoute: Insufficient permissions, redirecting to unauthorized");
        router.push("/unauthorized");
        setShouldRender(false);
      }
    } else {
      // User object not loaded yet but authenticated
      console.log("ProtectedRoute: User object not loaded, waiting...");
      setShouldRender(false);
    }
  }, [loading, isAuthenticated, user, allowedRoles, router]);

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingAnimation width={48} height={48} />
      </div>
    );
  }

  // Don't render until we've verified access
  if (!shouldRender) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingAnimation width={48} height={48} />
      </div>
    );
  }

  // All checks passed - render children
  return <>{children}</>;
}
