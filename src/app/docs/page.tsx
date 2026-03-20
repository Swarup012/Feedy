"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowRight, 
  BookOpen, 
  Rocket, 
  Zap, 
  MessageSquare,
  TrendingUp,
  Bell,
  Users,
  CheckCircle2
} from "lucide-react";

export default function DocsHomePage() {
  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-xl mb-4">
          <BookOpen className="h-12 w-12 text-white" />
        </div>
        
        <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-100 dark:to-white bg-clip-text text-transparent tracking-tight">
          Faddy Documentation
        </h1>
        
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Everything you need to collect feedback, build roadmaps, and ship better products.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link href="/docs/getting-started/quick-start">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg gap-2">
              <Rocket className="h-4 w-4" />
              Quick Start Guide
            </Button>
          </Link>
          <Link href="/signup">
            <Button size="lg" variant="outline" className="gap-2 border-2">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Quick Links */}
      <section className="grid md:grid-cols-2 gap-6">
        <Link href="/docs/getting-started/quick-start">
          <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-300 dark:hover:border-blue-700 h-full">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg group-hover:scale-110 transition-transform">
                  <Rocket className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    Getting Started
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Set up your first feedback board in under 5 minutes
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/docs/features/boards">
          <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-300 dark:hover:border-purple-700 h-full">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg group-hover:scale-110 transition-transform">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                    Feedback Boards
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Learn how to organize and manage customer feedback
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/docs/features/roadmap">
          <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-green-300 dark:hover:border-green-700 h-full">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 shadow-lg group-hover:scale-110 transition-transform">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                    Roadmap
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Plan and communicate your product direction
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/docs/features/changelog">
          <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-amber-300 dark:hover:border-amber-700 h-full">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg group-hover:scale-110 transition-transform">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2 text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    Changelog
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Keep users informed about product updates
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </section>

      {/* Features Overview */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
          What You'll Learn
        </h2>
        
        <div className="grid gap-4">
          <div className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                Set up feedback collection in minutes
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Create boards, invite your team, and start collecting feedback right away
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                Organize with boards and statuses
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Categorize feedback, track progress, and keep everything organized
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                Build public roadmaps
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Share your product vision and keep customers in the loop
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white mb-1">
                Manage team permissions
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Control who can view, edit, and manage feedback with role-based access
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-200/50 dark:border-blue-800/50 text-center">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
          Ready to Get Started?
        </h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-xl mx-auto">
          Create your free account and start collecting feedback in minutes
        </p>
        <Link href="/signup">
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 gap-2">
            Start Free Trial
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </section>
    </div>
  );
}
