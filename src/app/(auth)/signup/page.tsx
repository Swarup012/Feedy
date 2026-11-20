"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/logo";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, User, Mail, Lock, Loader2 } from "lucide-react";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { getPublicReturnUrl, clearReturnUrl } from "@/lib/returnUrl";
import { TokenManager } from "@/lib/tokenManager";
import { supabase } from "@/lib/supabase";
import "../auth.css";

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
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!formData.name.trim()) e.name = "Name is required";
    if (!formData.email.trim()) e.email = "Email is required";
    if (!formData.password) {
      e.password = "Password is required";
    } else if (
      formData.password.length < 8 ||
      !/[A-Z]/.test(formData.password) ||
      !/[0-9]/.test(formData.password)
    ) {
      e.password = "Use 8+ characters, including an uppercase letter and a number.";
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

    // SECURITY: Purge any lingering session from a prior user before creating
    // a new account. Without this, stale Supabase sessions and localStorage
    // tokens from a previous login persist — allowing identity cross-contamination.
    TokenManager.clearTokens();
    try {
      await supabase.auth.signOut();
    } catch {
      // Non-fatal — the backend will overwrite cookies on successful signup.
    }

    setLoading(true);
    setFormError("");
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
      setFormError(error.message || "Something went wrong.");
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
            <h1 className="auth__title">Create your account</h1>
            <p className="auth__lede">Start collecting feedback in minutes.</p>
          </header>

          <form onSubmit={handleSubmit} className="auth__form" noValidate>
            <div aria-live="polite" className="sr-only">
              {Object.values(errors).filter(Boolean).length > 0 && (
                <span>{Object.values(errors).filter(Boolean).join(". ")}</span>
              )}
            </div>

            <div className="auth__sso">
              <GoogleAuthButton mode="signup" />
              <div className="auth__divider">
                <span>Or continue with email</span>
              </div>
            </div>

            <div className="auth__field">
              <Label htmlFor="name" className="auth__label">
                Full name
              </Label>
              <div className="auth__control">
                <User className="auth__icon" size={18} aria-hidden="true" />
                <Input
                  id="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="Your name"
                  autoComplete="name"
                  required
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  className="auth__input"
                />
              </div>
              {errors.name && (
                <p id="name-error" className="auth__error">{errors.name}</p>
              )}
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
                <p id="email-error" className="auth__error">{errors.email}</p>
              )}
            </div>

            <div className="auth__field">
              <Label htmlFor="password" className="auth__label">
                Password
              </Label>
              <div className="auth__control">
                <Lock className="auth__icon" size={18} aria-hidden="true" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  maxLength={128}
                  required
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? "password-error" : "password-hint"}
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
              {errors.password ? (
                <p id="password-error" className="auth__error">{errors.password}</p>
              ) : (
                <p id="password-hint" className="auth__hint">
                  8+ characters, including an uppercase letter and a number.
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
                "Create account"
              )}
            </Button>
          </form>

          <p className="auth__switch">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>

          <div className="auth__legal">
            <p>
              By signing up, you agree to our{" "}
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
