"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { LandingFooter } from "@/components/ui/landing-footer";
import "./autopilot.css";

const STEPS = [
  {
    n: "01",
    title: "Connect",
    body: "Link Slack, Intercom, or paste conversations directly. No manual copy-pasting.",
    points: [
      "One-click Slack workspace integration",
      "Intercom conversation sync",
      "Paste any text directly",
    ],
    sample: (
      <div className="ap-sample">
        <div className="ap-sample__head">
          Connected sources
          <span className="ap-sample__meta">2 active</span>
        </div>
        <ul className="ap-sample__list">
          <li>Slack, #product-feedback</li>
          <li>Intercom, Conversations</li>
        </ul>
      </div>
    ),
  },
  {
    n: "02",
    title: "Smartflow reads",
    body: "A two-stage AI pipeline filters noise from real feedback, then extracts a clean title and description from the raw conversation.",
    points: [
      "Stage 1 filters out noise, greetings and off-topic messages",
      "Stage 2 extracts a clean title and description",
      "Tagged with its source for full traceability",
    ],
    sample: (
      <div className="ap-sample">
        <div className="ap-sample__head">
          Pipeline pass
          <span className="ap-sample__meta">sample</span>
        </div>
        <ul className="ap-sample__list">
          <li>Stage 1: 12 conversations in, 4 with real feedback out</li>
          <li>Stage 2: clean title and description generated</li>
        </ul>
      </div>
    ),
  },
  {
    n: "03",
    title: "Feedback appears",
    body: "Choose manual mode (review before it is posted) or automatic mode (published straight to your board), tagged so you always know it came from Smartflow.",
    points: [
      "Manual mode: review every suggestion before publishing",
      "Automatic mode: publish straight to your board",
      "Every post tagged by source for traceability",
    ],
    sample: (
      <div className="ap-sample">
        <div className="ap-sample__head">
          Capture modes
          <span className="ap-sample__meta">sample</span>
        </div>
        <ul className="ap-sample__list">
          <li>Manual review queue: Add dark mode to settings</li>
          <li>Published automatically: Export feedback as CSV</li>
          <li>Published automatically: Mobile app push notifications</li>
        </ul>
      </div>
    ),
  },
];

const MODES = [
  {
    tab: "Manual mode",
    title: "Review before it goes live",
    body: "Smartflow extracts and formats the feedback, but you decide what makes it to the board. Perfect for teams that want a human in the loop.",
  },
  {
    tab: "Automatic mode",
    title: "Flip the switch and let it run",
    body: "Smartflow publishes directly to your board. Nothing sits in a queue. Every request is tagged by source so you always know where it came from.",
  },
];

const SOURCES = [
  {
    name: "Slack",
    logo: "/images/icons/slack-new.svg",
    status: "Live",
    body: "Reads the channels you connect, request threads included.",
  },
  {
    name: "Intercom",
    logo: "/images/icons/intercom.svg",
    status: "Live",
    body: "Syncs conversations so support chatter becomes board posts.",
  },
  {
    name: "Discord",
    logo: "/images/icons/discord.svg",
    status: "Coming soon",
    body: "Community servers, captured the same way.",
  },
];

const MATTERS = [
  {
    title: "Stop losing feedback",
    body: "Every request is tagged by source, so you always know where an idea came from.",
  },
  {
    title: "Save hours every week",
    body: "Small teams do not have time to manually triage. Smartflow does the first pass for you.",
  },
  {
    title: "Nothing falls through",
    body: "Stop losing feedback in threads no one revisits. Every conversation is captured.",
  },
];

export default function AutopilotPage() {
  const [mode, setMode] = useState(0);

  return (
    <>
      <main className="ap-wrap" id="main">
        <section className="ap-hero">
          <div className="container ap-hero__inner">
            <div className="ap-hero__text">
              <h1>Feedback is already happening.</h1>
              <p className="lead">
                Every conversation across your connected tools, turned into
                board-ready feedback posts automatically.
              </p>
              <div className="ap-hero__actions">
                <Link href="/signup" className="ap-btn">
                  Try for Free
                </Link>
                <a href="#how-it-works" className="ap-btn ap-btn--quiet">
                  See how it works
                </a>
              </div>
            </div>
            <figure
              className="ap-board"
              data-slot="smartflow-board"
              data-alt="The feedback board filling with source-tagged posts captured via Smartflow, built from the page's own sample content"
            >
              <div className="ap-board__bar">
                <span className="ap-board__mark" aria-hidden="true">
                  SF
                </span>
                On your board
                <span className="ap-board__ctx">read-only view, live tags</span>
              </div>
              <ul className="ap-board__rows">
                <li>
                  <div className="ap-board__post">
                    <span className="ap-board__title">
                      Add dark mode to settings
                    </span>
                    <span className="ap-board__meta">
                      <span className="ap-chip ap-chip--live">via Smartflow</span>
                      from Slack, #product-feedback
                    </span>
                  </div>
                </li>
                <li>
                  <div className="ap-board__post">
                    <span className="ap-board__title">Export feedback as CSV</span>
                    <span className="ap-board__meta">
                      <span className="ap-chip ap-chip--live">via Smartflow</span>
                      from Intercom, Conversations
                    </span>
                  </div>
                </li>
                <li>
                  <div className="ap-board__post">
                    <span className="ap-board__title">
                      Mobile app push notifications
                    </span>
                    <span className="ap-board__meta">
                      <span className="ap-chip ap-chip--live">via Smartflow</span>
                      from Slack, #product-feedback
                    </span>
                  </div>
                </li>
                <li>
                  <div className="ap-board__post">
                    <span className="ap-board__title">
                      Bulk close duplicate requests
                    </span>
                    <span className="ap-board__meta">
                      <span className="ap-chip ap-chip--live">via Smartflow</span>
                      from Intercom, Conversations
                    </span>
                  </div>
                </li>
              </ul>
            </figure>
          </div>
        </section>

        <section className="ap-problem">
          <div className="container">
            <p className="ap-problem__text">
              Most product feedback never makes it to a board. It is buried in
              Slack threads, support tickets and sales calls, and by the time
              someone remembers to write it down, it is forgotten.
            </p>
          </div>
        </section>

        <section className="ap-run" id="how-it-works">
          <div className="container ap-run__inner">
            <div className="ap-run__aside">
              <h2>How Smartflow works</h2>
              <p className="lead">
                Three steps from conversation to actionable feedback.
              </p>
              <ol className="ap-run__index">
                {STEPS.map((s) => (
                  <li key={s.n}>
                    <span className="ap-run__num">{s.n}</span>
                    {s.title}
                  </li>
                ))}
              </ol>
            </div>
            <div className="ap-run__steps">
              {STEPS.map((s) => (
                <article className="ap-step" key={s.n}>
                  <div className="ap-step__head">
                    <span className="ap-step__num">{s.n}</span>
                    <h3>{s.title}</h3>
                  </div>
                  <p className="ap-step__body">{s.body}</p>
                  <ul className="ap-step__points">
                    {s.points.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                  {s.sample}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="ap-modes">
          <div className="container">
            <div className="ap-modes__head">
              <h2>Stay in control, or let it run</h2>
              <p className="lead">
                Two modes built for how your team actually works.
              </p>
            </div>
            <div className="ap-tabs" role="tablist" aria-label="Smartflow modes">
              {MODES.map((m, i) => (
                <button
                  key={m.tab}
                  type="button"
                  role="tab"
                  aria-selected={mode === i}
                  className="ap-tab"
                  onClick={() => setMode(i)}
                >
                  {m.tab}
                </button>
              ))}
            </div>
            {MODES.map((m, i) => (
              <div
                key={m.tab}
                className="ap-mode"
                role="tabpanel"
                hidden={mode !== i}
              >
                <h3>{m.title}</h3>
                <p>{m.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="ap-sources">
          <div className="container">
            <div className="ap-sources__head">
              <h2>Works where your conversations happen</h2>
              <p className="lead">
                Connect the tools your team already uses. Smartflow reads
                conversations from each one.
              </p>
            </div>
            <dl className="ap-sources__rows">
              {SOURCES.map((s) => (
                <div className="ap-source" key={s.name}>
                  <dt>
                    <Image
                      src={s.logo}
                      alt=""
                      width={24}
                      height={24}
                      className="ap-source__logo"
                    />
                    {s.name}
                    <span
                      className={
                        s.status === "Live"
                          ? "ap-chip ap-chip--live"
                          : "ap-chip"
                      }
                    >
                      {s.status}
                    </span>
                  </dt>
                  <dd>{s.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="ap-matters">
          <div className="container">
            <h2>Why it matters</h2>
            <div className="ap-matters__grid">
              {MATTERS.map((m) => (
                <div className="ap-matter" key={m.title}>
                  <h3>{m.title}</h3>
                  <p>{m.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="ap-close">
          <div className="container ap-close__inner">
            <div>
              <h2>Turn your conversations into a roadmap.</h2>
              <p>
                Start capturing feedback automatically. Free plan available, no
                card needed.
              </p>
            </div>
            <Link href="/signup" className="ap-btn ap-btn--band">
              Try for Free
            </Link>
          </div>
        </section>
      </main>

      <LandingFooter showCTA={false} />
    </>
  );
}
