"use client";
import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { LandingFooter } from "@/components/ui/landing-footer";
import { FeatureTabSection } from "@/components/FeatureTabSection";
import { HeroBackdrop } from "@/components/ui/hero-backdrop";
import {
  RotatingPhrase,
  type RotatingPhraseItem,
} from "@/components/ui/rotating-phrase";
import { Zap, Webhook, Braces, Puzzle, CheckCircle } from "lucide-react";
import "./landing.css";

const icon = (src: string) => (
  <img
    src={src}
    alt=""
    aria-hidden="true"
    className="lp-hero__phrase-icon"
  />
);

const GITHUB_ICON = (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true"
    className="lp-hero__phrase-icon"
  >
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const INTEGRATIONS: RotatingPhraseItem[] = [
  { label: "Slack", icon: icon("/images/icons/slack-new.svg") },
  { label: "Intercom", icon: icon("/images/icons/intercom.svg") },
  { label: "GitHub", icon: GITHUB_ICON },
  { label: "Discord", icon: icon("/images/icons/discord.svg") },
];

const INSIGHTS: RotatingPhraseItem[] = [
  { label: "what customers want" },
  { label: "recurring pain points" },
  { label: "trending requests" },
];

const PRIORITIES: RotatingPhraseItem[] = [
  { label: "what to build next" },
  { label: "the next feature" },
  { label: "what matters most" },
];

const HERO_STATS = [
  "Free plan available",
  "AI-powered insights",
  "Built for teams",
];

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const handleClick = () => {
    router.push("/signup");
  };

  useEffect(() => {
    // --- ORIGINAL BUSINESS LOGIC (PRESERVED) ---
    const hostname = window.location.hostname;
    const parts = hostname.split(".");

    let subdomain = null;

    // Production: company.domain.com
    if (parts.length >= 3 && !hostname.includes("localhost")) {
      subdomain = parts[0];
      if (subdomain === "www" || subdomain === "api" || subdomain === "admin") {
        subdomain = null;
      }
    }

    // Development: company.localhost:5173
    if (
      hostname.includes("localhost") &&
      parts.length > 1 &&
      parts[0] !== "localhost"
    ) {
      subdomain = parts[0];
    }

    const redirectLogic = async () => {
      // If HAS subdomain, redirect to that organization's public feedback
      // This allows users to view ANY organization's public pages
      if (!loading && subdomain) {
        try {
          const { boardService } = await import("@/services/boardService");
          const response = await boardService.getPublicBoards();
          const publicBoards = response.data.boards;

          if (publicBoards.length > 0) {
            router.push("/feedback");
            return;
          }
        } catch (error) {
          console.error("Error loading public boards:", error);
        }
      }

      // If NO subdomain and user is authenticated, go to their admin dashboard
      if (!loading && user && !subdomain) {
        router.push("/admin");
        return;
      }
    };

    redirectLogic();
  }, [user, loading, router]);

  return (
    <div className="lp-root">
      <a className="lp-skip" href="#main">
        Skip to content
      </a>

      <main id="main">
        {/* Hero · the owner's rotating statement over the drifting-signal backdrop, kept */}
        <section className="lp-hero">
          <HeroBackdrop />
          <div className="lp-hero__inner lp-wrap">
            <span className="lp-hero__note">Up and running in minutes</span>
            <h1 className="lp-hero__title">
              <span className="lp-hero__line">
                Collect feedback from <RotatingPhrase items={INTEGRATIONS} />
              </span>
              <span className="lp-hero__line">
                Understand <RotatingPhrase items={INSIGHTS} />
              </span>
              <span className="lp-hero__line">
                And prioritize <RotatingPhrase items={PRIORITIES} />
              </span>
            </h1>
            <p className="lp-hero__lead">
              Bring customer feedback together, uncover patterns with AI, and
              decide what to build next.
            </p>
            <div className="lp-hero__actions">
              <button type="button" onClick={handleClick} className="lp-btn">
                Try for Free
              </button>
              <a href="/pricing" className="lp-btn lp-btn--quiet">
                View Pricing
              </a>
            </div>
            <ul className="lp-hero__stats">
              {HERO_STATS.map((stat) => (
                <li key={stat} className="lp-hero__stat">
                  <CheckCircle size={16} aria-hidden="true" />
                  {stat}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Tabs · Switcher: the full loop in four panels */}
        <section className="lp-tabs lp-wrap">
          <div className="lp-tabs__head">
            <h2>Collect, understand, prioritize</h2>
            <p className="lead">
              The full loop, from first idea to shipped changelog.
            </p>
          </div>
          <FeatureTabSection />
        </section>

        {/* Integrations · Rows: eight ways feedback arrives */}
        <section className="lp-integrations lp-wrap">
          <div className="lp-head">
            <h2>Automate with your favorite apps</h2>
            <p className="lead">
              Connect Faddy to the tools your team already uses, plus
              everything else through Zapier, webhooks and our API. Feedback
              flows in automatically.
            </p>
          </div>
          <div className="lp-rows">
            <div className="lp-row">
              <span className="lp-row__icon">
                <img
                  src="/images/icons/intercom.svg"
                  alt=""
                  width={24}
                  height={24}
                />
              </span>
              <div>
                <h3>Intercom</h3>
                <p>Turn conversations into actionable product feedback.</p>
              </div>
            </div>
            <div className="lp-row">
              <span className="lp-row__icon">
                <img
                  src="/images/icons/slack-new.svg"
                  alt=""
                  width={24}
                  height={24}
                />
              </span>
              <div>
                <h3>Slack</h3>
                <p>
                  Monitor a Slack channel and convert messages into actionable
                  feedback.
                </p>
              </div>
            </div>
            <div className="lp-row">
              <span className="lp-row__icon">
                <img
                  src="/images/icons/discord.svg"
                  alt=""
                  width={24}
                  height={24}
                />
              </span>
              <div>
                <h3>Discord</h3>
                <p>Capture community conversations as structured feedback.</p>
              </div>
            </div>
            <div className="lp-row">
              <span className="lp-row__icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  width={24}
                  height={24}
                  aria-hidden="true"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </span>
              <div>
                <h3>GitHub</h3>
                <p>
                  Track issues and pull requests as feedback via GitHub App
                  webhooks.
                </p>
              </div>
            </div>
            <div className="lp-row">
              <span className="lp-row__icon">
                <Zap size={24} strokeWidth={1.5} aria-hidden="true" />
              </span>
              <div>
                <h3>Zapier</h3>
                <p>
                  Trigger Faddy from thousands of other apps, no code
                  required.
                </p>
              </div>
            </div>
            <div className="lp-row">
              <span className="lp-row__icon">
                <Webhook size={24} strokeWidth={1.5} aria-hidden="true" />
              </span>
              <div>
                <h3>Webhooks</h3>
                <p>Send new feedback to any URL the moment it lands.</p>
              </div>
            </div>
            <div className="lp-row">
              <span className="lp-row__icon">
                <Braces size={24} strokeWidth={1.5} aria-hidden="true" />
              </span>
              <div>
                <h3>REST API</h3>
                <p>Full read/write API and scoped keys for your own stack.</p>
              </div>
            </div>
            <div className="lp-row">
              <span className="lp-row__icon">
                <Puzzle size={24} strokeWidth={1.5} aria-hidden="true" />
              </span>
              <div>
                <h3>Any other tool</h3>
                <p>
                  Missing something? Route it in and out via Zapier, webhooks
                  or the API.
                </p>
              </div>
            </div>
          </div>
          <a href="/integrations" className="lp-more">
            Browse all integrations
          </a>
        </section>

        {/* Statement band · Committed field: the position, and the two facts */}
        <section className="lp-band">
          <div className="lp-wrap">
            <div className="lp-band__grid">
              <div className="lp-band__left">
                <h2>Stop building in the dark.</h2>
                <dl className="lp-band__facts">
                  <div>
                    <dt>Built for</dt>
                    <dd>
                      Startups and indie hackers. Not enterprise. No
                      complexity. No per-user pricing traps.
                    </dd>
                  </div>
                  <div>
                    <dt>Pricing starts at</dt>
                    <dd>
                      Free. Upgrade to $19/mo when you&apos;re ready. No
                      credit card to start.
                    </dd>
                  </div>
                </dl>
              </div>
              <ul className="lp-band__claims">
                <li>
                  Know exactly what your users want before you write a single
                  line of code
                </li>
                <li>
                  Public roadmap builds trust and reduces repetitive support
                  questions
                </li>
                <li>Changelog keeps users excited about every update you ship</li>
                <li>
                  Flat pricing that scales with your product, not your user
                  count
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Closing band: the one action, restated */}
        <section className="lp-cta lp-wrap">
          <div className="lp-cta__inner">
            <div className="lp-cta__text">
              <h2>Your users are waiting to tell you what to build</h2>
              <p>
                Start collecting feedback in minutes. Free plan available, no
                credit card required.
              </p>
            </div>
            <a href="/signup" className="lp-btn">
              Start Free Today
            </a>
          </div>
        </section>
      </main>

      <LandingFooter showCTA={true} />
    </div>
  );
}
