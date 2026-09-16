"use client";

import { useState, useEffect } from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/context/OrganizationContext";
import { PLANS, resolvePlan, getPlanFeatureDisplay, type PlanTier } from "@/config/plans";
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
import { LandingFooter } from "@/components/ui/landing-footer";
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
  ChevronDown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import paddleService from "@/services/paddleService";
import { TrackedUsersExplainer } from "@/components/pricing/TrackedUsersExplainer";

const PADDLE_CLIENT_TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || 'test_67753ae11c6f27e94e5909861a5';
const IS_SANDBOX = !PADDLE_CLIENT_TOKEN.startsWith('live_');

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { organization } = useOrganization();
  const { toast } = useToast();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [loading, setLoading] = useState(false);
  const [overageOpen, setOverageOpen] = useState(false);

  // Auto-resume pending checkout after login/signup/onboarding
  useEffect(() => {
    if (!user || !organization) return;
    const raw = sessionStorage.getItem("pendingCheckout");
    if (!raw) return;
    sessionStorage.removeItem("pendingCheckout");
    try {
      const intent = JSON.parse(raw) as { plan: "starter" | "pro"; billingCycle: "monthly" | "yearly"; skipTrial: boolean };
      handleUpgrade(intent.plan, intent.billingCycle, intent.skipTrial);
    } catch {
      // corrupted data — ignore
    }
  }, [user, organization]);

  const handleUpgrade = async (
    plan: "starter" | "pro",
    planType: "monthly" | "yearly",
    skipTrial: boolean = false,
  ) => {
    if (!user || !organization) {
      sessionStorage.setItem("pendingCheckout", JSON.stringify({ plan, billingCycle: planType, skipTrial }));
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
        if (response.data.transactionId) {
          try {
            if (!(window as any).Paddle) {
              const script = document.createElement('script');
              script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
              script.async = true;
              document.body.appendChild(script);
              await new Promise((resolve, reject) => {
                script.onload = () => resolve(true);
                script.onerror = () => reject(new Error('Failed to load Paddle'));
                setTimeout(() => reject(new Error('Timeout')), 10000);
              });
            }
            const Paddle = (window as any).Paddle;
            if (IS_SANDBOX) Paddle.Environment.set('sandbox');
            Paddle.Setup({ token: PADDLE_CLIENT_TOKEN });
            Paddle.Checkout.open({
              transactionId: response.data.transactionId,
              settings: {
                displayMode: 'overlay',
                theme: 'light',
                successUrl: window.location.origin + '/admin?checkout=success',
              },
            });
            setLoading(false);
            return;
          } catch {
            // fall through to redirect
          }
        }
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

  const freePlan = getPlanFeatureDisplay("free");
  const starterPlan = getPlanFeatureDisplay("starter");
  const proPlan = getPlanFeatureDisplay("pro");

  const currentPlan: PlanTier = resolvePlan(organization);

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <div className="container mx-auto px-4 py-16 pt-24">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-switzer font-medium mb-4">
            <span className="text-blue-600">Transparent</span> Pricing
          </h1>
          <p className="text-lg text-gray-600 dark:text-muted-foreground max-w-2xl mx-auto">
            Start with our <span className="font-switzer text-blue-600">FREE</span> plan. Upgrade when you need more. <span className="text-blue-600">Cancel anytime</span>
          </p>
        </div>

        {/* Billing Cycle Segmented Control */}
        <div className="flex flex-col items-center justify-center gap-3 mb-12">
          <div className="inline-flex items-center bg-gray-100 dark:bg-card rounded-full p-1 shadow-inner">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-200 ${billingCycle === "monthly"
                ? "bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-1 ring-inset ring-blue-500 shadow-sm"
                : "text-gray-600 dark:text-muted-foreground hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-200 flex items-center gap-2 ${billingCycle === "yearly"
                ? "bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-1 ring-inset ring-blue-500 shadow-sm"
                : "text-gray-600 dark:text-muted-foreground hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              Yearly
              <Badge className="bg-green-500 text-white text-xs px-2 py-0.5">
                Save {Math.round((starterPlan.savings / (starterPlan.monthlyPrice * 12)) * 100)}%–{Math.round((proPlan.savings / (proPlan.monthlyPrice * 12)) * 100)}%
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
                <CardTitle className="text-2xl">{freePlan.name}</CardTitle>
              </div>
              <div className="mb-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">
                    ${freePlan.monthlyPrice}
                  </span>
                  <span className="text-gray-600 dark:text-muted-foreground">
                    /month
                  </span>
                </div>
              </div>
              <CardDescription>For solo builders getting started.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full mb-6"
                disabled={!!user && currentPlan === "free"}
                onClick={() => {
                  if (!user) router.push("/signup");
                }}
              >
                {!user ? "Start FREE" : currentPlan === "free" ? "Current Plan" : "Switch to Free"}
              </Button>

              <div className="space-y-3">
                {freePlan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    {feature.included ? (
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                    )}
                    <span
                      className={
                        feature.included
                          ? "text-gray-700 dark:text-muted-foreground"
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
          <Card className="relative">


            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-2xl">{starterPlan.name}</CardTitle>
              </div>
              <div className="mb-4">
                {billingCycle === "monthly" ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      ${starterPlan.monthlyPrice}
                    </span>
                    <span className="text-gray-600 dark:text-muted-foreground">
                      /month
                    </span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">
                        ${starterPlan.yearlyPrice}
                      </span>
                      <span className="text-gray-600 dark:text-muted-foreground">
                        /month
                      </span>
                    </div>
                    <div className="text-sm text-blue-600 mt-1">
                      Billed yearly (${starterPlan.yearlyTotal}/year)
                    </div>
                    <Badge className="bg-green-500 text-white text-xs px-2 py-0.5 mt-2">
                      Save ${starterPlan.savings}/yr
                    </Badge>
                  </div>
                )}
              </div>
              <CardDescription>For indie founders ready to grow.</CardDescription>
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
                    {loading ? "Loading..." : "Start 7-Day Free Trial"}
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
                  Switch to Starter
                </Button>
              )}

              <div className="space-y-3">
                {starterPlan.features.map((feature, idx) => (
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
                        className={`${feature.highlight ? "font-semibold text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-muted-foreground"}`}
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
          <Card className="relative border-2 border-blue-500 shadow-xl">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-blue-500 text-white px-4 py-1">
                <Crown className="w-3 h-3 mr-1" />
                Recommended
              </Badge>
            </div>

            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-2xl">{proPlan.name}</CardTitle>
              </div>
              <div className="mb-4">
                {billingCycle === "monthly" ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      ${proPlan.monthlyPrice}
                    </span>
                    <span className="text-gray-600 dark:text-muted-foreground">
                      /month
                    </span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">
                        ${proPlan.yearlyPrice}
                      </span>
                      <span className="text-gray-600 dark:text-muted-foreground">
                        /month
                      </span>
                    </div>
                    <div className="text-sm text-blue-600 mt-1">
                      Billed yearly (${proPlan.yearlyTotal}/year)
                    </div>
                    <Badge className="bg-green-500 text-white text-xs px-2 py-0.5 mt-2">
                      Save ${proPlan.savings}/yr
                    </Badge>
                  </div>
                )}
              </div>
              <CardDescription>For teams who want it running on autopilot.</CardDescription>
            </CardHeader>
            <CardContent>
              {currentPlan === "free" ? (
                <div className="space-y-2 mb-6">
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={() => handleUpgrade("pro", billingCycle, false)}
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Start 7-Day Free Trial"}
                  </Button>

                </div>
              ) : currentPlan === "starter" ? (
                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700 mb-6"
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
                {proPlan.features.map((feature, idx) => (
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
                        className={`${feature.bold
                          ? "font-bold text-gray-900 dark:text-white"
                          : feature.highlight
                            ? "font-semibold text-blue-600 dark:text-blue-400"
                            : "text-gray-700 dark:text-muted-foreground"
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

        {/* Tracked Users Estimator */}
        <TrackedUsersExplainer
          billingCycle={billingCycle}
          onBillingCycleChange={setBillingCycle}
        />

        {/* Detailed Plan Comparison Table */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold mb-2">Compare Plans</h2>
            <p className="text-gray-600 dark:text-muted-foreground">
              See exactly what's included in each plan
            </p>
          </div>

          <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
              <div className="overflow-hidden border border-gray-200 dark:border-border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-border">
                  <thead className="bg-gray-50 dark:bg-background">
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
                        className="py-4 px-6 text-center text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        Starter
                      </th>
                      <th
                        scope="col"
                        className="py-4 px-6 text-center text-sm font-semibold text-gray-900 dark:text-white bg-blue-50 dark:bg-blue-900/20"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <Crown className="w-4 h-4 text-blue-600" />
                          Pro
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-card divide-y divide-gray-200 dark:divide-border">
                    {/* Pricing */}
                    <tr className="bg-gray-50 dark:bg-background/50">
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
                      <td className="py-4 px-6 text-center text-sm text-gray-900 dark:text-white font-semibold">
                        ${starterPlan.monthlyPrice}
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-900 dark:text-white font-semibold bg-blue-50/50 dark:bg-blue-900/10">
                        ${proPlan.monthlyPrice}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                        Yearly Price (save ${starterPlan.savings}–${proPlan.savings})
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-500">
                        -
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-900 dark:text-white font-semibold">
                        ${starterPlan.yearlyPrice}/mo
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-900 dark:text-white font-semibold bg-blue-50/50 dark:bg-blue-900/10">
                        ${proPlan.yearlyPrice}/mo
                      </td>
                    </tr>

                    {/* Team Collaboration */}
                    <tr className="bg-gray-50 dark:bg-background/50">
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
                      <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-muted-foreground">
                        3 admins
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10">
                        Unlimited
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                        Unlimited
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                        Admin Roles
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-muted-foreground">
                        Included in 3
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                        Up to 5 admins
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10">
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
                      <td className="py-4 px-6 text-center">
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-4 px-6 text-center bg-blue-50/50 dark:bg-blue-900/10">
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                    </tr>

                    {/* Feedback Management */}
                    <tr className="bg-gray-50 dark:bg-background/50">
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
                      <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-muted-foreground">
                        3 boards
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10">
                        Unlimited
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                        Unlimited
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                        Posts per Board
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-muted-foreground">
                        5 posts
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                        Unlimited
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10">
                        Unlimited
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                        Tracked Users
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-muted-foreground">
                        20 users
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                        125+ users
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10">
                        125+ users
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                        Roadmap Items
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-muted-foreground">
                        1 roadmap
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                        1 roadmap
                      </td>
                        <td className="py-4 px-6 text-center text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10">
                        Unlimited
                      </td>
                    </tr>

                    {/* Features */}
                    <tr className="bg-gray-50 dark:bg-background/50">
                      <td
                        colSpan={4}
                        className="py-3 px-6 text-sm font-semibold text-gray-900 dark:text-white"
                      >
                        Features
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                        Feedback Widget
                      </td>
                      <td className="py-4 px-6 text-center bg-blue-50/50 dark:bg-blue-900/10">
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-4 px-6 text-center bg-blue-50/50 dark:bg-blue-900/10">
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-4 px-6 text-center bg-blue-50/50 dark:bg-blue-900/10">
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                        Integrations
                      </td>
                      <td className="py-4 px-6 text-center">
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      </td>
                      <td className="py-4 px-6 text-center bg-blue-50/50 dark:bg-blue-900/10">
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-4 px-6 text-center bg-blue-50/50 dark:bg-blue-900/10">
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                        AI Chat
                      </td>
                      <td className="py-4 px-6 text-center">
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      </td>
                      <td className="py-4 px-6 text-center bg-blue-50/50 dark:bg-blue-900/10">
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-4 px-6 text-center bg-blue-50/50 dark:bg-blue-900/10">
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                        Autopilot
                      </td>
                      <td className="py-4 px-6 text-center">
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      </td>
                      <td className="py-4 px-6 text-center bg-blue-50/50 dark:bg-blue-900/10">
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                      <td className="py-4 px-6 text-center bg-blue-50/50 dark:bg-blue-900/10">
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                        Webhooks & API
                      </td>
                      <td className="py-4 px-6 text-center">
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      </td>
                      <td className="py-4 px-6 text-center bg-blue-50/50 dark:bg-blue-900/10">
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      </td>
                      <td className="py-4 px-6 text-center bg-blue-50/50 dark:bg-blue-900/10">
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                        Instant Notifications (urgent alerts)
                      </td>
                      <td className="py-4 px-6 text-center">
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      </td>
                      <td className="py-4 px-6 text-center">
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      </td>
                      <td className="py-4 px-6 text-center bg-blue-50/50 dark:bg-blue-900/10">
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
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
                      <td className="py-4 px-6 text-center bg-blue-50/50 dark:bg-blue-900/10">
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
                      <td className="py-4 px-6 text-center">
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      </td>
                      <td className="py-4 px-6 text-center bg-blue-50/50 dark:bg-blue-900/10">
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">1 subdomain</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                        Analytics
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-muted-foreground">
                        Basic
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                        Advanced
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10">
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
                      <td className="py-4 px-6 text-center">
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      </td>
                      <td className="py-4 px-6 text-center bg-blue-50/50 dark:bg-blue-900/10">
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
                      <td className="py-4 px-6 text-center">
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      </td>
                      <td className="py-4 px-6 text-center bg-blue-50/50 dark:bg-blue-900/10">
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
                      </td>
                    </tr>

                    {/* Overage & Billing */}
                    <tr className="bg-gray-50 dark:bg-background/50">
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
                      <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-muted-foreground">
                        20% (25 users)
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-900 dark:text-white bg-blue-50/50 dark:bg-blue-900/10">
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
                      <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-muted-foreground">
                        $12 per 50 users
                       </td>
                       <td className="py-4 px-6 text-center text-sm text-gray-900 dark:text-white bg-blue-50/50 dark:bg-blue-900/10">
                         $12 per 50 users
                      </td>
                    </tr>
                    <tr>
                      <td className="py-4 px-6 text-sm text-gray-900 dark:text-white">
                        Free Trial
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-500">
                        -
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-blue-600 dark:text-blue-400">
                        7 days
                      </td>
                      <td className="py-4 px-6 text-center text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10">
                        7 days
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* How Overage Billing Works — Collapsible */}
        <div className="max-w-5xl mx-auto mb-16">
          <Collapsible.Root open={overageOpen} onOpenChange={setOverageOpen}>
            <div className="text-center mb-6">
              <Collapsible.Trigger asChild>
                <button className="inline-flex items-center gap-2 text-xl font-bold mb-3 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  How Overage Billing Works
                  <ChevronDown
                    className={`w-5 h-5 transition-transform duration-200 ${overageOpen ? "rotate-180" : ""}`}
                  />
                </button>
              </Collapsible.Trigger>
              <p className="text-gray-600 dark:text-muted-foreground text-base">
                Simple, predictable pricing as your community grows
              </p>
            </div>

            <Collapsible.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">

          <div className="rounded-2xl border border-gray-200 dark:border-border bg-white dark:bg-background shadow-sm overflow-hidden mb-6">
            {/* Simple 3-column breakdown */}
            <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-border">
              {/* Zone 1 */}
              <div className="p-6 text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">0–125</div>
                <div className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-3">users</div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-semibold text-gray-900 dark:text-white">
                  $0 /mo
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Included in your plan</p>
              </div>

              {/* Zone 2 */}
              <div className="p-6 text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">126–150</div>
                <div className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-3">users</div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-semibold text-gray-900 dark:text-white">
                  $0 /mo
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Free grace buffer</p>
              </div>

              {/* Zone 3 */}
              <div className="p-6 text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">151+</div>
                <div className="text-sm font-medium text-gray-500 dark:text-muted-foreground mb-3">users</div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 text-sm font-semibold text-blue-700 dark:text-blue-300">
                  $12 / 50 users
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Pay only for what you use</p>
              </div>
            </div>
          </div>

          {/* How it works — minimal steps */}
          <div className="rounded-2xl border border-gray-200 dark:border-border bg-white dark:bg-background shadow-sm overflow-hidden mb-6">
            <div className="px-7 py-5 border-b border-gray-100 dark:border-border">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">How It Works</h3>
            </div>
            <div className="px-7 py-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 font-bold text-xs flex-shrink-0 mt-0.5">1</div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">Included users</h4>
                    <p className="text-sm text-gray-500 dark:text-muted-foreground leading-relaxed">125 tracked users come with your plan at no extra cost.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 font-bold text-xs flex-shrink-0 mt-0.5">2</div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">Grace buffer</h4>
                    <p className="text-sm text-gray-500 dark:text-muted-foreground leading-relaxed">25 extra users free — no charges until you hit 150.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-400 font-bold text-xs flex-shrink-0 mt-0.5">3</div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white text-sm mb-1">Simple overage</h4>
                    <p className="text-sm text-gray-500 dark:text-muted-foreground leading-relaxed">$12 per 50 additional users, billed monthly. Cancel anytime.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Example calculation — clean invoice */}
          <div className="rounded-2xl border border-gray-200 dark:border-border bg-white dark:bg-background shadow-sm overflow-hidden">
            <div className="px-7 py-5 border-b border-gray-100 dark:border-border">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Example: 180 Tracked Users</h3>
            </div>
            <div className="px-7 py-6">
              <div className="rounded-xl border border-gray-100 dark:border-border overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-border bg-gray-50/50 dark:bg-card/30">
                  <span className="text-sm text-gray-600 dark:text-muted-foreground">Base plan (125 users included)</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">$25</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-border bg-gray-50/50 dark:bg-card/30">
                  <span className="text-sm text-gray-600 dark:text-muted-foreground">Grace buffer (26–150 users)</span>
                  <span className="text-sm font-semibold text-green-600 dark:text-green-400 tabular-nums">$0</span>
                </div>
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-border bg-gray-50/50 dark:bg-card/30">
                  <span className="text-sm text-gray-600 dark:text-muted-foreground">Overage (30 users = 1 block)</span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white tabular-nums">+$12</span>
                </div>
                <div className="flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-card">
                  <span className="font-bold text-gray-900 dark:text-white">Total</span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">$37/mo</span>
                </div>
              </div>
            </div>
          </div>

          </Collapsible.Content>
          </Collapsible.Root>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-lg font-bold text-center mb-8">
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
                <p className="text-gray-600 dark:text-muted-foreground">
                  Yes! You can cancel your 7-day trial at any time with no
                  charges. If you don't cancel, you'll automatically be charged
                  after the trial ends.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  How does the 7-day trial work?
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-muted-foreground">
                  You get full access to all Starter plan features for 7 days,
                  completely free. You'll need to add a payment method to start the trial, but you won't be charged until after 7 days.
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
                <p className="text-gray-600 dark:text-muted-foreground">
                  You have a 20% grace buffer (25 users) before any overage
                  charges apply. After that, you're charged $12 per 50 additional
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
                <p className="text-gray-600 dark:text-muted-foreground">
                  Yes! You can upgrade to yearly billing at any time to save
                  ${starterPlan.savings}/year. The change will take effect at your next billing
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
                <p className="text-gray-600 dark:text-muted-foreground">
                  We don't offer refunds. You can cancel your monthly plan anytime and keep access until the end of your current billing period. Annual plans are non-refundable with access for the full year.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <Card className="max-w-2xl mx-auto bg-blue-600 text-white border-0">
            <CardContent className="p-5">
              <Zap className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">
                Ready to Grow Your Feedback Community?
              </h3>
              <p className="text-blue-100 mb-6">
                Start your 7-day free trial today. Payment method required.
              </p>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => {
                  if (currentPlan === "free") {
                    handleUpgrade("starter", billingCycle, false);
                  } else if (currentPlan === "starter") {
                    handleUpgrade("pro", billingCycle, false);
                  } else {
                    router.push("/admin/settings");
                  }
                }}
                disabled={loading}
              >
                {currentPlan === "free"
                  ? "Start Free Trial"
                  : currentPlan === "starter"
                    ? "Upgrade to Pro"
                    : "Manage Subscription"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      <LandingFooter />
    </div>
  );
}
