"use client"
import React, { useEffect, useState, useRef } from 'react';
import { 
  ArrowRight, 
  MessageSquare, 
  Lightbulb, 
  Zap, 
  CheckCircle, 
  Star, 
  Users, 
  TrendingUp, 
  Sparkles, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { Logo } from '@/components/logo';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';
import LandingButton from '../components/ui/LandingButton.tsx';
import {LayoutTextFlip} from '../components/ui/layout-text-flip.tsx'
import Eyes from '../components/Eyes.tsx'
import {ThinkingBubble} from '../components/ThinkingBubble.tsx'
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
} from "@/components/ui/resizable-navbar"
import { ThemeToggle } from '@/components/theme-toggle';
import { ThemeToggleDebug } from '@/components/theme-toggle-debug';
import FaddyLandingImage from '@/assets/images/Faddy_Landing.png'
import {PointerHighlight} from '../components/ui/pointer-highlight.tsx'
import { LandingFooter } from '@/components/ui/landing-footer';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [checkingBoards, setCheckingBoards] = useState(true);
  const [hasSubdomain, setHasSubdomain] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleClick = () => {
    router.push("/signup");
  }

  // Navbar Actions Component with visible prop
  const NavbarActions = ({ visible }: { visible?: boolean }) => (
    <div className="flex items-center gap-3">
      <ThemeToggleDebug />
      {!visible && (
        <NavbarButton 
          variant="secondary"
          onClick={() => router.push('/login')}
        >
          Login
        </NavbarButton>
      )}
      <NavbarButton 
        variant="primary"
        onClick={() => router.push('/signup')}
      >
        Sign Up
      </NavbarButton>
    </div>
  );
  
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
          ]
        },
        {
          section: "Use Cases",
          items: [
            { name: "Feature Request Management", link: "/collect-feedback" },
            { name: "Role-Based Access Control", link: "/role-based-access" },
            { name: "Public Roadmap", link: "/public-roadmap" },
          ]
        }
      ]
    },
    {
      name: "Documentation",
      link: "/docs",
    },
    {
      name: "Pricing",
      link: "/pricing",
    },
    {
      name: "Contact",
      link: "/contact",
    },
  ];
  
  // Refs for GSAP
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const benefitsRef = useRef(null);

  useEffect(() => {
    // --- ORIGINAL BUSINESS LOGIC (PRESERVED) ---
    const hostname = window.location.hostname;
    const parts = hostname.split('.');
    
    let subdomain = null;
    
    // Production: company.domain.com
    if (parts.length >= 3 && !hostname.includes('localhost')) {
      subdomain = parts[0];
      if (subdomain === 'www' || subdomain === 'api' || subdomain === 'admin') {
        subdomain = null;
      }
    }
    
    // Development: company.localhost:5173
    if (hostname.includes('localhost') && parts.length > 1 && parts[0] !== 'localhost') {
      subdomain = parts[0];
    }
    
    setHasSubdomain(!!subdomain);
    
    const redirectLogic = async () => {
      // If HAS subdomain, redirect to that organization's public feedback
      // This allows users to view ANY organization's public pages
      if (!loading && subdomain) {
        try {
          const { boardService } = await import('@/services/boardService');
          const response = await boardService.getPublicBoards();
          const publicBoards = response.data.boards;
          
          if (publicBoards.length > 0) {
            router.push('/feedback');
            return;
          } else {
            setCheckingBoards(false);
            return;
          }
        } catch (error) {
          console.error('Error loading public boards:', error);
          setCheckingBoards(false);
          return;
        }
      }

      // If NO subdomain and user is authenticated, go to their admin dashboard
      if (!loading && user && !subdomain) {
        router.push('/admin');
        return;
      }

      // If NO subdomain and not authenticated, show landing page
      if (!loading && !user && !subdomain) {
        setCheckingBoards(false);
        return;
      }
    };

    redirectLogic();
  }, [user, loading, router]);

  // --- GSAP ANIMATION ENGINE ---
  useEffect(() => {
    if (!checkingBoards && !loading) {
      const ctx = gsap.context(() => {
        // Hero Animation
        const tl = gsap.timeline();
        tl.from(".hero-reveal", {
          y: 60,
          opacity: 0,
          duration: 1,
          stagger: 0.2,
          ease: "expo.out"
        })
        .from(".hero-stats", {
          opacity: 0,
          y: 20,
          duration: 0.8,
          ease: "power2.out"
        }, "-=0.5");

        // Scroll Trigger: Features
        gsap.from(".feature-card", {
          scrollTrigger: {
            trigger: featuresRef.current,
            start: "top 80%",
            once: true
          },
          y: 40,
          opacity: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power3.out",
          immediateRender: false
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
          ease: "power2.out"
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
          ease: "power2.out"
        });
      });
      return () => ctx.revert();
    }
  }, [checkingBoards, loading]);

  if (loading || checkingBoards) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Initializing Faddy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 antialiased selection:bg-blue-100 dark:selection:bg-blue-900 selection:text-blue-900 dark:selection:text-blue-100">
      {/* Visual background texture */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(#000 1px, transparent 1px)`, backgroundSize: '40px 40px' }}></div>
      </div>

      {/* Resizable Navbar */}
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
          <NavbarActions visible={undefined} />
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <div key={`mobile-link-${idx}`} className="mb-4">
                {item.dropdown ? (
                  <div>
                    <span className="block text-lg font-medium text-neutral-600 dark:text-neutral-300 mb-2">
                      {item.name}
                    </span>
                    {item.dropdown.map((section, sectionIdx) => (
                      <div key={`mobile-section-${sectionIdx}`} className="ml-4 mt-3">
                        <div className="text-xs font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-2">
                          {section.section}
                        </div>
                        <div className="space-y-2">
                          {section.items.map((dropdownItem, itemIdx) => (
                            <a
                              key={`mobile-dropdown-${itemIdx}`}
                              href={dropdownItem.link}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="block text-sm text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1"
                            >
                              {dropdownItem.name}
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <a
                    href={item.link}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="relative text-neutral-600 dark:text-neutral-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <span className="block text-lg font-medium">{item.name}</span>
                  </a>
                )}
              </div>
            ))}
            <div className="flex w-full flex-col gap-3 mt-4">
              <div className="flex items-center gap-2 pb-2 border-b border-neutral-200 dark:border-neutral-800">
                <span className="text-sm font-medium text-neutral-600 dark:text-neutral-300">Theme:</span>
                <ThemeToggleDebug />
              </div>
              <NavbarButton
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push('/login');
                }}
                variant="secondary"
                className="w-full"
              >
                Login
              </NavbarButton>
              <NavbarButton
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push('/signup');
                }}
                variant="primary"
                className="w-full"
              >
                Sign Up
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      <main className="relative z-10">
        {/* Hero Section */}
        <section ref={heroRef} className="relative overflow-hidden pt-24 pb-40 px-6">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="hero-reveal text-4xl md:text-[70px] font-switzer font-medium tracking-tight leading-tight text-slate-900 dark:text-white mb-10 text-center">
              Stop Guessing What to<br />
              <span className="inline-block"><PointerHighlight>Build Next</PointerHighlight></span>
             {/* <LayoutTextFlip words={["What to","Build Next"]} /> */}
            </h1>
            
            <p className="hero-reveal text-xl md:text-2xl text-slate-500 dark:text-slate-400 max-w-3xl mx-auto mb-8 leading-relaxed">
                Faddy centralizes customer feedback and turns it into a clear product roadmap. Ship features users actually want—faster and with confidence.
            </p>
            
            <div className="hero-reveal flex flex-col sm:flex-row justify-center gap-8">
              <button 
                onClick={handleClick}
                className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-switzer font-bold rounded-2xl border border-black transition-all flex items-center justify-center gap-2 text-base"
              >
                Get Started
              </button>
              <a href="/feedback" className="px-10 py-4 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-switzer font-bold rounded-2xl border border-black dark:border-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2 text-base">
                Explore Demo Board
              </a>
            </div>

            <div className="mt-16 w-full max-w-6xl mx-auto">
              <img
                src="/images/Faddy_Landnding_hero.png"
                alt="Faddy Dashboard"
                className="w-full h-auto rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 object-contain"
              />
            </div>
            {/* Social Proof / Stats */}
            <div className="hero-stats mt-8 grid grid-cols-2 md:grid-cols-3 gap-12 max-w-4xl mx-auto border-t border-slate-100 pt-8">
              {[
                { label: 'Join our first 50 Founding Users', value: 'Early Access' },
                { label: 'Be part of the cmmunity shaping the future', value: 'V1.0' },
                { label: 'Setup fees or hidden credit card requirements', value: 'Zero' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-4xl font-switzer font-medium font-black text-slate-900 dark:text-white mb-2">{stat.value}</div>
                  <div className="text-sm font-switzer font-bold uppercase tracking-widest text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Abstract Glow Background */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-100/50 blur-[120px] rounded-full -z-10" />
          <div className="absolute top-1/2 -right-24 w-96 h-96 bg-blue-50/50 blur-[120px] rounded-full -z-10" />
        </section>

        {/* Features Section */}
        <section ref={featuresRef} className="py-32 px-6 bg-slate-50/50 dark:bg-slate-900/50 border-y border-slate-100 dark:border-slate-800">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl mb-24">
              <h2 className="text-4xl md:text-5xl font-switzer font-medium tracking-wide text-slate-900 dark:text-white mb-6">
                Everything you need to <br />manage product feedback
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
Organize all your feedback in one place, prioritize what to build next, and keep everyone updated
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  icon: <Lightbulb className="w-8 h-8" />, 
                  title: "Less time managing , more time building", 
                  desc: "Faddy  transforms raw user requests into actionable data points in seconds, not hours." 
                },
                { 
                  icon: <Zap className="w-8 h-8" />, 
                  title: "Easy to use", 
                  desc: "Faddy eliminates the complexity of user research with an interface designed for immediate clarity and high-velocity workflows." 
                },
                { 
                  icon: <MessageSquare className="w-8 h-8" />, 
                  title: "Close the Loop", 
                  desc: "Keep users engaged with public roadmaps and automated release notes." 
                }
              ].map((f, i) => (
                <div key={i} className="feature-card group p-10 bg-blue-600 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[32px] hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500">
                  <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-blue-500 group-hover:text-white transition-all duration-500">
                    {f.icon}
                  </div>
                  <h3 className="text-2xl font-switzer font-medium text-white dark:text-white mb-4">{f.title}</h3>
                  <p className="text-white dark:text-slate-400 leading-relaxed text-lg">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section ref={benefitsRef} className="py-32 px-6 bg-blue-600 overflow-hidden relative">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid md:grid-cols-2 gap-20 items-center">
              <div className="benefit-content text-white">
                <h2 className="text-4xl md:text-6xl font-switzer font-bold tracking-tight mb-8">
                  Focus on building, <br />not sorting.
                </h2>
                <div className="space-y-8">
                  {[
                    "Public roadmaps showcase your vision",
                    "Automated changelogs celebrate every launch",
                    "Smart notifications keep everyone in sync",
                    "Voting system lets users prioritize features"
                  ].map((text, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="mt-1 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-xl font-medium text-blue-50 leading-tight">{text}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid gap-6">
                {[
                  { label: "Engagement", value: "Up to 3x", icon: <Users /> },
                  { label: "Adoption", value: "+100%", icon: <TrendingUp /> }
                ].map((stat, i) => (
                  <div key={i} className="benefit-stat-card p-10 bg-white/10 backdrop-blur-2xl rounded-[40px] border border-white/20">
                    <div className="flex items-center gap-4 mb-6 text-white/80">
                      {stat.icon}
                      <span className="font-bold uppercase tracking-widest text-sm">{stat.label}</span>
                    </div>
                    <div className="text-6xl font-switzer font-black text-white">{stat.value}</div>
                    <p className="text-blue-100 mt-4 font-medium italic">Average increase observed by teams</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Abstract background shapes */}
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.1),transparent)]" />
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6">
          <div className="max-w-5xl mx-auto rounded-[48px] bg-slate-900 dark:bg-slate-800 p-16 md:p-24 overflow-hidden relative text-center">
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-switzer font-bold text-white mb-8 tracking-tighter leading-tight">
                Stop guessing. <br />Start building.
              </h2>
              <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                Join the teams that use Faddy to ship better products. 
                Free forever plan available.
              </p>
              <a href="/signup" className="inline-flex items-center gap-3 px-10 py-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-switzer font-black rounded-2xl hover:scale-105 transition-all shadow-xl shadow-white/10">
                Get Started Now
                <ArrowRight className="w-5 h-5" />
              </a>
            </div>
            {/* Background Glow */}
            <div className="absolute -bottom-24 -left-24 w-[500px] h-[500px] bg-blue-600/20 blur-[120px] rounded-full" />
          </div>
        </section>
      </main>

      {/* Footer */}
      <LandingFooter showCTA={true} />
    </div>
  );
}
