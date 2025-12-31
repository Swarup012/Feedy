"use client";

import { useState, useEffect, useRef } from "react";
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
import gsap from "gsap";

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const formRef = useRef(null);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Entrance Animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".login-reveal", {
        y: 20,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
      });
    }, formRef);
    return () => ctx.revert();
  }, []);

  // Check for pending invite token (Original Logic Preserved)
  useEffect(() => {
    const checkInviteToken = () => {
      try {
        const pendingInviteToken = localStorage.getItem('pendingInviteToken');
        if (pendingInviteToken) {
          console.log("🎫 Pending invite token found:", pendingInviteToken);
        }
        console.log("ℹ️ Standard login - users must have invite link to join organizations");
      } catch (error: any) {
        console.error("❌ Error checking invite token:", error);
      }
    };
    checkInviteToken();
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
    if (!validateForm()) return;
    setLoading(true);
    try {
      await login(formData.email, formData.password);
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
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
    <div ref={formRef} className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Visual background texture (Matches Landing Page) */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(#000 1px, transparent 1px)`, backgroundSize: '32px 32px' }}></div>
      </div>
      
      {/* Decorative Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-50/50 rounded-full blur-[120px] -z-10" />

      <div className="w-full max-w-[440px] relative z-10">
        {/* Header/Logo */}
        <div className="text-center mb-10 login-reveal">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110">
              <Logo width={42} height={42} />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900">Faddy</span>
          </Link>
        </div>

        {/* Login Card */}
        <div className="bg-white/80 backdrop-blur-2xl rounded-[32px] p-8 md:p-10 border border-slate-100 shadow-2xl shadow-slate-200/50 login-reveal">
          <div className="mb-10">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-3">
              Welcome back
            </h1>
            <p className="text-slate-500 font-medium">
              Enter your credentials to manage your feedback.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2.5">
              <Label htmlFor="email" className="text-sm font-bold text-slate-700 ml-1">
                Email Address
              </Label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail size={18} />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  className={`h-12 pl-11 rounded-2xl border-slate-200 bg-white/50 text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all duration-200 font-medium ${
                    errors.email ? "border-red-500 focus:ring-red-500/5 focus:border-red-500" : ""
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-xs font-bold text-red-500 flex items-center gap-1.5 ml-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between ml-1">
                <Label htmlFor="password" className="text-sm font-bold text-slate-700">
                  Password
                </Label>
                <Link 
                  href="/forgot-password" 
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold transition-colors"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={18} />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  className={`h-12 pl-11 pr-12 rounded-2xl border-slate-200 bg-white/50 text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all duration-200 font-medium ${
                    errors.password ? "border-red-500 focus:ring-red-500/5 focus:border-red-500" : ""
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
                <p className="text-xs font-bold text-red-500 flex items-center gap-1.5 ml-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-13 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-200 hover:shadow-xl hover:shadow-blue-300 hover:-translate-y-0.5 transition-all duration-300 group"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-3">
                  <LoadingAnimation width={20} height={20} />
                  <span>Verifying...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <span>Sign in</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-10 login-reveal">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-black text-slate-400">
              <span className="px-4 bg-white">Or continue with</span>
            </div>
          </div>

          {/* Social Sign Up Link */}
          <div className="text-center login-reveal">
            <p className="text-slate-500 font-medium">
              New to Faddy?{" "}
              <Link 
                href="/signup" 
                className="text-blue-600 font-bold hover:text-blue-700 transition-colors underline underline-offset-4"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-10 flex justify-center gap-6 login-reveal">
          <Link href="#" className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors">Privacy</Link>
          <Link href="#" className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors">Terms</Link>
          <Link href="#" className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest transition-colors">Help</Link>
        </div>
      </div>
    </div>
  );
}