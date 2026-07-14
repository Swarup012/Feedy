"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Calendar,
  Users,
  MessageSquare,
  Lock,
  Unlock,
  ThumbsUp,
  Palette,
  CheckCircle2,
  ArrowRight,
  Target,
  TrendingUp,
  Shield,
  Lightbulb,
  BarChart3,
  Eye,
  Globe,
  Zap,
  Clock,
  ListTodo,
  PlayCircle,
  CheckSquare,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

export default function PublicRoadmapPage() {
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
          ],
        },
        {
          section: "Use Cases",
          items: [
            { name: "Feature Request Management", link: "/collect-feedback" },
            { name: "Role-Based Access Control", link: "/role-based-access" },
            { name: "Public Roadmap", link: "/public-roadmap" },
          ],
        },
        {
          section: "Resources",
          items: [
            { name: "Blog", link: "/blog" },
          ],
        },
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
              Build Trust with a Public Roadmap
            </h1>
            <p className="text-xl font-switzer text-slate-600 dark:text-gray-400 mb-8 leading-relaxed">
              Show your vision, gather feedback, and keep stakeholders aligned with a beautiful public roadmap.
            </p>

            {/* CTA Button */}
            <div className="flex justify-center mb-8">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Trust Signals */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center text-sm text-slate-600 dark:text-gray-400">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Setup in 5 minutes</span>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section - 6 Cards */}
        <section className="py-20 bg-[#f9f9f9] dark:bg-gray-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-switzer font-bold text-slate-900 dark:text-white mb-4">
                Why Public Roadmaps Matter
              </h2>
              <p className="text-xl text-slate-600 dark:text-gray-400">
                Transform how you communicate your product vision
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Benefit 1 */}
              <Card className="border-slate-200 dark:border-border shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <h3 className="text-xl font-switzer font-bold text-slate-900 dark:text-white mb-3">
                    Build Trust & Transparency
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400">
                    Show users what you're working on. Build credibility by being open about your product direction.
                  </p>
                </CardContent>
              </Card>

              {/* Benefit 2 */}
              <Card className="border-slate-200 dark:border-border shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <h3 className="text-xl font-switzer font-bold text-slate-900 dark:text-white mb-3">
                    Drive User Engagement
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400">
                    Let users vote and comment on upcoming features. Turn passive users into active contributors.
                  </p>
                </CardContent>
              </Card>

              {/* Benefit 3 */}
              <Card className="border-slate-200 dark:border-border shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <h3 className="text-xl font-switzer font-bold text-slate-900 dark:text-white mb-3">
                    Reduce Support Requests
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400">
                    Answer "When will this be available?" before users ask. Cut down on repetitive support tickets.
                  </p>
                </CardContent>
              </Card>

              {/* Benefit 4 */}
              <Card className="border-slate-200 dark:border-border shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <h3 className="text-xl font-switzer font-bold text-slate-900 dark:text-white mb-3">
                    Align Stakeholders
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400">
                    Keep investors, team members, and customers on the same page about what's coming next.
                  </p>
                </CardContent>
              </Card>

              {/* Benefit 5 */}
              <Card className="border-slate-200 dark:border-border shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <h3 className="text-xl font-switzer font-bold text-slate-900 dark:text-white mb-3">
                    Gather Early Feedback
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400">
                    Validate ideas before building. Get user input on planned features to reduce wasted effort.
                  </p>
                </CardContent>
              </Card>

              {/* Benefit 6 */}
              <Card className="border-slate-200 dark:border-border shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <h3 className="text-xl font-switzer font-bold text-slate-900 dark:text-white mb-3">
                    Manage Expectations
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400">
                    Set realistic timelines publicly. Reduce frustration by showing what's in progress and what's planned.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section - 4 Cards */}
        <section className="py-20 bg-white dark:bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-switzer font-bold text-slate-900 dark:text-white mb-4">
                Powerful Roadmap Features
              </h2>
              <p className="text-xl text-slate-600 dark:text-gray-400">
                Everything you need to create a stunning public roadmap
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Feature 1 */}
              <Card className="border-slate-200 dark:border-border shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-switzer font-bold text-slate-900 dark:text-white mb-4">
                    Beautiful Timeline View
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400 mb-6">
                    Choose between quarterly, monthly, or custom timeline layouts. Visualize your roadmap in the format that works best for your team.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-slate-700 dark:text-gray-300">
                        Quarterly & monthly views
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-slate-700 dark:text-gray-300">
                        Drag-and-drop timeline management
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-slate-700 dark:text-gray-300">
                        Color-coded status indicators
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="border-slate-200 dark:border-border shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-switzer font-bold text-slate-900 dark:text-white mb-4">
                    Public & Private Options
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400 mb-6">
                    Control visibility with flexible privacy settings. Share publicly or restrict access to specific audiences.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-slate-700 dark:text-gray-300">
                        Public roadmaps for transparency
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-slate-700 dark:text-gray-300">
                        Private roadmaps for internal teams
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-slate-700 dark:text-gray-300">
                        Password-protected access
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="border-slate-200 dark:border-border shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-switzer font-bold text-slate-900 dark:text-white mb-4">
                    Voting & Comments
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400 mb-6">
                    Enable community feedback on your roadmap items. Let users vote and comment to prioritize features.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-slate-700 dark:text-gray-300">
                        User voting on roadmap items
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-slate-700 dark:text-gray-300">
                        Threaded comments & discussions
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-slate-700 dark:text-gray-300">
                        Email notifications for updates
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Feature 4 */}
              <Card className="border-slate-200 dark:border-border shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-switzer font-bold text-slate-900 dark:text-white mb-4">
                    Custom Branding
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400 mb-6">
                    Match your brand with customizable colors, logos, and domains. Make your roadmap feel like home.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-slate-700 dark:text-gray-300">
                        Custom colors & themes
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-slate-700 dark:text-gray-300">
                        Upload your logo & favicon
                      </span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="text-slate-700 dark:text-gray-300">
                        Custom domain support
                      </span>
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works Section - 3 Steps */}
        <section className="py-20 bg-[#f9f9f9] dark:bg-gray-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-switzer font-bold text-slate-900 dark:text-white mb-4">
                How It Works
              </h2>
              <p className="text-xl text-slate-600 dark:text-gray-400">
                Launch your public roadmap in three simple steps
              </p>
            </div>

            {/* Step 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
              <div className="order-2 lg:order-1">
                <div className="bg-slate-100 dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
                  {/* Mock Roadmap Creation Interface */}
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-6">
                    <div className="space-y-6">
                      {/* Roadmap Item Creation */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-gray-700">
                          <h4 className="font-semibold text-slate-900 dark:text-white">
                            Create Roadmap Item
                          </h4>
                        </div>
                        
                        {/* Feature Title */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-900 dark:text-white">
                            Feature Title
                          </label>
                          <div className="h-10 bg-white dark:bg-gray-950 rounded-lg border border-slate-200 dark:border-gray-700 px-3 flex items-center">
                            <span className="text-slate-400 dark:text-gray-500 text-sm">
                              Advanced Analytics Dashboard
                            </span>
                          </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-slate-900 dark:text-white">
                            Description
                          </label>
                          <div className="h-20 bg-white dark:bg-gray-950 rounded-lg border border-slate-200 dark:border-gray-700 p-3">
                            <span className="text-slate-400 dark:text-gray-500 text-sm">
                              Real-time analytics with custom reports...
                            </span>
                          </div>
                        </div>

                        {/* Category Badges */}
                        <div className="flex gap-2">
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-xs font-medium">
                            Feature
                          </span>
                          <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-full text-xs font-medium">
                            High Priority
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center justify-center h-12 w-12 bg-blue-600 text-white rounded-full text-xl font-bold">
                    1
                  </div>
                  <h3 className="text-3xl font-switzer font-bold text-slate-900 dark:text-white">
                    Create Roadmap Items
                  </h3>
                </div>
                <p className="text-lg font-switzer text-slate-600 dark:text-gray-400 mb-6">
                  Add features, improvements, and updates you're planning to build
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-slate-700 dark:text-gray-300">
                      Add title, description, and details
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-slate-700 dark:text-gray-300">
                      Categorize by feature type
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-slate-700 dark:text-gray-300">
                      Link to related feedback
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center justify-center h-12 w-12 bg-blue-600 text-white rounded-full text-xl font-bold">
                    2
                  </div>
                  <h3 className="text-3xl font-switzer font-bold text-slate-900 dark:text-white">
                    Set Status & Timeline
                  </h3>
                </div>
                <p className="text-lg font-switzer text-slate-600 dark:text-gray-400 mb-6">
                  Organize items by status and assign timelines for delivery
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-slate-700 dark:text-gray-300">
                      Set status: Planned, In Progress, Done
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-slate-700 dark:text-gray-300">
                      Assign quarterly or monthly timelines
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-slate-700 dark:text-gray-300">
                      Update progress as you build
                    </span>
                  </li>
                </ul>
              </div>
              <div>
                <div className="bg-slate-100 dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
                  {/* Mock Status Management */}
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-6 space-y-4">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
                      Roadmap Timeline
                    </h4>
                    
                    {/* Timeline Items */}
                    <div className="space-y-3">
                      {[
                        { status: "In Progress", title: "Mobile App Redesign", quarter: "Q1 2024", color: "blue" },
                        { status: "Planned", title: "API v2.0", quarter: "Q2 2024", color: "purple" },
                        { status: "Planned", title: "Advanced Analytics", quarter: "Q3 2024", color: "purple" },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 border border-slate-200 dark:border-gray-700 rounded-lg"
                        >
                          <div className={`px-2 py-1 rounded text-xs font-semibold ${
                            item.color === "blue" 
                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                              : "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"
                          }`}>
                            {item.status}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-slate-900 dark:text-white text-sm">
                              {item.title}
                            </div>
                          </div>
                          <span className="text-xs px-2 py-1 bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300 rounded">
                            {item.quarter}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1">
                <div className="bg-slate-100 dark:bg-gray-800 rounded-2xl p-8 shadow-xl">
                  {/* Mock Public Roadmap View */}
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        Public Roadmap
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                        <Globe className="h-3 w-3" />
                        <span>Live & Public</span>
                      </div>
                    </div>
                    
                    {/* Share Options */}
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-gray-300 mb-1">
                          Share Link
                        </label>
                        <div className="flex gap-2">
                          <div className="flex-1 h-8 bg-slate-100 dark:bg-gray-800 rounded border border-slate-200 dark:border-gray-700 flex items-center px-2">
                            <span className="text-xs text-slate-500 dark:text-gray-400">
                              roadmap.yourcompany.com
                            </span>
                          </div>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-8 text-xs">
                            Copy
                          </Button>
                        </div>
                      </div>
                      
                      {/* Visibility Toggle */}
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4 text-slate-600 dark:text-gray-400" />
                          <span className="text-sm text-slate-700 dark:text-gray-300">Public Access</span>
                        </div>
                        <div className="w-10 h-5 bg-blue-600 rounded-full flex items-center justify-end px-0.5">
                          <div className="w-4 h-4 bg-white rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center justify-center h-12 w-12 bg-blue-600 text-white rounded-full text-xl font-bold">
                    3
                  </div>
                  <h3 className="text-3xl font-switzer font-bold text-slate-900 dark:text-white">
                    Share Publicly
                  </h3>
                </div>
                <p className="text-lg font-switzer text-slate-600 dark:text-gray-400 mb-6">
                  Make your roadmap public and start building trust with your users
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-slate-700 dark:text-gray-300">
                      Get a shareable public link
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-slate-700 dark:text-gray-300">
                      Embed on your website
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-slate-700 dark:text-gray-300">
                      Collect votes and feedback
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-white dark:bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="p-12 rounded-2xl bg-blue-600 text-white">
              <h2 className="text-4xl font-switzer font-bold mb-4">
                Ready to Build Trust with Your Users?
              </h2>
              <p className="text-xl mb-8 text-blue-100">
                Launch your public roadmap today and start sharing your vision
              </p>
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-50 shadow-2xl"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <LandingFooter />
      </div>
    </>
  );
}
