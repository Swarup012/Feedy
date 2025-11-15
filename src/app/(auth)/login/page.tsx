"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowRight } from "lucide-react";
import api from "@/lib/api";
import { RoleSelectionModal } from "@/components/RoleSelectionModal";
import { LoadingAnimation } from "@/components/LoadingAnimation";

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string | null>(null);
  const [isJoiningOrg, setIsJoiningOrg] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);

  // Check URL params for organization info (when redirected from signup)
  // OR detect subdomain and fetch organization
  useEffect(() => {
    const detectOrganization = async () => {
      try {
        // First priority: Check URL params (from signup redirect)
        const orgId = searchParams.get('orgId');
        const orgName = searchParams.get('orgName');
        
        if (orgId) {
          console.log("🔍 Organization from URL params:", orgName, orgId);
          setOrganizationId(orgId);
          setOrganizationName(orgName);
          setIsJoiningOrg(true);
          return;
        }

        // Second priority: Detect from subdomain
        if (typeof window !== 'undefined') {
          const hostname = window.location.hostname;
          console.log("🌐 Current hostname:", hostname);
          const parts = hostname.split('.');
          console.log("🔍 Hostname parts:", parts);
          let subdomain: string | null = null;

          // Handle localhost with subdomain (e.g., notion.localhost)
          if (hostname.includes('localhost') && parts.length > 1 && parts[0] !== 'localhost') {
            subdomain = parts[0];
            console.log("🔍 Detected localhost subdomain:", subdomain);
          } else if (parts.length >= 3) {
            // Handle production domains (e.g., notion.yourdomain.com)
            subdomain = parts[0];
            // Ignore www and common subdomains
            if (subdomain === "www" || subdomain === "api" || subdomain === "admin") {
              console.log("ℹ️ Ignoring reserved subdomain:", subdomain);
              subdomain = null;
            } else {
              console.log("🔍 Detected production subdomain:", subdomain);
            }
          }

          if (subdomain) {
            console.log("📡 Fetching organization for subdomain:", subdomain);

            // Fetch organization by subdomain
            const response = await api.get(`/api/organizations/subdomain/${subdomain}`);
            console.log("📡 Subdomain API response:", response.data);
            
            if (response.data.success && response.data.data && response.data.data.organization) {
              const org = response.data.data.organization; // Extract nested organization object
              console.log("✅ Organization found:", org);
              setOrganizationId(org.id);
              setOrganizationName(org.name);
              setIsJoiningOrg(true); // Flag to show role selection if needed
              console.log("✅ Organization state set:", org.name, "ID:", org.id);
            } else {
              console.log("❌ No organization found for subdomain:", subdomain);
              console.log("Response structure:", response.data);
            }
          } else {
            console.log("ℹ️ No subdomain detected - standard login");
          }
        }
      } catch (error: any) {
        console.error("❌ Error detecting organization:", error);
        console.error("Error details:", error.response?.data || error.message);
      }
    };

    detectOrganization();
  }, [searchParams]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));

    if (errors[id]) {
      setErrors((prev) => ({ ...prev, [id]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      console.log("🔐 Submitting login with:", {
        email: formData.email,
        organizationId: organizationId,
        organizationName: organizationName,
        isJoiningOrg: isJoiningOrg
      });

      // If accessing via subdomain, pass organizationId to switch to that org
      // If joining for first time, show role modal; otherwise just switch context
      const response = await login(
        formData.email, 
        formData.password,
        organizationId || undefined // Pass organizationId from subdomain
      );

      // If joining organization for the first time, show role modal
      if (isJoiningOrg && organizationId) {
        setShowRoleModal(true);
      } else {
        toast({
          title: "Welcome back!",
          description: organizationName 
            ? `Switched to ${organizationName}` 
            : "You have successfully logged in.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid email or password.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-blue-50 flex items-center justify-center p-4">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '700ms'}}></div>
        </div>

        <div className="w-full max-w-md relative">
          {/* Logo and Back to Home */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-flex items-center space-x-2 mb-6 group">
              <div className="flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Logo width={40} height={40} />
              </div>
              <span className="text-xl font-bold text-[#2563eb]">Faddy</span>
            </Link>
          </div>

          {/* Login Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/60 shadow-2xl shadow-slate-900/5">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {organizationName ? `Join ${organizationName}` : 'Welcome Back'}
              </h1>
              <p className="text-slate-600">
                {organizationName 
                  ? `Login to access ${organizationName}'s workspace` 
                  : 'Enter your credentials to access your account'}
              </p>
              {organizationId && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    🏢 You're logging into <strong>{organizationName}</strong>
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Org ID: {organizationId}
                  </p>
                </div>
              )}
              
              {/* Debug info - remove in production */}
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-2 p-2 bg-gray-100 border border-gray-300 rounded text-xs">
                  <p>Debug: organizationId = {organizationId || 'null'}</p>
                  <p>Debug: organizationName = {organizationName || 'null'}</p>
                  <p>Debug: hostname = {typeof window !== 'undefined' ? window.location.hostname : 'N/A'}</p>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  className={`h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all ${
                    errors.email ? "border-red-500 focus:ring-red-500/20 focus:border-red-500" : ""
                  }`}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                    Password
                  </Label>
                  <Link 
                    href="/forgot-password" 
                    className="text-sm text-[#2563eb] hover:underline font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                    className={`h-12 rounded-xl border-slate-200 focus:ring-2 focus:ring-[#2563eb]/20 focus:border-[#2563eb] transition-all pr-12 ${
                      errors.password ? "border-red-500 focus:ring-red-500/20 focus:border-red-500" : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span className="inline-block w-1 h-1 bg-red-500 rounded-full"></span>
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full h-12 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-semibold text-base shadow-lg shadow-[#2563eb]/25 hover:shadow-xl hover:shadow-[#2563eb]/40 transition-all duration-300 group"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <LoadingAnimation width={20} height={20} className="mr-2" />
                    Logging in...
                  </>
                ) : (
                  <>
                    Log in
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-slate-500">or</span>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-slate-600">
                Don't have an account?{" "}
                <Link 
                  href="/signup" 
                  className="text-[#2563eb] font-semibold hover:underline"
                >
                  Sign up for free
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-slate-500 mt-6">
            By logging in, you agree to our{" "}
            <Link href="#" className="text-[#2563eb] hover:underline">Terms</Link>
            {" "}and{" "}
            <Link href="#" className="text-[#2563eb] hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>

      {/* Role Selection Modal - shown when joining an organization */}
      <RoleSelectionModal
        open={showRoleModal}
        organizationName={organizationName || undefined}
        organizationId={organizationId || undefined}
        isNewOrganization={false}
        onComplete={() => {
          setShowRoleModal(false);
          toast({
            title: "Welcome!",
            description: `You've successfully joined ${organizationName}!`,
          });
        }}
      />
    </>
  );
}