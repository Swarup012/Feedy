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
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  BarChart3,
  Zap,
  Share2,
  FolderOpen,
  Users,
  UserRound,
  Map,
  Plug,
  Bot,
  Eye,
  Code,
  ChevronDown,
} from "lucide-react";

function MobileNavGroup({
  label,
  sections,
  onNavigate,
}: {
  label: string;
  sections: {
    section: string;
    items: { name: string; link: string }[];
  }[];
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-full">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center justify-between rounded-xl px-3 py-3 text-base font-medium text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
          "hover:bg-accent",
        )}
      >
        {label}
        <ChevronDown
          aria-hidden="true"
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>
      {open && (
        <div className="pb-2">
          {sections.map((section) => (
            <div key={section.section} className="mt-1">
              <div className="px-3 pb-1 pt-2 text-sm font-medium text-muted-foreground">
                {section.section}
              </div>
              {section.items.map((item) => (
                <a
                  key={`${item.link}-${item.name}`}
                  href={item.link}
                  onClick={onNavigate}
                  className="block rounded-xl px-3 py-3 text-[15px] text-foreground hover:bg-accent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                >
                  {item.name}
                </a>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MarketingChrome({
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
              name: "Smartflow",
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
            {
              name: "End Users",
              link: "/end-users",
              description: "The public boards where your users submit, vote and see updates",
              icon: <UserRound className="w-4 h-4" />,
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
            {navItems.map((item, idx) =>
              item.dropdown ? (
                <MobileNavGroup
                  key={`mobile-group-${idx}`}
                  label={item.name}
                  sections={item.dropdown}
                  onNavigate={() => setIsMobileMenuOpen(false)}
                />
              ) : (
                <a
                  key={`mobile-link-${idx}`}
                  href={item.link}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full rounded-xl px-3 py-3 text-base font-medium text-foreground hover:bg-accent hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                >
                  {item.name}
                </a>
              ),
            )}
            <div className="mt-2 flex w-full flex-col gap-3 border-t border-border px-1 pb-1 pt-4">
              <NavbarButton
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push("/login");
                }}
                variant="secondary"
                className="w-full border-2 py-3 text-base"
              >
                Login
              </NavbarButton>
              <NavbarButton
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push("/signup");
                }}
                variant="primary"
                className="w-full py-3 text-base"
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
