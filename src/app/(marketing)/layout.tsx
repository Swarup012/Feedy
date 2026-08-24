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
import { ThemeToggleDebug } from "@/components/theme-toggle-debug";
import { Logo } from "@/components/logo";
import {
  MessageSquare,
  BarChart3,
  Zap,
  Share2,
  FolderOpen,
  Users,
  Map,
  Plug,
  Bot,
  Eye,
  Code,
} from "lucide-react";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  const NavbarActions = ({ visible }: { visible?: boolean }) => (
    <div className="flex items-center gap-3">
      <ThemeToggleDebug />
      {!visible && (
        <NavbarButton variant="secondary" onClick={() => router.push("/login")} className="border-2">
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
          section: "Core",
          items: [
            {
              name: "AI Chat",
              link: "/ai-chat",
              description: "Ask your product data questions in plain language",
              icon: <Bot className="w-4 h-4" />,
            },
            {
              name: "Expert View",
              link: "/expert-view",
              description: "Bird's-eye view of all feedback and trends",
              icon: <Eye className="w-4 h-4" />,
            },
            {
              name: "Autopilot",
              link: "/autopilot",
              description: "Automated workflows that save you hours",
              icon: <Zap className="w-4 h-4" />,
            },
            {
              name: "Developer & API",
              link: "/developer-api",
              description: "Build custom integrations with full API access",
              icon: <Code className="w-4 h-4" />,
            },
            {
              name: "Integrations",
              link: "/integrations",
              description: "Connect Intercom, Slack, Discord & more",
              icon: <Plug className="w-4 h-4" />,
            },
            {
              name: "Team Access",
              link: "/role-based-access",
              description: "Role-based permissions for your team",
              icon: <Users className="w-4 h-4" />,
            },
          ],
        },
        {
          section: "Manage",
          items: [
            {
              name: "Collect Feedback",
              link: "/collect-feedback",
              description: "Gather insights from users across all channels",
              icon: <MessageSquare className="w-4 h-4" />,
            },
            {
              name: "Analyze Feedback",
              link: "/analyze-feedback",
              description: "AI-powered analysis to find what matters",
              icon: <BarChart3 className="w-4 h-4" />,
            },
            {
              name: "Share Updates",
              link: "/share-updates",
              description: "Keep users engaged with changelogs",
              icon: <Share2 className="w-4 h-4" />,
            },
            {
              name: "Feature Requests",
              link: "/collect-feedback",
              description: "Track and prioritize user requests",
              icon: <FolderOpen className="w-4 h-4" />,
            },
            {
              name: "Public Roadmap",
              link: "/public-roadmap",
              description: "Share what you're building next",
              icon: <Map className="w-4 h-4" />,
            },
          ],
        },
      ],
      featured: {
        title: "From the blog",
        description: "Learn how teams use Faddy to build better products.",
        link: "/blog",
      },
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
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody>
          <NavbarLogo href="/">
            <Logo width={120} height={32} />
          </NavbarLogo>
          <NavItems items={navItems} />
          <NavbarActions />
        </NavBody>

        {/* Mobile Navigation */}
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
            id="mobile-nav-menu"
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <div key={`mobile-link-${idx}`} className="mb-4">
                {item.dropdown ? (
                  <div>
                    <span className="block text-lg font-medium text-muted-foreground mb-2">
                      {item.name}
                    </span>
                    {item.dropdown.map((section, sectionIdx) => (
                      <div
                        key={`mobile-section-${sectionIdx}`}
                        className="ml-4 mt-3"
                      >
                        <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                          {section.section}
                        </div>
                        <div className="space-y-2">
                          {section.items.map((dropdownItem, itemIdx) => (
                            <a
                              key={`mobile-dropdown-${itemIdx}`}
                              href={dropdownItem.link}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className="block text-sm text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset rounded transition-colors py-1"
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
                    className="relative text-muted-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset rounded transition-colors"
                  >
                    <span className="block text-lg font-medium">
                      {item.name}
                    </span>
                  </a>
                )}
              </div>
            ))}
            <div className="flex w-full flex-col gap-3 mt-4">
              <div className="flex items-center gap-2 pb-2 border-b border-border">
                <span className="text-sm font-medium text-muted-foreground">
                  Theme:
                </span>
                <ThemeToggleDebug />
              </div>
              <NavbarButton
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push("/login");
                }}
                variant="secondary"
                className="w-full border-2"
              >
                Login
              </NavbarButton>
              <NavbarButton
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push("/signup");
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
      {children}
    </>
  );
}
