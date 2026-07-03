import Link from "next/link";
import { ArrowRight, Sparkles, Shield, Linkedin, MessageCircle } from "lucide-react";

interface LandingFooterProps {
  showCTA?: boolean;
}

export function LandingFooter({ showCTA = true }: LandingFooterProps) {
  return (
    <footer className="relative bg-slate-50 dark:bg-slate-950 border-t border-slate-200/60 dark:border-slate-800/60 overflow-hidden">
      
      <div className="relative max-w-7xl mx-auto px-6 py-12 lg:py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
          {/* Brand Section - Enhanced */}
          <div className="lg:col-span-5">
            <div className="mb-6">
              <span className="text-2xl font-bold tracking-tight text-blue-600 dark:text-blue-500">
                Faddy
              </span>
            </div>
            
            {/* Social Media Links */}
            <div className="flex items-center gap-4 mb-8">
              <a
                href="https://www.linkedin.com/in/swarup-basu-314465211/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 dark:hover:bg-blue-600 text-slate-600 dark:text-slate-400 hover:text-white transition-all duration-300 hover:scale-110"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="https://discord.gg/Dx69zsH2CV"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-slate-600 dark:text-slate-400 hover:text-white transition-all duration-300 hover:scale-110"
                aria-label="Discord"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                </svg>
              </a>
              <a
                href="https://whatsapp.com/channel/0029VaBW4gzHltYELmDUZ13T"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-green-600 dark:hover:bg-green-600 text-slate-600 dark:text-slate-400 hover:text-white transition-all duration-300 hover:scale-110"
                aria-label="WhatsApp"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            </div>
            
            {/* CTA Section */}
            {showCTA && (
              <div className="inline-flex flex-col sm:flex-row gap-3">
                <a 
                  href="/signup" 
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
                >
                  Get Started Free
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a 
                  href="/contact" 
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 hover:border-blue-600 dark:hover:border-blue-500 text-slate-900 dark:text-white font-bold rounded-xl hover:shadow-lg transition-all duration-300"
                >
                  Contact Sales
                </a>
              </div>
            )}
          </div>

          {/* Navigation Grid */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-10 lg:gap-12">
            {/* Product Column */}
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                <div className="w-1 h-4 bg-blue-600 rounded-full" />
                Product
              </h4>
              <ul className="space-y-3.5">
                <li>
                  <a 
                    href="/feedback" 
                    className="group inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-all"
                  >
                    Feedback Boards
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </a>
                </li>
                <li>
                  <a 
                    href="/roadmap" 
                    className="group inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-all"
                  >
                    Roadmap
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </a>
                </li>
                <li>
                  <a 
                    href="/changelog" 
                    className="group inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-all"
                  >
                    Changelog
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </a>
                </li>
                <li>
                  <a 
                    href="/pricing" 
                    className="group inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-all"
                  >
                    Pricing
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                <div className="w-1 h-4 bg-purple-600 rounded-full" />
                Company
              </h4>
              <ul className="space-y-3.5">
                <li>
                  <a 
                    href="/docs" 
                    className="group inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-all"
                  >
                    Documentation
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </a>
                </li>
                <li>
                  <a 
                    href="/contact" 
                    className="group inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-all"
                  >
                    Contact Us
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal Column */}
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                <div className="w-1 h-4 bg-emerald-600 rounded-full" />
                Legal
              </h4>
              <ul className="space-y-3.5">
                <li>
                  <a 
                    href="/policy/privacy" 
                    className="group inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-all"
                  >
                    Privacy Policy
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </a>
                </li>
                <li>
                  <a 
                    href="/policy/terms" 
                    className="group inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-all"
                  >
                    Terms and Conditions
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </a>
                </li>
                <li>
                  <a 
                    href="/policy/refund" 
                    className="group inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-all"
                  >
                    Refund Policy
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </a>
                </li>
                <li>
                  <a 
                    href="/policy/cookie" 
                    className="group inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-all"
                  >
                    Cookies
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar - Enhanced */}
        <div className="mt-12 pt-6 border-t border-slate-200/60 dark:border-slate-800/60">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              © {new Date().getFullYear()} Faddy. All rights reserved.
            </p>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-500">
                Built with ❤️ for product teams
              </span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Live
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
