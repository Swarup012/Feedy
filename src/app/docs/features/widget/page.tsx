"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Code, ArrowRight } from "lucide-react";

export default function WidgetDocsPage() {
  return (
    <div className="prose prose-slate dark:prose-invert max-w-none">
      <div className="not-prose mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 text-sm font-semibold mb-4">
          <Code className="h-3.5 w-3.5" />
          Features
        </div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">
          Setting Up the Feedback Widget
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400">
          Embed a floating feedback button on your site so users can submit
          without leaving your app.
        </p>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Creating a widget
      </h2>
      <Card className="not-prose mb-8 border-2">
        <CardContent className="p-6">
          <ol className="space-y-4 text-slate-600 dark:text-slate-400">
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold text-sm flex-shrink-0">
                1
              </span>
              <span>
                Go to <strong>Organization Settings → Widgets</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold text-sm flex-shrink-0">
                2
              </span>
              <span>
                Click <strong>Create Widget</strong>.
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold text-sm flex-shrink-0">
                3
              </span>
              <span>
                Fill in the details:
                <ul className="mt-2 space-y-1 ml-4">
                  <li>
                    <strong>Widget Name</strong> — e.g., &ldquo;Product Feedback
                    Widget&rdquo;
                  </li>
                  <li>
                    <strong>Default Board</strong> — which board receives feedback
                    from this widget
                  </li>
                  <li>
                    <strong>Allowed Domains</strong> — comma-separated list of
                    domains (e.g.,{" "}
                    <code>yourapp.com, app.yourapp.com</code>). Leave empty to
                    allow all domains (not recommended for production).
                  </li>
                  <li>
                    <strong>Primary Color</strong> — accent color for the button
                    and header
                  </li>
                </ul>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold text-sm flex-shrink-0">
                4
              </span>
              <span>
                Configure settings:
                <ul className="mt-2 space-y-1 ml-4">
                  <li>
                    <strong>Show voting</strong> — let users upvote (default: on)
                  </li>
                  <li>
                    <strong>Allow anonymous feedback</strong> — submit without
                    identifying (default: off)
                  </li>
                  <li>
                    <strong>Show roadmap view</strong> — show roadmap tab
                    (default: on)
                  </li>
                  <li>
                    <strong>Require Secure Identity (HMAC)</strong> — signed
                    identity tokens (default: on)
                  </li>
                </ul>
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 font-bold text-sm flex-shrink-0">
                5
              </span>
              <span>
                Click <strong>Create Widget</strong>. Copy your API Secret
                immediately — it&rsquo;s shown once and never again.
              </span>
            </li>
          </ol>
        </CardContent>
      </Card>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Adding the widget to your site
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Click <strong>Copy Embed Code</strong> on your widget card, then paste
        the snippet before the closing <code>&lt;/body&gt;</code> tag on every
        page where the widget should appear:
      </p>
      <div className="not-prose mb-8 p-4 rounded-xl bg-slate-900 dark:bg-slate-950 text-sm font-mono text-slate-300 overflow-x-auto">
        <pre>{`<script src="https://your-backend-url/widget.js"></script>
<script>
  FeedyWidget.init({
    apiKey: 'your-widget-api-key',
    color: '#3b82f6'
  });
</script>`}</pre>
      </div>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Identifying users
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        To attribute feedback to specific users, call{" "}
        <code>FeedyWidget.identify()</code> from your page. This requires an
        HMAC signature generated on your server using the API Secret.
      </p>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
        Without identification, the user can still submit feedback but
        won&rsquo;t be tracked as a{" "}
        <Link href="/docs/plans/limits" className="text-indigo-600 dark:text-indigo-400 hover:underline">
          tracked user
        </Link>
        .
      </p>

      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
        Managing your widget
      </h2>
      <p className="text-slate-600 dark:text-slate-400 mb-4">
        Go to <strong>Organization Settings → Widgets</strong> to edit any
        widget. You can change all settings except the API key. To rotate the
        API Secret (invalidate the old one), click <strong>Rotate Secret</strong>.
      </p>

      <div className="not-prose mt-12 pt-8 border-t border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
          Related articles
        </h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <Link href="/docs/plans/limits">
            <Card className="group hover:shadow-lg transition-all border hover:border-indigo-300 dark:hover:border-indigo-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Tracked users &amp; overage billing
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  How identified users count toward your plan
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/features/boards">
            <Card className="group hover:shadow-lg transition-all border hover:border-indigo-300 dark:hover:border-indigo-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Setting up boards
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Create the boards your widget posts to
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/docs/plans/comparison">
            <Card className="group hover:shadow-lg transition-all border hover:border-indigo-300 dark:hover:border-indigo-700">
              <CardContent className="p-4">
                <p className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Understanding your plan
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Custom branding requires Starter or Pro
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
