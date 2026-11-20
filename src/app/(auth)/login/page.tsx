"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, Lock, Mail, Loader2 } from "lucide-react";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import "../auth.css";

function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    if (formError) setFormError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setFormError("");
    try {
      await login(formData.email.trim(), formData.password);
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
      setFormError(description);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <aside className="auth__brand" aria-label="About Faddy">
        <Link href="/" className="auth__lockup">
          <span className="auth__lockup-tile" aria-hidden="true">
            <Logo width={14} height={20} />
          </span>
          <span className="auth__lockup-name">Faddy</span>
        </Link>

        <div className="auth__brand-body">
          <p className="auth__brand-title">Close the loop on what your users ask for.</p>
          <p className="auth__brand-lede">
            One place to collect requests, find the signal with AI, and show people what shipped.
          </p>
          <ol className="auth__loop">
            <li>
              <span className="auth__loop-num">01</span>
              <span className="auth__loop-copy">
                <span className="auth__loop-title">Collect</span>
                <span className="auth__loop-text">Capture feedback everywhere your customers talk, from the widget and public boards to Slack, Intercom and more.</span>
              </span>
            </li>
            <li>
              <span className="auth__loop-num">02</span>
              <span className="auth__loop-copy">
                <span className="auth__loop-title">Cluster</span>
                <span className="auth__loop-text">Smartflow groups requests by theme.</span>
              </span>
            </li>
            <li>
              <span className="auth__loop-num">03</span>
              <span className="auth__loop-copy">
                <span className="auth__loop-title">Close</span>
                <span className="auth__loop-text">Ship it on the roadmap and changelog.</span>
              </span>
            </li>
          </ol>
        </div>

        <p className="auth__brand-foot">Built for small SaaS teams.</p>
      </aside>

      <main className="auth__pane">
        <div className="auth__column">
          <Link href="/" className="auth__mobile-mark" aria-label="Faddy home">
            <Logo width={26} height={26} />
            <span>Faddy</span>
          </Link>

          <header className="auth__head">
            <h1 className="auth__title">Sign in to your account</h1>
            <p className="auth__lede">Enter your credentials to access your dashboard.</p>
          </header>

          <form onSubmit={handleSubmit} className="auth__form" noValidate>
            <div aria-live="polite" className="sr-only">
              {Object.values(errors).filter(Boolean).length > 0 && (
                <span>{Object.values(errors).filter(Boolean).join(". ")}</span>
              )}
            </div>

            <div className="auth__sso">
              <GoogleAuthButton mode="login" />
              <div className="auth__divider">
                <span>Or continue with email</span>
              </div>
            </div>

            <div className="auth__field">
              <Label htmlFor="email" className="auth__label">
                Email address
              </Label>
              <div className="auth__control">
                <Mail className="auth__icon" size={18} aria-hidden="true" />
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
                  className="auth__input"
                />
              </div>
              {errors.email && (
                <p id="email-error" className="auth__error">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="auth__field">
              <div className="auth__label-row">
                <Label htmlFor="password" className="auth__label">
                  Password
                </Label>
                <Link href="/forgot-password" className="auth__forgot">
                  Forgot password?
                </Link>
              </div>
              <div className="auth__control">
                <Lock className="auth__icon" size={18} aria-hidden="true" />
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
                  className="auth__input auth__input--reveal"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="auth__reveal"
                >
                  {showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="auth__error">
                  {errors.password}
                </p>
              )}
            </div>

            {formError && (
              <div className="auth__alert" role="alert">
                <p>{formError}</p>
              </div>
            )}

            <Button type="submit" disabled={loading} className="auth__submit" aria-busy={loading}>
              {loading ? (
                <Loader2 className="auth__spinner" size={18} aria-hidden="true" />
              ) : (
                "Sign in"
              )}
            </Button>
          </form>

          <p className="auth__switch">
            Don’t have an account? <Link href="/signup">Create account</Link>
          </p>

          <div className="auth__legal">
            <p>
              By signing in, you agree to our{" "}
              <Link href="/policy/terms">Terms</Link>
              {" "}and{" "}
              <Link href="/policy/privacy">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="auth__pane">
        <Loader2 className="auth__spinner" size={32} aria-hidden="true" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
