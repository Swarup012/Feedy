"use client";

import Link from "next/link";
import Image from "next/image";
import { Zap } from "lucide-react";
import { LandingFooter } from "@/components/ui/landing-footer";
import "./integrations.css";

const GITHUB_MARK = (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
  </svg>
);

const TOOLS = [
  {
    name: "Intercom",
    logo: (
      <Image src="/images/icons/intercom.svg" alt="" width={28} height={28} />
    ),
    description:
      "Turn conversations into actionable product feedback. Smartflow reads Intercom messages and creates feedback posts automatically.",
    features: [
      "Auto-capture feedback from conversations",
      "Tag and categorize incoming requests",
      "Real-time sync with your feedback board",
    ],
  },
  {
    name: "Slack",
    logo: (
      <Image src="/images/icons/slack-new.svg" alt="" width={28} height={28} />
    ),
    description:
      "Monitor any Slack channel and convert messages into structured feedback. Never miss a feature request again.",
    features: [
      "Monitor multiple Slack channels",
      "AI-powered sentiment analysis",
      "Automatic duplicate detection",
    ],
  },
  {
    name: "Discord",
    logo: (
      <Image src="/images/icons/discord.svg" alt="" width={28} height={28} />
    ),
    description:
      "Capture community conversations as structured feedback. Keep your community engaged while building what they want.",
    features: [
      "Track feature requests from discussions",
      "Monitor multiple servers and channels",
      "Automatic prioritization based on votes",
    ],
  },
  {
    name: "GitHub",
    logo: GITHUB_MARK,
    description:
      "Track issues and pull requests as product feedback via GitHub App webhooks. Link code changes to user requests.",
    features: [
      "Sync issues as feedback items",
      "Link PRs to feature requests",
      "Track implementation status",
    ],
  },
  {
    name: "Zapier",
    logo: <Zap aria-hidden="true" />,
    description:
      "Send feedback into Faddy from 7,000+ apps, or trigger Zaps when new posts arrive.",
    features: [
      "Feed requests in from 7,000+ connected apps",
      "Trigger a Zap the moment a new post arrives",
      "One-click OAuth, an API key is created for you",
    ],
  },
];

const STEPS = [
  {
    n: "01",
    title: "Connect",
    body: "Link your tools with a few clicks. No code required.",
  },
  {
    n: "02",
    title: "Capture",
    body: "AI reads conversations and extracts feature requests automatically.",
  },
  {
    n: "03",
    title: "Prioritize",
    body: "See what users want most. Build with confidence.",
  },
];

export default function IntegrationsPage() {
  return (
    <>
      <main className="in-wrap" id="main">
        <section className="in-hero">
          <div className="container">
            <div className="in-hero__text">
              <h1>Connect your favorite tools.</h1>
              <p className="lead">
                Feedback flows in from the tools your team already uses.
              </p>
              <div className="in-hero__actions">
                <Link href="/signup" className="in-btn">
                  Start Free
                </Link>
                <a href="#integrations" className="in-btn in-btn--quiet">
                  View all integrations
                </a>
              </div>
            </div>
            <figure
              className="in-hub"
              data-slot="integration-hub"
              data-alt="Diagram: the five connected tools feeding one Faddy feedback board holding the product's sample posts"
            >
              <div className="in-hub__tools">
                {TOOLS.map((t) => (
                  <div className="in-hub__tool" key={t.name}>
                    <span className="in-logo">{t.logo}</span>
                    {t.name}
                    <span className="in-hub__line" aria-hidden="true" />
                  </div>
                ))}
              </div>
              <div className="in-hub__board">
                <div className="in-hub__boardhead">Faddy board</div>
                <ul className="in-hub__posts">
                  <li>
                    Add dark mode to settings
                    <span>from Slack</span>
                  </li>
                  <li>
                    Export feedback as CSV
                    <span>from Intercom</span>
                  </li>
                  <li>
                    Link issues to requests
                    <span>from GitHub</span>
                  </li>
                </ul>
              </div>
              <figcaption className="in-hub__cap">
                Every connected tool writes into one board.
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="in-index" id="integrations">
          <div className="container">
            <div className="in-index__head">
              <h2>The integrations, one by one</h2>
              <p className="lead">
                Five ways feedback reaches your board today.
              </p>
            </div>
            <dl className="in-index__rows">
              {TOOLS.map((t) => (
                <div className="in-tool" key={t.name}>
                  <dt>
                    <span className="in-logo in-logo--lg">{t.logo}</span>
                    {t.name}
                  </dt>
                  <dd>
                    <p className="in-tool__desc">{t.description}</p>
                    <ul className="in-tool__features">
                      {t.features.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="in-steps">
          <div className="container">
            <div className="in-steps__head">
              <h2>Three steps to automated feedback</h2>
              <p className="lead">
                Get started in minutes, not days. No complex setup required.
              </p>
            </div>
            <ol className="in-steps__list">
              {STEPS.map((s) => (
                <li className="in-step" key={s.n}>
                  <span className="in-step__num num">{s.n}</span>
                  <div>
                    <h3>{s.title}</h3>
                    <p>{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="in-close">
          <div className="container in-close__inner">
            <div>
              <h2>Ready to capture every voice?</h2>
              <p>
                Start collecting feedback from all your tools in minutes. Free
                plan available, no card needed.
              </p>
            </div>
            <Link href="/signup" className="in-btn in-btn--band">
              Start Free Today
            </Link>
          </div>
        </section>
      </main>

      <LandingFooter showCTA={true} />
    </>
  );
}
