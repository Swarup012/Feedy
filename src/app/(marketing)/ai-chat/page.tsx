"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  CheckCircle2,
  Bot,
  MessageSquare,
  Lightbulb,
  BarChart3,
  Shield,
  Users,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { LandingFooter } from "@/components/ui/landing-footer";

const features = [
  {
    title: "Organization-Specific Context",
    description:
      "The AI assistant understands your entire feedback history, roadmap, and team priorities. Every answer is tailored to your product.",
    icon: <Bot className="w-6 h-6" />,
  },
  {
    title: "Prioritization Guidance",
    description:
      "Ask what to build next and get data-driven recommendations based on user demand, effort estimates, and strategic impact.",
    icon: <BarChart3 className="w-6 h-6" />,
  },
  {
    title: "Problem Solving",
    description:
      "Describe a challenge and the AI suggests solutions drawn from your feedback patterns, industry best practices, and similar products.",
    icon: <Lightbulb className="w-6 h-6" />,
  },
  {
    title: "Team Collaboration",
    description:
      "Share AI insights with your team. Everyone gets the same context on what users want and why it matters.",
    icon: <Users className="w-6 h-6" />,
  },
];

const prompts = [
  {
    question: "What are the top 3 features users are asking for this month?",
    answer:
      "Based on 47 feedback posts from July, your users are requesting: 1) Dark mode (23 votes), 2) API access (18 votes), 3) Mobile app (15 votes). Dark mode has the highest engagement and lowest effort — I'd recommend prioritizing it.",
  },
  {
    question: "Why is churn increasing for our Pro plan?",
    answer:
      "I analyzed 12 cancellation reasons and 8 feedback posts. The main concern is pricing confusion — users don't see the value gap between Free and Pro. Consider adding a comparison page or trial extension to demonstrate Pro features.",
  },
  {
    question: "Should we build the integration or the roadmap feature first?",
    answer:
      "Looking at your data: Integrations have 31 requests (high demand), Roadmap has 24 requests (medium demand). However, Roadmap has higher retention impact based on similar products. If churn reduction is your goal, start with Roadmap.",
  },
];

export default function AiChatPage() {
  return (
    <>
      <div className="min-h-screen bg-white dark:bg-background">
        {/* Hero Section */}
        <section className="relative py-16 lg:py-20 overflow-hidden bg-white dark:bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
              {/* Left — Copy */}
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs sm:text-sm font-semibold mb-6">
                  <Sparkles className="w-4 h-4" />
                  AI-Powered Assistant
                </div>

                <h1 className="text-3xl lg:text-4xl xl:text-5xl font-switzer font-medium text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">
                  Talk to your product data.{" "}
                  <span className="text-purple-600 dark:text-purple-400">
                    Get answers, not just charts.
                  </span>
                </h1>

                <p className="text-lg lg:text-xl text-slate-600 dark:text-gray-400 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Ask questions in plain language. The AI assistant reads your
                  feedback, roadmap, and team context to give you actionable
                  answers — not generic advice.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Link href="/signup">
                    <Button
                      size="lg"
                      className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg w-full sm:w-auto"
                    >
                      Try for Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <a
                    href="#how-it-works"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-switzer font-semibold rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-sm"
                  >
                    See it in action
                  </a>
                </div>
              </div>

              {/* Right — Chat Preview */}
              <div className="flex-1 w-full max-w-lg lg:max-w-none">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900">
                  {/* Browser chrome */}
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span className="w-3 h-3 rounded-full bg-green-400" />
                    <div className="ml-3 flex-1 bg-white dark:bg-slate-700 rounded-md px-3 py-0.5 text-xs text-slate-400 dark:text-slate-500 font-mono">
                      faddy.site/admin/ai-chat
                    </div>
                  </div>

                  {/* Chat UI */}
                  <div className="p-6 space-y-4">
                    {/* User message */}
                    <div className="flex justify-end">
                      <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%] text-sm">
                        What are users asking for most this week?
                      </div>
                    </div>

                    {/* AI response */}
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] text-sm text-slate-700 dark:text-slate-300">
                        <p className="mb-2">
                          This week, 23 new feedback posts mention{" "}
                          <strong>dark mode</strong> as the top request.
                        </p>
                        <p className="mb-2">
                          Key insights:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                          <li>8 posts from Pro users (high priority)</li>
                          <li>Related to accessibility concerns</li>
                          <li>Competitor X just shipped this</li>
                        </ul>
                        <p className="mt-2 text-purple-600 dark:text-purple-400 font-medium">
                          Recommendation: Prioritize dark mode for next sprint.
                        </p>
                      </div>
                    </div>

                    {/* User message */}
                    <div className="flex justify-end">
                      <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%] text-sm">
                        How much effort would that take?
                      </div>
                    </div>

                    {/* AI response */}
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] text-sm text-slate-700 dark:text-slate-300">
                        <p>
                          Based on your codebase size and component library, I
                          estimate <strong>2-3 days</strong> for a basic dark
                          mode. Your existing Tailwind setup makes this
                          straightforward.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Example Prompts */}
        <section
          id="how-it-works"
          className="py-16 px-6 bg-slate-50/50 dark:bg-slate-900/50 border-y border-slate-100 dark:border-slate-800"
        >
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-switzer font-bold tracking-tight text-slate-900 dark:text-white mb-4">
                Ask anything about your product
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                Real questions. Real answers. Powered by your actual data.
              </p>
            </div>

            <div className="space-y-6">
              {prompts.map((prompt, idx) => (
                <Card
                  key={idx}
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden"
                >
                  <CardContent className="p-0">
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                        <MessageSquare className="w-4 h-4 text-blue-500" />
                        {prompt.question}
                      </div>
                    </div>
                    <div className="p-4 flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center shrink-0 mt-0.5">
                        <Bot className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                        {prompt.answer}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 px-6 bg-white dark:bg-background">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-switzer font-bold tracking-tight text-slate-900 dark:text-white mb-4">
                Built for product decisions
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                Not a generic chatbot. A specialized assistant that understands
                your product.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all"
                >
                  <CardContent className="p-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 mb-4">
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

        {/* Who It's For */}
        <section className="py-16 px-6 bg-slate-50/50 dark:bg-slate-900/50 border-y border-slate-100 dark:border-slate-800">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-switzer font-bold tracking-tight text-slate-900 dark:text-white mb-4">
                For owners and admins
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                Role-based access ensures the right people get the right
                insights.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                  <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-switzer font-bold text-slate-900 dark:text-white mb-1">
                    Owners
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    Full access to strategic insights, prioritization
                    recommendations, and competitive analysis.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-switzer font-bold text-slate-900 dark:text-white mb-1">
                    Admins
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                    Access to feedback analysis, team performance metrics, and
                    feature request trends.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto rounded-3xl bg-slate-900 dark:bg-slate-800 p-8 md:p-12 overflow-hidden relative text-center">
            <div className="relative z-10">
              <h2 className="text-xl md:text-3xl font-switzer font-bold text-white mb-8 tracking-tighter leading-tight">
                Stop guessing. Start knowing.
              </h2>
              <p className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                Try the AI assistant free for 14 days. No credit card required.
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
