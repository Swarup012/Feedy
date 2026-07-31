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
import {
  Check,
  X,
  Sparkles,
  Zap,
  TrendingUp,
  Users,
  Crown,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import paddleService from "@/services/paddleService";

export default function PricingContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { organization } = useOrganization();
  const { toast } = useToast();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [loading, setLoading] = useState(false);

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
      const response = await paddleService.createCheckoutSession({
        plan,
        billingCycle: planType,
        skipTrial,
      });

      if (response.success && response.data.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error("Failed to create checkout session");
      }
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to start checkout",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const plans = {
    free: {
      name: "Free",
      price: 0,
      description: "For solo builders just getting started with structured feedback.",
      features: [
        { text: "3 feedback boards", included: true },
        { text: "5 posts per board", included: true },
        { text: "20 tracked users", included: true },
        { text: "3 team members", included: true },
        { text: "1 roadmap", included: true },
        { text: "Basic analytics", included: true },
      ],
      highlight: false,
    },
    starter: {
      name: "Starter",
      monthlyPrice: 19,
      yearlyPrice: 180,
      effectiveMonthlyYearly: 15,
      savings: 48,
      description: "For indie founders and small teams ready to put their brand front and center.",
      features: [
        { text: "Unlimited Feedback Boards + Posts", included: true },
        { text: "Unlimited team members", included: true, highlight: true },
        { text: "Up to 5 admins", included: true, highlight: true },
        { text: "1 roadmap", included: true },
        { text: "125+ tracked users", included: true },
        { text: "Advanced analytics", included: true },
        { text: "Custom branding", included: true },
      ],
      highlight: true,
    },
    pro: {
      name: "Pro",
      monthlyPrice: 49,
      yearlyPrice: 540,
      effectiveMonthlyYearly: 45,
      savings: 48,
      description: "Turn scattered feedback into clear priorities with AI-powered clustering and automation.",
      features: [
        { text: 'All Starter features, plus:', included: true, bold: true },
        { text: 'Up to 10 admins', included: true, highlight: true },
        { text: '1 custom Subdomain', included: true, highlight: true },
        { text: 'Priority support', included: true, highlight: true },
        { text: 'Custom integrations', included: true },
        { text: 'Advanced security features', included: true },
      ],
      highlight: false,
    },
  };

  const currentPlan = organization?.plan || "free";

  return (
    <div className="space-y-10">
      {/* Billing Cycle Toggle */}
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-full p-1 shadow-inner">
          <button
            onClick={() => setBillingCycle("monthly")}
            className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-200 ${
              billingCycle === "monthly"
                ? "bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-1 ring-inset ring-blue-500 shadow-sm"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("yearly")}
            className={`px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-200 flex items-center gap-2 ${
              billingCycle === "yearly"
                ? "bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-1 ring-inset ring-blue-500 shadow-sm"
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
      <div className="grid md:grid-cols-3 gap-6">
        {/* Free Plan */}
        <Card className="relative">
          <CardHeader>
            <CardTitle className="text-2xl">{plans.free.name}</CardTitle>
            <div className="mb-2">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold">${plans.free.price}</span>
                <span className="text-gray-600 dark:text-gray-400">/month</span>
              </div>
            </div>
            <CardDescription>{plans.free.description}</CardDescription>
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
              {!user ? "Start FREE" : currentPlan === "free" ? "Current Plan" : "Downgrade"}
            </Button>
            <div className="space-y-3">
              {plans.free.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  {feature.included ? (
                    <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                  )}
                  <span className={feature.included ? "text-gray-700 dark:text-gray-300" : "text-gray-400 line-through"}>
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
            <div className="flex items-center justify-between mb-1">
              <CardTitle className="text-2xl">{plans.starter.name}</CardTitle>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-200"></div>
                <Badge className="relative bg-white dark:bg-gray-900 text-orange-600 dark:text-amber-400 border border-orange-200 dark:border-amber-800/60 shadow-sm font-bold uppercase tracking-wider text-[10px] px-2.5 py-0.5 flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-orange-500 dark:fill-amber-500 text-orange-500 dark:text-amber-500" />
                  Early Access
                </Badge>
              </div>
            </div>
            <div className="mb-2">
              {billingCycle === "monthly" ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">${plans.starter.monthlyPrice}</span>
                  <span className="text-gray-600 dark:text-gray-400">/month</span>
                </div>
              ) : (
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">${plans.starter.effectiveMonthlyYearly}</span>
                    <span className="text-gray-600 dark:text-gray-400">/month</span>
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
                  onClick={() => handleUpgrade("starter", billingCycle, false)}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Start 14-Day Free Trial"}
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
                    <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${feature.highlight ? "text-blue-500" : "text-green-500"}`} />
                  ) : (
                    <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <span className={`${feature.highlight ? "font-semibold text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`}>
                      {feature.text}
                    </span>
                    {feature.subtext && (
                      <div className="text-xs text-gray-500 mt-0.5">Flexible overage billing</div>
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
            <div className="flex items-center justify-between mb-1">
              <CardTitle className="text-2xl">{plans.pro.name}</CardTitle>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-200"></div>
                <Badge className="relative bg-white dark:bg-gray-900 text-orange-600 dark:text-amber-400 border border-orange-200 dark:border-amber-800/60 shadow-sm font-bold uppercase tracking-wider text-[10px] px-2.5 py-0.5 flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-orange-500 dark:fill-amber-500 text-orange-500 dark:text-amber-500" />
                  Early Access
                </Badge>
              </div>
            </div>
            <div className="mb-2">
              {billingCycle === "monthly" ? (
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold">${plans.pro.monthlyPrice}</span>
                  <span className="text-gray-600 dark:text-gray-400">/month</span>
                </div>
              ) : (
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">${plans.pro.effectiveMonthlyYearly}</span>
                    <span className="text-gray-600 dark:text-gray-400">/month</span>
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
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={() => handleUpgrade("pro", billingCycle, false)}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Start Pro Trial"}
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
              {plans.pro.features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  {feature.included ? (
                    <Check className={`w-5 h-5 flex-shrink-0 mt-0.5 ${feature.highlight ? "text-blue-500" : "text-green-500"}`} />
                  ) : (
                    <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <span className={`${feature.bold ? "font-bold text-gray-900 dark:text-white" : feature.highlight ? "font-semibold text-blue-600 dark:text-blue-400" : "text-gray-700 dark:text-gray-300"}`}>
                      {feature.text}
                    </span>
                    {feature.subtext && (
                      <div className="text-xs text-gray-500 mt-0.5">Flexible overage billing</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Current Subscription Management */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold mb-4">Manage Subscription</h3>
        <BillingManagement />
      </div>
    </div>
  );
}

// Inline billing management (cancel, payment history)
function BillingManagement() {
  return (
    <div className="text-sm text-gray-500">
      To cancel your subscription or view payment history, go to the{" "}
      <a href="/admin/organization?tab=billing-details" className="text-blue-600 underline">
        billing details
      </a>{" "}
      section or contact support.
    </div>
  );
}
