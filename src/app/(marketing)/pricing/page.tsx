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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16 pt-24">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-switzer font-medium mb-4">
            <span className="text-blue-600">Transparent</span> Pricing
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Start with our <span className="font-switzer text-blue-600">FREE</span> plan. Upgrade when you need more. <span className="text-blue-600">Cancel anytime</span>
          </p>
        </div>

        {/* Billing Cycle Segmented Control */}
        <div className="flex flex-col items-center justify-center gap-3 mb-12">
          <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-full p-1 shadow-inner">
            <button
              onClick={() => setBillingCycle("monthly")}
              className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-200 ${billingCycle === "monthly"
                ? "bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-1 ring-inset ring-blue-500 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle("yearly")}
              className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-200 flex items-center gap-2 ${billingCycle === "yearly"
                ? "bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-1 ring-inset ring-blue-500 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
            >
              Yearly
              <Badge className="bg-green-500 text-white text-xs px-2 py-0.5">
                Save ${starterPlan.savings}–${proPlan.savings}
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
                  <span className="text-gray-600 dark:text-gray-400">
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
          <Card className="relative">


            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-2xl">{starterPlan.name}</CardTitle>
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-200"></div>
                  <Badge className="relative bg-white dark:bg-gray-900 text-orange-600 dark:text-amber-400 border border-orange-200 dark:border-amber-800/60 shadow-sm font-bold uppercase tracking-wider text-[10px] px-2.5 py-0.5 flex items-center gap-1">
                    <Zap className="w-3 h-3 fill-orange-500 dark:fill-amber-500 text-orange-500 dark:text-amber-500" />
                    Early Access
                  </Badge>
                </div>
              </div>
              <div className="mb-4">
                {billingCycle === "monthly" ? (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      ${starterPlan.monthlyPrice}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      /month
                    </span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">
                        ${starterPlan.yearlyPrice}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        /month
                      </span>
                    </div>
                    <div className="text-sm text-blue-600 mt-1">
                      Billed yearly (${starterPlan.yearlyTotal}/year)
                    </div>
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
          <Card className="relative border-2 border-blue-500 shadow-xl">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-blue-500 text-white px-4 py-1">
                <Crown className="w-3 h-3 mr-1" />
                Most Popular
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
                    <span className="text-gray-600 dark:text-gray-400">
                      /month
                    </span>
                  </div>
                ) : (
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">
                        ${proPlan.yearlyPrice}
                      </span>
                      <span className="text-gray-600 dark:text-gray-400">
                        /month
                      </span>
                    </div>
                    <div className="text-sm text-blue-600 mt-1">
                      Billed yearly (${proPlan.yearlyTotal}/year)
                    </div>
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

        {/* Tracked Users Estimator */}
        <TrackedUsersExplainer
          billingCycle={billingCycle}
          onBillingCycleChange={setBillingCycle}
        />

        {/* Detailed Plan Comparison Table */}
        <div className="max-w-6xl mx-auto mb-16">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold mb-2">Compare Plans</h2>
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
                      <td className="py-4 px-6 text-center text-sm font-semibold text-blue-600 dark:text-blue-400">
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
                      <td className="py-4 px-6 text-center text-sm font-semibold text-blue-600 dark:text-blue-400">
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
                      <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300">
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
                      <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300">
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
                        Integrations (Slack, Discord, Intercom)
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
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">Manual only</span>
                      </td>
                      <td className="py-4 px-6 text-center bg-blue-50/50 dark:bg-blue-900/10">
                        <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">Full access</span>
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
                        <Check className="w-5 h-5 text-green-500 mx-auto" />
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
                      <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300">
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
                      <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300">
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
                      <td className="py-4 px-6 text-center text-sm text-gray-700 dark:text-gray-300">
                        $6 per 50 users
                      </td>
                      <td className="py-4 px-6 text-center text-sm text-gray-900 dark:text-white bg-blue-50/50 dark:bg-blue-900/10">
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
              <p className="text-gray-600 dark:text-gray-400 text-base">
                Simple, predictable pricing as your community grows
              </p>
            </div>

            <Collapsible.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">

          {/* Three-zone usage bar */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden mb-6">
            <div className="px-8 pt-7 pb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-5">
                User Zones at a Glance
              </p>
              {/* Bar */}
              <div className="flex h-10 rounded-xl overflow-hidden gap-0.5 mb-3">
                <div className="flex-[5] bg-green-500 flex items-center justify-center">
                  <span className="text-white text-xs font-semibold">0 – 125</span>
                </div>
                <div className="flex-[1] bg-blue-400 flex items-center justify-center">
                  <span className="text-white text-xs font-semibold hidden sm:block">126 – 150</span>
                </div>
                <div className="flex-[1] bg-blue-600 flex items-center justify-center rounded-r-xl">
                  <span className="text-white text-xs font-semibold">151+</span>
                </div>
              </div>
              {/* Zone labels */}
              <div className="flex gap-0.5">
                <div className="flex-[5] text-center">
                  <span className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                    <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                    Included &mdash; <strong className="text-gray-800 dark:text-gray-200">$0</strong>
                  </span>
                </div>
                <div className="flex-[1] text-center">
                  <span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                    Grace &mdash; <strong className="text-gray-800 dark:text-gray-200">$0</strong>
                  </span>
                </div>
                <div className="flex-[1] text-center">
                  <span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                    Overage &mdash; <strong className="text-gray-800 dark:text-gray-200">$6/50 users</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Steps + Rate table in a two-column grid */}
          <div className="grid md:grid-cols-[1fr_auto] gap-6 mb-6">
            {/* Vertical timeline */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-7 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
                <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="font-semibold text-gray-900 dark:text-white text-sm">How It Works</span>
              </div>
              <div className="px-7 py-6 space-y-0">
                {/* Step 1 */}
                <div className="flex gap-5">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 border-2 border-green-400 dark:border-green-600 flex items-center justify-center text-green-700 dark:text-green-400 font-bold text-xs flex-shrink-0">1</div>
                    <div className="w-px flex-1 bg-gradient-to-b from-green-300 to-blue-300 dark:from-green-700 dark:to-blue-700 my-2 min-h-[2rem]" />
                  </div>
                  <div className="pb-6 flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Start with 125 Included Users</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">Your Starter plan includes 125 tracked users at no extra cost — unique visitors who engage with your feedback boards.</p>
                  </div>
                </div>
                {/* Step 2 */}
                <div className="flex gap-5">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-400 dark:border-blue-600 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-xs flex-shrink-0">2</div>
                    <div className="w-px flex-1 bg-gradient-to-b from-blue-300 to-blue-400 dark:from-blue-700 dark:to-blue-600 my-2 min-h-[2rem]" />
                  </div>
                  <div className="pb-6 flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Get a Free 20% Grace Buffer</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">We won't charge you until you reach <span className="font-semibold text-gray-700 dark:text-gray-200">150 users</span>. 25 extra users, completely free — giving you room to grow without surprise bills.</p>
                  </div>
                </div>
                {/* Step 3 */}
                <div className="flex gap-5">
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 border-2 border-blue-500 dark:border-blue-500 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold text-xs flex-shrink-0">3</div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-1">Pay Only for What You Use</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">After 150 users, pay <span className="font-semibold text-gray-700 dark:text-gray-200">$6 per 50 additional users</span> each month. No commitments, cancel anytime.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Overage rate card */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm overflow-hidden self-start min-w-[200px]">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">Overage Rates</span>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {[
                  { range: "151 – 200", cost: "+$6" },
                  { range: "201 – 250", cost: "+$12" },
                  { range: "251 – 300", cost: "+$18" },
                  { range: "301 – 350", cost: "+$24" },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between px-6 py-3 bg-gray-50/40 dark:bg-gray-800/30">
                    <span className="text-sm text-gray-500 dark:text-gray-400 tabular-nums">{row.range}</span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums ml-6">{row.cost}</span>
                  </div>
                ))}
              </div>
              <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-800/50">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Per 50 users / month</p>
              </div>
            </div>
          </div>

          {/* Example calculation — invoice style */}
          <div className="rounded-2xl border border-blue-200 dark:border-blue-800/60 bg-white dark:bg-gray-900 shadow-md overflow-hidden">
            <div className="flex items-center gap-3 px-8 py-5 bg-blue-600 dark:bg-blue-700">
              <Users className="w-5 h-5 text-white/90" />
              <span className="font-semibold text-white text-sm">Example: 180 Tracked Users This Month</span>
            </div>
            <div className="px-8 py-7 space-y-6">
              {/* Segmented usage bar */}
              <div>
                <div className="flex items-center justify-between mb-2 text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300">Your Usage</span>
                  <span className="font-bold text-blue-600 tabular-nums">180 / 125 included</span>
                </div>
                <div className="h-5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex gap-0.5">
                  <div className="bg-green-500 h-full rounded-l-full" style={{ width: "69.4%" }} title="0–125: Included" />
                  <div className="bg-blue-400 h-full" style={{ width: "13.9%" }} title="126–150: Grace" />
                  <div className="bg-blue-600 h-full rounded-r-full" style={{ width: "11.1%" }} title="151–180: Overage" />
                </div>
                <div className="relative mt-1.5 text-xs text-gray-400" style={{ height: "1.1rem" }}>
                  <span className="absolute left-0">0</span>
                  <span className="absolute" style={{ left: "69.4%" }}>125</span>
                  <span className="absolute" style={{ left: "83.3%" }}>150</span>
                  <span className="absolute right-0 font-semibold text-blue-600">180</span>
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-green-500" />Included</span>
                  <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-400" />Grace (free)</span>
                  <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-sm bg-blue-600" />Overage</span>
                </div>
              </div>

              {/* Invoice breakdown */}
              <div className="rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                {[
                  { dot: "bg-green-500", label: "Base Plan (125 users included)", value: "$25", valueClass: "" },
                  { dot: "bg-blue-400", label: "Grace Buffer (26–150 users)", value: "$0", valueClass: "text-green-600" },
                  { dot: "bg-blue-600", label: "Overage (30 users = 1 block × $6)", value: "+$6", valueClass: "" },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-700 last:border-0 bg-gray-50/40 dark:bg-gray-800/30">
                    <div className="flex items-center gap-3">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${row.dot}`} />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{row.label}</span>
                    </div>
                    <span className={`text-sm font-semibold tabular-nums ${row.valueClass || "text-gray-900 dark:text-white"}`}>{row.value}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between px-5 py-4 bg-blue-50 dark:bg-blue-900/20 border-t-2 border-blue-200 dark:border-blue-700">
                  <span className="font-bold text-gray-900 dark:text-white">Total This Month</span>
                  <span className="text-lg font-bold text-blue-600 tabular-nums">$31</span>
                </div>
              </div>

              {/* Callout */}
              <div className="flex items-start gap-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/60 px-5 py-4">
                <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-900 dark:text-green-100 leading-relaxed">
                  <strong>You only pay for 30 extra users</strong> thanks to the grace buffer — not 55. Track your usage in real-time on your dashboard.
                </p>
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
                <p className="text-gray-600 dark:text-gray-400">
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
                <p className="text-gray-600 dark:text-gray-400">
                  You get full access to all Starter plan features for 7 days,
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
            <CardContent className="p-5">
              <Zap className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-lg font-bold mb-2">
                Ready to Grow Your Feedback Community?
              </h3>
              <p className="text-blue-100 mb-6">
                Start your 7-day free trial today. No credit card required.
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
