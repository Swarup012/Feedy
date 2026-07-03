import Link from "next/link";
import { Logo } from "@/components/logo";
import { ArrowUpRight, Sparkles } from "lucide-react";

interface FooterProps {
  variant?: "default" | "minimal";
  organizationName?: string;
}

export function Footer({ variant = "default", organizationName }: FooterProps) {
  const currentYear = new Date().getFullYear();
  const appName = organizationName || "Faddy";

  if (variant === "minimal") {
    return (
      <footer className="relative w-full border-t border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/20 to-blue-50/40 dark:from-transparent dark:via-blue-950/10 dark:to-blue-950/20 pointer-events-none" />
        <div className="container relative py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2.5">
              <Logo className="h-5 w-5" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                © {currentYear} {appName}. All rights reserved.
              </span>
            </div>
            <div className="flex gap-6">
              <Link
                href="/policy/privacy"
                className="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/policy/terms"
                className="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
              >
                Terms and Conditions
              </Link>
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="relative w-full border-t border-gray-200/50 dark:border-gray-800/50 bg-white dark:bg-gray-950 overflow-hidden">
      {/* Premium gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/30 dark:from-blue-950/20 dark:via-gray-950 dark:to-purple-950/10 pointer-events-none" />

      {/* Decorative elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="container relative py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
          {/* Brand Section - Enhanced */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 dark:from-blue-600 dark:to-blue-700 shadow-lg shadow-blue-500/25">
                <Logo className="h-6 w-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                {appName}
              </span>
            </div>
            <p className="text-base leading-relaxed text-gray-600 dark:text-gray-400 max-w-md mb-6">
              The modern way to manage customer feedback and ship better
              products. Transform feedback into actionable insights.
            </p>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border border-blue-200/50 dark:border-blue-800/50">
              <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Trusted by innovative teams
              </span>
            </div>
          </div>

          {/* Navigation Grid - 3 columns */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8 lg:gap-12">
            {/* Product Links */}
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-gray-900 dark:text-white mb-5">
                Product
              </h4>
              <ul className="space-y-3.5">
                <li>
                  <Link
                    href="/feedback"
                    className="group inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-all"
                  >
                    Feedback
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/roadmap"
                    className="group inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-all"
                  >
                    Roadmap
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/changelog"
                    className="group inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-all"
                  >
                    Changelog
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="group inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-all"
                  >
                    Pricing
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-gray-900 dark:text-white mb-5">
                Company
              </h4>
              <ul className="space-y-3.5">
                <li>
                  <Link
                    href="/docs"
                    className="group inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-all"
                  >
                    Documentation
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="group inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-all"
                  >
                    Contact Us
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div>
              <h4 className="font-bold text-sm uppercase tracking-wider text-gray-900 dark:text-white mb-5">
                Legal
              </h4>
              <ul className="space-y-3.5">
                <li>
                  <Link
                    href="/policy/privacy"
                    className="group inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-all"
                  >
                    Privacy Policy
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/policy/terms"
                    className="group inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-all"
                  >
                    Terms and Conditions
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/policy/refund"
                    className="group inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-all"
                  >
                    Refund Policy
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
                <li>
                  <Link
                    href="/policy/cookie"
                    className="group inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-all"
                  >
                    Cookies
                    <ArrowUpRight className="h-3.5 w-3.5 opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar - Enhanced */}
        <div className="mt-16 pt-8 border-t border-gray-200/60 dark:border-gray-800/60">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
              © {currentYear} {appName}. All rights reserved.
            </p>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-500">
              Made with ❤️ for product teams
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
