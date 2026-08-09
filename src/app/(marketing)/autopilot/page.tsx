"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MessageSquare,
  Zap,
  CheckCircle2,
  ArrowRight,
  Link2,
  Sparkles,
  Eye,
  Slack,
  Clock,
  Target,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { LandingFooter } from "@/components/ui/landing-footer";

export default function AutopilotPage() {
  return (
    <>
      <div className="min-h-screen bg-white dark:bg-background">
        {/* ─── Hero Section ─── */}
        <section className="relative py-16 lg:py-20 overflow-hidden bg-white dark:bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
              {/* Left — Copy */}
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-semibold mb-6">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  AI-powered feedback capture
                </div>

                <h1 className="text-3xl lg:text-4xl xl:text-5xl font-switzer font-medium text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">
                  Feedback is already happening.{" "}
                  <span className="text-blue-600 dark:text-blue-400">
                    Autopilot makes sure you see it.
                  </span>
                </h1>

                <p className="text-lg lg:text-xl text-slate-600 dark:text-gray-400 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Autopilot reads every conversation across your connected tools
                  and turns real user requests into feedback posts —
                  automatically.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Link href="/signup">
                    <Button
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg w-full sm:w-auto"
                    >
                      Try for Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <a
                    href="#how-it-works"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-switzer font-semibold rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-sm"
                  >
                    See how it works
                  </a>
                </div>
              </div>

              {/* Right — Animated Visual */}
              <div className="flex-1 w-full max-w-lg lg:max-w-none">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900">
                  {/* Browser chrome */}
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span className="w-3 h-3 rounded-full bg-green-400" />
                    <div className="ml-3 flex-1 bg-white dark:bg-slate-700 rounded-md px-3 py-0.5 text-xs text-slate-400 dark:text-slate-500 font-mono">
                      faddy.site/autopilot
                    </div>
                  </div>

                  {/* Animation Canvas */}
                  <div className="relative h-64 sm:h-80 overflow-hidden">
                    <AutopilotAnimation />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Problem Section ─── */}
        <section className="py-16 px-6 bg-white dark:bg-background">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-xl lg:text-2xl text-slate-600 dark:text-gray-400 leading-relaxed font-switzer">
              Most product feedback never makes it to a board. It&apos;s buried
              in Slack threads, support tickets, and sales calls — and by the
              time someone remembers to write it down, it&apos;s forgotten.
            </p>
          </div>
        </section>

        {/* ─── How It Works ─── */}
        <section
          id="how-it-works"
          className="py-16 lg:py-20 px-6 bg-white dark:bg-background border-y border-slate-100 dark:border-slate-800"
        >
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-2xl lg:text-3xl font-switzer font-bold text-slate-900 dark:text-white mb-4">
                How Autopilot works
              </h2>
              <p className="text-lg text-slate-600 dark:text-gray-400 max-w-2xl mx-auto">
                Three steps from conversation to actionable feedback.
              </p>
            </div>

            <div className="space-y-12">
              {/* Step 1 — Connect */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="order-2 lg:order-1">
                  <div className="bg-slate-100 dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                          <Link2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">
                            Connected Sources
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            2 active integrations
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {[
                          "Slack — #product-feedback",
                          "Intercom — Conversations",
                        ].map((source, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700"
                          >
                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                            <span className="text-sm text-slate-700 dark:text-slate-300">
                              {source}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="order-1 lg:order-2">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center justify-center h-12 w-12 bg-blue-600 text-white rounded-full text-xl font-bold shrink-0">
                      1
                    </div>
                    <h3 className="text-xl font-switzer font-bold text-slate-900 dark:text-white">
                      Connect
                    </h3>
                  </div>
                  <p className="text-lg text-slate-600 dark:text-gray-400 mb-4">
                    Link Slack, Intercom, or paste conversations directly. No
                    manual copy-pasting.
                  </p>
                  <ul className="space-y-2">
                    {[
                      "One-click Slack workspace integration",
                      "Intercom conversation sync",
                      "Paste any text directly",
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                        <span className="text-slate-700 dark:text-gray-300">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Step 2 — Autopilot Reads */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center justify-center h-12 w-12 bg-blue-600 text-white rounded-full text-xl font-bold shrink-0">
                      2
                    </div>
                    <h3 className="text-xl font-switzer font-bold text-slate-900 dark:text-white">
                      Autopilot reads
                    </h3>
                  </div>
                  <p className="text-lg text-slate-600 dark:text-gray-400 mb-4">
                    A two-stage AI pipeline filters noise from real feedback,
                    then extracts a clean title and description from the raw
                    conversation.
                  </p>
                  <ul className="space-y-2">
                    {[
                      "Stage 1: Filter out noise, greetings, and off-topic messages",
                      "Stage 2: Extract a clean title + description",
                      "Tagged with source: 'autopilot' for full traceability",
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                        <span className="text-slate-700 dark:text-gray-300">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="bg-slate-100 dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">
                            AI Pipeline
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Two-stage processing
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                          <div className="text-xs font-semibold text-amber-600 mb-1">
                            Stage 1 — Filter
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            12 conversations → 4 with real feedback
                          </div>
                        </div>
                        <div className="flex justify-center">
                          <div className="w-px h-4 bg-slate-200 dark:bg-slate-700" />
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700">
                          <div className="text-xs font-semibold text-blue-600 mb-1">
                            Stage 2 — Extract
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Clean title + description generated
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 — Feedback Appears */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div className="order-2 lg:order-1">
                  <div className="bg-slate-100 dark:bg-gray-800 rounded-2xl p-6 shadow-xl">
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-5">
                      <div className="space-y-3">
                        {[
                          {
                            title: "Add dark mode to settings",
                            tag: "via Autopilot",
                            source: "Slack",
                          },
                          {
                            title: "Export feedback as CSV",
                            tag: "via Autopilot",
                            source: "Intercom",
                          },
                          {
                            title: "Mobile app push notifications",
                            tag: "via Autopilot",
                            source: "Slack",
                          },
                        ].map((item, i) => (
                          <div
                            key={i}
                            className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-700"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                                {item.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-medium">
                                {item.tag}
                              </span>
                              <span className="text-xs text-slate-400">
                                from {item.source}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="order-1 lg:order-2">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center justify-center h-12 w-12 bg-blue-600 text-white rounded-full text-xl font-bold shrink-0">
                      3
                    </div>
                    <h3 className="text-xl font-switzer font-bold text-slate-900 dark:text-white">
                      Feedback appears
                    </h3>
                  </div>
                  <p className="text-lg text-slate-600 dark:text-gray-400 mb-4">
                    Choose manual mode (review before it&apos;s posted) or
                    automatic mode (published straight to your board), tagged so
                    you always know it came from Autopilot.
                  </p>
                  <ul className="space-y-2">
                    {[
                      "Manual mode: review every suggestion before publishing",
                      "Automatic mode: publish straight to your board",
                      "Every post tagged by source for traceability",
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                        <span className="text-slate-700 dark:text-gray-300">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Manual vs Automatic Mode ─── */}
        <section className="py-16 lg:py-20 px-6 bg-white dark:bg-background">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl lg:text-3xl font-switzer font-bold text-slate-900 dark:text-white mb-4">
                Stay in control, or let it run
              </h2>
              <p className="text-lg text-slate-600 dark:text-gray-400 max-w-2xl mx-auto">
                Two modes built for how your team actually works.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Manual Mode */}
              <Card className="border-slate-200 dark:border-border shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center mb-5">
                    <Eye className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-switzer font-bold text-slate-900 dark:text-white mb-3">
                    Manual mode
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400 leading-relaxed">
                    Review every suggestion before it goes live. Autopilot
                    extracts and formats the feedback, but you decide what makes
                    it to the board. Perfect for teams that want a human in the
                    loop.
                  </p>
                </CardContent>
              </Card>

              {/* Automatic Mode */}
              <Card className="border-slate-200 dark:border-border shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mb-5">
                    <Zap className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="text-xl font-switzer font-bold text-slate-900 dark:text-white mb-3">
                    Automatic mode
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400 leading-relaxed">
                    Flip the switch and let Autopilot publish directly to your
                    board. Nothing sits in a queue. Every request is tagged by
                    source so you always know where it came from.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* ─── Integrations ─── */}
        <section className="py-16 px-6 bg-white dark:bg-background border-y border-slate-100 dark:border-slate-800">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl lg:text-3xl font-switzer font-bold text-slate-900 dark:text-white mb-4">
              Works where your conversations happen
            </h2>
            <p className="text-lg text-slate-600 dark:text-gray-400 mb-10 max-w-xl mx-auto">
              Connect the tools your team already uses. Autopilot reads
              conversations from each one.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-6">
              {/* Slack */}
              <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <Slack className="w-6 h-6 text-purple-600" />
                <span className="font-switzer font-semibold text-slate-900 dark:text-white">
                  Slack
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 font-medium">
                  Live
                </span>
              </div>

              {/* Intercom */}
              <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <MessageSquare className="w-6 h-6 text-blue-500" />
                <span className="font-switzer font-semibold text-slate-900 dark:text-white">
                  Intercom
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 font-medium">
                  Live
                </span>
              </div>

              {/* Discord — Coming Soon */}
              <div className="flex items-center gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 opacity-60">
                <svg
                  className="w-6 h-6 text-indigo-500"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z" />
                </svg>
                <span className="font-switzer font-semibold text-slate-900 dark:text-white">
                  Discord
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400 font-medium">
                  Coming soon
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Why It Matters ─── */}
        <section className="py-16 lg:py-20 px-6 bg-blue-600 overflow-hidden relative">
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-2xl lg:text-3xl font-switzer font-bold text-white mb-4">
                Why it matters
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: <Target className="w-5 h-5" />,
                  title: "Stop losing feedback",
                  description:
                    "Every request is tagged by source, so you always know where an idea came from.",
                },
                {
                  icon: <Clock className="w-5 h-5" />,
                  title: "Save hours every week",
                  description:
                    "Small teams don't have time to manually triage — Autopilot does the first pass for you.",
                },
                {
                  icon: <Shield className="w-5 h-5" />,
                  title: "Nothing falls through",
                  description:
                    "Stop losing feedback in threads no one revisits. Every conversation is captured.",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-6 bg-white/10 rounded-2xl border border-white/20"
                >
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-4 text-white">
                    {item.icon}
                  </div>
                  <h3 className="text-lg font-switzer font-bold text-white mb-2">
                    {item.title}
                  </h3>
                  <p className="text-blue-100 leading-relaxed text-sm">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA Footer ─── */}
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto rounded-3xl bg-slate-900 dark:bg-slate-800 p-8 md:p-12 overflow-hidden relative text-center">
            <div className="relative z-10">
              <h2 className="text-xl md:text-3xl font-switzer font-bold text-white mb-8 tracking-tighter leading-tight">
                Turn your conversations into a roadmap.
              </h2>
              <p className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                Start capturing feedback automatically. Free plan available — no
                credit card required.
              </p>
              <a
                href="/signup"
                className="inline-flex items-center gap-3 px-6 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-switzer font-black rounded-2xl hover:scale-105 transition-all shadow-xl shadow-white/10 text-base"
              >
                Try for Free
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <LandingFooter showCTA={false} />
    </>
  );
}

/* ─── Autopilot Animation (Pure CSS) ─── */
function AutopilotAnimation() {
  return (
    <div className="relative w-full h-full flex items-center justify-center bg-white dark:bg-slate-950 overflow-hidden">
      {/* Left side — incoming messages */}
      <div className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 flex flex-col gap-3 animate-slide-in">
        {[
          { color: "bg-purple-500", delay: "0s" },
          { color: "bg-blue-500", delay: "0.3s" },
          { color: "bg-indigo-500", delay: "0.6s" },
        ].map((msg, i) => (
          <div
            key={i}
            className={`w-16 sm:w-20 h-10 sm:h-12 ${msg.color} rounded-xl opacity-80 animate-float`}
            style={{ animationDelay: msg.delay }}
          >
            <div className="flex items-center gap-1 p-2">
              <div className="w-2 h-2 rounded-full bg-white/60" />
              <div className="flex-1 space-y-1">
                <div className="h-1 bg-white/40 rounded w-full" />
                <div className="h-1 bg-white/40 rounded w-2/3" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Center — AI Filter */}
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-amber-500 shadow-lg shadow-amber-500/30 flex items-center justify-center animate-pulse-slow">
            <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
          </div>
          <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
            <span className="text-[10px] font-bold text-white">AI</span>
          </div>
        </div>
        <div className="mt-2 text-xs font-switzer font-semibold text-slate-500 dark:text-slate-400">
          Two-stage filter
        </div>
      </div>

      {/* Right side — output cards */}
      <div className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 flex flex-col gap-3">
        {[{ delay: "1.5s" }, { delay: "2.2s" }, { delay: "2.9s" }].map(
          (card, i) => (
            <div
              key={i}
              className="w-20 sm:w-24 h-12 sm:h-14 bg-white dark:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 shadow-md opacity-0 animate-fade-in-card"
              style={{ animationDelay: card.delay }}
            >
              <div className="p-2 space-y-1.5">
                <div className="h-1.5 bg-slate-200 dark:bg-slate-600 rounded w-full" />
                <div className="h-1.5 bg-slate-200 dark:bg-slate-600 rounded w-3/4" />
                <div className="flex items-center gap-1 mt-1">
                  <div className="h-1 w-8 bg-blue-200 dark:bg-blue-800 rounded" />
                  <div className="h-1 w-6 bg-slate-100 dark:bg-slate-600 rounded" />
                </div>
              </div>
            </div>
          ),
        )}
      </div>

      {/* Flow lines */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 400 300"
        preserveAspectRatio="none"
      >
        {/* Left to center */}
        <path
          d="M 80 100 Q 160 150 180 150"
          fill="none"
          stroke="rgba(148,163,184,0.3)"
          strokeWidth="2"
          strokeDasharray="6 4"
          className="animate-dash"
        />
        <path
          d="M 80 150 Q 160 150 180 150"
          fill="none"
          stroke="rgba(148,163,184,0.3)"
          strokeWidth="2"
          strokeDasharray="6 4"
          className="animate-dash"
          style={{ animationDelay: "0.2s" }}
        />
        <path
          d="M 80 200 Q 160 150 180 150"
          fill="none"
          stroke="rgba(148,163,184,0.3)"
          strokeWidth="2"
          strokeDasharray="6 4"
          className="animate-dash"
          style={{ animationDelay: "0.4s" }}
        />
        {/* Center to right */}
        <path
          d="M 220 150 Q 280 150 320 120"
          fill="none"
          stroke="rgba(59,130,246,0.4)"
          strokeWidth="2"
          strokeDasharray="6 4"
          className="animate-dash"
          style={{ animationDelay: "1s" }}
        />
        <path
          d="M 220 150 Q 280 150 320 150"
          fill="none"
          stroke="rgba(59,130,246,0.4)"
          strokeWidth="2"
          strokeDasharray="6 4"
          className="animate-dash"
          style={{ animationDelay: "1.2s" }}
        />
        <path
          d="M 220 150 Q 280 150 320 180"
          fill="none"
          stroke="rgba(59,130,246,0.4)"
          strokeWidth="2"
          strokeDasharray="6 4"
          className="animate-dash"
          style={{ animationDelay: "1.4s" }}
        />
      </svg>

      <style jsx>{`
        @keyframes slide-in {
          0% {
            transform: translateY(-50%) translateX(-20px);
            opacity: 0;
          }
          100% {
            transform: translateY(-50%) translateX(0);
            opacity: 1;
          }
        }
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-4px);
          }
        }
        @keyframes pulse-slow {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        @keyframes fade-in-card {
          0% {
            opacity: 0;
            transform: translateX(10px);
          }
          100% {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes dash {
          to {
            stroke-dashoffset: -20;
          }
        }
        .animate-slide-in {
          animation: slide-in 0.8s ease-out forwards;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        .animate-fade-in-card {
          animation: fade-in-card 0.5s ease-out forwards;
        }
        .animate-dash {
          animation: dash 1.5s linear infinite;
        }
      `}</style>
    </div>
  );
}
