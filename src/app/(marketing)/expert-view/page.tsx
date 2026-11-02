"use client";

import Link from "next/link";
import { LandingFooter } from "@/components/ui/landing-footer";
import "./expert-view.css";

const STATS = [
  { label: "Urgent", count: "12", note: "Critical issues, immediate attention" },
  { label: "Trending", count: "28", note: "Gaining momentum this week" },
  { label: "Focus", count: "8", note: "High-impact, on your roadmap" },
  { label: "Opportunities", count: "15", note: "Underserved needs with room to grow" },
];

const PRIORITY = [
  { name: "Dark Mode Support", votes: "47", trend: "+12%", status: "Urgent" },
  { name: "API Access", votes: "31", trend: "+8%", status: "Trending" },
  { name: "Mobile App", votes: "24", trend: "+5%", status: "Focus" },
];

const FEATURES = [
  {
    title: "Source tracking",
    body: "See exactly where feedback comes from: Intercom, Slack, Discord, GitHub, or direct submissions. Understand which channels drive the most valuable insights.",
  },
  {
    title: "Priority matrix",
    body: "A visual grid of urgency against impact. Instantly spot what to build next based on user demand and business value.",
  },
  {
    title: "Trend detection",
    body: "AI identifies rising and falling topics. Catch feature requests before they become churn risks.",
  },
  {
    title: "Feature impact score",
    body: "Quantify how much each feature contributes to retention, satisfaction and revenue. Know what is actually working.",
  },
];

const HELPS = [
  {
    title: "Identify what's working",
    body: "See which features drive engagement and retention. Double down on what matters.",
  },
  {
    title: "Spot problems early",
    body: "Catch declining trends before they become churn. React to user needs proactively.",
  },
  {
    title: "Align your team",
    body: "Share insights with stakeholders. Everyone sees the same data and the same priorities.",
  },
];

export default function ExpertViewPage() {
  return (
    <>
      <main className="ev-wrap" id="main">
        <section className="ev-hero">
          <div className="container ev-hero__inner">
            <div className="ev-hero__text">
              <h1>See what your users really want.</h1>
              <p className="lead">
                Every signal in one view. Spot trends, prioritize by impact,
                decide.
              </p>
              <div className="ev-hero__actions">
                <Link href="/signup" className="ev-btn">
                  Try for Free
                </Link>
                <a href="#features" className="ev-btn ev-btn--quiet">
                  Explore features
                </a>
              </div>
            </div>
            <figure
              className="ev-dash"
              data-slot="expert-dashboard"
              data-alt="The Expert View dashboard built live: insight counts and this week's top priorities, from the page's own sample data"
            >
              <div className="ev-dash__bar">
                <span className="ev-dash__mark" aria-hidden="true">
                  EV
                </span>
                Expert View
                <span className="ev-dash__ctx">admin/expert-view, sample data</span>
              </div>
              <div className="ev-dash__body">
                <dl className="ev-dash__stats">
                  {STATS.map((s) => (
                    <div className="ev-stat" key={s.label}>
                      <dt>{s.label}</dt>
                      <dd className="num">{s.count}</dd>
                    </div>
                  ))}
                </dl>
                <div className="ev-dash__prio">
                  <div className="ev-dash__priohead">Top priority this week</div>
                  <ul className="ev-dash__list">
                    {PRIORITY.map((p) => (
                      <li className="ev-prio" key={p.name}>
                        <span className="ev-prio__name">{p.name}</span>
                        <span className="ev-prio__status">{p.status}</span>
                        <span className="ev-prio__votes num">{p.votes} votes</span>
                        <span className="ev-prio__trend num">{p.trend}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </figure>
          </div>
        </section>

        <section className="ev-features" id="features">
          <div className="container">
            <div className="ev-features__head">
              <h2>One view of every signal you collect</h2>
              <p className="lead">
                From raw feedback to actionable insights, all in one view.
              </p>
            </div>
            <dl className="ev-features__rows">
              {FEATURES.map((f) => (
                <div className="ev-feature" key={f.title}>
                  <dt>{f.title}</dt>
                  <dd>{f.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="ev-matrix">
          <div className="container">
            <div className="ev-matrix__head">
              <h2>Urgency against impact</h2>
              <p className="lead">
                The priority matrix plots every item so the next build is
                obvious, not argued.
              </p>
            </div>
            <figure
              className="ev-grid"
              data-slot="priority-matrix"
              data-alt="Illustrative priority matrix plotting the dashboard's sample items by urgency and impact"
            >
              <span className="ev-grid__y" aria-hidden="true">Urgency</span>
              <div className="ev-grid__cell ev-grid__q1">
                <span className="ev-grid__item ev-grid__item--on">Dark Mode Support</span>
              </div>
              <div className="ev-grid__cell ev-grid__q2">
                <span className="ev-grid__item">API Access</span>
              </div>
              <div className="ev-grid__cell ev-grid__q3">
                <span className="ev-grid__item">Mobile App</span>
              </div>
              <div className="ev-grid__cell ev-grid__q4">
                <span className="ev-grid__empty">Everything else waits in the backlog until its signals move.</span>
              </div>
              <span className="ev-grid__x" aria-hidden="true">Impact</span>
              <figcaption className="ev-grid__cap">
                Illustrative, plotting the dashboard&apos;s sample items. High
                urgency, high impact goes first.
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="ev-helps">
          <div className="container">
            <div className="ev-helps__head">
              <h2>Make better product decisions</h2>
              <p className="lead">
                Stop guessing. Know what your users actually need.
              </p>
            </div>
            <dl className="ev-helps__rows">
              {HELPS.map((h) => (
                <div className="ev-help" key={h.title}>
                  <dt>{h.title}</dt>
                  <dd>{h.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="ev-close">
          <div className="container ev-close__inner">
            <div>
              <h2>Ready to see the full picture?</h2>
              <p>
                Try the Expert View free for 14 days, no card needed.
              </p>
            </div>
            <Link href="/signup" className="ev-btn ev-btn--band">
              Start Free Today
            </Link>
          </div>
        </section>
      </main>

      <LandingFooter showCTA={true} />
    </>
  );
}
