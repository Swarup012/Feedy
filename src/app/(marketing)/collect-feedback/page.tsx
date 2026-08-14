"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Mail,
  MessageSquare,
  Lightbulb,
  TrendingUp,
  Users,
  Target,
  Upload,
  Lock,
  Shield,
  CheckCircle2,
  ArrowRight,
  Play,
  ChevronDown,
  Globe,
  Link2,
  ThumbsUp,
  FileText,
  UserCheck,
  Zap,
  BarChart3,
  Heart,
  Clock,
  Briefcase,
  Smartphone,
  Building2,
  Slack,
  Code,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { LandingFooter } from "@/components/ui/landing-footer";

export default function CollectFeedbackPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <>

      <div className="min-h-screen bg-[#f9f9f9] dark:bg-background">
        {/* Hero Section */}
        <section className="relative py-16 lg:py-20 overflow-hidden bg-white dark:bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl lg:text-4xl font-switzer  font-medium text-slate-900 dark:text-white mb-6 tracking-tight">
              Collect Feedback from Your Users, Effortlessly
            </h1>
            <p className="text-xl font-switzer text-slate-600 dark:text-gray-400 mb-8 leading-relaxed">
              Centralize feedback from multiple channels. Organize requests.
              Never miss a valuable insight again.
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

        {/* Problem Statement Section */}
        <section className="py-16 bg-[#f9f9f9] dark:bg-gray-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-switzer font-bold text-slate-900 dark:text-white mb-4">
                Scattered Feedback = Missed Opportunities
              </h2>
              <p className="text-xl text-slate-600 dark:text-gray-400 max-w-3xl mx-auto">
                Don't let valuable insights slip through the cracks
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Pain Point 1 */}
              <Card className="border-slate-200 dark:border-border shadow-lg">
                <CardContent className="p-5 text-center">
                  <h3 className="text-xl font-switzer font-bold text-slate-900 dark:text-white mb-3">
                    Lost in Email Threads
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400">
                    Customer feedback buried in hundreds of emails, making it
                    impossible to track and prioritize
                  </p>
                </CardContent>
              </Card>

              {/* Pain Point 2 */}
              <Card className="border-slate-200 dark:border-border shadow-lg">
                <CardContent className="p-5 text-center">
                  <h3 className="text-xl font-switzer font-bold text-slate-900 dark:text-white mb-3">
                    Spread Across Tools
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400">
                    Slack, support tickets, social media - feedback scattered
                    everywhere with no single source of truth
                  </p>
                </CardContent>
              </Card>

              {/* Pain Point 3 */}
              <Card className="border-slate-200 dark:border-border shadow-lg">
                <CardContent className="p-5 text-center">
                  <h3 className="text-xl font-switzer font-bold text-slate-900 dark:text-white mb-3">
                    No Clear Picture
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400">
                    Hard to see patterns, prioritize requests, or understand
                    what features users actually want
                  </p>
                </CardContent>
              </Card>
          </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 bg-[#f9f9f9] dark:bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-switzer font-bold text-slate-900 dark:text-white mb-4">
                Collect Feedback in 3 Simple Steps
              </h2>
            </div>

            {/* Step 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center mb-12">
              <div className="order-2 lg:order-1">
                <div className="bg-slate-100 dark:bg-gray-800 rounded-2xl p-5 shadow-xl">
                  {/* Mock Board Creation Interface - Matches actual CreateBoardDialog */}
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-4">
                    <div className="space-y-6">
                      {/* Board Name Input */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-900 dark:text-white">
                          Board Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <div className="h-10 bg-white dark:bg-gray-950 rounded-lg border border-slate-200 dark:border-gray-700 px-3 flex items-center">
                            <span className="text-slate-400 dark:text-gray-500 text-sm">
                              Feature Requests
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-gray-400">
                          Choose a clear name for your feedback board
                        </p>
                      </div>

                      {/* Board Slug */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-900 dark:text-white">
                          URL Slug <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-500 dark:text-gray-400 px-3 py-2 bg-slate-50 dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700">
                            yoursite.com/board/
                          </span>
                          <div className="flex-1 h-10 bg-white dark:bg-gray-950 rounded-lg border border-slate-200 dark:border-gray-700 px-3 flex items-center">
                            <span className="text-slate-400 dark:text-gray-500 text-sm">
                              feature-requests
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Slug is available</span>
                        </div>
                      </div>

                      {/* Board Icon Picker */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-900 dark:text-white">
                          Board Icon
                        </label>
                        <div className="grid grid-cols-6 gap-2">
                          {[
                            { icon: Lightbulb, selected: true },
                            { icon: MessageSquare, selected: false },
                            { icon: Target, selected: false },
                            { icon: Zap, selected: false },
                            { icon: Heart, selected: false },
                            { icon: Star, selected: false },
                          ].map((item, i) => (
                            <button
                              key={i}
                              className={`p-3 rounded-lg border-2 transition-all ${
                                item.selected
                                  ? "border-blue-600 bg-blue-50 dark:bg-blue-950/30"
                                  : "border-slate-200 dark:border-gray-700 hover:border-slate-300 dark:hover:border-gray-600"
                              }`}
                            >
                              <item.icon
                                className={`h-5 w-5 ${
                                  item.selected
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-slate-400 dark:text-gray-500"
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Categories */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-900 dark:text-white">
                          Categories
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {[
                            "Feature Request",
                            "Bug Report",
                            "Improvement",
                            "Question",
                          ].map((cat, i) => (
                            <div
                              key={i}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-lg text-sm font-medium"
                            >
                              <span>{cat}</span>
                              {i < 3 && (
                                <X className="h-3 w-3 cursor-pointer hover:text-blue-900 dark:hover:text-blue-200" />
                              )}
                            </div>
                          ))}
                          <button className="px-3 py-1.5 border-2 border-dashed border-slate-300 dark:border-gray-600 rounded-lg text-sm text-slate-500 dark:text-gray-400 hover:border-slate-400 dark:hover:border-gray-500 hover:text-slate-700 dark:hover:text-gray-300 transition-colors">
                            + Add Category
                          </button>
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
                  <h3 className="text-xl font-switzer font-bold text-slate-900 dark:text-white">
                    Create Your Feedback Board
                  </h3>
                </div>
                <p className="text-lg font-switzer text-slate-600 dark:text-gray-400 mb-6">
                  Set up a branded feedback portal in minutes
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-slate-700 dark:text-gray-300">
                      Customize categories, colors, and branding
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-slate-700 dark:text-gray-300">
                      Set visibility options (public or private)
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-slate-700 dark:text-gray-300">
                      Configure voting and submission rules
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Step 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center mb-12">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center justify-center h-12 w-12 bg-blue-600 text-white rounded-full text-xl font-bold">
                    2
                  </div>
                  <h3 className="text-xl font-switzer font-bold text-slate-900 dark:text-white">
                    Share with Your Users
                  </h3>
                </div>
                <p className="text-lg font-switzer text-slate-600 dark:text-gray-400 mb-6">
                  Get a shareable link or embed on your site
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-slate-700 dark:text-gray-300">
                      Copy shareable link to distribute
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-slate-700 dark:text-gray-300">
                      Embed widget code on your website
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-slate-700 dark:text-gray-300">
                      No user account needed for submissions
                    </span>
                  </li>
                </ul>
              </div>
              <div>
                <div className="bg-slate-100 dark:bg-gray-800 rounded-2xl p-5 shadow-xl">
                  {/* Mock Share Interface */}
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-4 space-y-4">
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-4">
                      Share Your Board
                    </h4>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                        Public Link
                      </label>
                      <div className="flex gap-2">
                        <div className="flex-1 h-10 bg-slate-100 dark:bg-gray-800 rounded border border-slate-200 dark:border-gray-700 flex items-center px-3">
                          <span className="text-sm text-slate-500 dark:text-gray-400">
                            faddy.site/feedback/your-board
                          </span>
                        </div>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
                        Embed Code
                      </label>
                      <div className="h-20 bg-slate-100 dark:bg-gray-800 rounded border border-slate-200 dark:border-gray-700 p-3 font-mono text-xs text-slate-600 dark:text-gray-400">
                        {'<script src="..."></script>'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
              <div className="order-2 lg:order-1">
                <div className="bg-slate-100 dark:bg-gray-800 rounded-2xl p-5 shadow-xl">
                  {/* Mock Feedback Dashboard */}
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-slate-900 dark:text-white">
                        All Feedback
                      </h4>
                      <div className="flex gap-2">
                        {["All", "Feature", "Bug"].map((filter, i) => (
                          <span
                            key={i}
                            className={`px-3 py-1 rounded-full text-sm ${i === 0 ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-gray-800 text-slate-700 dark:text-gray-300"}`}
                          >
                            {filter}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {[
                        {
                          votes: 24,
                          title: "Dark mode support",
                          category: "Feature",
                        },
                        {
                          votes: 18,
                          title: "Export to PDF",
                          category: "Feature",
                        },
                        {
                          votes: 12,
                          title: "Slack integration",
                          category: "Feature",
                        },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-3 p-3 border border-slate-200 dark:border-gray-700 rounded-lg"
                        >
                          <div className="text-center">
                            <TrendingUp className="h-4 w-4 text-blue-600 mx-auto" />
                            <span className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                              {item.votes}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-slate-900 dark:text-white text-sm">
                              {item.title}
                            </div>
                          </div>
                          <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full">
                            {item.category}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center justify-center h-12 w-12 bg-blue-600 text-white rounded-full text-xl font-bold">
                    3
                  </div>
                  <h3 className="text-xl font-switzer font-bold text-slate-900 dark:text-white">
                    Watch Ideas Flow In
                  </h3>
                </div>
                <p className="text-lg font-switzer text-slate-600 dark:text-gray-400 mb-6">
                  All feedback organized in one place
                </p>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-slate-700 dark:text-gray-300">
                      Auto-categorize and tag suggestions
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-slate-700 dark:text-gray-300">
                      See votes and popularity at a glance
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="text-slate-700 dark:text-gray-300">
                      Filter, search, and prioritize easily
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Key Features Grid */}
        <section className="py-16 bg-[#f9f9f9] dark:bg-gray-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-switzer font-bold text-slate-900 dark:text-white mb-4">
                Everything You Need to Collect Feedback
              </h2>
              <p className="text-xl text-slate-600 dark:text-gray-400">
                Powerful features designed to make feedback collection
                effortless
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Feature 1 */}
              <Card className="border-slate-200 dark:border-border shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-5">
                  <h3 className="text-xl font-switzer font-bold text-slate-900 dark:text-white mb-3">
                    Public Feedback Boards
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400">
                    Branded portal for your users with public or private
                    options. Custom domains available.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="border-slate-200 dark:border-border shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-5">
                  <h3 className="text-xl font-switzer font-bold text-slate-900 dark:text-white mb-3">
                    Multiple Input Channels
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400">
                    Web widget, direct links, email integration, and API for
                    custom integrations.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="border-slate-200 dark:border-border shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-5">
                  <h3 className="text-xl font-switzer font-bold text-slate-900 dark:text-white mb-3">
                    Smart Categorization
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400">
                    Auto-tag by type (bug, feature, improvement). Custom
                    categories and smart filtering.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 4 */}
              <Card className="border-slate-200 dark:border-border shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-5">
                  <h3 className="text-xl font-switzer font-bold text-slate-900 dark:text-white mb-3">
                    User Voting
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400">
                    Let users upvote ideas they love. See what's truly popular
                    and prevent duplicate requests.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 5 */}
              <Card className="border-slate-200 dark:border-border shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-5">
                  <h3 className="text-xl font-switzer font-bold text-slate-900 dark:text-white mb-3">
                    Rich Submissions
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400">
                    Text descriptions, image uploads, file attachments, and
                    automatic context capture.
                  </p>
                </CardContent>
              </Card>

              {/* Feature 6 */}
              <Card className="border-slate-200 dark:border-border shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-5">
                  <h3 className="text-xl font-switzer font-bold text-slate-900 dark:text-white mb-3">
                    Anonymous or Authenticated
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400">
                    Allow guest submissions or require user login. Track
                    feedback by user with ease.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Benefits Section - Redesigned */}
        <section className="py-16 bg-[#f9f9f9] dark:bg-gray-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-switzer font-bold text-slate-900 dark:text-white mb-4">
                Why Teams Love Collecting Feedback with Faddy
              </h2>
              <p className="text-xl text-slate-600 dark:text-gray-400 max-w-3xl mx-auto">
                Join hundreds of product teams using Faddy to build better products
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Benefit 1 - Save Time */}
              <div className="group">
                <Card className="border-slate-200 dark:border-border shadow-lg hover:shadow-xl transition-all h-full">
                  <CardContent className="p-5">
                    <div className="mb-6">
                      <div className="inline-flex p-4 bg-blue-600 rounded-2xl shadow-md">
                        <Clock className="h-10 w-10 text-white" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-switzer font-bold text-slate-900 dark:text-white mb-4">
                      Save Hours Every Week
                    </h3>
                    <p className="text-slate-600 dark:text-gray-400 mb-6 leading-relaxed">
                      Stop hunting for feedback across emails, Slack, and support tickets. Everything organized in one beautiful dashboard.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">Centralized hub</p>
                          <p className="text-xs text-slate-500 dark:text-gray-500">All feedback in one place</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">Smart filters</p>
                          <p className="text-xs text-slate-500 dark:text-gray-500">Find what you need instantly</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">Auto-organize</p>
                          <p className="text-xs text-slate-500 dark:text-gray-500">Categorize automatically</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Benefit 2 - Build Better */}
              <div className="group">
                <Card className="border-blue-200 dark:border-blue-800 shadow-lg hover:shadow-xl transition-all h-full bg-blue-50 dark:bg-blue-950/20">
                  <CardContent className="p-5">
                    <div className="mb-6">
                      <div className="inline-flex p-4 bg-blue-600 rounded-2xl shadow-md">
                        <Target className="h-10 w-10 text-white" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-switzer font-bold text-slate-900 dark:text-white mb-4">
                      Build What Users Want
                    </h3>
                    <p className="text-slate-600 dark:text-gray-400 mb-6 leading-relaxed">
                      Make data-driven decisions based on real user demand. Prioritize features by votes and user impact.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">Vote tracking</p>
                          <p className="text-xs text-slate-500 dark:text-gray-500">See what's most wanted</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">Validate ideas</p>
                          <p className="text-xs text-slate-500 dark:text-gray-500">Test before building</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">Save resources</p>
                          <p className="text-xs text-slate-500 dark:text-gray-500">No wasted development</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Benefit 3 - Engage Community */}
              <div className="group">
                <Card className="border-slate-200 dark:border-border shadow-lg hover:shadow-xl transition-all h-full">
                  <CardContent className="p-5">
                    <div className="mb-6">
                      <div className="inline-flex p-4 bg-blue-600 rounded-2xl shadow-md">
                        <Heart className="h-10 w-10 text-white" />
                      </div>
                    </div>
                    <h3 className="text-2xl font-switzer font-bold text-slate-900 dark:text-white mb-4">
                      Engage Your Community
                    </h3>
                    <p className="text-slate-600 dark:text-gray-400 mb-6 leading-relaxed">
                      Show users you're listening. Public voting creates excitement and transparency builds lasting trust.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-1 p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">Build loyalty</p>
                          <p className="text-xs text-slate-500 dark:text-gray-500">Create engaged users</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">Boost engagement</p>
                          <p className="text-xs text-slate-500 dark:text-gray-500">Active participation</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="mt-1 p-1 bg-green-100 dark:bg-green-900/30 rounded-full">
                          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">Show transparency</p>
                          <p className="text-xs text-slate-500 dark:text-gray-500">Build trust with users</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
        {/* Use Cases Section */}
        <section className="py-16 bg-[#f9f9f9] dark:bg-gray-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-2xl font-switzer font-bold text-slate-900 dark:text-white mb-4">
                Perfect For...
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Use Case 1 */}
              <Card className="border-slate-200 dark:border-border shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-5 text-center">
                  <h3 className="text-xl font-switzer font-bold text-slate-900 dark:text-white mb-3">
                    SaaS Products
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400 mb-4 italic">
                    "Collect feature requests from customers"
                  </p>
                  <p className="text-sm text-slate-500 dark:text-gray-500">
                    Example: Project management tools, CRM platforms
                  </p>
                </CardContent>
              </Card>

              {/* Use Case 2 */}
              <Card className="border-slate-200 dark:border-border shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-5 text-center">
                  <h3 className="text-xl font-switzer font-bold text-slate-900 dark:text-white mb-3">
                    Mobile Apps
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400 mb-4 italic">
                    "Gather user feedback and bug reports"
                  </p>
                  <p className="text-sm text-slate-500 dark:text-gray-500">
                    Example: Fitness apps, social networks
                  </p>
                </CardContent>
              </Card>

              {/* Use Case 3 */}
              <Card className="border-slate-200 dark:border-border shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-5 text-center">
                  <h3 className="text-xl font-switzer font-bold text-slate-900 dark:text-white mb-3">
                    Web Agencies
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400 mb-4 italic">
                    "Let clients request changes and features"
                  </p>
                  <p className="text-sm text-slate-500 dark:text-gray-500">
                    Example: Client portals, development agencies
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Integration Callout */}
        <section className="py-16 bg-[#f9f9f9] dark:bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-switzer font-bold text-slate-900 dark:text-white mb-4">
                Collect Feedback Wherever Your Users Are
              </h2>
            </div>

            <div className="flex flex-wrap justify-center gap-5 mb-8">
              {[
                { icon: Globe, label: "Embeddable Widget", color: "blue" },
                { icon: Link2, label: "Shareable Links", color: "purple" },
                { icon: Mail, label: "Email Integration", color: "red" },
                { icon: Slack, label: "Slack Connect", color: "orange" },
                { icon: Code, label: "API Access", color: "green" },
              ].map((channel, i) => (
                <div key={i} className="flex flex-col items-center gap-3">
                  <div
                    className={`p-4 rounded-full ${
                      channel.color === "blue"
                        ? "bg-blue-100 dark:bg-blue-900/30"
                        : channel.color === "purple"
                          ? "bg-purple-100 dark:bg-purple-900/30"
                          : channel.color === "red"
                            ? "bg-red-100 dark:bg-red-900/30"
                            : channel.color === "orange"
                              ? "bg-orange-100 dark:bg-orange-900/30"
                              : "bg-green-100 dark:bg-green-900/30"
                    }`}
                  >
                    <channel.icon
                      className={`h-8 w-8 ${
                        channel.color === "blue"
                          ? "text-blue-600 dark:text-blue-400"
                          : channel.color === "purple"
                            ? "text-blue-600 dark:text-blue-400"
                            : channel.color === "red"
                              ? "text-blue-600 dark:text-blue-400"
                              : channel.color === "orange"
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-blue-600 dark:text-blue-400"
                      }`}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 dark:text-gray-300">
                    {channel.label}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-center text-lg text-slate-600 dark:text-gray-400">
              Embed anywhere • Share instantly • Integrate seamlessly
            </p>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-16 bg-[#f9f9f9] dark:bg-gray-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-switzer font-bold text-slate-900 dark:text-white mb-4">
                Trusted by Teams Building Better Products
              </h2>
            </div>

            {/* Testimonial */}
            <Card className="max-w-4xl mx-auto border-slate-200 dark:border-border shadow-xl mb-8">
              <CardContent className="p-5 lg:p-8">
                <div className="flex gap-1 mb-4 justify-center">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className="h-5 w-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-xl text-slate-700 dark:text-gray-300 text-center mb-6 italic">
                  "We chose Faddy because it cuts through the noise. The setup
                  is instant, and the UI is incredibly straightforward, making
                  it easy for both our team and our customers to use. No
                  complexity, no headaches—just clear prioritization."
                </p>
                <div className="flex items-center justify-center gap-4">
                  <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                    TS
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      Tushar Prasad
                    </p>
                    <p className="text-sm text-slate-500 dark:text-gray-400">
                      Product Manager at Temcia Digital
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { number: "∞", label: "Ideas Collected" },
                { number: "Temcia Group", label: "Teams Using Faddy" },
                { number: "95%", label: "Satisfaction Rate" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-4xl lg:text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    {stat.number}
                  </div>
                  <div className="text-slate-600 dark:text-gray-400 font-medium">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-[#f9f9f9] dark:bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-switzer font-bold text-slate-900 dark:text-white mb-4">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="space-y-4">
              {[
                {
                  q: "Do users need to create an account to submit feedback?",
                  a: "No! Users can submit feedback anonymously without creating an account. You can also enable optional authentication if you prefer to track submissions by user.",
                },
                {
                  q: "Can I customize the look of my feedback board?",
                  a: "Yes! You can customize colors, categories, branding, and choose between public or private visibility. Custom domains are available on premium plans.",
                },
                {
                  q: "How do I prevent spam submissions?",
                  a: "Faddy includes built-in spam protection with rate limiting, duplicate detection, and optional email verification. You can also enable moderation for all submissions.",
                },
                {
                  q: "Can I make my board private?",
                  a: "Absolutely! You can set your feedback board to private, requiring authentication to view and submit. Perfect for internal teams or beta testing.",
                },
                {
                  q: "What happens to feedback after I collect it?",
                  a: "You can organize feedback into categories, track votes, update status, link to your roadmap, and close the loop by notifying users when features are shipped.",
                },
              ].map((faq, i) => (
                <Card
                  key={i}
                  className="border-slate-200 dark:border-border shadow-sm"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full text-left"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-switzer font-semibold text-slate-900 dark:text-white pr-8">
                          {faq.q}
                        </h3>
                        <ChevronDown
                          className={`h-5 w-5 text-slate-400 dark:text-gray-500 transition-transform flex-shrink-0 ${
                            openFaq === i ? "transform rotate-180" : ""
                          }`}
                        />
                      </div>
                      {openFaq === i && (
                        <p className="mt-4 text-slate-600 dark:text-gray-400 leading-relaxed">
                          {faq.a}
                        </p>
                      )}
                    </CardContent>
                  </button>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-16 bg-blue-600 dark:bg-blue-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-2xl lg:text-3xl font-bold text-white mb-6">
              Start Collecting Valuable Feedback Today
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join hundreds of teams building better products with customer
              insights
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg w-full sm:w-auto"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/pricing">
                <Button
                  size="lg"
                  className="bg-white/10 backdrop-blur-sm border-2 border-white text-white hover:bg-white hover:text-blue-600 w-full sm:w-auto"
                >
                  View Pricing
                </Button>
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center text-blue-100">
              <div className="flex items-center gap-2 justify-center">
                <CheckCircle2 className="h-5 w-5" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <CheckCircle2 className="h-5 w-5" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2 justify-center">
                <CheckCircle2 className="h-5 w-5" />
                <span>Cancel anytime</span>
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
