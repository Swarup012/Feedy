
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
  const formRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Entrance animation
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".login-reveal", {
        y: 12,
        opacity: 0,
        scale: 0.98,
        duration: 0.8,
        stagger: 0.08,
        ease: "power3.out",
      });
    }, formRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    try {
      const token = localStorage.getItem("pendingInviteToken");
      if (token) console.log("🎫 Pending invite token:", token);
    } catch {}
  }, [searchParams]);

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!formData.email) e.email = "Email is required";
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
      await login(formData.email, formData.password);
      toast({ title: "Welcome back" });
    } catch (err: any) {
      toast({
        title: "Login failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      ref={formRef}
      className="min-h-screen flex items-center justify-center px-6 relative overflow-hidden"
      style={{
        background:
          "radial-gradient(1200px 600px at 50% -10%, rgba(79,124,255,0.14), transparent 60%), var(--bg)",
      }}
    >
      {/* Subtle noise */}
      <div className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255,255,255,0.4) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="w-full max-w-[420px] relative z-10">
        {/* Logo */}
        <div className="login-reveal text-center mb-10">
          <Link href="/" className="inline-flex items-center gap-3">
            <Logo width={40} height={40} />
            <span className="text-xl font-semibold tracking-tight">
              Faddy
            </span>
          </Link>
        </div>

        {/* Card */}
        <div
          className="login-reveal rounded-2xl p-8 border shadow-2xl"
          style={{
            background: "var(--panel)",
            borderColor: "var(--panel-border)",
            backdropFilter: "blur(18px)",
          }}
        >
          <h1 className="text-2xl font-semibold tracking-tight">
            Welcome back.
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Continue managing your feedback.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* Email */}
            <div>
              <Label className="text-xs uppercase tracking-wide text-[var(--muted)]">
                Email
              </Label>
              <div className="relative mt-2">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={16} />
                <Input
                  id="email"
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
              {errors.password && (
                <p className="text-xs mt-1 text-[var(--danger)]">
                  {errors.password}
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
                  Sign in <ArrowRight size={16} />
                </span>
              )}
            </Button>
          </form>

          <p className="text-sm text-center mt-8 text-[var(--muted)]">
            New here?{" "}
            <Link href="/signup" className="text-[var(--accent)] hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
