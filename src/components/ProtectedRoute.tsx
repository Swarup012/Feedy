"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

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

    // Check role - Use organization_role instead of global role
    if (user) {
      // Use organization_role (owner/admin/member) instead of global role
      const userOrgRole = user.organization_role || user.role; // Fallback to global role if org_role doesn't exist
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Don't render until we've verified access
  if (!shouldRender) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // All checks passed - render children
  return <>{children}</>;
}
