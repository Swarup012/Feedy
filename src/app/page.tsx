"use client"
import React, { useEffect, useState } from 'react';
import { ArrowRight, MessageSquare, Lightbulb, Zap, CheckCircle, Star, Users, TrendingUp, Sparkles } from 'lucide-react';
import { Logo } from '@/components/logo';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [checkingBoards, setCheckingBoards] = useState(true);

  useEffect(() => {
    
    const redirectToBoard = async () => {
      // If user is authenticated, redirect to admin dashboard
      if (!loading && user) {
        router.push('/admin');
        return;
      }

      // If not authenticated, redirect to a random public board
      if (!loading && !user) {
        try {
          const { boardService } = await import('@/services/boardService');
          const response = await boardService.getPublicBoards();
          const publicBoards = response.data.boards;
          
          if (publicBoards.length > 0) {
            // Pick a random public board
            const randomBoard = publicBoards[Math.floor(Math.random() * publicBoards.length)];
            router.push(`/feedback/boards/${randomBoard.slug}`);
          } else {
            // No public boards, show landing page
            setCheckingBoards(false);
          }
        } catch (error) {
          console.error('Error loading public boards:', error);
          setCheckingBoards(false);
        }
      }
    };

    redirectToBoard();
  }, [user, loading, router]);

  // Show loading state while checking
  if (loading || checkingBoards) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  const primaryColor = '#2563eb';
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-blue-50">
      <style jsx>{`
        .hover-primary:hover {
          color: ${primaryColor};
        }
        .btn-primary {
          background-color: ${primaryColor};
        }
        .btn-primary:hover {
          box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.5);
        }
        .btn-primary-lg:hover {
          box-shadow: 0 25px 50px -12px rgba(37, 99, 235, 0.5);
        }
        .border-hover:hover {
          border-color: rgba(37, 99, 235, 0.5);
        }
        .text-primary {
          color: ${primaryColor};
        }
        .bg-primary {
          background-color: ${primaryColor};
        }
        .bg-primary-light {
          background-color: rgba(37, 99, 235, 0.15);
        }
        .bg-primary-lighter {
          background-color: rgba(37, 99, 235, 0.1);
        }
        .border-primary-light {
          border-color: rgba(37, 99, 235, 0.3);
        }
        .shadow-primary {
          box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.1);
        }
        .hover-glow:hover {
          background-color: rgba(37, 99, 235, 0.2);
        }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-2">
              <Logo width={36} height={36} />
              <span className="text-xl font-bold text-primary">
                Faddy
              </span>
            </div>
            
            <nav className="hidden md:flex items-center space-x-8">
              <a href="/feedback" className="text-sm font-medium text-slate-600 hover-primary transition-colors">
                Feedback
              </a>
              <a href="/roadmap/testing" className="text-sm font-medium text-slate-600 hover-primary transition-colors">
                Roadmap
              </a>
              <a href="/changelog" className="text-sm font-medium text-slate-600 hover-primary transition-colors">
                Changelog
              </a>
            </nav>
            
            <div className="flex items-center space-x-4">
              <a href="/login" className="text-sm font-medium text-slate-600 hover-primary transition-colors">
                Log In
              </a>
              <a href="/signup" className="px-5 py-2 btn-primary text-white text-sm font-medium rounded-xl transition-all duration-300">
                Sign Up
              </a>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-20 pb-32 px-6 lg:px-8">
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-light rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-lighter rounded-full blur-3xl animate-pulse" style={{animationDelay: '700ms'}}></div>
          </div>
          
          <div className="max-w-7xl mx-auto relative">
            <div className="text-center max-w-4xl mx-auto">
              {/* Badge */}
              <div className="inline-flex items-center space-x-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full border border-primary-light shadow-primary mb-8">
                <Star className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-slate-700">Trusted by 10,000+ product teams</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
                <span className="text-slate-900">
                  Build Better Products
                </span>
                <br />
                <span className="text-primary">
                  with User Feedback
                </span>
              </h1>
              
              <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                Transform customer insights into action. Collect, analyze, and prioritize feedback to create products your users will love.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <a href="/signup" className="group px-8 py-4 btn-primary btn-primary-lg text-white font-semibold rounded-2xl transition-all duration-300 flex items-center space-x-2">
                  <span>Get Started Free</span>
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </a>
                <a href="/feedback" className="px-8 py-4 bg-white/80 backdrop-blur-sm text-slate-700 font-semibold rounded-2xl border border-slate-200 border-hover hover:shadow-xl transition-all duration-300">
                  View Demo Board
                </a>
              </div>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-8 mt-16 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">10k+</div>
                  <div className="text-sm text-slate-600 mt-1">Active Users</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">500k+</div>
                  <div className="text-sm text-slate-600 mt-1">Feedback Items</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">99%</div>
                  <div className="text-sm text-slate-600 mt-1">Satisfaction</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 px-6 lg:px-8 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                Everything You Need in One Platform
              </h2>
              <p className="text-lg text-slate-600">
                Powerful features designed to streamline your feedback workflow
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Lightbulb className="h-8 w-8" />,
                  title: "Capture Feedback",
                  description: "Collect feature requests, bug reports, and ideas seamlessly from multiple channels.",
                },
                {
                  icon: <Zap className="h-8 w-8" />,
                  title: "AI-Powered Insights",
                  description: "Automatically categorize, analyze sentiment, and surface trending feedback with AI.",
                },
                {
                  icon: <MessageSquare className="h-8 w-8" />,
                  title: "Engage Community",
                  description: "Keep users informed with public roadmaps, changelogs, and status updates.",
                }
              ].map((feature, index) => (
                <div key={index} className="group relative">
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500 hover-glow"></div>
                  <div className="relative h-full bg-white rounded-3xl p-8 border border-slate-200 hover:border-transparent hover:shadow-2xl transition-all duration-300">
                    <div className="inline-flex p-4 rounded-2xl bg-primary text-white mb-6 group-hover:scale-110 transition-transform duration-300">
                      {feature.icon}
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                    <p className="text-slate-600 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-24 px-6 lg:px-8 bg-primary relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent)]"></div>
          </div>
          
          <div className="max-w-7xl mx-auto relative">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Close the Loop with Your Users
                </h2>
                <p className="text-blue-100 text-lg mb-8">
                  Build trust and loyalty by keeping users engaged throughout your product journey.
                </p>
                
                <div className="space-y-6">
                  {[
                    "Public roadmaps showcase your vision and priorities",
                    "Automated changelogs celebrate every launch",
                    "Smart notifications keep everyone in sync",
                    "Voting system lets users prioritize features"
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-white text-lg">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="relative">
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                  <div className="space-y-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30">
                      <div className="flex items-center space-x-3 mb-4">
                        <Users className="h-6 w-6 text-white" />
                        <span className="text-white font-semibold">User Engagement</span>
                      </div>
                      <div className="text-4xl font-bold text-white">+187%</div>
                      <div className="text-blue-100 text-sm mt-2">Average increase</div>
                    </div>
                    
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 border border-white/30">
                      <div className="flex items-center space-x-3 mb-4">
                        <TrendingUp className="h-6 w-6 text-white" />
                        <span className="text-white font-semibold">Feature Adoption</span>
                      </div>
                      <div className="text-4xl font-bold text-white">+243%</div>
                      <div className="text-blue-100 text-sm mt-2">Faster rollouts</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-24 px-6 lg:px-8 bg-slate-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-lg text-slate-600">
                Choose the perfect plan for your team. Start free, upgrade as you grow.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Free Plan */}
              <div className="bg-white rounded-3xl p-8 border-2 border-slate-200 hover:shadow-xl transition-all duration-300">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Free</h3>
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-slate-900">$0</span>
                    <span className="text-slate-600 ml-2">/month</span>
                  </div>
                  <p className="text-slate-600 mt-4">Perfect for getting started</p>
                </div>
                
                <a href="/signup" className="block w-full py-3 px-6 text-center font-semibold rounded-xl border-2 border-slate-300 text-slate-700 hover:border-slate-400 hover:shadow-md transition-all duration-300 mb-6">
                  Get Started
                </a>
                
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mr-3 mt-0.5" />
                    <span className="text-slate-600">Up to 100 feedback items</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mr-3 mt-0.5" />
                    <span className="text-slate-600">Public roadmap</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mr-3 mt-0.5" />
                    <span className="text-slate-600">Basic analytics</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mr-3 mt-0.5" />
                    <span className="text-slate-600">Community support</span>
                  </li>
                </ul>
              </div>

              {/* Pro Plan */}
              <div className="bg-white rounded-3xl p-8 border-2 border-primary hover:shadow-2xl transition-all duration-300 relative transform md:scale-105">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary text-white px-4 py-1 rounded-full text-sm font-semibold">
                    Most Popular
                  </span>
                </div>
                
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Pro</h3>
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-slate-900">$29</span>
                    <span className="text-slate-600 ml-2">/month</span>
                  </div>
                  <p className="text-slate-600 mt-4">For growing teams</p>
                </div>
                
                <a href="/signup" className="block w-full py-3 px-6 text-center font-semibold rounded-xl bg-primary text-white btn-primary-lg transition-all duration-300 mb-6">
                  Start Free Trial
                </a>
                
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mr-3 mt-0.5" />
                    <span className="text-slate-600">Unlimited feedback items</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mr-3 mt-0.5" />
                    <span className="text-slate-600">AI-powered insights</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mr-3 mt-0.5" />
                    <span className="text-slate-600">Advanced analytics</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mr-3 mt-0.5" />
                    <span className="text-slate-600">Priority email support</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mr-3 mt-0.5" />
                    <span className="text-slate-600">Custom branding</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mr-3 mt-0.5" />
                    <span className="text-slate-600">Integrations</span>
                  </li>
                </ul>
              </div>

              {/* Enterprise Plan */}
              <div className="bg-white rounded-3xl p-8 border-2 border-slate-200 hover:shadow-xl transition-all duration-300">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Enterprise</h3>
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-slate-900">Custom</span>
                  </div>
                  <p className="text-slate-600 mt-4">For large organizations</p>
                </div>
                
                <a href="/contact" className="block w-full py-3 px-6 text-center font-semibold rounded-xl border-2 border-slate-300 text-slate-700 hover:border-slate-400 hover:shadow-md transition-all duration-300 mb-6">
                  Contact Sales
                </a>
                
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mr-3 mt-0.5" />
                    <span className="text-slate-600">Everything in Pro</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mr-3 mt-0.5" />
                    <span className="text-slate-600">Unlimited team members</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mr-3 mt-0.5" />
                    <span className="text-slate-600">Advanced security (SSO)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mr-3 mt-0.5" />
                    <span className="text-slate-600">Dedicated account manager</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mr-3 mt-0.5" />
                    <span className="text-slate-600">Custom integrations</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mr-3 mt-0.5" />
                    <span className="text-slate-600">SLA guarantee</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-12 md:p-16 relative overflow-hidden">
              <div className="absolute inset-0" style={{background: `radial-gradient(circle at 30% 50%, rgba(37, 99, 235, 0.3), transparent)`}}></div>
              <div className="relative">
                <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                  Ready to Transform Your Feedback?
                </h2>
                <p className="text-xl text-blue-200 mb-10">
                  Join thousands of teams building better products with Faddy
                </p>
                <a href="/signup" className="inline-flex items-center space-x-2 px-8 py-4 bg-white text-primary font-semibold rounded-2xl hover:shadow-2xl hover:shadow-white/50 transition-all duration-300">
                  <span>Start Free Trial</span>
                  <ArrowRight className="h-5 w-5" />
                </a>
                <p className="text-blue-200 text-sm mt-6">No credit card required • Free forever plan available</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <span className="text-slate-400 text-sm">
                © 2025 Faddy. All rights reserved.
              </span>
            </div>
            
            <div className="flex items-center space-x-6">
              <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}