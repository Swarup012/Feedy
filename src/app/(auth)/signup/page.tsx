"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { TokenManager } from "@/lib/tokenManager";
import { Loader2, Eye, EyeOff } from "lucide-react";
import api from "@/lib/api";
import { RoleSelectionModal } from "@/components/RoleSelectionModal";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [loadingOrg, setLoadingOrg] = useState(true);
  const [showRoleModal, setShowRoleModal] = useState(false);
  // Detect subdomain and fetch organization on mount
  useEffect(() => {
    const detectOrganization = async () => {
      try {
        // Get subdomain from hostname
        const hostname = window.location.hostname;
        const parts = hostname.split(".");
        let subdomain: string | null = null;

        // Handle localhost with subdomain (e.g., startups.localhost)
        if (hostname.includes("localhost") && parts.length > 1 && parts[0] !== "localhost") {
          subdomain = parts[0];
        }
        // Handle production (e.g., startups.fady.com)
        else if (parts.length >= 3 && !hostname.includes("localhost")) {
          subdomain = parts[0];
          // Ignore www and common subdomains
          if (subdomain === "www" || subdomain === "api" || subdomain === "admin") {
            subdomain = null;
          }
        }

        if (subdomain) {
          console.log("🔍 Detected subdomain:", subdomain);
          
          // Fetch organization by subdomain
          const response = await api.get(`/api/organizations/subdomain/${subdomain}`);
          
          if (response.data.success && response.data.data.organization) {
            const org = response.data.data.organization;
            setOrganizationId(org.id);
            setOrganizationName(org.name);
            console.log("✅ Found organization:", org.name, org.id);
          }
        } else {
          console.log("ℹ️ No subdomain detected - user will create new organization");
        }
      } catch (error) {
        console.error("❌ Error fetching organization:", error);
        // If organization not found, user will create a new one
      } finally {
        setLoadingOrg(false);
      }
    };

    detectOrganization();
  }, []);

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password =
        "Password must contain uppercase, lowercase, and number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));

    // Clear error when user starts typing
    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: "" }));
    }
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { emailConfirmationRequired } = await signup(
        formData.name,
        formData.email,
        formData.password,
        undefined, // No role during signup - will be set in modal
        organizationId || undefined, // Pass organizationId if joining existing org
      );

      if (emailConfirmationRequired) {
        toast({
          title: "Account created!",
          description:
            "Please check your email to verify your account before logging in.",
          duration: 2000,
        });

        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        // Show role selection modal instead of redirecting
        setShowRoleModal(true);
      }
    } catch (error: any) {
      // Check if email already exists
      if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
        toast({
          title: "Account Already Exists",
          description: organizationName 
            ? `You already have an account. Please login to join ${organizationName}.`
            : "You already have an account. Please login instead.",
          variant: "destructive",
          duration: 5000,
        });
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push(`/login${organizationId ? `?orgId=${organizationId}&orgName=${organizationName}` : ''}`);
        }, 2000);
      } else {
        toast({
          title: "Signup failed",
          description: error.message || "Something went wrong. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="mx-auto max-w-sm">
        <CardHeader className="text-center">
          <Link href="/" className="inline-block mb-4">
            <Logo className="h-8 w-8 mx-auto" />
          </Link>
          <CardTitle className="text-2xl">Sign Up</CardTitle>
          <CardDescription>
            {loadingOrg ? (
              "Loading..."
            ) : organizationName ? (
              <>Joining <strong>{organizationName}</strong></>
            ) : (
              "Enter your information to create an account"
            )}
          </CardDescription>
        </CardHeader>
      <CardContent>
        {loadingOrg ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Name Field */}
          <div className="grid gap-2">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              disabled={loading}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
              className={errors.email ? "border-red-500" : ""}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
                className={errors.password ? "border-red-500" : ""}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password}</p>
            )}
            <p className="text-xs text-gray-500">
              Must be 8+ characters with uppercase, lowercase, and number
            </p>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : organizationName ? (
              `Join ${organizationName}`
            ) : (
              "Create an account"
            )}
          </Button>
        </form>
        )}

        <div className="mt-4 text-center text-sm">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Log in
          </Link>
        </div>
      </CardContent>
    </Card>

      {/* Role Selection Modal - shown after successful signup */}
      <RoleSelectionModal
        open={showRoleModal}
        organizationName={organizationName || undefined}
        organizationId={organizationId || undefined}
        isNewOrganization={!organizationId}
        onComplete={() => {
          setShowRoleModal(false);
          // Refresh user data and redirect
          const userData = TokenManager.getUser();
          if (userData?.organization_id || organizationId) {
            router.push("/dashboard");
          } else {
            router.push("/onboarding");
          }
        }}
      />
    </>
  );
}
