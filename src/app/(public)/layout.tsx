"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Search, Eye, AlertCircle } from "lucide-react";

import { Logo } from "@/components/logo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { TokenManager } from "@/lib/tokenManager";
import api from "@/lib/api";

// Organization type
interface Organization {
  id: string;
  name: string;
  subdomain: string;
  logo_url?: string;
}

function AdminViewToggle() {
  const pathname = usePathname();
  const { user } = useAuth();
  const isAdminView = pathname.startsWith("/admin");

  // Only show for admin/owner users (organization_role)
  if (!user || (user.organization_role !== "admin" && user.organization_role !== "owner")) return null;

  if (isAdminView) {
    return (
      <Button variant="outline" asChild>
        <Link href="/feedback">
          <Eye className="mr-2 h-4 w-4" />
          Public View
        </Link>
      </Button>
    );
  }

  return (
    <Button variant="outline" asChild>
      <Link href="/admin">
        <Eye className="mr-2 h-4 w-4" />
        Admin View
      </Link>
    </Button>
  );
}

function AppHeader({ organization }: { organization: Organization | null }) {
  const { user, logout, isAuthenticated } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return "U";
    return (
      user.name
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "U"
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Left Section - Show Organization Branding */}
        <div className="mr-4 hidden md:flex">
          <Link href="/feedback" className="mr-6 flex items-center space-x-2">
            {organization?.logo_url ? (
              <img 
                src={organization.logo_url} 
                alt={organization.name} 
                className="h-8 w-8 rounded-md object-cover"
              />
            ) : (
              <Logo className="h-6 w-6" />
            )}
            <span className="font-bold">{organization?.name || "Faddy"}</span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/feedback"
              className="transition-colors hover:text-foreground/80 text-foreground"
            >
              Feedback
            </Link>
            <Link
              href="/roadmap/testing"
              className="transition-colors hover:text-foreground/80 text-foreground"
            >
              Roadmap
            </Link>
            <Link
              href="/changelog"
              className="transition-colors hover:text-foreground/80 text-foreground"
            >
              Changelog
            </Link>
          </nav>
        </div>

        {/* Right Section */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          {/* Search */}
         

          {/* User Section */}
          <div className="flex items-center space-x-2">
            <ThemeToggle />
            {isAuthenticated && user ? (
              <>
                <AdminViewToggle />
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                  <span className="sr-only">Notifications</span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-8 w-8 rounded-full"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage
                          src={
                            user.avatar_url ||
                            `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}`
                          }
                          alt={user.name}
                        />
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.name}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <DropdownMenuItem asChild>
                        <Link href="/profile">Profile</Link>
                      </DropdownMenuItem>
                      {(user.organization_role === "admin" || user.organization_role === "owner") && (
                        <DropdownMenuItem asChild>
                          <Link href="/admin/feedback">Admin Dashboard</Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem>Settings</DropdownMenuItem>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

// Error page component for invalid subdomain
function InvalidOrganizationError() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="max-w-md w-full mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <div>
              <h1 className="text-2xl font-bold mb-2">Organization Not Found</h1>
              <p className="text-muted-foreground mb-4">
                The organization you're trying to access doesn't exist or has been removed.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Please check the URL and try again, or contact support if you believe this is an error.
              </p>
              <Button asChild className="w-full">
                <Link href="/">Go to Home</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Detect subdomain and fetch organization
  useEffect(() => {
    const detectOrganization = async () => {
      try {
        // Get subdomain from hostname
        const hostname = window.location.hostname;
        const parts = hostname.split(".");
        let subdomain: string | null = null;

        // Handle production (e.g., notion.fady.com)
        if (parts.length >= 3 && !hostname.includes("localhost")) {
          subdomain = parts[0];
          if (subdomain === "www" || subdomain === "api" || subdomain === "admin") {
            subdomain = null;
          }
        }
        // Handle development (e.g., notion.localhost)
        else if (hostname.includes("localhost") && parts.length > 1 && parts[0] !== "localhost") {
          subdomain = parts[0];
        }

        // If no subdomain, no organization context needed (landing page)
        if (!subdomain) {
          setOrganization(null);
          setLoading(false);
          return;
        }

        // Fetch organization by subdomain
        const response = await api.get(`/api/organizations/subdomain/${subdomain}`);
        
        if (response.data.success && response.data.data.organization) {
          setOrganization(response.data.data.organization);
          setError(false);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Failed to fetch organization:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    detectOrganization();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show error if invalid subdomain
  if (error) {
    return <InvalidOrganizationError />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader organization={organization} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
