"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Pause, Play } from "lucide-react";

const tabs = [
  {
    id: "ai",
    label: "AI",
    headline: "AI that understands your users, so you don’t have to guess.",
    description:
      "Faddy’s AI automatically categorizes feedback, detects sentiment, and surfaces the patterns that matter, giving you clarity on what to build next without hours of manual review.",
    stat: { value: "10×", label: "faster feedback analysis with AI" },
  },
  {
    id: "prioritize",
    label: "Focus",
    headline: "Focus",
    description:
      "AI surfaces the 3-5 requests worth building next, ranked by votes, revenue impact, and how often they come up.",
    stat: { value: "3×", label: "faster roadmap decisions" },
  },
  {
    id: "roadmap",
    label: "What matters",
    headline: "Understand what truly matters.",
    description:
      "Go beyond simple vote counting. See the ‘why’ behind the feedback, segment requests by customer type, and identify which features will drive revenue.",
    stat: { value: "80%", label: "better alignment with customer needs" },
  },
  {
    id: "changelog",
    label: "Signal",
    headline: "Signal",
    description:
      "Cut through the noise. AI separates real demand from one-off asks, so you know what’s actually worth your time.",
    stat: { value: "40%", label: "higher user retention after updates" },
  },
];

function PrioritizeSample() {
  const items = [
    { title: "Custom domain support", votes: 312, revenue: "$12k/mo", mentions: 84 },
    { title: "API access & webhooks", votes: 241, revenue: "$9.5k/mo", mentions: 62 },
    { title: "SSO Integration", votes: 189, revenue: "$15k/mo", mentions: 41 },
    { title: "Dark mode", votes: 134, revenue: null, mentions: 120 },
  ];
  return (
    <figure className="ft-visual ft-visual--sample">
      <div className="ft-sample__head">
        <span className="ft-sample__label">AI recommended focus</span>
        <span className="ft-tag">Top 4 requests</span>
      </div>
      <ul className="ft-list">
        {items.map((item) => (
          <li key={item.title} className="ft-row">
            <span className="ft-row__title">{item.title}</span>
            <span className="ft-row__meta">
              <span>{item.votes} votes</span>
              <span>{item.revenue ? `${item.revenue} impact` : "No revenue impact"}</span>
              <span>{item.mentions} mentions</span>
            </span>
          </li>
        ))}
      </ul>
    </figure>
  );
}

function RoadmapSample() {
  const insights = [
    { feature: "API access & webhooks", insight: "Requested by 12 Enterprise accounts", impact: "High revenue" },
    { feature: "SSO Integration", insight: "Dealbreaker for 5 pending sales", impact: "Critical" },
    { feature: "Dark mode", insight: "Top voted, low engineering effort", impact: "Quick win" },
  ];
  return (
    <figure className="ft-visual ft-visual--sample">
      <div className="ft-sample__head">
        <span className="ft-sample__label">What matters</span>
      </div>
      <div className="ft-insights">
        {insights.map((item) => (
          <div key={item.feature} className="ft-insight">
            <div className="ft-insight__head">
              <span className="ft-row__title">{item.feature}</span>
              <span className="ft-tag">{item.impact}</span>
            </div>
            <p>{item.insight}</p>
          </div>
        ))}
      </div>
    </figure>
  );
}

function ChangelogSample() {
  const entries = [
    { date: "Jul 8, 2026", title: "Custom branding & themes", tag: "New" },
    { date: "Jun 22, 2026", title: "Slack & Discord notifications", tag: "Integration" },
    { date: "Jun 5, 2026", title: "Improved vote analytics", tag: "Improvement" },
  ];
  return (
    <figure className="ft-visual ft-visual--sample">
      <div className="ft-sample__head">
        <span className="ft-sample__label">What’s new</span>
      </div>
      <div className="ft-insights">
        {entries.map((entry) => (
          <div key={entry.title} className="ft-insight">
            <div className="ft-insight__head">
              <span className="ft-row__title">{entry.title}</span>
              <span className="ft-tag">{entry.tag}</span>
            </div>
            <p className="ft-sample__date">{entry.date}</p>
          </div>
        ))}
      </div>
    </figure>
  );
}

function AiVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
      setPlaying(false);
      return;
    }
    video.play().catch(() => setPlaying(false));
  }, []);

  const toggle = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => setPlaying(false));
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  return (
    <figure className="ft-visual ft-visual--capture">
      <video
        ref={videoRef}
        src="/videos/SaaS_ai_landing.mp4"
        poster="/videos/SaaS_ai_landing-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      <button
        type="button"
        onClick={toggle}
        className="ft-visual__pause"
        aria-label={playing ? "Pause the product video" : "Play the product video"}
      >
        {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
      </button>
    </figure>
  );
}

const visuals: Record<string, ReactNode> = {
  ai: <AiVideo />,
  prioritize: <PrioritizeSample />,
  roadmap: <RoadmapSample />,
  changelog: <ChangelogSample />,
};

export function FeatureTabSection() {
  const [active, setActive] = useState(0);
  const tab = tabs[active];

  return (
    <div>
      <div className="ft-seg" role="tablist" aria-label="What Faddy does">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`ft-tab-${t.id}`}
            aria-selected={active === i}
            aria-controls="ft-panel"
            onClick={() => setActive(i)}
            className="ft-tab"
          >
            {t.label}
          </button>
        ))}
      </div>

      <div
        className="ft-panel"
        role="tabpanel"
        id="ft-panel"
        aria-labelledby={`ft-tab-${tab.id}`}
      >
        <div className="ft-panel__text">
          <h3>{tab.headline}</h3>
          <p>{tab.description}</p>
          <p className="ft-stat">
            <b>{tab.stat.value}</b>
            <span>{tab.stat.label}</span>
          </p>
          <a href="/signup" className="ft-link">
            Get started free
          </a>
        </div>
        <div className="ft-panel__visual">{visuals[tab.id]}</div>
      </div>
    </div>
  );
}
