"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  CheckCircle2,
  Code,
  Key,
  Plug,
  Database,
  RefreshCw,
  Shield,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { LandingFooter } from "@/components/ui/landing-footer";

const features = [
  {
    title: "RESTful API",
    description:
      "Full-featured API with comprehensive documentation. Manage boards, posts, users, and more programmatically.",
    icon: <Code className="w-6 h-6" />,
  },
  {
    title: "Webhooks",
    description:
      "Real-time notifications when feedback is submitted, upvoted, or status changes. Build custom integrations effortlessly.",
    icon: <RefreshCw className="w-6 h-6" />,
  },
  {
    title: "API Keys",
    description:
      "Generate scoped API keys for secure access. Rotate, revoke, and manage permissions per key.",
    icon: <Key className="w-6 h-6" />,
  },
  {
    title: "Data Sync",
    description:
      "Sync feedback with your CRM, support tools, and databases. Keep customer data consistent across all systems.",
    icon: <Database className="w-6 h-6" />,
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

export default function DeveloperApiPage() {
  return (
    <>
      <div className="min-h-screen bg-white dark:bg-background">
        {/* Hero Section */}
        <section className="relative py-16 lg:py-20 overflow-hidden bg-white dark:bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
              {/* Left — Copy */}
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300 text-xs sm:text-sm font-semibold mb-6">
                  <Code className="w-4 h-4" />
                  Developer Tools
                </div>

                <h1 className="text-3xl lg:text-4xl xl:text-5xl font-switzer font-medium text-slate-900 dark:text-white mb-6 tracking-tight leading-tight">
                  Build with Faddy.{" "}
                  <span className="text-orange-600 dark:text-orange-400">
                    Your way.
                  </span>
                </h1>

                <p className="text-lg lg:text-xl text-slate-600 dark:text-gray-400 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Full API access, webhooks, and SDKs. Embed feedback collection
                  into your app, sync customer data, and build custom workflows
                  — all with your brand front and center.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Link href="/signup">
                    <Button
                      size="lg"
                      className="bg-orange-600 hover:bg-orange-700 text-white shadow-lg w-full sm:w-auto"
                    >
                      Get API Key
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <a
                    href="#features"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-switzer font-semibold rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-sm"
                  >
                    View Documentation
                  </a>
                </div>
              </div>

              {/* Right — Code Preview */}
              <div className="flex-1 w-full max-w-lg lg:max-w-none">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-700/80 bg-slate-900">
                  {/* Terminal chrome */}
                  <div className="flex items-center gap-1.5 bg-slate-800 px-4 py-2.5 border-b border-slate-700">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span className="w-3 h-3 rounded-full bg-green-400" />
                    <div className="ml-3 flex items-center gap-2 text-xs text-slate-400 font-mono">
                      terminal
                    </div>
                  </div>

                  {/* Code Content */}
                  <div className="p-6 font-mono text-sm">
                    <div className="text-slate-500 mb-2"># Get your API key from the dashboard</div>
                    <div className="text-slate-500 mb-2"># Then make your first request</div>
                    <div className="text-slate-300 mb-1">
                      <span className="text-purple-400">curl</span>{" "}
                      <span className="text-emerald-400">-H</span>{" "}
                      <span className="text-amber-300">"Authorization: Bearer fdy_live_YOUR_KEY"</span> \
                    </div>
                    <div className="text-slate-300 mb-4 pl-4">
                      https://api.faddy.site/api/v1/posts
                    </div>

                    <div className="text-slate-500 mb-2"># Or use Node.js / fetch</div>
                    <div className="text-slate-300 mb-1">
                      <span className="text-purple-400">const</span>{" "}
                      <span className="text-blue-400">res</span>{" "}
                      <span className="text-slate-500">=</span>{" "}
                      <span className="text-purple-400">await</span>{" "}
                      <span className="text-emerald-400">fetch</span>(
                    </div>
                    <div className="text-slate-300 pl-4 mb-1">
                      <span className="text-amber-300">'https://api.faddy.site/api/v1/boards'</span>,
                    </div>
                    <div className="text-slate-300 pl-4 mb-1">
                      {"{"} headers: {"{"} 'Authorization': <span className="text-amber-300">'Bearer fdy_live_YOUR_KEY'</span> {"}"} {"}"}
                    </div>
                    <div className="text-slate-300 mb-4">);</div>

                    <div className="text-slate-500 mb-2"># Response</div>
                    <div className="text-slate-300 mb-1">{"{"}</div>
                    <div className="text-slate-300 pl-4 mb-1">
                      <span className="text-emerald-400">"success"</span>: <span className="text-amber-300">true</span>,
                    </div>
                    <div className="text-slate-300 pl-4 mb-1">
                      <span className="text-emerald-400">"data"</span>: {"{"}
                    </div>
                    <div className="text-slate-300 pl-8 mb-1">
                      <span className="text-emerald-400">"boards"</span>: [ {"{"} "name": <span className="text-amber-300">"Feature Requests"</span> {"}"} ]
                    </div>
                    <div className="text-slate-300 pl-4">{"}"}</div>
                    <div className="text-slate-300">{"}"}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="py-16 px-6 bg-slate-50/50 dark:bg-slate-900/50 border-y border-slate-100 dark:border-slate-800"
        >
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-switzer font-bold tracking-tight text-slate-900 dark:text-white mb-4">
                Everything developers need
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                Powerful API, great docs, and tools that just work.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {features.map((feature) => (
                <Card
                  key={feature.title}
                  className="bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-lg transition-all"
                >
                  <CardContent className="p-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 mb-4">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-switzer font-bold text-slate-900 dark:text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases with Code */}
        <section className="py-16 px-6 bg-white dark:bg-background">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-switzer font-bold tracking-tight text-slate-900 dark:text-white mb-4">
                Build anything you imagine
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                From simple widgets to complex workflows — it&apos;s all possible.
              </p>
            </div>

            <div className="space-y-8">
              {useCases.map((useCase) => (
                <div
                  key={useCase.title}
                  className="grid md:grid-cols-2 gap-6 items-center"
                >
                  <div>
                    <h3 className="text-xl font-switzer font-bold text-slate-900 dark:text-white mb-3">
                      {useCase.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                      {useCase.description}
                    </p>
                  </div>
                  <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
                    <pre className="font-mono text-sm text-slate-300 whitespace-pre">
                      {useCase.code}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="py-16 px-6 bg-slate-50/50 dark:bg-slate-900/50 border-y border-slate-100 dark:border-slate-800">
          <div className="max-w-5xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Secure by Default",
                  description:
                    "API keys are encrypted at rest. Rate limiting, IP whitelisting, and audit logs included.",
                  icon: <Shield className="w-6 h-6" />,
                },
                {
                  title: "99.9% Uptime",
                  description:
                    "Enterprise-grade infrastructure with automatic failover. Your integrations never sleep.",
                  icon: <Zap className="w-6 h-6" />,
                },
                {
                  title: "Generous Limits",
                  description:
                    "10,000 requests/month on free tier. Scale up as you grow — no surprise bills.",
                  icon: <Key className="w-6 h-6" />,
                },
              ].map((item) => (
                <div key={item.title} className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 mb-4">
                    {item.icon}
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
                Start building with Faddy today
              </h2>
              <p className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                Get your API key in seconds. Free tier includes 10,000 requests
                per month.
              </p>
              <a
                href="/signup"
                className="inline-flex items-center gap-3 px-6 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-switzer font-black rounded-2xl hover:scale-105 transition-all text-base"
              >
                Get API Key Free
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
