"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, ArrowRight, Lock, Mail } from "lucide-react";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import gsap from "gsap";

function LoginForm() {
  const { login } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Entrance animation — respects prefers-reduced-motion
  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      if (prefersReduced) {
        gsap.set(".login-reveal", { opacity: 1 });
      } else {
        gsap.from(".login-reveal", {
          y: 12,
          opacity: 0,
          scale: 0.98,
          duration: 0.8,
          stagger: 0.08,
          ease: "power3.out",
        });
      }
    }, formRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    try {
      localStorage.getItem("pendingInviteToken");
    } catch {}
  }, [searchParams]);

  const validateForm = () => {
    const e: Record<string, string> = {};
    const email = formData.email.trim();
    if (!email) {
      e.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = "Please enter a valid email address";
    }
    if (!formData.password) {
      e.password = "Password is required";
    } else if (formData.password.length < 6) {
      e.password = "Password must be at least 6 characters";
    }
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
      await login(formData.email.trim(), formData.password);
      toast({ title: "Welcome back" });
    } catch (err: any) {
      const message = err?.message || "Login failed";
      let description = message;
      if (message.includes("Invalid login credentials") || message.includes("invalid")) {
        description = "Invalid email or password. Please try again.";
      } else if (message.includes("network") || message.includes("fetch")) {
        description = "Network error. Check your connection and try again.";
      } else if (message.includes("rate") || message.includes("429")) {
        description = "Too many attempts. Please wait a moment and try again.";
      }
      toast({
        title: "Login failed",
        description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={formRef} className="h-screen overflow-hidden flex bg-background">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-40 dark:opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 dark:bg-primary/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-muted/50 dark:bg-muted/30 rounded-full blur-3xl"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-8 lg:p-10 w-full">
          {/* Logo */}
          <div className="login-reveal">
            <Link href="/" className="inline-flex items-center gap-3">
              <Logo width={36} height={36} className="text-primary" />
              <span className="text-lg font-switzer font-bold text-foreground">Faddy</span>
            </Link>
          </div>

          {/* Main Content - Illustration */}
          <div className="login-reveal flex-1 flex items-center justify-center mt-6 mb-6">
            <img 
              src="/images/login/Secure%20lock.svg" 
              alt="Welcome back illustration" 
              className="w-full max-w-[400px] h-auto object-contain drop-shadow-2xl" 
            />
          </div>

          {/* Footer */}
          <div className="login-reveal text-sm text-muted-foreground">
            © 2026 Faddy. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="login-reveal lg:hidden mb-6 text-center">
            <Link href="/" className="inline-flex items-center gap-3">
              <Logo width={36} height={36} className="text-primary" />
              <span className="text-lg font-switzer font-bold text-foreground">Faddy</span>
            </Link>
          </div>

          {/* Form Header */}
          <div className="login-reveal mb-6">
            <h2 className="text-lg font-switzer font-bold text-foreground">
              Sign in to your account
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Enter your credentials to access your dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-reveal space-y-5" noValidate>
            <div aria-live="polite" className="sr-only">
              {Object.values(errors).filter(Boolean).length > 0 && (
                <span>{Object.values(errors).filter(Boolean).join(". ")}</span>
              )}
            </div>
            {/* Google Sign In */}
            <div className="space-y-3">
              <GoogleAuthButton mode="login" />
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with email
                  </span>
                </div>
              </div>
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                Email address
              </Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="you@company.com"
                  autoComplete="email"
                  inputMode="email"
                  maxLength={254}
                  required
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  className="pl-10 h-12 bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg font-switzer"
                />
              </div>
              {errors.email && (
                <p id="email-error" className="text-xs mt-2 text-destructive">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label htmlFor="password" className="text-sm font-medium text-foreground">
                  Password
                </Label>
                <Link 
                  href="/forgot-password"
                  className="text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  maxLength={128}
                  required
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  className="pl-10 pr-12 h-12 bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 rounded-lg font-switzer"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-xs mt-2 text-destructive">
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-switzer font-semibold rounded-lg transition-all duration-200 shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <LoadingAnimation width={20} height={20} />
              ) : (
                <span className="flex items-center justify-center gap-2">
                  Sign in
                  <ArrowRight size={18} />
                </span>
              )}
            </Button>
          </form>

          {/* Sign up link */}
          <p className="login-reveal text-center mt-6 text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/signup" className="text-primary hover:text-primary/80 font-semibold transition-colors">
              Create account
            </Link>
          </p>

          {/* Privacy links */}
          <div className="login-reveal mt-6 pt-6 border-t border-border">
            <p className="text-xs text-center text-muted-foreground">
              By signing in, you agree to our{" "}
              <Link href="/policy/terms" className="text-primary hover:text-primary/80 hover:underline">
                Terms
              </Link>
              {" "}and{" "}
              <Link href="/policy/privacy" className="text-primary hover:text-primary/80 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LoadingAnimation width={40} height={40} />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
