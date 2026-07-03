"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  Bell,
  Users,
  Megaphone,
  CheckCircle2,
  MessageSquare,
  BarChart3,
  Target,
  Zap,
  Mail,
  Globe,
} from "lucide-react";
import { useState } from "react";
import Link from "next/link";
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
import { ThemeToggleDebug } from "@/components/theme-toggle-debug";
import { LandingFooter } from "@/components/ui/landing-footer";
import { Logo } from "@/components/logo";

export default function ShareUpdatesPage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  // Navbar Actions Component
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

  return (
    <>
      {/* Navbar */}
      <Navbar>
        <NavBody>
          <NavbarLogo href="/">
            <Logo width={120} height={32} />
          </NavbarLogo>
          <NavItems items={navItems} />
          <NavbarActions />
        </NavBody>

        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo href="/">
              <Logo width={120} height={32} />
            </NavbarLogo>
            <div className="flex items-center gap-2">
              <ThemeToggleDebug />
              <MobileNavToggle
                isOpen={isMobileMenuOpen}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              />
            </div>
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
                      <div
                        key={`mobile-section-${sectionIdx}`}
                        className="ml-4 mt-3"
                      >
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
                    <span className="block text-lg font-medium">
                      {item.name}
                    </span>
                  </a>
                )}
              </div>
            ))}
            <NavbarActions visible />
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      <div className="min-h-screen bg-[#f9f9f9] dark:bg-background">
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden bg-white dark:bg-background">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl lg:text-4xl font-switzer font-medium text-slate-900 dark:text-white mb-6 tracking-tight">
              Share Updates, Close the Loop
            </h1>
            <p className="text-xl font-switzer text-slate-600 dark:text-gray-400 mb-8 leading-relaxed">
              Keep users informed with changelogs and status updates. Show them
              you're listening and building what they want.
            </p>

            {/* CTA Button */}
            <div className="flex justify-center mb-8">
              <Link href="/signup">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                >
                  Start Sharing
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            {/* Trust Signals */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 justify-center text-sm text-slate-600 dark:text-gray-400">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Public changelogs</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Email notifications</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Status tracking</span>
              </div>
            </div>
          </div>
        </section>

        {/* Keep your users in the loop */}
        <section className="py-20 bg-[#f9f9f9] dark:bg-gray-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-switzer font-bold text-slate-900 dark:text-white mb-4">
                Keep your users in the loop
              </h2>
              <p className="text-xl text-slate-600 dark:text-gray-400 max-w-3xl mx-auto">
                Communication builds trust and keeps users engaged
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Feature 1 */}
              <Card className="border-slate-200 dark:border-border shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-switzer font-medium text-slate-900 dark:text-white mb-3">
                    Changelogs
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400">
                    Publish beautiful changelogs to showcase new features,
                    improvements, and bug fixes
                  </p>
                </CardContent>
              </Card>

              {/* Feature 2 */}
              <Card className="border-slate-200 dark:border-border shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-switzer font-medium text-slate-900 dark:text-white mb-3">
                    Status Updates
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400">
                    Update feedback status from planned to in progress to
                    shipped
                  </p>
                </CardContent>
              </Card>

              {/* Feature 3 */}
              <Card className="border-slate-200 dark:border-border shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-switzer font-medium text-slate-900 dark:text-white mb-3">
                    Notifications
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400">
                    Automatically notify users when their requested features are
                    shipped
                  </p>
                </CardContent>
              </Card>

              {/* Feature 4 */}
              <Card className="border-slate-200 dark:border-border shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-switzer font-medium text-slate-900 dark:text-white mb-3">
                    Public Roadmap
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400">
                    Share what you're working on and build anticipation for
                    upcoming features
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Explore the customer feedback cycle */}
        <section className="py-20 bg-[#f9f9f9] dark:bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-switzer font-medium text-slate-900 dark:text-white mb-4">
                Explore the customer feedback cycle
              </h2>
              <p className="text-xl text-slate-600 dark:text-gray-400 max-w-3xl mx-auto">
                From collection to action, understand the complete journey
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Step 1 */}
              <div className="relative">
                <Link href="/collect-feedback">
                  <Card className="border-slate-200 dark:border-border shadow-lg h-full hover:shadow-xl transition-all cursor-pointer group">
                    <CardContent className="p-8">
                      <div className="mb-6">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full text-xl font-bold group-hover:scale-110 transition-transform">
                          1
                        </div>
                      </div>
                      <h3 className="text-2xl font-switzer font-bold text-slate-900 dark:text-white mb-4 group-hover:text-blue-600 transition-colors">
                        Collect
                      </h3>
                      <p className="text-slate-600 dark:text-gray-400 mb-6">
                        Gather feedback from multiple channels into one
                        centralized hub. Users submit ideas, report bugs, and
                        share suggestions.
                      </p>
                      <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-semibold">
                        <MessageSquare className="h-4 w-4" />
                        <span>Collect Feedback</span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                {/* Arrow */}
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <ArrowRight className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative">
                <Link href="/analyze-feedback">
                  <Card className="border-slate-200 dark:border-border shadow-lg h-full hover:shadow-xl transition-all cursor-pointer group">
                    <CardContent className="p-8">
                      <div className="mb-6">
                        <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full text-xl font-bold group-hover:scale-110 transition-transform">
                          2
                        </div>
                      </div>
                      <h3 className="text-2xl font-switzer font-bold text-slate-900 dark:text-white mb-4 group-hover:text-blue-600 transition-colors">
                        Analyze
                      </h3>
                      <p className="text-slate-600 dark:text-gray-400 mb-6">
                        Filter, sort, and prioritize feedback based on votes,
                        impact, and alignment with your goals. Identify patterns
                        and trends.
                      </p>
                      <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-semibold">
                        <BarChart3 className="h-4 w-4" />
                        <span>Analyze Feedback</span>
                        <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
                {/* Arrow */}
                <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <ArrowRight className="h-8 w-8 text-blue-600" />
                </div>
              </div>

              {/* Step 3 */}
              <div>
                <Card className="border-blue-200 dark:border-blue-800 shadow-lg h-full bg-blue-50 dark:bg-blue-950/20">
                  <CardContent className="p-8">
                    <div className="mb-6">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full text-xl font-bold">
                        3
                      </div>
                    </div>
                    <h3 className="text-2xl font-switzer font-bold text-slate-900 dark:text-white mb-4">
                      Share
                    </h3>
                    <p className="text-slate-600 dark:text-gray-400 mb-6">
                      Keep users informed with updates, changelogs, and status
                      changes. Close the loop and build trust with your
                      community.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-semibold">
                      <Users className="h-4 w-4" />
                      <span>Share Updates</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <LandingFooter showCTA={false} />
    </>
  );
}
