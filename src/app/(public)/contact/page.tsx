"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { LandingFooter } from "@/components/ui/landing-footer";
import api from "@/lib/api";

type SubjectType = "Feature Request" | "Bug Report" | "Billing" | "Other";

export default function ContactPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

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
    ? "We're here to help! Submit your support request and we'll get back to you as soon as possible."
    : "Have a question or feedback? We'd love to hear from you. Fill out the form below and we'll be in touch.";

  // Handle form field changes
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Client-side validation
  const validateForm = (): boolean => {
    // Honeypot check
    if (formData.honeypot) {
      toast({
        title: "Error",
        description: "Invalid submission detected.",
        variant: "destructive",
      });
      return false;
    }

    // Email validation
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return false;
    }

    // Subject validation
    if (!formData.subject) {
      toast({
        title: "Subject Required",
        description: "Please select a subject for your message.",
        variant: "destructive",
      });
      return false;
    }

    // Message validation
    if (formData.message.trim().length < 10) {
      toast({
        title: "Message Too Short",
        description: "Please provide more details (at least 10 characters).",
        variant: "destructive",
      });
      return false;
    }

    if (formData.message.trim().length > 5000) {
      toast({
        title: "Message Too Long",
        description: "Please keep your message under 5000 characters.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

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
        toast({
          title: "Message Sent!",
          description: response.data.message || "We'll get back to you soon.",
        });
      }
    } catch (error: any) {
      console.error("Contact form error:", error);
      toast({
        title: "Submission Failed",
        description:
          error.response?.data?.message ||
          "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success state - Thank You message
  if (isSubmitted) {
    return (
      <>
        <div className="min-h-screen bg-slate-50 dark:bg-background">
          <div className="relative max-w-3xl mx-auto px-4 py-12">
            <Card className="border border-slate-200 dark:border-border shadow-xl">
              <CardContent className="relative pt-10 pb-10 text-center">
                {/* Success Icon */}
                <div className="flex justify-center mb-5">
                  <div className="relative">
                    <div className="p-4 rounded-full bg-green-600 shadow-lg">
                      <CheckCircle2
                        className="h-12 w-12 text-white"
                        strokeWidth={2.5}
                      />
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-switzer font-medium text-slate-900 dark:text-white mb-4">
                  Message Sent Successfully!
                </h2>

                <p className="text-base text-slate-700 dark:text-slate-300 mb-3 font-medium">
                  Thank you for reaching out to us.
                </p>

                <p className="text-base text-slate-600 dark:text-slate-400 mb-6 max-w-xl mx-auto leading-relaxed">
                  {user
                    ? "Our support team will review your request and respond to you via email within 24-48 hours."
                    : "We'll get back to you at the email address you provided within 24-48 hours."}
                </p>

                {/* Info Cards */}
                <div className="grid sm:grid-cols-2 gap-4 mb-6 max-w-2xl mx-auto">
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/50">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Response Time
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      24-48 hours
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200/50 dark:border-green-800/50">
                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Secure Delivery
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      Message encrypted
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-2 hover:border-blue-600 dark:hover:border-blue-500"
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
                    className="bg-blue-600 hover:bg-blue-700 shadow-lg"
                    onClick={() =>
                      (window.location.href = user ? "/admin" : "/")
                    }
                  >
                    {user ? "Back to Dashboard" : "Back to Home"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  // Main contact form
  return (
    <>
      <div className="min-h-screen bg-slate-50 dark:bg-background">
        <div className="relative max-w-5xl mx-auto px-4 py-10 lg:py-12">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl lg:text-4xl font-switzer font-medium text-slate-900 dark:text-white mb-5 tracking-tight">
              {formType}
            </h1>

            <p className="text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              {formDescription}
            </p>

            {user && (
              <div className="mt-6 inline-flex items-center gap-2.5 px-5 py-3 bg-blue-50 dark:bg-blue-950/30 rounded-full border border-blue-200 dark:border-blue-800 shadow-sm">
                <div className="p-1 rounded-full bg-green-500">
                  <CheckCircle2
                    className="h-3 w-3 text-white"
                    strokeWidth={3}
                  />
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Logged in as {user.email}
                </span>
              </div>
            )}
          </div>

          {/* Contact Form Card */}
          <Card className="border border-slate-200 dark:border-border shadow-xl">
            <CardHeader className="relative border-b border-slate-200 dark:border-border bg-slate-50 dark:bg-gray-800/50 pb-5">
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <CardTitle className="text-xl font-switzer font-medium tracking-tight mb-2 text-slate-900 dark:text-white">
                    Send Us a Message
                  </CardTitle>
                  <CardDescription className="text-base">
                    All fields are required. We typically respond within 24-48
                    hours.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="relative pt-5">
              <form onSubmit={handleSubmit} className="space-y-7">
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
                <div className="space-y-3">
                  <Label
                    htmlFor="email"
                    className="text-base font-switzer font-medium flex items-center gap-2 text-slate-900 dark:text-white"
                  >
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
                    className="text-base h-12 border-2 focus:border-blue-500 dark:focus:border-blue-400"
                  />
                  {user && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      Email auto-filled from your account
                    </p>
                  )}
                </div>

                {/* Subject Dropdown */}
                <div className="space-y-3">
                  <Label
                    htmlFor="subject"
                    className="text-base font-switzer font-medium text-slate-900 dark:text-white"
                  >
                    Subject
                  </Label>
                  <Select
                    value={formData.subject}
                    onValueChange={(value) => handleChange("subject", value)}
                    required
                  >
                    <SelectTrigger className="text-base h-12 border-2 focus:border-blue-500 dark:focus:border-blue-400">
                      <SelectValue placeholder="Select a subject..." />
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
                </div>

                {/* Message Textarea */}
                <div className="space-y-3">
                  <Label
                    htmlFor="message"
                    className="text-base font-switzer font-medium text-slate-900 dark:text-white"
                  >
                    Message
                  </Label>
                  <Textarea
                    id="message"
                    placeholder="Please provide as much detail as possible..."
                    value={formData.message}
                    onChange={(e) => handleChange("message", e.target.value)}
                    required
                    rows={8}
                    className="text-base resize-none border-2 focus:border-blue-500 dark:focus:border-blue-400"
                    maxLength={5000}
                  />
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500 dark:text-slate-400">
                      Minimum 10 characters
                    </span>
                    <span
                      className={`font-semibold ${formData.message.length < 10 ? "text-amber-600" : formData.message.length > 4500 ? "text-red-600" : "text-slate-600 dark:text-slate-400"}`}
                    >
                      {formData.message.length}/5000
                    </span>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-6">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full text-lg py-7 bg-blue-600 hover:bg-blue-700 shadow-xl hover:shadow-2xl transition-all duration-300 font-switzer font-medium"
                    size="lg"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message
                      </>
                    )}
                  </Button>
                </div>

                {/* Additional Info */}
                <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex items-center justify-center text-sm text-slate-600 dark:text-slate-400">
                    <p>
                      {user
                        ? "Your message will be associated with your account for faster support."
                        : "Your information is secure and will never be shared."}
                    </p>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Alternative Contact Methods - Enhanced */}
          <div className="mt-8">
            <div className="text-center mb-5">
              <h2 className="text-xl font-switzer font-medium text-slate-900 dark:text-white mb-2">
                Other Ways to Reach Us
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Choose the method that works best for you
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="group text-center p-5 hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-300 dark:hover:border-blue-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <h3 className="font-switzer font-medium text-lg mb-2 text-slate-900 dark:text-white">
                  Email Us
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-3">
                  Get a response within 24 hours
                </p>
                <a
                  href="mailto:support@faddy.com"
                  className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  support@faddy.com
                </a>
              </Card>

              <Card className="group text-center p-5 hover:shadow-2xl transition-all duration-300 border-2 hover:border-green-300 dark:hover:border-green-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <h3 className="font-switzer font-medium text-lg mb-2 text-slate-900 dark:text-white">
                  WhatsApp
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-3">
                  Chat with our team ,Mon-Fri, 9am-5pm EST
                </p>
                <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                  +91 8240635683
                </p>
              </Card>

              <Card className="group text-center p-5 hover:shadow-2xl transition-all duration-300 border-2 hover:border-purple-300 dark:hover:border-purple-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
                <h3 className="font-switzer font-medium text-lg mb-2 text-slate-900 dark:text-white">
                  Help Center
                </h3>
                <p className="text-slate-600 dark:text-slate-400 mb-3">
                  Available 24/7
                </p>
                <p className="text-sm font-semibold text-purple-600 dark:text-purple-400">
                  <a
                    href="https://whatsapp.com/channel/0029VaBW4gzHltYELmDUZ13T"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Click to join the Channel
                  </a>
                </p>
              </Card>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center px-6 py-3 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Average response time: 6 hours
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
