"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { LandingFooter } from "@/components/ui/landing-footer";
import { ThemeToggleDebug } from "@/components/theme-toggle-debug";
import {
  Check,
  ArrowRight,
  TrendingDown,
  DollarSign,
  Users,
} from "lucide-react";

export default function CannyAlternativeClient() {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // ── Nav config (mirrors every other marketing page) ──────────────────────
  const navItems = [
    {
      name: "Product",
      link: "/feedback",
      dropdown: [
        {
          section: "Features",
          items: [
            { name: "Collect Feedback", link: "/collect-feedback" },
            { name: "Analyze Feedback", link: "/analyze-feedback" },
            { name: "Share Updates", link: "/share-updates" },
          ],
        },
        {
          section: "Use Cases",
          items: [
            { name: "Feature Request Management", link: "/collect-feedback" },
            { name: "Role-Based Access Control", link: "/role-based-access" },
            { name: "Public Roadmap", link: "/public-roadmap" },
          ],
        },
        {
          section: "Resources",
          items: [
            { name: "Blog", link: "/blog" },
          ],
        },
      ],
    },
    { name: "Documentation", link: "/docs" },
    { name: "Pricing", link: "/pricing" },
    { name: "Contact", link: "/contact" },
  ];

  const NavbarActions = ({ visible }: { visible?: boolean }) => (
    <div className="flex items-center gap-3">
      <ThemeToggleDebug />
      {!visible && (
        <NavbarButton variant="secondary" onClick={() => router.push("/login")}>
          Login
        </NavbarButton>
      )}
      <NavbarButton variant="primary" onClick={() => router.push("/signup")}>
        Sign Up
      </NavbarButton>
    </div>
  );

  // ── Page data ─────────────────────────────────────────────────────────────
  const painPoints = [
    {
      icon: <DollarSign className="w-6 h-6 text-red-500" />,
      title: "Canny starts at $400/month",
      desc: "That's $4,800/year — just to collect feedback. For most startups, that's a significant chunk of their entire SaaS budget.",
    },
    {
      icon: <TrendingDown className="w-6 h-6 text-red-500" />,
      title: "Pricing scales with tracked users",
      desc: "As your product grows, your Canny bill silently grows with it. More users = more cost, with no ceiling in sight.",
    },
    {
      icon: <Users className="w-6 h-6 text-red-500" />,
      title: "Overkill for small teams and startups",
      desc: "Enterprise-grade complexity, enterprise-grade price. Small teams end up paying for features they'll never touch.",
    },
  ];

  const comparisonRows = [
    { feature: "Starting price",  faddy: "Free",                     canny: "$400/mo",          faddyWins: true  },
    { feature: "Free plan",       faddy: "Yes",                      canny: "Limited trial",     faddyWins: true  },
    { feature: "Pricing model",   faddy: "Flat fee",                 canny: "Per tracked user",  faddyWins: true  },
    { feature: "Feedback boards", faddy: "Yes",                      canny: "Yes",               faddyWins: false },
    { feature: "Feature voting",  faddy: "Yes",                      canny: "Yes",               faddyWins: false },
    { feature: "Public roadmap",  faddy: "Yes",                      canny: "Yes",               faddyWins: false },
    { feature: "Changelog",       faddy: "Yes",                      canny: "Yes",               faddyWins: false },
    { feature: "Best for",        faddy: "Startups & indie hackers", canny: "Enterprise",        faddyWins: true  },
  ];

  const plans = [
    {
      name: "Free",
      price: "$0",
      per: "forever",
      highlight: false,
      badge: undefined as string | undefined,
      features: [
        "3 feedback boards",
        "20 tracked users",
        "3 team members",
        "1 roadmap",
        "Basic analytics",
      ],
      cta: "Get Started Free",
      href: "/signup",
    },
    {
      name: "Starter",
      price: "$19",
      per: "/ month",
      highlight: true,
      badge: "Most Popular",
      features: [
        "Unlimited feedback boards",
        "125+ tracked users",
        "Unlimited team members",
        "Advanced analytics",
        "Custom branding",
        "14-day free trial",
      ],
      cta: "Start Free Trial",
      href: "/signup?plan=starter",
    },
    {
      name: "Pro",
      price: "$49",
      per: "/ month",
      highlight: false,
      badge: undefined as string | undefined,
      features: [
        "Everything in Starter",
        "Up to 10 admins",
        "Custom subdomain",
        "Priority support",
        "Custom integrations",
        "14-day free trial",
      ],
      cta: "Start Pro Trial",
      href: "/signup?plan=pro",
    },
  ];

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased">

      {/* ── Navbar ─────────────────────────────────────────────── */}

      <main>
        {/* ── Hero ───────────────────────────────────────────────── */}
        <section className="relative overflow-hidden pt-20 pb-16 px-6">
          {/* Glow blobs */}
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-100/60 dark:bg-blue-900/20 blur-[120px] rounded-full -z-10" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-indigo-100/40 dark:bg-indigo-900/10 blur-[100px] rounded-full -z-10" />

          <div className="max-w-4xl mx-auto text-center">
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm font-semibold mb-6">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              Canny Alternative
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-4xl font-switzer font-bold tracking-tight leading-[1.1] text-slate-900 dark:text-white mb-6">
              The Best Canny Alternative{" "}
              <span className="text-blue-600 dark:text-blue-400">for Startups</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
              Faddy gives you everything Canny does — feedback boards, feature
              voting, public roadmap, changelog — at a fraction of the price.
              No per-user pricing surprises.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="/signup"
                id="hero-cta-start-free"
                className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-switzer font-bold rounded-2xl border border-blue-700 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-0.5 text-base"
              >
                Start Free
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="/pricing"
                id="hero-cta-see-pricing"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-switzer font-bold rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200 text-base"
              >
                See pricing
              </a>
            </div>

            <p className="mt-8 text-sm text-slate-400 dark:text-slate-500">
              Free plan available · No credit card required · Setup in 2 minutes
            </p>
          </div>
        </section>

        {/* ── Pain points ────────────────────────────────────────── */}
        <section className="py-16 px-6 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-100 dark:border-slate-800">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-switzer font-bold text-slate-900 dark:text-white mb-4">
                Why teams leave Canny
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
                Canny is a solid product — but it was built for enterprises, not startups.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {painPoints.map((point, i) => (
                <div
                  key={i}
                  className="group p-5 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-red-200 dark:hover:border-red-900 hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-12 h-12 flex items-center justify-center bg-red-50 dark:bg-red-900/20 rounded-xl mb-5 group-hover:scale-110 transition-transform duration-300">
                    {point.icon}
                  </div>
                  <h3 className="text-lg font-switzer font-semibold text-slate-900 dark:text-white mb-3">
                    {point.title}
                  </h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                    {point.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Comparison table ───────────────────────────────────── */}
        <section className="py-16 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-switzer font-bold text-slate-900 dark:text-white mb-4">
                Faddy vs Canny
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg">
                An honest side-by-side comparison.
              </p>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                    <th className="py-4 px-6 text-left text-sm font-semibold text-slate-600 dark:text-slate-300 w-1/3">
                      Feature
                    </th>
                    <th className="py-4 px-6 text-center text-sm font-bold text-blue-600 dark:text-blue-400 w-1/3">
                      Faddy ✦
                    </th>
                    <th className="py-4 px-6 text-center text-sm font-semibold text-slate-400 dark:text-slate-500 w-1/3">
                      Canny
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                  {comparisonRows.map((row, i) => (
                    <tr
                      key={i}
                      className={`transition-colors ${
                        row.faddyWins ? "bg-blue-50/40 dark:bg-blue-900/10" : ""
                      }`}
                    >
                      <td className="py-4 px-6 text-sm text-slate-700 dark:text-slate-300 font-medium">
                        {row.feature}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {row.faddy === "Yes" ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                            {row.faddy}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {row.canny === "Yes" ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : (
                          <span
                            className={`text-sm ${
                              row.faddyWins
                                ? "text-slate-400 dark:text-slate-500 line-through"
                                : "text-slate-600 dark:text-slate-400"
                            }`}
                          >
                            {row.canny}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── Pricing ────────────────────────────────────────────── */}
        <section className="py-16 px-6 bg-slate-50 dark:bg-slate-900/50 border-y border-slate-100 dark:border-slate-800">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-switzer font-bold text-slate-900 dark:text-white mb-4">
                Simple flat pricing
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
                One price. No user-based overages. No surprises on your invoice.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`relative flex flex-col p-5 rounded-2xl border transition-all duration-300 ${
                    plan.highlight
                      ? "bg-blue-600 border-blue-500 shadow-2xl shadow-blue-500/20 scale-[1.02]"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-lg"
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1.5 bg-white text-blue-600 text-xs font-bold rounded-full shadow-md border border-blue-100">
                        {plan.badge}
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3
                      className={`text-xl font-switzer font-bold mb-2 ${
                        plan.highlight ? "text-white" : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span
                        className={`text-4xl font-switzer font-black ${
                          plan.highlight ? "text-white" : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {plan.price}
                      </span>
                      <span
                        className={`text-sm ${
                          plan.highlight ? "text-blue-100" : "text-slate-500 dark:text-slate-400"
                        }`}
                      >
                        {plan.per}
                      </span>
                    </div>
                  </div>

                  <ul className="space-y-3 flex-1 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <Check
                          className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                            plan.highlight ? "text-blue-200" : "text-green-500"
                          }`}
                        />
                        <span
                          className={`text-sm ${
                            plan.highlight
                              ? "text-blue-50"
                              : "text-slate-600 dark:text-slate-300"
                          }`}
                        >
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href={plan.href}
                    id={`pricing-cta-${plan.name.toLowerCase()}`}
                    className={`block text-center py-3 px-6 rounded-xl font-switzer font-semibold text-sm transition-all duration-200 ${
                      plan.highlight
                        ? "bg-white text-blue-600 hover:bg-blue-50 hover:shadow-lg"
                        : "bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md hover:shadow-blue-500/20"
                    }`}
                  >
                    {plan.cta}
                  </a>
                </div>
              ))}
            </div>

            <p className="text-center mt-8 text-sm text-slate-400 dark:text-slate-500">
              All paid plans include a 14-day free trial. No credit card required to start.
            </p>
          </div>
        </section>

        {/* ── Final CTA ──────────────────────────────────────────── */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto rounded-2xl bg-slate-900 dark:bg-slate-800 p-8 md:p-16 text-center overflow-hidden relative">
            <div className="absolute -bottom-20 -left-20 w-[400px] h-[400px] bg-blue-600/20 blur-[100px] rounded-full" />
            <div className="absolute -top-20 -right-20 w-[300px] h-[300px] bg-indigo-600/15 blur-[80px] rounded-full" />

            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-switzer font-bold text-white mb-6 leading-tight">
                Switch to Faddy today
              </h2>
              <p className="text-lg text-slate-400 mb-10 max-w-xl mx-auto leading-relaxed">
                Join teams who chose simplicity and flat pricing over per-user
                billing surprises. Start for free — no card required.
              </p>
              <a
                href="/signup"
                id="final-cta-signup"
                className="inline-flex items-center gap-3 px-10 py-4 bg-white text-slate-900 font-switzer font-black rounded-2xl hover:scale-105 hover:shadow-xl hover:shadow-white/10 transition-all duration-200"
              >
                Create your free account
                <ArrowRight className="w-5 h-5" />
              </a>
              <p className="mt-6 text-sm text-slate-500">
                Free plan forever · No credit card · Cancel anytime
              </p>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter showCTA={false} />
    </div>
  );
}
