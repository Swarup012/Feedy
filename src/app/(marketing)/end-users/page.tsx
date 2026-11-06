"use client";

import Link from "next/link";
import { useRef } from "react";
import { LandingFooter } from "@/components/ui/landing-footer";
import "./end-users.css";

const DOS = [
  {
    title: "Submit feedback",
    body: "Post a request or a bug in seconds, straight into your queue.",
  },
  {
    title: "Upvote and comment",
    body: "Back what matters, add detail in the thread.",
  },
  {
    title: "Follow progress",
    body: "Requests carry real statuses. Users watch, no emails.",
  },
  {
    title: "Get updates",
    body: "When it ships, the people who asked hear first.",
  },
];

const PLACES = [
  {
    title: "Public boards",
    body: "Feedback pages on your own domain, open by link.",
    link: "/feedback",
    linkLabel: "See a board",
  },
  {
    title: "In-app widget",
    body: "Collect and vote inside your app.",
    link: "/docs",
    linkLabel: "How it installs",
  },
  {
    title: "Public roadmap",
    body: "Planned, in progress, shipped, shown to users.",
    link: "/public-roadmap",
    linkLabel: "See the roadmap",
  },
];

const SAMPLE_ROWS = [
  { name: "Dark Mode Support", votes: "47" },
  { name: "API Access", votes: "31" },
  { name: "Mobile App", votes: "24" },
  { name: "Export to CSV", votes: "22" },
  { name: "Slack alerts", votes: "15" },
];

export default function EndUsersPage() {
  const demoRef = useRef<HTMLIFrameElement>(null);
  const demoFigRef = useRef<HTMLElement>(null);

  return (
    <>
      <main className="eu-wrap" id="main">
        <section className="eu-hero">
          <div className="container eu-hero__inner">
            <div>
              <h1>Feedback your users actually see.</h1>
              <p className="lead">
                The part of Faddy that lives outside your team, in the open.
              </p>
              <div className="eu-hero__actions">
                <Link href="/signup" className="eu-btn">
                  Try for Free
                </Link>
                <a
                  href="#demo"
                  className="eu-btn eu-btn--quiet"
                  onClick={(e) => {
                    e.preventDefault();
                    demoFigRef.current?.scrollIntoView({ block: "center" });
                    demoFigRef.current?.focus();
                  }}
                >
                  Play the demo
                </a>
              </div>
            </div>
            <figure
              className="eu-board"
              data-alt="A public board built live in the hero: three sample requests with their upvote counts"
            >
              <div className="eu-board__bar">
                Public board
                <span className="eu-board__ctx">sample data</span>
              </div>
              <ul className="eu-board__list">
                {SAMPLE_ROWS.map((r) => (
                  <li className="eu-row" key={r.name}>
                    <span className="eu-row__name">{r.name}</span>
                    <span className="eu-row__votes num">{r.votes}</span>
                  </li>
                ))}
              </ul>
            </figure>
          </div>
        </section>

        <section className="eu-demo" id="demo">
          <div className="container">
            <div className="eu-demo__head">
              <h2>See it as your users do</h2>
              <p className="lead">
                A clickable walkthrough of the boards, voting and updates.
              </p>
            </div>
            <figure
              ref={demoFigRef}
              className="eu-demo__frame"
              tabIndex={0}
              aria-label="Faddy product demo, interactive. Press Enter to move focus into the demo."
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  demoRef.current?.focus();
                }
              }}
            >
              <iframe
                ref={demoRef}
                src="https://app.supademo.com/embed/cmw4b6npm025cqmrbzb0867ia?embed_v=2&utm_source=embed"
                loading="lazy"
                title="Faddy Demo"
                allow="clipboard-write"
                allowFullScreen
                tabIndex={-1}
              />
            </figure>
            <p className="eu-demo__fallback">
              Demo not loading?{" "}
              <a
                href="https://app.supademo.com/embed/cmw4b6npm025cqmrbzb0867ia?embed_v=2&utm_source=embed"
                target="_blank"
                rel="noopener noreferrer"
              >
                Open it directly
              </a>
              .
            </p>
          </div>
        </section>

        <section className="eu-doing">
          <div className="container">
            <div className="eu-doing__head">
              <h2>Submit, back, follow, hear</h2>
              <p className="lead">
                Four things, one shared record.
              </p>
            </div>
            <dl className="eu-doing__rows">
              {DOS.map((d) => (
                <div className="eu-do" key={d.title}>
                  <dt>{d.title}</dt>
                  <dd>{d.body}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="eu-places">
          <div className="container">
            <div className="eu-places__head">
              <h2>Three doors to the same loop</h2>
              <p className="lead">
                From the app, a link or the roadmap.
              </p>
            </div>
            <dl className="eu-places__rows">
              {PLACES.map((p) => (
                <div className="eu-place" key={p.title}>
                  <dt>{p.title}</dt>
                  <dd>{p.body}</dd>
                  <a
                    className="eu-place__link"
                    href={p.link}
                    {...(p.link.startsWith("http")
                      ? { target: "_blank", rel: "noopener noreferrer" }
                      : {})}
                  >
                    {p.linkLabel}
                  </a>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="eu-close">
          <div className="container eu-close__inner">
            <div>
              <h2>Give feedback a front door</h2>
              <p>
                Set up a board and send your users to it. Free for 14 days, no
                card needed.
              </p>
            </div>
            <Link href="/signup" className="eu-btn eu-btn--band">
              Start Free Today
            </Link>
          </div>
        </section>
      </main>

      <LandingFooter showCTA={true} />
    </>
  );
}
