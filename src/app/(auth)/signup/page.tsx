
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
import { Eye, EyeOff, User, Mail, Lock, ArrowRight } from "lucide-react";
import { LoadingAnimation } from "@/components/LoadingAnimation";
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
    <div
      ref={containerRef}
      className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
      style={{
        background:
          "radial-gradient(1200px 600px at 50% -10%, rgba(79,124,255,0.14), transparent 60%), var(--bg)",
      }}
    >
      {/* Subtle noise */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="w-full max-w-[420px] relative z-10">
        {/* Logo */}
        <div className="signup-reveal text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <Logo width={40} height={40} />
            <span className="text-xl font-semibold tracking-tight">
              Faddy
            </span>
          </Link>
        </div>

        {/* Card */}
        <div
          className="signup-reveal rounded-2xl p-8 border shadow-2xl"
          style={{
            background: "var(--panel)",
            borderColor: "var(--panel-border)",
            backdropFilter: "blur(18px)",
          }}
        >
          <h1 className="text-2xl font-semibold tracking-tight">
            Create your account.
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Start collecting feedback in minutes.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* Name */}
            <div>
              <Label className="text-xs uppercase tracking-wide text-[var(--muted)]">
                Full name
              </Label>
              <div className="relative mt-2">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
                <Input
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Jane Doe"
                  className="pl-10 h-11 bg-transparent border border-white/10 
                  text-[var(--ink)] placeholder:text-[var(--muted)]
                  focus:border-[var(--accent)] focus:ring-0 rounded-xl"
                />
              </div>
              {errors.name && (
                <p className="text-xs mt-1 text-[var(--danger)]">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <Label className="text-xs uppercase tracking-wide text-[var(--muted)]">
                Email
              </Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="you@company.com"
                  className="pl-10 h-11 bg-transparent border border-white/10 
                  text-[var(--ink)] placeholder:text-[var(--muted)]
                  focus:border-[var(--accent)] focus:ring-0 rounded-xl"
                />
              </div>
              {errors.email && (
                <p className="text-xs mt-1 text-[var(--danger)]">
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <Label className="text-xs uppercase tracking-wide text-[var(--muted)]">
                Password
              </Label>
              <div className="relative mt-2">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="••••••••"
                  className="pl-10 pr-12 h-11 bg-transparent border border-white/10 
                  text-[var(--ink)] placeholder:text-[var(--muted)]
                  focus:border-[var(--accent)] focus:ring-0 rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--muted)] hover:text-white"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password ? (
                <p className="text-xs mt-1 text-[var(--danger)]">
                  {errors.password}
                </p>
              ) : (
                <p className="text-[11px] mt-1 text-[var(--muted)]">
                  8+ characters • uppercase • number
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-xl bg-[var(--accent)] 
              hover:bg-[#3f6ae0] transition-all duration-300"
            >
              {loading ? (
                <LoadingAnimation width={18} height={18} />
              ) : (
                <span className="flex items-center gap-2">
                  Create account <ArrowRight size={16} />
                </span>
              )}
            </Button>
          </form>

          <p className="text-sm text-center mt-8 text-[var(--muted)]">
            Already have an account?{" "}
            <Link href="/login" className="text-[var(--accent)] hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-8 text-center text-[11px] text-[var(--muted)] uppercase tracking-widest signup-reveal">
          By signing up, you agree to our Terms & Privacy
        </p>
      </div>
    </div>
  );
}
