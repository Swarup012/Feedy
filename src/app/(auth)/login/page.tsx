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
import { Loader2, Eye, EyeOff, Sparkles, ArrowRight } from "lucide-react";
import api from "@/lib/api";
import { RoleSelectionModal } from "@/components/RoleSelectionModal";

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
          setOrganizationId(orgId);
          setOrganizationName(orgName);
          return;
        }

        // Second priority: Detect from subdomain
        if (typeof window !== 'undefined') {
          const hostname = window.location.hostname;
          const parts = hostname.split('.');
          let subdomain: string | null = null;

          // Handle localhost with subdomain (e.g., startups.localhost)
          if (hostname.includes('localhost') && parts.length > 1) {
            subdomain = parts[0];
          } else if (parts.length >= 3) {
            // Handle production domains (e.g., startups.yourdomain.com)
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
            if (response.data.success && response.data.data) {
              setOrganizationId(response.data.data.id);
              setOrganizationName(response.data.data.name);
              setIsJoiningOrg(true); // Flag to show role selection
              console.log("✅ Organization detected:", response.data.data.name);
            }
          }
        }
      } catch (error: any) {
        console.error("Error detecting organization:", error);
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
      // Login first, then handle organization joining via modal
      const response = await login(
        formData.email, 
        formData.password
      );

      // If joining organization, show role modal
      if (isJoiningOrg && organizationId) {
        setShowRoleModal(true);
      } else {
        toast({
          title: "Welcome back!",
          description: "You have successfully logged in.",
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
              <div className="w-10 h-10 bg-[#2563eb] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-[#2563eb]">Faddy</span>
            </Link>
          </div>

          {/* Login Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-slate-200/60 shadow-2xl shadow-slate-900/5">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back</h1>
              <p className="text-slate-600">
                {organizationName 
                  ? `Login to join ${organizationName}` 
                  : 'Enter your credentials to access your account'}
              </p>
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
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
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