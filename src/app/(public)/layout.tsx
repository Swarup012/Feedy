"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Search, Eye } from "lucide-react";

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
import { useAuth } from "@/hooks/useAuth";
import { TokenManager } from "@/lib/tokenManager";

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

function AppHeader() {
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
        {/* Left Section */}
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Logo className="h-6 w-6" />
            <span className="font-bold">Faddy</span>
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
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <form>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search feedback..."
                  className="w-full bg-secondary pl-8 md:w-[200px] lg:w-[300px]"
                />
              </div>
            </form>
          </div>

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

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
