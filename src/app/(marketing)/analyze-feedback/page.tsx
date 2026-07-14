"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  BarChart3,
  Filter,
  TrendingUp,
  Users,
  Target,
  MessageSquare,
  CheckCircle2,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { ThemeToggleDebug } from "@/components/theme-toggle-debug";
import { LandingFooter } from "@/components/ui/landing-footer";
import { Logo } from "@/components/logo";

export default function AnalyzeFeedbackPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  // Navbar Actions Component
  const NavbarActions = ({ visible }: { visible?: boolean }) => (
    <div className="flex items-center gap-3">
      <ThemeToggleDebug />
      {!visible && (
        <NavbarButton variant="secondary" onClick={() => router.push("/login")}>
          Login
        </NavbarButton>
      )}
      <NavbarButton variant="primary" onClick={() => router.push("/signup")}>
        Sign Up
      </NavbarButton>
    </div>
  );

  const navItems = [
    {
      name: "Product",
      link: "/feedback",
      dropdown: [
        {
          section: "Features",
          items: [
            { name: "Collect Feedback", link: "/collect-feedback" },
            { name: "Analyze Feedback", link: "/analyze-feedback" },
            { name: "Share Updates", link: "/share-updates" },
          ]
        },
        {
          section: "Use Cases",
          items: [
            { name: "Feature Request Management", link: "/collect-feedback" },
            { name: "Role-Based Access Control", link: "/role-based-access" },
            { name: "Public Roadmap", link: "/public-roadmap" },
          ]
        },
        {
          section: "Resources",
          items: [
            { name: "Blog", link: "/blog" },
          ]
        }
      ],
    },
    {
      name: "Documentation",
      link: "/docs",
    },
    {
      name: "Pricing",
      link: "/pricing",
    },
    {
      name: "Contact",
      link: "/contact",
    },
  ];

  return (
    <>
      {/* Navbar */}

      <div className="min-h-screen bg-[#f9f9f9] dark:bg-background">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden bg-white dark:bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl lg:text-4xl font-switzer font-medium text-slate-900 dark:text-white mb-6 tracking-tight">
              Analyze Feedback, Make Better Decisions
            </h1>
            <p className="text-xl font-switzer text-slate-600 dark:text-gray-400 mb-8 leading-relaxed">
              Turn user feedback into actionable insights. Filter, prioritize,
              and understand what your users really want.
            </p>

            {/* CTA Button */}
            <div className="flex justify-center mb-8">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                >
                  Start Analyzing
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Trust Signals */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center text-sm text-slate-600 dark:text-gray-400">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Instant insights</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Smart filtering</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Real-time updates</span>
              </div>
            </div>
          </div>
        </section>

        {/* Faddy helps you cut through the noise */}
        <section className="py-20 bg-[#f9f9f9] dark:bg-gray-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-switzer font-bold text-slate-900 dark:text-white mb-4">
                Faddy helps you cut through the noise
              </h2>
              <p className="text-xl text-slate-600 dark:text-gray-400 max-w-3xl mx-auto">
                Powerful analysis tools to understand what matters most
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Feature 1 */}
              <Card className="border-slate-200 dark:border-border shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-switzer font-medium text-slate-900 dark:text-white mb-3">
                    Smart Filters
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400">
                    Filter by category, status, votes, date, and more to find
                    exactly what you need
                  </p>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="border-slate-200 dark:border-border shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-switzer font-medium text-slate-900 dark:text-white mb-3">
                    Vote Tracking
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400">
                    See which features have the most demand and prioritize based
                    on user votes
                  </p>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="border-slate-200 dark:border-border shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-switzer font-medium text-slate-900 dark:text-white mb-3">
                    Insights Dashboard
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400">
                    Get a bird's-eye view of feedback trends and patterns at a
                    glance
                  </p>
                </CardContent>
              </Card>

              {/* Feature 4 */}
              <Card className="border-slate-200 dark:border-border shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-switzer font-medium text-slate-900 dark:text-white mb-3">
                    Prioritization
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400">
                    Tag and organize feedback to align with your product roadmap
                    and goals
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Analytics Views Section - Basic vs Expert */}
        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-switzer font-medium text-foreground mb-4">
                Two Powerful Ways to Analyze Your Feedback
              </h2>
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                Simple metrics or advanced insights? Choose the view that fits your needs and switch anytime.
              </p>
            </div>

            <div className="space-y-16">
              {/* Basic View - Image Left, Content Right */}
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Image */}
                <div className="rounded-lg border shadow-lg overflow-hidden bg-card">
                  <Image
                    src="/images/analytics_basic.png"
                    alt="Analytics Basic View"
                    width={800}
                    height={600}
                    className="w-full h-auto"
                  />
                </div>
                {/* Content */}
                <div className="space-y-4">
                  <h3 className="text-3xl font-semibold text-foreground">
                    Basic View
                  </h3>
                  <p className="text-lg text-muted-foreground">
                    Perfect for quick insights and at-a-glance metrics. The Basic view provides a clean, simple interface showing your essential analytics without overwhelming details.
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <span>Clean, minimal interface for quick scanning</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <span>Essential metrics at a glance</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <span>Perfect for daily monitoring</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Expert View - Content Left, Image Right */}
              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Content */}
                <div className="space-y-4 md:order-1">
                  <h3 className="text-3xl font-semibold text-foreground">
                    Expert View
                  </h3>
                  <p className="text-lg text-muted-foreground">
                    Unlock comprehensive insights with advanced visualizations and detailed breakdowns. The Expert view gives you full control over your analytics with powerful filtering and deep data exploration.
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <span>Advanced charts and trend analysis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <span>Detailed data breakdowns and segments</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                      <span>Powerful filtering and customization</span>
                    </li>
                  </ul>
                </div>
                {/* Image */}
                <div className="rounded-lg border shadow-lg overflow-hidden bg-card md:order-2">
                  <Image
                    src="/images/analytics_expert.png"
                    alt="Analytics Expert View"
                    width={800}
                    height={600}
                    className="w-full h-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Explore the customer feedback cycle */}
        <section className="py-20 bg-[#f9f9f9] dark:bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-switzer font-medium text-slate-900 dark:text-white mb-4">
                Explore the customer feedback cycle
              </h2>
              <p className="text-xl text-slate-600 dark:text-gray-400 max-w-3xl mx-auto">
                From collection to action, understand the complete journey
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="relative">
                <Link href="/collect-feedback">
                  <Card className="border-slate-200 dark:border-border shadow-lg h-full hover:shadow-xl transition-all cursor-pointer group">
                    <CardContent className="p-8">
                      <div className="mb-6">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full text-xl font-bold group-hover:scale-110 transition-transform">
                          1
                        </div>
                      </div>
                      <h3 className="text-2xl font-switzer font-medium text-slate-900 dark:text-white mb-4 group-hover:text-blue-600 transition-colors">
                        Collect
                      </h3>
                      <p className="text-slate-600 dark:text-gray-400 mb-6">
                        Gather feedback from multiple channels into one
                        centralized hub. Users submit ideas, report bugs, and
                        share suggestions.
                      </p>
                      <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-semibold">
                        <MessageSquare className="h-4 w-4" />
                        <span>Collect Feedback</span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                {/* Arrow */}
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <ArrowRight className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <Card className="border-blue-200 dark:border-blue-800 shadow-lg h-full bg-blue-50 dark:bg-blue-950/20">
                  <CardContent className="p-8">
                    <div className="mb-6">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full text-xl font-bold">
                        2
                      </div>
                    </div>
                    <h3 className="text-2xl font-switzer font-medium text-slate-900 dark:text-white mb-4">
                      Analyze
                    </h3>
                    <p className="text-slate-600 dark:text-gray-400 mb-6">
                      Filter, sort, and prioritize feedback based on votes,
                      impact, and alignment with your goals. Identify patterns
                      and trends.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-semibold">
                      <BarChart3 className="h-4 w-4" />
                      <span>Analyze Feedback</span>
                    </div>
                  </CardContent>
                </Card>
                {/* Arrow */}
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <ArrowRight className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              {/* Step 3 */}
              <div>
                <Card className="border-slate-200 dark:border-border shadow-lg h-full">
                  <CardContent className="p-8">
                    <div className="mb-6">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full text-xl font-bold">
                        3
                      </div>
                    </div>
                    <h3 className="text-2xl font-switzer font-medium text-slate-900 dark:text-white mb-4">
                      Share
                    </h3>
                    <p className="text-slate-600 dark:text-gray-400 mb-6">
                      Keep users informed with updates, changelogs, and status
                      changes. Close the loop and build trust with your
                      community.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-semibold">
                      <Users className="h-4 w-4" />
                      <span>Share Updates</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <LandingFooter showCTA={false} />
    </>
  );
}
