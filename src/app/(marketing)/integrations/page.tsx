"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  CheckCircle2,
  Plug,
  Zap,
  MessageSquare,
  GitBranch,
  Bell,
} from "lucide-react";
import Link from "next/link";
import { LandingFooter } from "@/components/ui/landing-footer";

const integrations = [
  {
    name: "Intercom",
    description:
      "Turn conversations into actionable product feedback. Autopilot reads Intercom messages and creates feedback posts automatically.",
    icon: (
      <img
        src="/images/icons/intercom.svg"
        alt="Intercom"
        className="h-8 w-8"
      />
    ),
    color: "#1F8DED",
    features: [
      "Auto-capture feedback from conversations",
      "Tag and categorize incoming requests",
      "Real-time sync with your feedback board",
    ],
  },
  {
    name: "Slack",
    description:
      "Monitor any Slack channel and convert messages into structured feedback. Never miss a feature request again.",
    icon: (
      <img
        src="/images/icons/slack-new.svg"
        alt="Slack"
        className="h-8 w-8"
      />
    ),
    color: "#E01E5A",
    features: [
      "Monitor multiple Slack channels",
      "AI-powered sentiment analysis",
      "Automatic duplicate detection",
    ],
  },
  {
    name: "Discord",
    description:
      "Capture community conversations as structured feedback. Keep your community engaged while building what they want.",
    icon: (
      <img
        src="/images/icons/discord.svg"
        alt="Discord"
        className="h-8 w-8"
      />
    ),
    color: "#5865F2",
    features: [
      "Track feature requests from discussions",
      "Monitor multiple servers and channels",
      "Automatic prioritization based on votes",
    ],
  },
  {
    name: "GitHub",
    description:
      "Track issues and pull requests as product feedback via GitHub App webhooks. Link code changes to user requests.",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-8 w-8 text-slate-900 dark:text-white"
      >
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
      </svg>
    ),
    color: "#24292F",
    features: [
      "Sync issues as feedback items",
      "Link PRs to feature requests",
      "Track implementation status",
    ],
  },
];

export default function IntegrationsPage() {
  return (
    <>
      <div className="min-h-screen bg-white dark:bg-background">
        {/* Hero Section */}
        <section className="relative py-16 lg:py-20 overflow-hidden bg-white dark:bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-semibold mb-6">
                <Plug className="w-4 h-4" />
                Seamless Integrations
              </div>

              <h1 className="text-3xl lg:text-4xl xl:text-5xl font-switzer font-medium text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">
                Connect your favorite tools.{" "}
                <span className="text-blue-600 dark:text-blue-400">
                  Capture every voice.
                </span>
              </h1>

              <p className="text-lg lg:text-xl text-slate-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto leading-relaxed">
                Faddy integrates with the tools your team already uses. Feedback
                flows in automatically — no manual work required.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/signup">
                  <Button
                    size="lg"
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg w-full sm:w-auto"
                  >
                    Start Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <a
                  href="#integrations"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-switzer font-semibold rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-sm"
                >
                  View All Integrations
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Integrations Grid */}
        <section
          id="integrations"
          className="py-16 px-6 bg-slate-50/50 dark:bg-slate-900/50 border-y border-slate-100 dark:border-slate-800"
        >
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-6">
              {integrations.map((integration) => (
                <Card
                  key={integration.name}
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all group overflow-hidden"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div
                        className="h-14 w-14 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: `${integration.color}15` }}
                      >
                        {integration.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-switzer font-bold text-slate-900 dark:text-white mb-2">
                          {integration.name}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                          {integration.description}
                        </p>
                        <ul className="space-y-2">
                          {integration.features.map((feature, idx) => (
                            <li
                              key={idx}
                              className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400"
                            >
                              <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 px-6 bg-white dark:bg-background">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-switzer font-bold tracking-tight text-slate-900 dark:text-white mb-4">
                Three steps to automated feedback
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                Get started in minutes, not days. No complex setup required.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  title: "Connect",
                  description:
                    "Link your tools with a few clicks. No code required.",
                  icon: <Plug className="w-6 h-6" />,
                },
                {
                  step: "02",
                  title: "Capture",
                  description:
                    "AI reads conversations and extracts feature requests automatically.",
                  icon: <MessageSquare className="w-6 h-6" />,
                },
                {
                  step: "03",
                  title: "Prioritize",
                  description:
                    "See what users want most. Build with confidence.",
                  icon: <Zap className="w-6 h-6" />,
                },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-4">
                    {item.icon}
                  </div>
                  <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-2">
                    Step {item.step}
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
                Ready to capture every voice?
              </h2>
              <p className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                Start collecting feedback from all your tools in minutes. Free
                plan available — no credit card required.
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
