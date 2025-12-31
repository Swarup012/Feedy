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
import { Eye, EyeOff, User, Mail, Lock, ArrowRight, Sparkles } from "lucide-react";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import gsap from "gsap";

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const { toast } = useToast();
  const containerRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Entrance Animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".signup-reveal", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
      });
    }, containerRef);
    return () => ctx.revert();
  }, []);

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
      newErrors.password = "Needs uppercase, lowercase, and a number";
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
      const { emailConfirmationRequired } = await signup(
        formData.name,
        formData.email,
        formData.password
      );

      if (emailConfirmationRequired) {
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
        setTimeout(() => router.push("/login"), 2000);
      } else {
        router.push("/onboarding");
      }
    } catch (error: any) {
      if (error.message?.includes('already registered')) {
        toast({
          title: "Account Exists",
          description: "Redirecting to login...",
          variant: "destructive",
        });
        setTimeout(() => router.push('/login'), 2000);
      } else {
        toast({
          title: "Signup failed",
          description: error.message || "Something went wrong.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(#000 1px, transparent 1px)`, backgroundSize: '32px 32px' }}></div>
      </div>
      
      {/* Soft Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-50/60 rounded-full blur-[120px] -z-10" />

      <div className="w-full max-w-[480px] relative z-10">
        {/* Logo */}
        <div className="text-center mb-8 signup-reveal">
          <Link href="/" className="inline-flex items-center gap-3 group">
            <div className="transition-transform duration-500 group-hover:rotate-12">
              <Logo width={40} height={40} />
            </div>
            <span className="text-2xl font-black tracking-tighter text-slate-900">Faddy</span>
          </Link>
        </div>

        {/* Signup Card */}
        <div className="bg-white/70 backdrop-blur-2xl rounded-[32px] p-8 md:p-12 border border-slate-100 shadow-2xl shadow-slate-200/50 signup-reveal">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
               <Sparkles className="w-4 h-4 text-blue-600" />
               <span className="text-xs font-black uppercase tracking-widest text-blue-600">Free forever for small teams</span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Create your account
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name Field */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-bold text-slate-700 ml-1">Full Name</Label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <User size={18} />
                </div>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  className={`h-12 pl-11 rounded-2xl border-slate-200 bg-white/50 text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all ${
                    errors.name ? "border-red-500" : ""
                  }`}
                />
              </div>
              {errors.name && <p className="text-xs font-bold text-red-500 ml-1">{errors.name}</p>}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-bold text-slate-700 ml-1">Work Email</Label>
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
                  className={`h-12 pl-11 rounded-2xl border-slate-200 bg-white/50 text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all ${
                    errors.email ? "border-red-500" : ""
                  }`}
                />
              </div>
              {errors.email && <p className="text-xs font-bold text-red-500 ml-1">{errors.email}</p>}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-bold text-slate-700 ml-1">Password</Label>
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
                  className={`h-12 pl-11 pr-12 rounded-2xl border-slate-200 bg-white/50 text-slate-900 placeholder:text-slate-400 focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 transition-all ${
                    errors.password ? "border-red-500" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password ? (
                 <p className="text-xs font-bold text-red-500 ml-1">{errors.password}</p>
              ) : (
                <p className="text-[10px] uppercase tracking-wider font-black text-slate-400 ml-1">
                  8+ chars • Uppercase • Number
                </p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 mt-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-100 transition-all group"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <LoadingAnimation width={18} height={18} />
                  <span>Creating...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-50 text-center signup-reveal">
            <p className="text-slate-500 font-medium">
              Already have an account?{" "}
              <Link href="/login" className="text-blue-600 font-bold hover:underline underline-offset-4">
                Log in
              </Link>
            </p>
          </div>
        </div>

        {/* Legal Footer */}
        <p className="mt-8 text-center text-[11px] text-slate-400 font-bold uppercase tracking-widest signup-reveal">
          By signing up, you agree to our{" "}
          <Link href="#" className="text-slate-600 hover:text-blue-600">Terms</Link>
          {" "}&{" "}
          <Link href="#" className="text-slate-600 hover:text-blue-600">Privacy</Link>
        </p>
      </div>
    </div>
  );
}