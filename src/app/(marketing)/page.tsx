"use client";
import React, { useEffect, useRef } from "react";
import { ArrowRight, CheckCircle, Users, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/dist/ScrollTrigger";
import { PointerHighlight } from "@/components/ui/pointer-highlight.tsx";
import { LandingFooter } from "@/components/ui/landing-footer";
import { FeatureTabSection } from "@/components/FeatureTabSection";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const handleClick = () => {
    router.push("/signup");
  };

  // Refs for GSAP
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const benefitsRef = useRef(null);

  // Ref for scroll-triggered video
  const videoRef = useRef<HTMLVideoElement>(null);

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

  // --- GSAP ANIMATION ENGINE ---
  useEffect(() => {
    if (!loading) {
      const ctx = gsap.context(() => {
        // Hero Animation
        const tl = gsap.timeline();
        tl.from(".hero-reveal", {
          y: 60,
          opacity: 0,
          duration: 1,
          stagger: 0.2,
          ease: "expo.out",
        }).from(
          ".hero-stats",
          {
            opacity: 0,
            y: 20,
            duration: 0.8,
            ease: "power2.out",
          },
          "-=0.5",
        );

        // Scroll Trigger: Features
        gsap.from(".feature-card", {
          scrollTrigger: {
            trigger: featuresRef.current,
            start: "top 80%",
            once: true,
          },
          y: 40,
          opacity: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          immediateRender: false,
        });

        // Scroll Trigger: Benefits Left
        gsap.from(".benefit-content", {
          scrollTrigger: {
            trigger: benefitsRef.current,
            start: "top 70%",
          },
          x: -50,
          opacity: 0,
          duration: 1,
          ease: "power2.out",
        });

        // Scroll Trigger: Benefits Cards Right
        gsap.from(".benefit-stat-card", {
          scrollTrigger: {
            trigger: benefitsRef.current,
            start: "top 70%",
          },
          x: 50,
          opacity: 0,
          duration: 1,
          stagger: 0.2,
          ease: "power2.out",
        });
      });
      return () => ctx.revert();
    }
  }, [loading]);

  // Play video when it enters the viewport, pause when it leaves.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {
            /* autoplay may be blocked */
          });
        } else {
          video.pause();
        }
      },
      { threshold: 0.3 },
    );

    observer.observe(video);
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-100 dark:selection:bg-blue-900 selection:text-blue-900 dark:selection:text-blue-100">
      {/* Visual background texture */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }}
        ></div>
      </div>

      {/* Resizable Navbar */}

      <main className="relative z-10">
        {/* Hero Section */}
        <section
          ref={heroRef}
          className="relative overflow-hidden pt-20 sm:pt-12 pb-12 sm:pb-10 px-5 sm:px-6"
        >
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col lg:flex-row items-start gap-10 lg:gap-8">
              {/* Left — Hero Copy */}
              <div className="w-full lg:w-[46%] flex flex-col items-center lg:items-start text-center lg:text-left space-y-5 sm:space-y-7">
                {/* Eyebrow badge */}
                <div className="hero-reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs sm:text-sm font-semibold">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  AI-powered customer feedback platform
                </div>

                <h1 className="hero-reveal text-3xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-switzer font-medium tracking-tight leading-tight text-slate-900 dark:text-white">
                  Your users are telling you what to build.
                  <br />
                  <span className="inline-block mt-3">
                    <PointerHighlight>Are you listening?</PointerHighlight>
                  </span>
                </h1>

                <p className="hero-reveal text-base sm:text-lg md:text-xl text-slate-500 dark:text-slate-400 leading-relaxed max-w-lg">
                  Faddy's AI reads every request across your tools and tells you
                  exactly what to build next to keep users happy and paying.
                </p>

                <div className="hero-reveal flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button
                    onClick={handleClick}
                    className="w-full sm:w-auto px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-switzer font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-base border border-black"
                  >
                    Try for Free
                  </button>
                  <a
                    href="/pricing"
                    className="w-full sm:w-auto px-8 py-3.5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-switzer font-bold rounded-2xl border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 text-base"
                  >
                    Pricing
                  </a>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  No credit card required
                </p>

                {/* Social Proof / Stats */}
                <div className="hero-stats w-full pt-5 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    "Free plan available",
                    "From $19/mo flat",
                    "Built for small teams",
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-center lg:justify-start gap-2"
                    >
                      <CheckCircle className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="text-sm font-switzer font-medium text-slate-600 dark:text-slate-300">
                        {stat}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right — Video (54%), hidden on small mobile, shown from md up */}
              <div className="hidden md:block w-full lg:w-[54%] relative">
                <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-700/80">
                  {/* Fake browser chrome */}
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-4 py-2.5 border-b border-slate-200 dark:border-slate-700">
                    <span className="w-3 h-3 rounded-full bg-red-400" />
                    <span className="w-3 h-3 rounded-full bg-yellow-400" />
                    <span className="w-3 h-3 rounded-full bg-green-400" />
                    <div className="ml-3 flex-1 bg-white dark:bg-slate-700 rounded-md px-3 py-0.5 text-xs text-slate-400 dark:text-slate-500 font-mono">
                      faddy.site
                    </div>
                  </div>
                  <video
                    ref={videoRef}
                    src="/videos/landing_page.mp4"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    className="w-full h-auto object-contain block"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section — Tabbed Showcase */}
        <section
          ref={featuresRef}
          className="py-12 px-6 bg-slate-50/50 dark:bg-slate-900/50 border-y border-slate-100 dark:border-slate-800"
        >
          <div className="max-w-6xl mx-auto">
            {/* Section header */}
            <div className="text-center mb-14">
              <h2 className="text-xl md:text-2xl font-switzer font-medium tracking-tight text-slate-900 dark:text-white mb-4">
                Everything you need to manage product feedback
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
                From collecting ideas to shipping features — Faddy handles the
                full loop.
              </p>
            </div>

            {/* Tab bar */}
            <FeatureTabSection />
          </div>
        </section>

        {/* Benefits Section */}
        <section
          ref={benefitsRef}
          className="py-16 px-6 bg-blue-600 overflow-hidden relative"
        >
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div className="benefit-content text-white">
                <h2 className="text-xl md:text-3xl font-switzer font-bold tracking-tight mb-8">
                  Stop building <br />
                  in the dark.
                </h2>
                <div className="space-y-5">
                  {[
                    "Know exactly what your users want before you write a single line of code",
                    "Public roadmap builds trust and reduces repetitive support questions",
                    "Changelog keeps users excited about every update you ship",
                    "Flat pricing that scales with your product, not your user count",
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="mt-1 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-lg font-medium text-blue-50 leading-tight">
                        {text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-6">
                {[
                  {
                    label: "Built for",
                    value: "Startups & Indie Hackers",
                    subtext:
                      "Not enterprise. No complexity. No per-user pricing traps.",
                    icon: <Users />,
                  },
                  {
                    label: "Pricing starts at",
                    value: "Free",
                    subtext:
                      "Upgrade to $19/mo when you're ready. No credit card to start.",
                    icon: <Sparkles />,
                  },
                ].map((stat, i) => (
                  <div
                    key={i}
                    className="benefit-stat-card p-6 bg-white/10 rounded-2xl border border-white/20"
                  >
                    <div className="flex items-center gap-4 mb-6 text-white/80">
                      {stat.icon}
                      <span className="font-bold uppercase tracking-widest text-sm">
                        {stat.label}
                      </span>
                    </div>
                    <div className="text-2xl font-switzer font-black text-white leading-tight">
                      {stat.value}
                    </div>
                    <p className="text-blue-100 mt-4 font-medium leading-relaxed text-sm">
                      {stat.subtext}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Automate with Apps Section */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-switzer font-bold tracking-tight text-slate-900 dark:text-white mb-4">
              Automate with your favorite apps
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 mb-12 max-w-xl mx-auto">
              Connect Faddy to the tools your team already uses. Feedback flows in automatically.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                {
                  name: "Intercom",
                  icon: (
                    <img
                      src="/images/icons/intercom.svg"
                      alt="Intercom"
                      className="h-6 w-6"
                    />
                  ),
                  color: "#1F8DED",
                  description:
                    "Turn conversations into actionable product feedback.",
                },
                {
                  name: "Slack",
                  icon: (
                    <img
                      src="/images/icons/slack-new.svg"
                      alt="Slack"
                      className="h-6 w-6"
                    />
                  ),
                  color: "#E01E5A",
                  description:
                    "Monitor a Slack channel and convert messages into actionable feedback.",
                },
                {
                  name: "Discord",
                  icon: (
                    <img
                      src="/images/icons/discord.svg"
                      alt="Discord"
                      className="h-6 w-6"
                    />
                  ),
                  color: "#5865F2",
                  description:
                    "Capture community conversations as structured feedback.",
                },
                {
                  name: "GitHub",
                  icon: (
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      className="h-6 w-6"
                    >
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                    </svg>
                  ),
                  color: "#24292F",
                  description:
                    "Track issues and pull requests as feedback via GitHub App webhooks.",
                },
              ].map((integration) => (
                <div
                  key={integration.name}
                  className="flex flex-col items-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all group"
                >
                  <div
                    className="h-12 w-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"
                    style={{ backgroundColor: `${integration.color}15` }}
                  >
                    {integration.icon}
                  </div>
                  <h3 className="font-switzer font-bold text-slate-900 dark:text-white mb-2">
                    {integration.name}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {integration.description}
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
                Your users are waiting to tell you what to build.
              </h2>
              <p className="text-lg text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                Start collecting feedback in minutes. Free plan available — no
                credit card required.
              </p>
              <a
                href="/signup"
                className="inline-flex items-center gap-3 px-6 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-switzer font-black rounded-2xl hover:scale-105 transition-all text-base"
              >
                Start Free Today
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <LandingFooter showCTA={true} />
    </div>
  );
}
