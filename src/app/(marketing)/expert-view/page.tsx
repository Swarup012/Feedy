"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  TrendingUp,
  AlertTriangle,
  Focus,
  BarChart3,
  Zap,
  Target,
  Lightbulb,
} from "lucide-react";
import Link from "next/link";
import { LandingFooter } from "@/components/ui/landing-footer";

const insights = [
  {
    label: "Urgent",
    count: "12",
    description: "Critical issues requiring immediate attention",
    color: "red",
    icon: <AlertTriangle className="w-5 h-5" />,
  },
  {
    label: "Trending",
    count: "28",
    description: "Features gaining momentum this week",
    color: "blue",
    icon: <TrendingUp className="w-5 h-5" />,
  },
  {
    label: "Focus",
    count: "8",
    description: "High-impact items aligned with your roadmap",
    color: "purple",
    icon: <Focus className="w-5 h-5" />,
  },
  {
    label: "Opportunities",
    count: "15",
    description: "Underserved needs with growth potential",
    color: "green",
    icon: <Lightbulb className="w-5 h-5" />,
  },
];

const features = [
  {
    title: "Source Tracking",
    description:
      "See exactly where feedback comes from — Intercom, Slack, Discord, GitHub, or direct submissions. Understand which channels drive the most valuable insights.",
    icon: <Eye className="w-6 h-6" />,
  },
  {
    title: "Priority Matrix",
    description:
      "Visual grid showing urgency vs impact. Instantly spot what to build next based on user demand and business value.",
    icon: <Target className="w-6 h-6" />,
  },
  {
    title: "Trend Detection",
    description:
      "AI identifies rising and falling topics. Catch feature requests before they become churn risks.",
    icon: <TrendingUp className="w-6 h-6" />,
  },
  {
    title: "Feature Impact Score",
    description:
      "Quantify how much each feature contributes to retention, satisfaction, and revenue. Know what's真正 working.",
    icon: <BarChart3 className="w-6 h-6" />,
  },
];

export default function ExpertViewPage() {
  return (
    <>
      <div className="min-h-screen bg-white dark:bg-background">
        {/* Hero Section */}
        <section className="relative py-16 lg:py-20 overflow-hidden bg-white dark:bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
              {/* Left — Copy */}
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs sm:text-sm font-semibold mb-6">
                  <Eye className="w-4 h-4" />
                  Expert Dashboard
                </div>

                <h1 className="text-3xl lg:text-4xl xl:text-5xl font-switzer font-medium text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">
                  See what your users really want.{" "}
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Make decisions with confidence.
                  </span>
                </h1>

                <p className="text-lg lg:text-xl text-slate-600 dark:text-gray-400 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  The Expert View gives you a bird&apos;s-eye view of all
                  feedback. Spot trends, prioritize by impact, and understand
                  which features actually drive your product forward.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Link href="/signup">
                    <Button
                      size="lg"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg w-full sm:w-auto"
                    >
                      Try for Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <a
                    href="#features"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-switzer font-semibold rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-sm"
                  >
                    Explore Features
                  </a>
                </div>
              </div>

              {/* Right — Dashboard Preview */}
              <div className="flex-1 w-full max-w-lg lg:max-w-none">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900">
                  {/* Browser chrome */}
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span className="w-3 h-3 rounded-full bg-green-400" />
                    <div className="ml-3 flex-1 bg-white dark:bg-slate-700 rounded-md px-3 py-0.5 text-xs text-slate-400 dark:text-slate-500 font-mono">
                      faddy.site/admin/expert-view
                    </div>
                  </div>

                  {/* Dashboard Content */}
                  <div className="p-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      {insights.map((item) => (
                        <div
                          key={item.label}
                          className={`p-3 rounded-xl border ${
                            item.color === "red"
                              ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                              : item.color === "blue"
                              ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                              : item.color === "purple"
                              ? "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800"
                              : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`${
                                item.color === "red"
                                  ? "text-red-500"
                                  : item.color === "blue"
                                  ? "text-blue-500"
                                  : item.color === "purple"
                                  ? "text-purple-500"
                                  : "text-green-500"
                              }`}
                            >
                              {item.icon}
                            </span>
                            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                              {item.label}
                            </span>
                          </div>
                          <div className="text-2xl font-bold text-slate-900 dark:text-white">
                            {item.count}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Priority List */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4">
                      <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                        Top Priority This Week
                      </div>
                      <div className="space-y-2">
                        {[
                          {
                            name: "Dark Mode Support",
                            votes: 47,
                            trend: "+12%",
                            status: "urgent",
                          },
                          {
                            name: "API Access",
                            votes: 31,
                            trend: "+8%",
                            status: "trending",
                          },
                          {
                            name: "Mobile App",
                            votes: 24,
                            trend: "+5%",
                            status: "focus",
                          },
                        ].map((item) => (
                          <div
                            key={item.name}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  item.status === "urgent"
                                    ? "bg-red-500"
                                    : item.status === "trending"
                                    ? "bg-blue-500"
                                    : "bg-purple-500"
                                }`}
                              />
                              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                {item.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <span className="text-slate-500 dark:text-slate-400">
                                {item.votes} votes
                              </span>
                              <span className="text-emerald-500 font-medium">
                                {item.trend}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="py-16 px-6 bg-slate-50/50 dark:bg-slate-900/50 border-y border-slate-100 dark:border-slate-800"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-switzer font-bold tracking-tight text-slate-900 dark:text-white mb-4">
                Everything you need to see the full picture
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                From raw feedback to actionable insights — all in one view.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all"
                >
                  <CardContent className="p-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-switzer font-bold text-slate-900 dark:text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Helps */}
        <section className="py-16 px-6 bg-white dark:bg-background">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-switzer font-bold tracking-tight text-slate-900 dark:text-white mb-4">
                Make better product decisions
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                Stop guessing. Start knowing what your users actually need.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Identify What's Working",
                  description:
                    "See which features drive engagement and retention. Double down on what matters.",
                  icon: <CheckCircle2 className="w-6 h-6" />,
                },
                {
                  title: "Spot Problems Early",
                  description:
                    "Catch declining trends before they become churn. React to user needs proactively.",
                  icon: <AlertTriangle className="w-6 h-6" />,
                },
                {
                  title: "Align Your Team",
                  description:
                    "Share insights with stakeholders. Everyone sees the same data and priorities.",
                  icon: <Zap className="w-6 h-6" />,
                },
              ].map((item) => (
                <div key={item.title} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 mb-4">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-switzer font-bold text-slate-900 dark:text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto rounded-3xl bg-slate-900 dark:bg-slate-800 p-8 md:p-12 overflow-hidden relative text-center">
            <div className="relative z-10">
              <h2 className="text-xl md:text-3xl font-switzer font-bold text-white mb-8 tracking-tighter leading-tight">
                Ready to see the full picture?
              </h2>
              <p className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                Start with the Expert View free for 14 days. No credit card
                required.
              </p>
              <a
                href="/signup"
                className="inline-flex items-center gap-3 px-6 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-switzer font-black rounded-2xl hover:scale-105 transition-all text-base"
              >
                Start Free Today
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </section>
      </div>

      <LandingFooter showCTA={true} />
    </>
  );
}
