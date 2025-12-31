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

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [checkingBoards, setCheckingBoards] = useState(true);
  const [hasSubdomain, setHasSubdomain] = useState(false);
  
  const handleClick = () => {
    router.push("/signup");
  }
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
      // If user is authenticated, always go to admin dashboard
      if (!loading && user) {
        router.push('/admin');
        return;
      }

      // If NO subdomain (root domain), show landing page
      if (!loading && !user && !subdomain) {
        setCheckingBoards(false);
        return;
      }

      // If HAS subdomain and not authenticated, redirect to company's board
      if (!loading && !user && subdomain) {
        try {
          const { boardService } = await import('@/services/boardService');
          const response = await boardService.getPublicBoards();
          const publicBoards = response.data.boards;
          
          if (publicBoards.length > 0) {
            const firstBoard = publicBoards[0];
            router.push(`/feedback/boards/${firstBoard.slug}`);
          } else {
            setCheckingBoards(false);
          }
        } catch (error) {
          console.error('Error loading public boards:', error);
          setCheckingBoards(false);
        }
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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="text-slate-500 font-medium animate-pulse">Initializing Faddy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Visual background texture */}
      <div className="fixed inset-0 z-0 opacity-[0.03] pointer-events-none">
        <div className="absolute inset-0" style={{ backgroundImage: `radial-gradient(#000 1px, transparent 1px)`, backgroundSize: '40px 40px' }}></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 w-full z-[100] bg-white/70 backdrop-blur-xl border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 group">
            <div className="transition-transform duration-300 group-hover:rotate-12">
              <Logo width={36} height={36} />
            </div>
            <span className="text-2xl font-bold tracking-tighter text-slate-900">Faddy</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-10">
            {['Feedback', 'Roadmap', 'Changelog'].map((item) => (
              <a key={item} href={`/${item.toLowerCase()}`} className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors">
                {item}
              </a>
            ))}
          </nav>
          
          <div className="flex items-center gap-6">
            <a href="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">Log In</a>
            <a href="/signup" className="px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-full hover:bg-blue-600 hover:shadow-lg hover:shadow-blue-200 transition-all duration-300">
              Sign Up Free
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10 pt-20">
        {/* Hero Section */}
        <section ref={heroRef} className="relative overflow-hidden pt-24 pb-40 px-6">
          <div className="max-w-7xl mx-auto text-center">
            {/* Floating Badge */}
            <div className="hero-reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 mb-10">
              <Star className="w-4 h-4 text-blue-600 fill-blue-600" />
              <span className="text-xs font-black uppercase tracking-widest text-blue-700">Trusted by 10k+ teams</span>
            </div>
            
            <h1 className="hero-reveal text-6xl md:text-[92px] font-extrabold tracking-tight leading-[0.9] text-slate-900 mb-10">
              The feedback loop <br />
              <LayoutTextFlip words={["Done Right","Get Better"]} />
            </h1>
            
            <p className="hero-reveal text-xl md:text-2xl text-slate-500 max-w-3xl mx-auto mb-14 leading-relaxed">
              Faddy centralizes customer requests and turns them into 
              actionable insights. Build what users actually want, faster.
            </p>
            
            <div className="hero-reveal flex flex-col sm:flex-row justify-center gap-5">
              <LandingButton onClick={handleClick} />
              <a href="/feedback" className="px-10 py-5 bg-white text-slate-900 font-bold rounded-2xl border-2 border-slate-100 hover:border-blue-200 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                Explore Demo Board
                <ExternalLink className="w-4 h-4 text-slate-400" />
              </a>
            </div>

            {/* Social Proof / Stats */}
            <div className="hero-stats mt-24 grid grid-cols-2 md:grid-cols-3 gap-12 max-w-4xl mx-auto border-t border-slate-100 pt-16">
              {[
                { label: 'Active Users', value: '10k+' },
                { label: 'Feedback Items', value: '500k+' },
                { label: 'CSAT Score', value: '99%' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-4xl font-black text-slate-900 mb-2">{stat.value}</div>
                  <div className="text-sm font-bold uppercase tracking-widest text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Abstract Glow Background */}
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-100/50 blur-[120px] rounded-full -z-10" />
          <div className="absolute top-1/2 -right-24 w-96 h-96 bg-blue-50/50 blur-[120px] rounded-full -z-10" />
        </section>

        {/* Features Section */}
        <section ref={featuresRef} className="py-32 px-6 bg-slate-50/50 border-y border-slate-100">
          <div className="max-w-7xl mx-auto">
            <div className="max-w-3xl mb-24">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-900 mb-6">
                Everything you need to <br />manage product feedback
              </h2>
              <p className="text-lg text-slate-500 leading-relaxed">
                Powerful features designed to replace your messy spreadsheets and scattered Slack messages.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { 
                  icon: <Lightbulb className="w-8 h-8" />, 
                  title: "Centralize Inputs", 
                  desc: "Connect your support tools, Slack, and email to one unified feedback inbox." 
                },
                { 
                  icon: <Zap className="w-8 h-8" />, 
                  title: "AI-Categorization", 
                  desc: "Let our AI analyze sentiment and tag features so you can see trends instantly." 
                },
                { 
                  icon: <MessageSquare className="w-8 h-8" />, 
                  title: "Close the Loop", 
                  desc: "Keep users engaged with public roadmaps and automated release notes." 
                }
              ].map((f, i) => (
                <div key={i} className="feature-card group p-10 bg-white border border-slate-200 rounded-[32px] hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500">
                  <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                    {f.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-4">{f.title}</h3>
                  <p className="text-slate-500 leading-relaxed text-lg">{f.desc}</p>
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
                <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">
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
                  { label: "Engagement", value: "+187%", icon: <Users /> },
                  { label: "Adoption", value: "+243%", icon: <TrendingUp /> }
                ].map((stat, i) => (
                  <div key={i} className="benefit-stat-card p-10 bg-white/10 backdrop-blur-2xl rounded-[40px] border border-white/20">
                    <div className="flex items-center gap-4 mb-6 text-white/80">
                      {stat.icon}
                      <span className="font-bold uppercase tracking-widest text-sm">{stat.label}</span>
                    </div>
                    <div className="text-6xl font-black text-white">{stat.value}</div>
                    <p className="text-blue-100 mt-4 font-medium italic">Average increase observed by teams</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Abstract background shapes */}
          <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.1),transparent)]" />
        </section>

        {/* Pricing Section */}
        <section className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-24">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 tracking-tight">Simple, scale-ready pricing</h2>
              <p className="text-xl text-slate-500">No hidden fees. Start for free, upgrade when you’re ready.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Plan Card */}
              <div className="p-10 rounded-[32px] border-2 border-slate-100 bg-white hover:border-slate-200 transition-all group">
                <h3 className="text-xl font-bold mb-2">Free</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-5xl font-black">$0</span>
                  <span className="text-slate-400 font-bold">/mo</span>
                </div>
                <ul className="space-y-4 mb-10">
                  {['100 feedback items', 'Public roadmap', 'Community support'].map(item => (
                    <li key={item} className="flex items-center gap-3 text-slate-600 font-medium">
                      <CheckCircle className="w-5 h-5 text-blue-500" /> {item}
                    </li>
                  ))}
                </ul>
                <a href="/signup" className="block w-full py-4 bg-slate-100 text-slate-900 text-center font-bold rounded-2xl group-hover:bg-slate-900 group-hover:text-white transition-all">Get Started</a>
              </div>

              {/* Pro Plan Card */}
              <div className="p-10 rounded-[32px] border-2 border-blue-600 bg-white shadow-2xl shadow-blue-200 relative scale-105 z-10">
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-5 py-1 rounded-full text-xs font-black uppercase tracking-widest">Most Popular</div>
                <h3 className="text-xl font-bold mb-2">Pro</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-5xl font-black text-blue-600">$29</span>
                  <span className="text-slate-400 font-bold">/mo</span>
                </div>
                <ul className="space-y-4 mb-10">
                  {['Unlimited items', 'AI Insights', 'Custom Branding', 'Advanced Integrations'].map(item => (
                    <li key={item} className="flex items-center gap-3 text-slate-600 font-medium">
                      <CheckCircle className="w-5 h-5 text-blue-600" /> {item}
                    </li>
                  ))}
                </ul>
                <a href="/signup" className="block w-full py-4 bg-blue-600 text-white text-center font-bold rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">Start Free Trial</a>
              </div>

              {/* Enterprise Card */}
              <div className="p-10 rounded-[32px] border-2 border-slate-100 bg-white hover:border-slate-200 transition-all group">
                <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-5xl font-black">Custom</span>
                </div>
                <ul className="space-y-4 mb-10">
                  {['SSO Security', 'SLA Guarantee', 'Dedicated Manager', 'Custom Contracts'].map(item => (
                    <li key={item} className="flex items-center gap-3 text-slate-600 font-medium">
                      <CheckCircle className="w-5 h-5 text-blue-500" /> {item}
                    </li>
                  ))}
                </ul>
                <a href="/contact" className="block w-full py-4 bg-slate-100 text-slate-900 text-center font-bold rounded-2xl group-hover:bg-slate-900 group-hover:text-white transition-all">Contact Sales</a>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 px-6">
          <div className="max-w-5xl mx-auto rounded-[48px] bg-slate-900 p-16 md:p-24 overflow-hidden relative text-center">
            <div className="relative z-10">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tighter leading-tight">
                Stop guessing. <br />Start building.
              </h2>
              <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                Join the 10,000+ teams that use Faddy to ship better products. 
                Free forever plan available.
              </p>
              <a href="/signup" className="inline-flex items-center gap-3 px-10 py-5 bg-white text-slate-900 font-black rounded-2xl hover:scale-105 transition-all shadow-xl shadow-white/10">
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
      <footer className="bg-slate-50 border-t border-slate-200 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Logo width={28} height={28} />
                <span className="text-xl font-bold tracking-tighter">Faddy</span>
              </div>
              <p className="text-slate-500 max-w-xs font-medium">
                The modern way to manage customer feedback and ship better products.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
              <div>
                <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-widest text-xs">Product</h4>
                <ul className="space-y-4 text-sm font-bold text-slate-500">
                  <li><a href="/feedback" className="hover:text-blue-600">Boards</a></li>
                  <li><a href="/roadmap/testing" className="hover:text-blue-600">Roadmap</a></li>
                  <li><a href="/changelog" className="hover:text-blue-600">Changelog</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-bold text-slate-900 mb-6 uppercase tracking-widest text-xs">Support</h4>
                <ul className="space-y-4 text-sm font-bold text-slate-500">
                  <li><a href="#" className="hover:text-blue-600">Help Center</a></li>
                  <li><a href="#" className="hover:text-blue-600">Privacy</a></li>
                  <li><a href="#" className="hover:text-blue-600">Terms</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-20 pt-10 border-t border-slate-200 flex flex-col md:flex-row justify-between text-slate-400 text-xs font-bold uppercase tracking-widest">
            <span>© 2025 Faddy Inc.</span>
            <div className="flex gap-8 mt-4 md:mt-0">
              <a href="#" className="hover:text-slate-900 transition-colors">Twitter</a>
              <a href="#" className="hover:text-slate-900 transition-colors">LinkedIn</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
