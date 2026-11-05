"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  Loader2,
} from "lucide-react";
import api from "@/lib/api";

type SubjectType = "Feature Request" | "Bug Report" | "Billing" | "Other";

export default function ContactPage() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    subject: "" as SubjectType | "",
    message: "",
    honeypot: "", // Anti-spam hidden field
  });

  // Auto-fill email if user is authenticated
  useEffect(() => {
    if (user?.email) {
      setFormData((prev) => ({ ...prev, email: user.email || "" }));
    }
  }, [user]);

  // Determine form type based on authentication
  const formType = user ? "Support Request" : "General Inquiry";
  const formDescription = user
    ? "We’re here to help! Submit your support request and we’ll get back to you as soon as possible."
    : "Have a question or feedback? We’d love to hear from you. Fill out the form below and we’ll be in touch.";

  // Handle form field changes
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  // Client-side validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Honeypot check
    if (formData.honeypot) {
      errors.honeypot = "Invalid submission detected.";
      return false;
    }

    // Email validation
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      errors.email = "Please enter a valid email address.";
    }

    // Subject validation
    if (!formData.subject) {
      errors.subject = "Please select a subject for your message.";
    }

    // Message validation
    if (formData.message.trim().length < 10) {
      errors.message = "Please provide more details (at least 10 characters).";
    } else if (formData.message.trim().length > 5000) {
      errors.message = "Please keep your message under 5000 characters.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await api.post("/api/contact", {
        email: formData.email.toLowerCase().trim(),
        subject: formData.subject,
        message: formData.message.trim(),
        honeypot: formData.honeypot,
        userAgent: navigator.userAgent,
      });

      if (response.data.success) {
        setIsSubmitted(true);
      }
    } catch (error: any) {
      console.error("Contact form error:", error);
      setSubmitError(
        error.response?.data?.message ||
          "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state - Thank You message
  if (isSubmitted) {
    return (
      <div className="bg-background text-foreground">
        <div className="container max-w-3xl py-12">
          <div className="rounded-lg border border-border bg-card p-8 text-center sm:p-10">
            {/* Success Icon */}
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-success/15">
              <CheckCircle2
                className="h-7 w-7 text-success"
                strokeWidth={2}
              />
            </div>

            <h2 className="font-headline text-2xl font-semibold tracking-tight text-foreground">
              Message sent successfully
            </h2>

            <p className="mt-3 text-base font-medium text-foreground">
              Thank you for reaching out to us.
            </p>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
              {user
                ? "Our support team will review your request and respond to you via email within 24-48 hours."
                : "We’ll get back to you at the email address you provided within 24-48 hours."}
            </p>

            {/* Info — hairline surfaces, not cards */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-md border border-border bg-secondary/50 p-4 text-left">
                <p className="text-sm font-medium text-foreground">
                  Response Time
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  24-48 hours
                </p>
              </div>
              <div className="rounded-md border border-border bg-secondary/50 p-4 text-left">
                <p className="text-sm font-medium text-foreground">
                  Secure Delivery
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Message encrypted
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({
                    email: user?.email || "",
                    subject: "",
                    message: "",
                    honeypot: "",
                  });
                }}
              >
                Send Another Message
              </Button>

              <Button
                size="lg"
                onClick={() =>
                  (window.location.href = user ? "/admin" : "/")
                }
              >
                {user ? "Back to Dashboard" : "Back to Home"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main contact form
  return (
    <div className="bg-background text-foreground">
      <div className="container max-w-5xl py-12">
        <div className="grid gap-10 lg:grid-cols-12">
          {/* Main — the form */}
          <div className="lg:col-span-7">
            <div className="rounded-lg border border-border bg-card p-6 sm:p-8">
              <h2 className="font-headline text-xl font-semibold tracking-tight text-foreground">
                Send Us a Message
              </h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                All fields are required. We typically respond within 24-48
                hours.
              </p>

              <form onSubmit={handleSubmit} className="mt-6 space-y-5">
                {/* Honeypot - Hidden field for spam protection */}
                <input
                  type="text"
                  name="honeypot"
                  value={formData.honeypot}
                  onChange={(e) => handleChange("honeypot", e.target.value)}
                  style={{ display: "none" }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@company.com"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    disabled={!!user}
                    required
                    className={formErrors.email ? "border-destructive" : undefined}
                  />
                  {formErrors.email && (
                    <p className="text-sm text-destructive">{formErrors.email}</p>
                  )}
                  {user && !formErrors.email && (
                    <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                      Email auto-filled from your account
                    </p>
                  )}
                </div>

                {/* Subject Dropdown */}
                <div className="space-y-2">
                  <Label
                    htmlFor="subject"
                    className="text-sm font-medium"
                  >
                    Subject
                  </Label>
                  <Select
                    value={formData.subject}
                    onValueChange={(value) => handleChange("subject", value)}
                    required
                  >
                    <SelectTrigger
                      className={formErrors.subject ? "border-destructive" : undefined}
                    >
                      <SelectValue placeholder="Select a subject…" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Feature Request">
                        Feature Request
                      </SelectItem>
                      <SelectItem value="Bug Report">
                        Bug Report
                      </SelectItem>
                      <SelectItem value="Billing">
                        Billing
                      </SelectItem>
                      <SelectItem value="Other">
                        Other
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {formErrors.subject && (
                    <p className="text-sm text-destructive">{formErrors.subject}</p>
                  )}
                </div>

                {/* Message Textarea */}
                <div className="space-y-2">
                  <Label
                    htmlFor="message"
                    className="text-sm font-medium"
                  >
                    Message
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Please provide as much detail as possible…"
                    value={formData.message}
                    onChange={(e) => handleChange("message", e.target.value)}
                    required
                    rows={8}
                    className={`resize-none ${formErrors.message ? "border-destructive" : ""}`}
                    maxLength={5000}
                  />
                  {formErrors.message && (
                    <p className="text-sm text-destructive">{formErrors.message}</p>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Minimum 10 characters
                    </span>
                    <span
                      className={`tabular-nums ${formData.message.length > 4500 ? "text-destructive" : "text-muted-foreground"}`}
                    >
                      {formData.message.length}/5000
                    </span>
                  </div>
                </div>

                {/* Submit Error Banner */}
                {submitError && (
                  <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3">
                    <p className="text-sm font-medium text-destructive">{submitError}</p>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full focus-visible:ring-2 focus-visible:ring-offset-2"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />
                      Sending…
                    </>
                  ) : (
                    <>
                      Send Message
                    </>
                  )}
                </Button>

                {/* Additional Info */}
                <p className="border-t border-border pt-4 text-center text-sm text-muted-foreground">
                  {user
                    ? "Your message will be associated with your account for faster support."
                    : "Your information is secure and will never be shared."}
                </p>
              </form>
            </div>
          </div>

          {/* Aside — reassurance and other channels */}
          <aside className="lg:col-span-5">
            <h1 className="font-headline text-2xl font-semibold tracking-tight text-foreground lg:text-3xl">
              {formType}
            </h1>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              {formDescription}
            </p>

            {user && (
              <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3.5 py-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" strokeWidth={2.5} />
                <span className="text-sm font-medium text-foreground">
                  Logged in as {user.email}
                </span>
              </div>
            )}

            <div className="mt-10">
              <h2 className="font-headline text-lg font-semibold tracking-tight text-foreground">
                Other Ways to Reach Us
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose the method that works best for you
              </p>

              <div className="mt-5">
                <div className="border-t border-border py-5 first:pt-0">
                  <h3 className="text-sm font-medium text-foreground">
                    Email Us
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Get a response within 24 hours
                  </p>
                  <a
                    href="mailto:support@faddy.com"
                    className="mt-1.5 inline-block text-sm font-medium text-primary underline-offset-2 transition-colors hover:underline"
                  >
                    support@faddy.com
                  </a>
                </div>

                <div className="border-t border-border py-5 first:pt-0">
                  <h3 className="text-sm font-medium text-foreground">
                    WhatsApp
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Chat with our team, Mon-Fri, 9am-5pm EST
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-foreground">
                    +91 8240635683
                  </p>
                </div>

                <div className="border-t border-border py-5 first:pt-0">
                  <h3 className="text-sm font-medium text-foreground">
                    Help Center
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Available 24/7
                  </p>
                  <a
                    href="https://whatsapp.com/channel/0029VaBW4gzHltYELmDUZ13T"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-block text-sm font-medium text-primary underline-offset-2 transition-colors hover:underline"
                  >
                    Click to join the Channel
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-md border border-border bg-secondary/50 px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Average response time:{" "}
                <span className="font-medium text-foreground">6 hours</span>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
