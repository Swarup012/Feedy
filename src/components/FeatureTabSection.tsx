"use client";

import { useState } from "react";
import { Sparkles, TrendingUp, Map, Megaphone, ThumbsUp, Bell, ChevronRight } from "lucide-react";

const tabs = [
  {
    id: "ai",
    label: "AI",
    icon: <Sparkles className="w-4 h-4" />,
    headline: "AI that understands your users, so you don't have to guess.",
    description:
      "Faddy's AI automatically categorizes feedback, detects sentiment, and surfaces the patterns that matter — giving you clarity on what to build next without hours of manual review.",
    stat: { value: "10×", label: "faster feedback analysis with AI" },
    mockup: <VideoMockup />,
  },
  {
    id: "prioritize",
    label: "Focus",
    icon: <TrendingUp className="w-4 h-4" />,
    headline: "Focus",
    description:
      "AI surfaces the 3-5 requests worth building next — ranked by votes, revenue impact, and how often they come up.",
    stat: { value: "3×", label: "faster roadmap decisions" },
    mockup: <PrioritizeMockup />,
  },
  {
    id: "roadmap",
    label: "What matters",
    icon: <Map className="w-4 h-4" />,
    headline: "Understand what truly matters.",
    description:
      "Go beyond simple vote counting. See the 'why' behind the feedback, segment requests by customer type, and identify which features will drive revenue.",
    stat: { value: "80%", label: "better alignment with customer needs" },
    mockup: <RoadmapMockup />,
  },
  {
    id: "changelog",
    label: "Signal",
    icon: <Megaphone className="w-4 h-4" />,
    headline: "Signal",
    description:
      "Cut through the noise. AI separates real demand from one-off asks, so you know what's actually worth your time.",
    stat: { value: "40%", label: "higher user retention after updates" },
    mockup: <ChangelogMockup />,
  },
];

export function FeatureTabSection() {
  const [active, setActive] = useState(0);
  const tab = tabs[active];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex items-center justify-center gap-3 mb-10 overflow-x-auto flex-wrap">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            onClick={() => setActive(i)}
            className={`flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 whitespace-nowrap border
              ${active === i
                ? "bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20"
                : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-800 dark:hover:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-sm"
              }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content area */}
      <div className="grid md:grid-cols-2 gap-8 items-center">
        {/* Left — text */}
        <div className="flex flex-col gap-6">
          <h3 className="text-2xl md:text-3xl font-switzer font-semibold text-slate-900 dark:text-white leading-snug">
            {tab.headline}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-base">
            {tab.description}
          </p>

          {/* Stat pill */}
          <div className="inline-flex items-center gap-3 px-5 py-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-2xl w-fit">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400">{tab.stat.value}</span>
            <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">{tab.stat.label}</span>
          </div>

          <a
            href="/signup"
            className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-sm font-semibold hover:gap-2.5 transition-all duration-200"
          >
            Get started free <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        {/* Right — mockup */}
        <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl shadow-slate-200/60 dark:shadow-slate-900/60">
          {tab.mockup}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────── Mockups ─────────────────────────── */

function VideoMockup() {
  return (
    <div className="relative w-full aspect-video bg-black overflow-hidden">
      <video
        src="/videos/SaaS_ai_landing.mp4"
        autoPlay
        muted
        loop
        playsInline
        className="w-full h-full object-cover"
      />
    </div>
  );
}

function PrioritizeMockup() {
  const items = [
    { title: "Custom domain support", votes: 312, revenue: "$12k/mo", mentions: 84 },
    { title: "API access & webhooks", votes: 241, revenue: "$9.5k/mo", mentions: 62 },
    { title: "SSO Integration", votes: 189, revenue: "$15k/mo", mentions: 41 },
    { title: "Dark mode", votes: 134, revenue: "-", mentions: 120 },
  ];
  return (
    <div className="p-5 bg-slate-50 dark:bg-slate-900 min-h-[280px] flex flex-col justify-center">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI Recommended Focus</span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
          Top 4 Requests
        </span>
      </div>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
            <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm mb-2">{item.title}</div>
            <div className="flex items-center gap-3 text-[10px] font-medium">
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> {item.votes} votes
              </span>
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> {item.revenue} impact
              </span>
              <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> {item.mentions} mentions
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoadmapMockup() {
  const insights = [
    { feature: "API access & webhooks", insight: "Requested by 12 Enterprise accounts", impact: "High Revenue", color: "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800/30" },
    { feature: "SSO Integration", insight: "Dealbreaker for 5 pending sales", impact: "Critical", color: "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800/30" },
    { feature: "Dark mode", insight: "Top voted, low engineering effort", impact: "Quick Win", color: "text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30" },
  ];
  return (
    <div className="p-5 bg-slate-50 dark:bg-slate-900 min-h-[280px] flex flex-col justify-center">
      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-4">What Matters</span>
      <div className="space-y-3">
        {insights.map((item, i) => (
          <div key={i} className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex justify-between items-start mb-1.5">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">{item.feature}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.color}`}>
                {item.impact}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{item.insight}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ChangelogMockup() {
  const entries = [
    { version: "v2.4", date: "Jul 8, 2026", title: "Custom branding & themes", tags: ["New"] },
    { version: "v2.3", date: "Jun 22, 2026", title: "Slack & Discord notifications", tags: ["New", "Integration"] },
    { version: "v2.2", date: "Jun 5, 2026", title: "Improved vote analytics", tags: ["Improvement"] },
  ];
  return (
    <div className="p-5 bg-slate-50 dark:bg-slate-900 min-h-[280px]">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-3.5 h-3.5 text-blue-500" />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">What's New</span>
      </div>
      <div className="space-y-3">
        {entries.map((entry, i) => (
          <div key={i} className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              {entry.tags.map((tag) => (
                <span key={tag} className="text-[10px] font-bold px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-md">
                  {tag}
                </span>
              ))}
              <span className="text-[10px] text-slate-400 ml-auto">{entry.date}</span>
            </div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{entry.title}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
