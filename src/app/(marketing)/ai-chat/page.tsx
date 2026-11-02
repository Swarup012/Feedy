"use client";

import { useState } from "react";
import Link from "next/link";
import { LandingFooter } from "@/components/ui/landing-footer";
import "./ai-chat.css";

const asks = [
  {
    tab: "Top requests this month",
    question: "What are the top 3 features users are asking for this month?",
    answer:
      "Based on 47 feedback posts from July, your users are requesting: 1) Dark mode (23 votes), 2) API access (18 votes), 3) Mobile app (15 votes). Dark mode has the highest engagement and the lowest effort, so I'd recommend prioritizing it.",
  },
  {
    tab: "Pro plan churn",
    question: "Why is churn increasing for our Pro plan?",
    answer:
      "I analyzed 12 cancellation reasons and 8 feedback posts. The main concern is pricing confusion: users don't see the value gap between Free and Pro. Consider adding a comparison page or trial extension to demonstrate Pro features.",
  },
  {
    tab: "Integration or roadmap",
    question: "Should we build the integration or the roadmap feature first?",
    answer:
      "Looking at your data: Integrations have 31 requests (high demand), Roadmap has 24 requests (medium demand). However, Roadmap has higher retention impact based on similar products. If churn reduction is your goal, start with Roadmap.",
  },
];

const skills = [
  {
    title: "Organization-specific context",
    description:
      "The assistant understands your entire feedback history, roadmap and team priorities. Every answer is tailored to your product.",
  },
  {
    title: "Prioritization guidance",
    description:
      "Ask what to build next and get data-driven recommendations based on user demand, effort estimates and strategic impact.",
  },
  {
    title: "Problem solving",
    description:
      "Describe a challenge and it suggests solutions drawn from your feedback patterns, industry best practices and similar products.",
  },
  {
    title: "Team collaboration",
    description:
      "Share the answers with your team. Everyone gets the same context on what users want and why it matters.",
  },
];

export default function AiChatPage() {
  const [active, setActive] = useState(0);

  return (
    <main className="ac-wrap" id="main">
      <section className="ac-hero">
        <div className="container ac-hero__inner">
          <div className="ac-hero__text">
            <h1>Talk to your product data.</h1>
            <p className="lead">
              Plain-language answers, drawn from your feedback, roadmap and
              team context.
            </p>
            <div className="ac-hero__actions">
              <Link href="/signup" className="ac-btn">
                Try for Free
              </Link>
              <a href="#how-it-works" className="ac-btn ac-btn--quiet">
                See it in action
              </a>
            </div>
          </div>

          <figure
            className="ac-chat"
            data-slot="chat-demo"
            data-alt="The AI chat in the admin, captured from the running product"
          >
            <div className="ac-chat__bar">
              <span className="ac-chat__mark" aria-hidden="true">
                AI
              </span>
              <span>Faddy assistant</span>
              <span className="ac-chat__ctx">
                context: feedback, roadmap, team
              </span>
            </div>
            <div className="ac-chat__thread">
              <p className="ac-msg ac-msg--you">
                What are users asking for most this week?
              </p>
              <div className="ac-msg ac-msg--ai">
                <p>
                  This week, 23 new feedback posts mention{" "}
                  <strong>dark mode</strong> as the top request.
                </p>
                <p>Key insights:</p>
                <ul>
                  <li>8 posts from Pro users (high priority)</li>
                  <li>Related to accessibility concerns</li>
                  <li>Competitor X just shipped this</li>
                </ul>
                <p className="ac-msg__rec">
                  Recommendation: Prioritize dark mode for next sprint.
                </p>
              </div>
              <p className="ac-msg ac-msg--you">
                How much effort would that take?
              </p>
              <div className="ac-msg ac-msg--ai">
                <p>
                  Based on your codebase size and component library, I estimate{" "}
                  <strong>2-3 days</strong> for a basic dark mode. Your existing
                  Tailwind setup makes this straightforward.
                </p>
              </div>
            </div>
          </figure>
        </div>
      </section>

      <section className="ac-asks" id="how-it-works">
        <div className="container">
          <div className="ac-asks__head">
            <h2>Ask anything about your product</h2>
            <p className="lead">
              Real questions. Real answers. Powered by your actual data.
            </p>
          </div>
          <div className="ac-switch" role="tablist" aria-label="Example questions">
            <div className="ac-tabs">
              {asks.map((ask, i) => (
                <button
                  key={ask.tab}
                  type="button"
                  role="tab"
                  id={`ac-tab-${i}`}
                  aria-selected={active === i}
                  aria-controls={`ac-panel-${i}`}
                  tabIndex={active === i ? 0 : -1}
                  className="ac-tab"
                  onClick={() => setActive(i)}
                >
                  {ask.tab}
                </button>
              ))}
            </div>
            {asks.map((ask, i) => (
              <section
                key={ask.tab}
                role="tabpanel"
                id={`ac-panel-${i}`}
                aria-labelledby={`ac-tab-${i}`}
                hidden={active !== i}
                className="ac-panel"
              >
                <h3>{ask.question}</h3>
                <p>{ask.answer}</p>
              </section>
            ))}
          </div>
        </div>
      </section>

      <section className="ac-skills">
        <div className="container ac-skills__inner">
          <div className="ac-skills__head">
            <h2>What the assistant does</h2>
            <p>
              Not a generic chatbot. A specialized assistant that understands
              your product.
            </p>
          </div>
          <dl className="ac-skills__rows">
            {skills.map((skill) => (
              <div className="ac-skill" key={skill.title}>
                <dt>{skill.title}</dt>
                <dd>{skill.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="ac-roles">
        <div className="container">
          <h2>For owners and admins</h2>
          <p className="lead">
            Role-based access ensures the right people get the right insights.
          </p>
          <dl className="ac-roles__pair">
            <div className="ac-role">
              <dt>Owners</dt>
              <dd>
                Full access to strategic insights, prioritization
                recommendations and competitive analysis.
              </dd>
            </div>
            <div className="ac-role">
              <dt>Admins</dt>
              <dd>
                Access to feedback analysis, team performance metrics and
                feature request trends.
              </dd>
            </div>
          </dl>
        </div>
      </section>

      <section className="ac-close">
        <div className="container ac-close__inner">
          <div>
            <h2>Stop guessing. Start knowing.</h2>
            <p>
              Try the AI assistant free for 14 days, no card needed.
            </p>
          </div>
          <a href="/signup" className="ac-btn ac-btn--band">
            Start Free Today
          </a>
        </div>
      </section>

      <LandingFooter showCTA={true} />
    </main>
  );
}
