
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, User, Mail, Lock, ArrowRight, CheckCircle2, Zap, Shield } from "lucide-react";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import gsap from "gsap";
import { getPublicReturnUrl, clearReturnUrl } from "@/lib/returnUrl";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const { toast } = useToast();
  const containerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Entrance animation (matched to login)
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".signup-reveal", {
        y: 12,
        opacity: 0,
        scale: 0.98,
        duration: 0.8,
        stagger: 0.08,
        ease: "power3.out",
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!formData.name.trim()) e.name = "Name is required";
    if (!formData.email.trim()) e.email = "Email is required";
    if (!formData.password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(p => ({ ...p, [id]: value }));
    if (errors[id]) setErrors(p => ({ ...p, [id]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const { emailConfirmationRequired } = await signup(
        formData.name,
        formData.email,
        formData.password
      );

      if (emailConfirmationRequired) {
        toast({
          title: "Account created",
          description: "Check your email to verify your account.",
        });
        setTimeout(() => router.push("/login"), 2000);
      } else {
        const returnUrl = getPublicReturnUrl();
        if (returnUrl) {
          clearReturnUrl();
          router.push(returnUrl);
        } else {
          router.push("/onboarding");
        }
      }
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen flex bg-white dark:bg-slate-950">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-300 rounded-full blur-3xl"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <div className="signup-reveal">
            <Link href="/" className="inline-flex items-center gap-3">
              <Logo width={40} height={40} className="text-white" />
              <span className="text-2xl font-switzer font-bold">Faddy</span>
            </Link>
          </div>

          {/* Main Content */}
          <div className="signup-reveal space-y-8 max-w-md">
            <h1 className="text-5xl font-switzer font-bold leading-tight">
              Start building better products today
            </h1>
            <p className="text-xl text-blue-100 leading-relaxed">
              Join thousands of teams using Faddy to collect feedback, prioritize features, and ship what matters.
            </p>

            {/* Features */}
            <div className="space-y-4 pt-8">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <span className="text-lg">Free 14-day trial, no credit card required</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="text-lg">Set up in under 5 minutes</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="text-lg">Enterprise-grade security & privacy</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="signup-reveal text-sm text-blue-100">
            © 2026 Faddy. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="flex-1 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="signup-reveal lg:hidden mb-8 text-center">
            <Link href="/" className="inline-flex items-center gap-3">
              <Logo width={40} height={40} className="text-blue-600" />
              <span className="text-2xl font-switzer font-bold text-slate-900 dark:text-white">Faddy</span>
            </Link>
          </div>

          {/* Form Header */}
          <div className="signup-reveal mb-8">
            <h2 className="text-3xl font-switzer font-bold text-slate-900 dark:text-white">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Start collecting feedback in minutes
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="signup-reveal space-y-5">
            {/* Google Sign Up */}
            <div className="space-y-4">
              <GoogleAuthButton mode="signup" />
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-300 dark:border-slate-700" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white dark:bg-slate-950 px-2 text-slate-500 dark:text-slate-400">
                    Or continue with email
                  </span>
                </div>
              </div>
            </div>

            {/* Name */}
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Full name
              </Label>
              <div className="relative mt-2">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Jane Doe"
                  className="pl-10 h-12 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 rounded-lg font-switzer"
                />
              </div>
              {errors.name && (
                <p className="text-xs mt-2 text-red-600 dark:text-red-400">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Email address
              </Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="you@company.com"
                  className="pl-10 h-12 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 rounded-lg font-switzer"
                />
              </div>
              {errors.email && (
                <p className="text-xs mt-2 text-red-600 dark:text-red-400">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Password
              </Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="••••••••"
                  className="pl-10 pr-12 h-12 bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-600/20 rounded-lg font-switzer"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password ? (
                <p className="text-xs mt-2 text-red-600 dark:text-red-400">
                  {errors.password}
                </p>
              ) : (
                <p className="text-xs mt-2 text-slate-500 dark:text-slate-500">
                  8+ characters • uppercase • number
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-switzer font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-blue-600/25 hover:shadow-blue-600/40 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
            >
              {loading ? (
                <LoadingAnimation width={20} height={20} />
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Create account
                  <ArrowRight size={18} />
                </span>
              )}
            </Button>
          </form>

          {/* Sign in link */}
          <p className="signup-reveal text-center mt-8 text-sm text-slate-600 dark:text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
              Sign in
            </Link>
          </p>

          {/* Privacy links */}
          <div className="signup-reveal mt-8 pt-8 border-t border-slate-200 dark:border-slate-800">
            <p className="text-xs text-center text-slate-500 dark:text-slate-500">
              By signing up, you agree to our{" "}
              <Link href="/policy/terms" className="text-blue-600 hover:text-blue-700 hover:underline">
                Terms
              </Link>
              {" "}and{" "}
              <Link href="/policy/privacy" className="text-blue-600 hover:text-blue-700 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
