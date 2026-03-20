"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/context/OrganizationContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Logo } from "@/components/logo";
import {
  Check,
  X,
  Sparkles,
  Zap,
  TrendingUp,
  Users,
  LayoutGrid,
  MessageSquare,
  Crown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import paddleService from "@/services/paddleService";

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { organization } = useOrganization();
  const { toast } = useToast();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [loading, setLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const handleUpgrade = async (
    plan: "starter" | "pro",
    planType: "monthly" | "yearly",
    skipTrial: boolean = false,
  ) => {
    if (!user || !organization) {
      router.push("/login?redirect=/pricing");
      return;
    }

    try {
      setLoading(true);

      // Create checkout session
      const response = await paddleService.createCheckoutSession({
        plan: plan,
        billingCycle: planType,
        skipTrial,
      });

      if (response.success && response.data.url) {
        // Redirect to Paddle Checkout
        window.location.href = response.data.url;
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to start checkout",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const plans = {
    free: {
      name: "Free",
      price: 0,
      description: "Perfect for trying out Faddy",
      features: [
        { text: "3 feedback boards", included: true },
        { text: "5 posts per board", included: true },
        { text: "20 tracked users", included: true },
        { text: "3 team members", included: true },
        { text: "1 roadmap", included: true },
        { text: "Basic analytics", included: true },
        { text: "Custom branding", included: false },
        { text: "Advanced analytics", included: false },
        { text: "Priority support", included: false },
      ],
      cta: "Current Plan",
      highlight: false,
    },
    starter: {
      name: "Starter",
      monthlyPrice: 19,
      yearlyPrice: 180,
      effectiveMonthlyYearly: 15,
      savings: 48,
      description: "For growing teams collecting feedback",
      features: [
        { text: "Unlimited feedback boards", included: true },
        { text: "Unlimited posts", included: true },
        { text: "125+ tracked users included", included: true },
        { text: "Unlimited team members", included: true, highlight: true },
        { text: "Up to 5 admins", included: true, highlight: true },
        { text: "1 roadmap", included: true },
        { text: "Advanced analytics", included: true },
        { text: "Custom branding", included: true },
        { text: "$6 per 50 additional users", included: true, subtext: true },
        { text: "14-day free trial", included: true, highlight: true },
      ],
      cta: "Start Free Trial",
      highlight: true,
    },
    pro: {
      name: "Pro",
      monthlyPrice: 49,
      yearlyPrice: 540,
      effectiveMonthlyYearly: 45,
      savings: 48,
      description: "For teams that need more collaboration",
      features: [
        { text: 'Everything in Starter, plus:', included: true, bold: true },
        { text: 'Unlimited team members', included: true, highlight: true },
        { text: 'Up to 10 admins', included: true, highlight: true },
        { text: '1 custom domain (subdomain)', included: true, highlight: true },
        { text: 'Priority support', included: true, highlight: true },
        { text: 'Custom integrations', included: true },
        { text: 'Advanced security features', included: true },
        { text: '$6 per 50 additional users', included: true, subtext: true },
        { text: '14-day free trial', included: true, highlight: true },
      ],
      cta: "Start Pro Trial",
      highlight: false,
    },
  };

  const currentPlan = organization?.plan || "free";

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
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

            <div className="mt-6 space-y-3 border-t border-neutral-200 dark:border-neutral-800 pt-4">
              <NavbarButton
                variant="secondary"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push("/login");
                }}
                className="w-full"
              >
                Login
              </NavbarButton>
              <NavbarButton
                variant="primary"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  router.push("/signup");
                }}
                className="w-full"
              >
                Sign Up
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      <div className="container mx-auto px-4 py-16 pt-24">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4" variant="secondary">
            <Sparkles className="w-3 h-3 mr-1" />
            Pricing
          </Badge>
          <h1 className="text-3xl md:text-4xl font-switzer font-medium mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Start with our free plan. Upgrade when you need more. Cancel
            anytime.
          </p>
        </div>

        {/* Billing Cycle Segmented Control */}
        <div className="flex flex-col items-center justify-center gap-3 mb-12">
          <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-full p-1 shadow-inner">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-200 ${
                billingCycle === "monthly"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
                billingCycle === "yearly"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-md"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              Yearly
              <Badge className="bg-green-500 text-white text-xs px-2 py-0.5">
                Save $48
              </Badge>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
          {/* Free Plan */}
          <Card className="relative">
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-2xl">{plans.free.name}</CardTitle>
              </div>
              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">
                    ${plans.free.price}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">
                    /month
                  </span>
                </div>
              </div>
              <CardDescription>{plans.free.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full mb-6"
                disabled={currentPlan === "free"}
              >
                {currentPlan === "free" ? "Current Plan" : "Downgrade"}
              </Button>

              <div className="space-y-3">
                {plans.free.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                    )}
                    <span
                      className={
                        feature.included
                          ? "text-gray-700 dark:text-gray-300"
                          : "text-gray-400 line-through"
                      }
                    >
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Starter Plan */}
          <Card
            className={`relative ${plans.starter.highlight ? "border-2 border-blue-500 shadow-xl" : ""}`}
          >
            {plans.starter.highlight && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white px-4 py-1">
                  <Crown className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}

            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-2xl">{plans.starter.name}</CardTitle>
              </div>
              <div className="mb-4">
                {billingCycle === "monthly" ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      ${plans.starter.monthlyPrice}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      /month
                    </span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">
                        ${plans.starter.effectiveMonthlyYearly}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        /month
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Billed yearly (${plans.starter.yearlyPrice}/year)
                    </div>
                  </div>
                )}
              </div>
              <CardDescription>{plans.starter.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {currentPlan === "free" ? (
                <div className="space-y-2 mb-6">
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() =>
                      handleUpgrade("starter", billingCycle, false)
                    }
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Start 14-Day Free Trial"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleUpgrade("starter", billingCycle, true)}
                    disabled={loading}
                  >
                    Skip Trial & Subscribe Now
                  </Button>
                </div>
              ) : currentPlan === "starter" ? (
                <Button variant="outline" className="w-full mb-6" disabled>
                  Current Plan
                </Button>
              ) : (
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 mb-6"
                  onClick={() => handleUpgrade("starter", billingCycle, false)}
                  disabled={loading}
                >
                  Downgrade to Starter
                </Button>
              )}

              <div className="space-y-3">
                {plans.starter.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check
                        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${feature.highlight ? "text-blue-500" : "text-green-500"}`}
                      />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <span
                        className={`${feature.highlight ? "font-semibold text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`}
                      >
                        {feature.text}
                      </span>
                      {feature.subtext && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          Flexible overage billing
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pro Plan */}
          <Card className="relative border-2 border-purple-500 shadow-xl">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1">
                <Sparkles className="w-3 h-3 mr-1" />
                Best Value
              </Badge>
            </div>

            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-2xl">{plans.pro.name}</CardTitle>
              </div>
              <div className="mb-4">
                {billingCycle === "monthly" ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      ${plans.pro.monthlyPrice}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      /month
                    </span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">
                        ${plans.pro.effectiveMonthlyYearly}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        /month
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Billed yearly (${plans.pro.yearlyPrice}/year)
                    </div>
                  </div>
                )}
              </div>
              <CardDescription>{plans.pro.description}</CardDescription>
            </CardHeader>
            <CardContent>
              {currentPlan === "free" ? (
                <div className="space-y-2 mb-6">
                  <Button
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    onClick={() => handleUpgrade("pro", billingCycle, false)}
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Start Pro Trial"}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleUpgrade("pro", billingCycle, true)}
                    disabled={loading}
                  >
                    Skip Trial & Subscribe Now
                  </Button>
                </div>
              ) : currentPlan === "starter" ? (
                <Button
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 mb-6"
                  onClick={() => handleUpgrade("pro", billingCycle, false)}
                  disabled={loading}
                >
                  Upgrade to Pro
                </Button>
              ) : (
                <Button variant="outline" className="w-full mb-6" disabled>
                  Current Plan
                </Button>
              )}

              <div className="space-y-3">
                {plans.pro.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check
                        className={`w-5 h-5 flex-shrink-0 mt-0.5 ${feature.highlight ? "text-purple-500" : "text-green-500"}`}
                      />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <span
                        className={`${
                          feature.bold
                            ? "font-bold text-gray-900 dark:text-white"
                            : feature.highlight
                              ? "font-semibold text-purple-600 dark:text-purple-400"
                              : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {feature.text}
                      </span>
                      {feature.subtext && (
                        <div className="text-xs text-gray-500 mt-0.5">
                          Flexible overage billing
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Plan Comparison Table */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Compare Plans</h2>
            <p className="text-gray-600 dark:text-gray-400">
              See exactly what's included in each plan
            </p>
          </div>

          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden border border-gray-200 dark:border-gray-800 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th
                        scope="col"
                        className="py-4 px-6 text-left text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        Features
                      </th>
                      <th
                        scope="col"
                        className="py-4 px-6 text-center text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        Free
                      </th>
                      <th
                        scope="col"
                        className="py-4 px-6 text-center text-sm font-semibold text-gray-900 dark:text-white bg-blue-50 dark:bg-blue-900/20"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Crown className="w-4 h-4 text-blue-600" />
                          Starter
                        </div>
                      </th>
                      <th
                        scope="col"
                        className="py-4 px-6 text-center text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        Pro
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-card divide-y divide-gray-200 dark:divide-gray-800">
                    {/* Pricing */}
                    <tr className="bg-gray-50 dark:bg-gray-900/50">
                      <td
                        colSpan={4}
                        className="py-3 px-6 text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        Pricing
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                        Monthly Price
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-900 dark:text-white font-semibold">
                        $0
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-900 dark:text-white font-semibold bg-blue-50/50 dark:bg-blue-900/10">
                        $19
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-900 dark:text-white font-semibold">
                        $49
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                        Yearly Price (save $48)
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-500">
                        -
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-900 dark:text-white font-semibold bg-blue-50/50 dark:bg-blue-900/10">
                        $15/mo
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-900 dark:text-white font-semibold">
                        $45/mo
                      </td>
                    </tr>

                    {/* Team Collaboration */}
                    <tr className="bg-gray-50 dark:bg-gray-900/50">
                      <td
                        colSpan={4}
                        className="py-3 px-6 text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        Team & Collaboration
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                        Team Members
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300">
                        3 total members
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10">
                        Unlimited
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-purple-600 dark:text-purple-400">
                        Unlimited
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                        Admin Roles
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300">
                        Included in 3
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10">
                        Up to 5 admins
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-purple-600 dark:text-purple-400">
                        Up to 10 admins
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                        Role-Based Permissions
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-4 px-6 text-center bg-blue-50/50 dark:bg-blue-900/10">
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                    </tr>

                    {/* Feedback Management */}
                    <tr className="bg-gray-50 dark:bg-gray-900/50">
                      <td
                        colSpan={4}
                        className="py-3 px-6 text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        Feedback Management
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                        Feedback Boards
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300">
                        3 boards
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10">
                        Unlimited
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-purple-600 dark:text-purple-400">
                        Unlimited
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                        Posts per Board
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300">
                        5 posts
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10">
                        Unlimited
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-purple-600 dark:text-purple-400">
                        Unlimited
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                        Tracked Users
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300">
                        20 users
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10">
                        125+ users
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-purple-600 dark:text-purple-400">
                        125+ users
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                        Roadmap Items
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300">
                        1 roadmap
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10">
                        1 roadmap
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-purple-600 dark:text-purple-400">
                        Unlimited
                      </td>
                    </tr>

                    {/* Features */}
                    <tr className="bg-gray-50 dark:bg-gray-900/50">
                      <td
                        colSpan={4}
                        className="py-3 px-6 text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        Features
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                        Custom Branding
                      </td>
                      <td className="py-4 px-6 text-center">
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      </td>
                      <td className="py-4 px-6 text-center bg-blue-50/50 dark:bg-blue-900/10">
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                        Custom Domain
                      </td>
                      <td className="py-4 px-6 text-center">
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      </td>
                      <td className="py-4 px-6 text-center bg-blue-50/50 dark:bg-blue-900/10">
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-sm font-semibold text-purple-600 dark:text-purple-400">1 subdomain</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                        Analytics
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300">
                        Basic
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10">
                        Advanced
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-purple-600 dark:text-purple-400">
                        Advanced
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                        Priority Support
                      </td>
                      <td className="py-4 px-6 text-center">
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      </td>
                      <td className="py-4 px-6 text-center bg-blue-50/50 dark:bg-blue-900/10">
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                        Custom Integrations
                      </td>
                      <td className="py-4 px-6 text-center">
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      </td>
                      <td className="py-4 px-6 text-center bg-blue-50/50 dark:bg-blue-900/10">
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                        Advanced Security
                      </td>
                      <td className="py-4 px-6 text-center">
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      </td>
                      <td className="py-4 px-6 text-center bg-blue-50/50 dark:bg-blue-900/10">
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                    </tr>

                    {/* Overage & Billing */}
                    <tr className="bg-gray-50 dark:bg-gray-900/50">
                      <td
                        colSpan={4}
                        className="py-3 px-6 text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        Overage & Billing
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                        Overage Allowed
                      </td>
                      <td className="py-4 px-6 text-center">
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      </td>
                      <td className="py-4 px-6 text-center bg-blue-50/50 dark:bg-blue-900/10">
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-4 px-6 text-center">
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                        Grace Buffer
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-500">
                        -
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300 bg-blue-50/50 dark:bg-blue-900/10">
                        20% (25 users)
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300">
                        20% (25 users)
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                        Overage Price
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-500">
                        -
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300 bg-blue-50/50 dark:bg-blue-900/10">
                        $6 per 50 users
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300">
                        $6 per 50 users
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                        Free Trial
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-500">
                        -
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10">
                        14 days
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-purple-600 dark:text-purple-400">
                        14 days
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Overage Pricing Explanation - Redesigned */}
        <div className="max-w-5xl mx-auto mb-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-3">
              How Overage Billing Works
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Simple, predictable pricing as your community grows
            </p>
          </div>

          {/* Visual Pricing Tiers */}
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {/* Tier 1: Included */}
            <div className="relative">
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-2 border-green-500 dark:border-green-600 rounded-xl p-6 h-full">
                <div className="absolute -top-3 left-4">
                  <Badge className="bg-green-500 text-white">Included</Badge>
                </div>
                <div className="text-center mt-2">
                  <div className="text-5xl font-bold text-green-600 dark:text-green-400 mb-2">
                    0-125
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Tracked Users
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    $0
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Included in plan
                  </div>
                </div>
              </div>
            </div>

            {/* Tier 2: Grace Buffer */}
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-2 border-blue-500 dark:border-blue-600 rounded-xl p-6 h-full">
                <div className="absolute -top-3 left-4">
                  <Badge className="bg-blue-500 text-white">Grace Period</Badge>
                </div>
                <div className="text-center mt-2">
                  <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                    126-150
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Tracked Users
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    $0
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    20% grace buffer
                  </div>
                </div>
              </div>
            </div>

            {/* Tier 3: Overage */}
            <div className="relative">
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-2 border-purple-500 dark:border-purple-600 rounded-xl p-6 h-full">
                <div className="absolute -top-3 left-4">
                  <Badge className="bg-purple-500 text-white">Overage</Badge>
                </div>
                <div className="text-center mt-2">
                  <div className="text-5xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                    151+
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Tracked Users
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    $6
                  </div>
                  <div className="text-xs text-gray-500 mt-1">per 50 users</div>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works Steps */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                How It Works
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 font-bold">
                    1
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg mb-2">
                    Start with 125 Included Users
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    Your Starter plan includes 125 tracked users at no extra
                    cost. Tracked users are unique visitors who interact with
                    your feedback boards.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                    2
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg mb-2">
                    Get 20% Grace Buffer (25 Users)
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    We won't charge you until you reach{" "}
                    <strong>150 users</strong>. This gives you flexibility as
                    your community grows without unexpected charges.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">
                    3
                  </div>
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-lg mb-2">
                    Pay Only for What You Use
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    After 150 users, pay just{" "}
                    <strong>$6 for every 50 additional users</strong> each
                    month. No long-term commitments.
                  </p>
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          151-200 users:
                        </span>
                        <span className="font-semibold">+$6</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          201-250 users:
                        </span>
                        <span className="font-semibold">+$12</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          251-300 users:
                        </span>
                        <span className="font-semibold">+$18</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">
                          301-350 users:
                        </span>
                        <span className="font-semibold">+$24</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Example Calculation */}
          <Card className="border-2 border-blue-200 dark:border-blue-800">
            <CardHeader className="bg-blue-50 dark:bg-blue-900/20">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Example: 180 Tracked Users This Month
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {/* Visual Progress Bar */}
                <div className="relative">
                  <div className="flex items-center justify-between mb-2 text-sm">
                    <span className="font-medium">Your Usage</span>
                    <span className="font-bold text-blue-600">180 users</span>
                  </div>
                  <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden relative">
                    <div className="absolute inset-0 flex">
                      <div
                        className="bg-green-500 h-full"
                        style={{ width: "41.67%" }}
                        title="0-125: Included"
                      ></div>
                      <div
                        className="bg-blue-500 h-full"
                        style={{ width: "8.33%" }}
                        title="126-150: Grace"
                      ></div>
                      <div
                        className="bg-purple-500 h-full"
                        style={{ width: "10%" }}
                        title="151-180: Overage"
                      ></div>
                    </div>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0</span>
                    <span>125</span>
                    <span>150</span>
                    <span className="font-semibold text-purple-600">180</span>
                  </div>
                </div>

                {/* Calculation Breakdown */}
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-5">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-gray-700 dark:text-gray-300">
                          Base Plan (125 users)
                        </span>
                      </div>
                      <span className="font-semibold">$19</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-gray-700 dark:text-gray-300">
                          Grace Buffer (25 users)
                        </span>
                      </div>
                      <span className="font-semibold text-green-600">$0</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        <span className="text-gray-700 dark:text-gray-300">
                          Overage (30 users = 1 block)
                        </span>
                      </div>
                      <span className="font-semibold">+$6</span>
                    </div>
                    <div className="border-t border-gray-300 dark:border-gray-600 pt-3 flex justify-between items-center">
                      <span className="text-lg font-bold">
                        Total This Month:
                      </span>
                      <span className="text-2xl font-bold text-blue-600">
                        $25
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-900 dark:text-blue-100 flex items-start gap-2">
                    <Check className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>You're only paying for 30 extra users</strong>{" "}
                      because of the grace buffer. Track your usage in real-time
                      on your dashboard.
                    </span>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Can I cancel my trial anytime?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Yes! You can cancel your 14-day trial at any time with no
                  charges. If you don't cancel, you'll automatically be charged
                  after the trial ends.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  How does the 14-day trial work?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  You get full access to all Starter plan features for 14 days,
                  completely free. No credit card required until you decide to
                  continue. We'll remind you 7, 3, and 1 day before your trial
                  ends.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  What happens if I exceed my tracked user limit?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  You have a 20% grace buffer (25 users) before any overage
                  charges apply. After that, you're charged $6 per 50 additional
                  users, billed monthly. You can track your usage in real-time
                  on your dashboard.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Can I switch between monthly and yearly billing?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Yes! You can upgrade to yearly billing at any time to save
                  $48/year. The change will take effect at your next billing
                  cycle.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Is there a refund policy?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-400">
                  Monthly plans can be canceled anytime with access until the
                  end of your paid period. Annual plans are non-refundable but
                  you'll have access for the full year.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto bg-blue-600 text-white border-0">
            <CardContent className="p-8">
              <Zap className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-2xl font-bold mb-2">
                Ready to Grow Your Feedback Community?
              </h3>
              <p className="text-blue-100 mb-6">
                Start your 14-day free trial today. No credit card required.
              </p>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => handleUpgrade("starter", billingCycle, false)}
                disabled={loading || currentPlan !== "free"}
              >
                {currentPlan !== "free"
                  ? "Already Subscribed"
                  : "Start Free Trial"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <LandingFooter />
    </div>
  );
}
