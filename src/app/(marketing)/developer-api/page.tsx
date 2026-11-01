import Link from "next/link";
import { LandingFooter } from "@/components/ui/landing-footer";
import "./developer-api.css";

export const metadata = {
  title: "Developer API | Faddy",
  description:
    "Full API access, webhooks, and SDKs for Faddy. Embed feedback collection into your app and build custom workflows.",
};

const features = [
  {
    title: "RESTful API",
    description: "Manage boards, posts, and users programmatically.",
  },
  {
    title: "Webhooks",
    description: "Real-time notifications on submit, upvote, or status change.",
  },
  {
    title: "API Keys",
    description: "Scoped keys you can rotate and revoke.",
  },
  {
    title: "Data Sync",
    description: "Keep data consistent across your CRM and tools.",
  },
];

const useCases = [
  {
    title: "Submit Feedback via API",
    description:
      "Create feedback posts programmatically from your app, website, or backend services.",
    code: `const res = await fetch('https://api.faddy.site/api/v1/posts', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer fdy_live_YOUR_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: 'Dark mode support',
    boardId: 'board_abc123',
    description: 'Please add dark mode'
  })
});
const data = await res.json();
console.log(data);`,
  },
  {
    title: "List & Filter Posts",
    description:
      "Query feedback with filters — board, status, date range. Build custom dashboards and reports.",
    code: `const params = new URLSearchParams({
  boardId: 'board_abc123',
  status: 'open',
  limit: '20',
  offset: '0'
});

const res = await fetch(
  \`https://api.faddy.site/api/v1/posts?\${params}\`,
  {
    headers: { 'Authorization': 'Bearer fdy_live_YOUR_KEY' }
  }
);
const { data } = await res.json();
console.log(data.posts);`,
  },
  {
    title: "Connect via Webhooks",
    description:
      "Get notified in real-time when feedback is created, updated, or status changes.",
    code: `// Webhook payload example
{
  "event": "post.created",
  "data": {
    "id": "post_xyz",
    "title": "API rate limiting",
    "status": "open",
    "board": { "name": "Feature Requests" },
    "author": { "email": "user@example.com" }
  },
  "timestamp": "2026-08-24T10:30:00Z"
}`,
  },
];

const trust = [
  {
    title: "Secure by Default",
    description:
      "API keys are encrypted at rest. Rate limiting and audit logs included.",
  },
  {
    title: "99.9% Uptime",
    description: "Enterprise-grade infrastructure with automatic failover.",
  },
  {
    title: "Generous Limits",
    description: "10,000 requests/month on free tier. No surprise bills.",
  },
];

export default function DeveloperApiPage() {
  return (
    <>
      <div className="da-root">
        {/* Hero — Settled */}
        <section className="da-hero">
          <div className="da-container da-hero__grid">
            <div className="da-hero__text">
              <h1>
                Build with Faddy.
                <br />
                Your way.
              </h1>
              <p className="da-lead">
                Full API access, webhooks, and SDKs, with your brand front and
                center.
              </p>
              <div className="da-hero__actions">
                <Link href="/signup" className="da-key da-key--primary">
                  Get API Key
                </Link>
                <a href="#features" className="da-key">
                  View Documentation
                </a>
              </div>
              <p className="da-small">Free tier: 10,000 requests a month.</p>
            </div>
            <div className="da-hero__code">
              <pre className="da-code">
                <code>
                  <span className="c">
                    {"# Get your API key from the dashboard"}
                  </span>
                  {"\n"}
                  <span className="c">{"# Then make your first request"}</span>
                  {"\n"}
                  <span className="k">curl</span> <span className="k">-H</span>{" "}
                  <span className="k">
                    &quot;Authorization: Bearer fdy_live_YOUR_KEY&quot;
                  </span>{" "}
                  \{"\n"}
                  {"   https://api.faddy.site/api/v1/posts"}
                  {"\n\n"}
                  <span className="c">{"# Or use Node.js / fetch"}</span>
                  {"\n"}
                  <span className="k">const</span> res{" "}
                  <span className="k">=</span>{" "}
                  <span className="k">await</span>{" "}
                  <span className="k">fetch</span>(
                  {"\n"}
                  {"   "}
                  <span className="k">
                    &apos;https://api.faddy.site/api/v1/boards&apos;
                  </span>
                  ,{"\n"}
                  {"   { headers: { "}
                  <span className="k">&apos;Authorization&apos;</span>
                  {": "}
                  <span className="k">
                    &apos;Bearer fdy_live_YOUR_KEY&apos;
                  </span>
                  {" } }"}
                  {"\n"}
                  );
                  {"\n\n"}
                  <span className="c">{"# Response"}</span>
                  {"\n"}
                  {"{"}
                  {"\n"}
                  {"   "}
                  <span className="k">&quot;success&quot;</span>: true,{"\n"}
                  {"   "}
                  <span className="k">&quot;data&quot;</span>: {"{"}
                  {"\n"}
                  {"      "}
                  <span className="k">&quot;boards&quot;</span>: [ {"{"}{" "}
                  <span className="k">&quot;name&quot;</span>:{" "}
                  <span className="k">&quot;Feature Requests&quot;</span>{" "}
                  {"}"} ]{"\n"}
                  {"   }"}
                  {"\n"}
                  {"}"}
                </code>
              </pre>
            </div>
          </div>
        </section>

        {/* Worked examples — the real calls, in hairline rows */}
        <section className="da-section da-section--flush">
          <div className="da-container">
            <div className="da-head">
              <h2>Build anything you imagine</h2>
              <p className="da-lead">
                From simple widgets to complex workflows — it&rsquo;s all
                possible.
              </p>
            </div>
            <div className="da-rows">
              {useCases.map((useCase) => (
                <div className="da-row" key={useCase.title}>
                  <div className="da-row__copy">
                    <h3>{useCase.title}</h3>
                    <p>{useCase.description}</p>
                  </div>
                  <div className="da-row__code">
                    <pre className="da-code">
                      <code>{useCase.code}</code>
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature index — four ruled rows, no tiles */}
        <section id="features" className="da-section da-section--tight">
          <div className="da-container">
            <div className="da-head">
              <h2>Everything developers need</h2>
              <p className="da-lead">
                Powerful API, great docs, and tools that just work.
              </p>
            </div>
            <div className="da-index">
              {features.map((feature) => (
                <div className="da-index__row" key={feature.title}>
                  <h3>{feature.title}</h3>
                  <p>{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Trust band — a change of paper */}
        <section className="da-band">
          <div className="da-container">
            <div className="da-band__grid">
              {trust.map((cell) => (
                <div className="da-band__cell" key={cell.title}>
                  <h3>{cell.title}</h3>
                  <p>{cell.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Close band — the ink plate, the action once more */}
        <section className="da-close">
          <div className="da-container da-close__inner">
            <div>
              <h2>Start building with Faddy today</h2>
              <p>
                Get your API key in seconds, then create posts and wire up
                webhooks.
              </p>
            </div>
            <Link href="/signup" className="da-key da-key--primary">
              Get API Key Free
            </Link>
          </div>
        </section>
      </div>
      <LandingFooter showCTA={true} />
    </>
  );
}
