"use client";

import { useState, useEffect } from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/context/OrganizationContext";
import { resolvePlan, getPlanFeatureDisplay, type PlanTier } from "@/config/plans";
import { LandingFooter } from "@/components/ui/landing-footer";
import { Check, X, Crown, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import paddleService from "@/services/paddleService";
import { TrackedUsersExplainer } from "@/components/pricing/TrackedUsersExplainer";
import "./pricing.css";

const PADDLE_CLIENT_TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || 'test_67753ae11c6f27e94e5909861a5';
const IS_SANDBOX = !PADDLE_CLIENT_TOKEN.startsWith('live_');

type FeatureDisplay = ReturnType<typeof getPlanFeatureDisplay>;

export default function PricingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { organization, organizationRole } = useOrganization();
  // Checkout creation is owner-only on the backend; null role = logged out (existing redirect flow).
  const canManageBilling = !organizationRole || organizationRole === "owner";
  const { toast } = useToast();
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [loading, setLoading] = useState(false);
  const [overageOpen, setOverageOpen] = useState(true);

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
      // corrupted data: ignore
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

    if (!canManageBilling) {
      toast({
        title: "Ask your organization owner to upgrade",
        description: "Only the organization owner can change billing.",
      });
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

  const starterSavePct = Math.round(
    (starterPlan.savings / (starterPlan.monthlyPrice * 12)) * 100,
  );
  const proSavePct = Math.round(
    (proPlan.savings / (proPlan.monthlyPrice * 12)) * 100,
  );
  const saveFrom = Math.min(starterSavePct, proSavePct);
  const saveTo = Math.max(starterSavePct, proSavePct);

  return (
    <div className="pr-root">
      <style>{`/* Hallmark · shape: price sheet · genre: modern-minimal · theme: brand (kept) · redesign: full
 * paper: oklch(98.6% 0.005 250) · accent: oklch(56% 0.206 263) (Faddy --primary) · display: Switzer · body: Inter · hero: Banner · nav: floating pill (kept) · footer: kept (LandingFooter) · signature: the three prices at display scale in one hairline sheet, Pro marked by its word and the page's one filled button
 * axes: cool-paper/grotesk/brand-blue · posture: Restrained · modes: light+dark · contrast: pass · fold: pass · v2.0.0 */
/* Hallmark · dismissed 58 · kept content: the comparison table and FAQ are the owner's words; a table window always exceeds the screen budget, only a copy gate may cut one */
/* Hallmark · dismissed F19 · kept chrome: navbar (500/700) and LandingFooter (700) sit outside this redesign; this page runs 400/500/600 */
/* Hallmark · waive 39b · the 40px pill is the shared marketing navbar, while every control this pricing page owns measures 44px or more · site chrome is kept at redesign depth, so only this page's own controls are in scope here */
/* Hallmark · waive 49b · the wrapping labels sit in the shared site footer, whose copy and line breaks are the owner's kept content on this pricing page · a footer phrase that cannot shorten is the guard this gate already names */`}</style>
      <main className="pr-wrap">
          <section className="pr-hero">
            <div className="pr-hero__inner">
              <div className="pr-hero__text">
                <h1>Transparent Pricing</h1>
                <p className="lead">
                  Start with our FREE plan. Upgrade when you need more. Cancel
                  anytime.
                </p>
              </div>
              <div className="pr-billing">
                <div
                  className="pr-seg"
                  data-cycle={billingCycle}
                  role="group"
                  aria-label="Billing cycle"
                >
                  <span className="pr-seg__thumb" aria-hidden="true" />
                  <button
                    type="button"
                    className="pr-seg__btn"
                    aria-pressed={billingCycle === "monthly"}
                    onClick={() => setBillingCycle("monthly")}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    className="pr-seg__btn"
                    aria-pressed={billingCycle === "yearly"}
                    onClick={() => setBillingCycle("yearly")}
                  >
                    Yearly
                  </button>
                </div>
                <span className="pr-billing__save">
                  Save {saveFrom}% to {saveTo}%
                </span>
              </div>
            </div>
            {user && organization && !canManageBilling && (
              <p className="pr-note" data-testid="owner-only-note">
                Ask your organization owner to upgrade. Only the organization
                owner can change billing.
              </p>
            )}
          </section>

          <section className="pr-plans" aria-label="Plans">
            <div className="pr-sheet">
              <div className="pr-plan">
                <div className="pr-plan__head">
                  <span className="pr-plan__name">{freePlan.name}</span>
                </div>
                <div className="pr-plan__price">
                  <span className="pr-price" key={billingCycle}>
                    ${freePlan.monthlyPrice}
                  </span>
                  <span className="pr-price__unit">/month</span>
                </div>
                <p className="pr-plan__desc">
                  For solo builders getting started.
                </p>
                <div className="pr-plan__cta">
                  <button
                    type="button"
                    className="pr-btn pr-btn--quiet pr-btn--block"
                    disabled={!!user && currentPlan === "free"}
                    onClick={() => { if (!user) router.push("/signup"); }}
                  >
                    {!user
                      ? "Start FREE"
                      : currentPlan === "free"
                        ? "Current Plan"
                        : "Switch to Free"}
                  </button>
                </div>
                <FeatureList features={freePlan.features} tier="free" />
              </div>

              <div className="pr-plan">
                <div className="pr-plan__head">
                  <span className="pr-plan__name">{starterPlan.name}</span>
                </div>
                <div className="pr-plan__price">
                  <span className="pr-price" key={billingCycle}>
                    $
                    {billingCycle === "monthly"
                      ? starterPlan.monthlyPrice
                      : starterPlan.yearlyPrice}
                  </span>
                  <span className="pr-price__unit">/month</span>
                  {billingCycle === "yearly" && (
                    <>
                      <span className="pr-plan__billed">
                        Billed yearly (${starterPlan.yearlyTotal}/year)
                      </span>
                      <span className="pr-plan__save">
                        Save ${starterPlan.savings}/yr
                      </span>
                    </>
                  )}
                </div>
                <p className="pr-plan__desc">
                  For indie founders ready to grow.
                </p>
                {currentPlan === "free" ? (
                  <div className="pr-plan__cta">
                    <button
                      type="button"
                      className="pr-btn pr-btn--quiet pr-btn--block"
                      onClick={() =>
                        handleUpgrade("starter", billingCycle, false)
                      }
                      disabled={loading}
                    >
                      {loading ? "Loading..." : "Start 7-Day Free Trial"}
                    </button>
                    <button
                      type="button"
                      className="pr-plan__skip"
                      onClick={() => handleUpgrade("starter", billingCycle, true)}
                      disabled={loading}
                    >
                      Skip trial, pay now
                    </button>
                  </div>
                ) : currentPlan === "starter" ? (
                  <div className="pr-plan__cta">
                    <button
                      type="button"
                      className="pr-btn pr-btn--quiet pr-btn--block"
                      disabled
                    >
                      Current Plan
                    </button>
                  </div>
                ) : (
                  <div className="pr-plan__cta">
                    <button
                      type="button"
                      className="pr-btn pr-btn--quiet pr-btn--block"
                      onClick={() => handleUpgrade("starter", billingCycle, false)}
                      disabled={loading}
                    >
                      Switch to Starter
                    </button>
                  </div>
                )}
                <FeatureList features={starterPlan.features} tier="starter" />
              </div>

              <div className="pr-plan">
                <div className="pr-plan__head">
                  <span className="pr-plan__name">{proPlan.name}</span>
                  <span className="pr-plan__tag">
                    <Crown size={14} aria-hidden="true" />
                    Recommended
                  </span>
                </div>
                <div className="pr-plan__price">
                  <span className="pr-price" key={billingCycle}>
                    $
                    {billingCycle === "monthly"
                      ? proPlan.monthlyPrice
                      : proPlan.yearlyPrice}
                  </span>
                  <span className="pr-price__unit">/month</span>
                  {billingCycle === "yearly" && (
                    <>
                      <span className="pr-plan__billed">
                        Billed yearly (${proPlan.yearlyTotal}/year)
                      </span>
                      <span className="pr-plan__save">
                        Save ${proPlan.savings}/yr
                      </span>
                    </>
                  )}
                </div>
                <p className="pr-plan__desc">
                  For teams who want it running on autopilot.
                </p>
                {currentPlan === "free" ? (
                  <div className="pr-plan__cta">
                    <button
                      type="button"
                      className="pr-btn pr-btn--block"
                      onClick={() => handleUpgrade("pro", billingCycle, false)}
                      disabled={loading}
                    >
                      {loading ? "Loading..." : "Start 7-Day Free Trial"}
                    </button>
                    <button
                      type="button"
                      className="pr-plan__skip"
                      onClick={() => handleUpgrade("pro", billingCycle, true)}
                      disabled={loading}
                    >
                      Skip trial, pay now
                    </button>
                  </div>
                ) : currentPlan === "starter" ? (
                  <div className="pr-plan__cta">
                    <button
                      type="button"
                      className="pr-btn pr-btn--block"
                      onClick={() => handleUpgrade("pro", billingCycle, false)}
                      disabled={loading}
                    >
                      Upgrade to Pro
                    </button>
                  </div>
                ) : (
                  <div className="pr-plan__cta">
                    <button
                      type="button"
                      className="pr-btn pr-btn--quiet pr-btn--block"
                      disabled
                    >
                      Current Plan
                    </button>
                  </div>
                )}
                <FeatureList features={proPlan.features} tier="pro" />
              </div>
            </div>
          </section>

          <section className="pr-estimator" aria-label="Cost estimator">
            <TrackedUsersExplainer
              billingCycle={billingCycle}
              onBillingCycleChange={setBillingCycle}
            />
          </section>

          <section className="pr-compare">
            <div className="pr-compare__head">
              <h2>Compare Plans</h2>
              <p>See exactly what’s included in each plan</p>
            </div>

            <div className="pr-table-scroll">
              <table className="pr-table">
                <thead>
                  <tr>
                    <th scope="col">Features</th>
                    <th scope="col">Free</th>
                    <th scope="col">Starter</th>
                    <th scope="col">
                      <span className="pr-table__pro">
                        <Crown size={16} aria-hidden="true" />
                        Pro
                      </span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="pr-table__sec">
                    <td colSpan={4}>Pricing</td>
                  </tr>
                  <tr>
                    <td>Monthly Price</td>
                    <td className="is-strong">$0</td>
                    <td className="is-strong">${starterPlan.monthlyPrice}</td>
                    <td className="is-strong">${proPlan.monthlyPrice}</td>
                  </tr>
                  <tr>
                    <td>
                      Yearly Price (save ${starterPlan.savings}-$
                      {proPlan.savings})
                    </td>
                    <td>-</td>
                    <td className="is-strong">${starterPlan.yearlyPrice}/mo</td>
                    <td className="is-strong">${proPlan.yearlyPrice}/mo</td>
                  </tr>

                  <tr className="pr-table__sec">
                    <td colSpan={4}>Team &amp; Collaboration</td>
                  </tr>
                  <tr>
                    <td>Team Members</td>
                    <td>3 total members</td>
                    <td>Unlimited</td>
                    <td>Unlimited</td>
                  </tr>
                  <tr>
                    <td>Admin Roles</td>
                    <td>Up to 3 admins</td>
                    <td>Up to 5 admins</td>
                    <td>Up to 10 admins</td>
                  </tr>
                  <tr>
                    <td>Role-Based Permissions</td>
                    <td>
                      <Yes />
                    </td>
                    <td>
                      <Yes />
                    </td>
                    <td>
                      <Yes />
                    </td>
                  </tr>

                  <tr className="pr-table__sec">
                    <td colSpan={4}>Feedback Management</td>
                  </tr>
                  <tr>
                    <td>Feedback Boards</td>
                    <td>Unlimited</td>
                    <td>Unlimited</td>
                    <td>Unlimited</td>
                  </tr>
                  <tr>
                    <td>Posts per Board</td>
                    <td>Unlimited</td>
                    <td>Unlimited</td>
                    <td>Unlimited</td>
                  </tr>
                  <tr>
                    <td>Tracked Users</td>
                    <td>20 users</td>
                    <td>125+ users</td>
                    <td>125+ users</td>
                  </tr>
                  <tr>
                    <td>Roadmap Items</td>
                    <td>Unlimited</td>
                    <td>Unlimited</td>
                    <td>Unlimited</td>
                  </tr>

                  <tr className="pr-table__sec">
                    <td colSpan={4}>Features</td>
                  </tr>
                  <tr>
                    <td>Feedback Widget</td>
                    <td>
                      <Yes />
                    </td>
                    <td>
                      <Yes />
                    </td>
                    <td>
                      <Yes />
                    </td>
                  </tr>
                  <tr>
                    <td>Integrations</td>
                    <td>
                      <Yes />
                    </td>
                    <td>1 active</td>
                    <td>Unlimited</td>
                  </tr>
                  <tr>
                    <td>AI Chat</td>
                    <td>10 credits</td>
                    <td>50 credits</td>
                    <td>Unlimited</td>
                  </tr>
                  <tr>
                    <td>Smart Flow</td>
                    <td>
                      <Yes />
                    </td>
                    <td>
                      <Yes />
                    </td>
                    <td>
                      <Yes />
                    </td>
                  </tr>
                  <tr>
                    <td>Developer API &amp; Webhook Access</td>
                    <td>
                      <No />
                    </td>
                    <td>
                      <No />
                    </td>
                    <td>
                      <Yes />
                    </td>
                  </tr>
                  <tr>
                    <td>High-Severity Feedback Alerts</td>
                    <td>
                      <No />
                    </td>
                    <td>
                      <Yes />
                    </td>
                    <td>
                      <Yes />
                    </td>
                  </tr>
                  <tr>
                    <td>Advanced Severity Detection</td>
                    <td>
                      <No />
                    </td>
                    <td>
                      <No />
                    </td>
                    <td>
                      <Yes />
                    </td>
                  </tr>
                  <tr>
                    <td>Custom Branding</td>
                    <td>
                      <No />
                    </td>
                    <td>
                      <Yes />
                    </td>
                    <td>
                      <Yes />
                    </td>
                  </tr>
                  <tr>
                    <td>MRR Insights</td>
                    <td>
                      <No />
                    </td>
                    <td>
                      <Yes />
                    </td>
                    <td>
                      <Yes />
                    </td>
                  </tr>
                  <tr>
                    <td>Custom Domain</td>
                    <td>
                      <No />
                    </td>
                    <td>
                      <No />
                    </td>
                    <td className="is-strong">1 subdomain</td>
                  </tr>
                  <tr>
                    <td>Analytics</td>
                    <td>Advanced</td>
                    <td>Advanced</td>
                    <td>Advanced</td>
                  </tr>
                  <tr>
                    <td>Priority Support</td>
                    <td>
                      <No />
                    </td>
                    <td>
                      <No />
                    </td>
                    <td>
                      <Yes />
                    </td>
                  </tr>
                  <tr>
                    <td>Advanced Security</td>
                    <td>
                      <No />
                    </td>
                    <td>
                      <No />
                    </td>
                    <td>
                      <Yes />
                    </td>
                  </tr>

                  <tr className="pr-table__sec">
                    <td colSpan={4}>Overage &amp; Billing</td>
                  </tr>
                  <tr>
                    <td>Overage Allowed</td>
                    <td>
                      <No />
                    </td>
                    <td>
                      <Yes />
                    </td>
                    <td>
                      <Yes />
                    </td>
                  </tr>
                  <tr>
                    <td>Grace Buffer</td>
                    <td>-</td>
                    <td>20% (25 users)</td>
                    <td>20% (25 users)</td>
                  </tr>
                  <tr>
                    <td>Overage Price</td>
                    <td>-</td>
                    <td>$12 per 50 users</td>
                    <td>$12 per 50 users</td>
                  </tr>
                  <tr>
                    <td>Free Trial</td>
                    <td>-</td>
                    <td className="is-strong">7 days</td>
                    <td className="is-strong">7 days</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="pr-overage">
            <Collapsible.Root open={overageOpen} onOpenChange={setOverageOpen}>
              <div className="pr-overage__head">
                <Collapsible.Trigger asChild>
                  <button
                    type="button"
                    className="pr-overage__trigger"
                    data-open={overageOpen}
                  >
                    How Overage Billing Works
                    <ChevronDown size={20} aria-hidden="true" />
                  </button>
                </Collapsible.Trigger>
                <p className="pr-overage__sub">
                  Simple, predictable pricing as your community grows
                </p>
              </div>

              <Collapsible.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                <div className="pr-zones">
                  <div className="pr-zone">
                    <div className="pr-zone__range">0-125</div>
                    <span className="pr-zone__unit">users</span>
                    <span className="pr-zone__price">$0 /mo</span>
                    <span className="pr-zone__note">
                      Included in your plan
                    </span>
                  </div>
                  <div className="pr-zone">
                    <div className="pr-zone__range">126-150</div>
                    <span className="pr-zone__unit">users</span>
                    <span className="pr-zone__price">$0 /mo</span>
                    <span className="pr-zone__note">Free grace buffer</span>
                  </div>
                  <div className="pr-zone pr-zone--paid">
                    <div className="pr-zone__range">151+</div>
                    <span className="pr-zone__unit">users</span>
                    <span className="pr-zone__price">$12 / 50 users</span>
                    <span className="pr-zone__note">
                      Pay only for what you use
                    </span>
                  </div>
                </div>

                <div className="pr-how">
                  <ol className="pr-steps">
                    <li>
                      <h4>Included users</h4>
                      <p>
                        125 tracked users come with your plan at no extra cost.
                      </p>
                    </li>
                    <li>
                      <h4>Grace buffer</h4>
                      <p>
                        25 extra users free: no charges until you hit 150.
                      </p>
                    </li>
                    <li>
                      <h4>Simple overage</h4>
                      <p>
                        $12 per 50 additional users, billed monthly. Cancel
                        anytime.
                      </p>
                    </li>
                  </ol>
                </div>

                <div className="pr-example">
                  <h3>Example: 180 Tracked Users</h3>
                  <div className="pr-invoice">
                    <div className="pr-invoice__row">
                      <span>Base plan (125 users included)</span>
                      <span className="pr-invoice__amt">$25</span>
                    </div>
                    <div className="pr-invoice__row">
                      <span>Grace buffer (26-150 users)</span>
                      <span className="pr-invoice__amt pr-invoice__amt--free">
                        $0
                      </span>
                    </div>
                    <div className="pr-invoice__row">
                      <span>Overage (30 users = 1 block)</span>
                      <span className="pr-invoice__amt">+$12</span>
                    </div>
                    <div className="pr-invoice__row">
                      <span>Total</span>
                      <span className="pr-invoice__total">$37/mo</span>
                    </div>
                  </div>
                </div>
              </Collapsible.Content>
            </Collapsible.Root>
          </section>

          <section className="pr-faq">
            <div className="pr-faq__head">
              <h2>Frequently Asked Questions</h2>
            </div>

            <div>
              <div className="pr-faq__row">
                <h3 className="pr-faq__q">Can I cancel my trial anytime?</h3>
                <p className="pr-faq__a">
                  Yes! You can cancel your 7-day trial at any time with no
                  charges. If you don’t cancel, you’ll automatically be charged
                  after the trial ends.
                </p>
              </div>

              <div className="pr-faq__row">
                <h3 className="pr-faq__q">How does the 7-day trial work?</h3>
                <p className="pr-faq__a">
                  You get full access to all Starter plan features for 7 days,
                  completely free. You’ll need to add a payment method to start
                  the trial, but you won’t be charged until after 7 days. We’ll
                  remind you 7, 3, and 1 day before your trial ends.
                </p>
              </div>

              <div className="pr-faq__row">
                <h3 className="pr-faq__q">
                  What happens if I exceed my tracked user limit?
                </h3>
                <p className="pr-faq__a">
                  You have a 20% grace buffer (25 users) before any overage
                  charges apply. After that, you’re charged $12 per 50
                  additional users, billed monthly. You can track your usage in
                  real-time on your dashboard.
                </p>
              </div>

              <div className="pr-faq__row">
                <h3 className="pr-faq__q">
                  Can I switch between monthly and yearly billing?
                </h3>
                <p className="pr-faq__a">
                  Yes! You can upgrade to yearly billing at any time to save $
                  {starterPlan.savings}/year. The change will take effect at
                  your next billing cycle.
                </p>
              </div>

              <div className="pr-faq__row">
                <h3 className="pr-faq__q">Is there a refund policy?</h3>
                <p className="pr-faq__a">
                  We don’t offer refunds. You can cancel your monthly plan
                  anytime and keep access until the end of your current billing
                  period. Annual plans are non-refundable with access for the
                  full year.
                </p>
              </div>
            </div>
          </section>
      </main>

      <section className="pr-close">
        <div className="pr-wrap">
          <div className="pr-close__inner">
            <div>
              <h2>Ready to Grow Your Feedback Community?</h2>
              <p className="lead">
                Start your 7-day free trial today. Payment method required.
              </p>
            </div>
            <div className="pr-close__actions">
              <button
                type="button"
                className="pr-btn"
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
              </button>
              {currentPlan === "free" && (
                <button
                  type="button"
                  className="pr-close__skip"
                  onClick={() => handleUpgrade("starter", billingCycle, true)}
                  disabled={loading}
                >
                  Skip trial, pay now
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
}

function FeatureList({
  features,
  tier,
}: {
  features: FeatureDisplay["features"];
  tier: PlanTier;
}) {
  return (
    <ul className="pr-feats">
      {features.map((feature, idx) => {
        const highlight = tier !== "free" && feature.highlight;
        const bold = tier === "pro" && feature.bold;
        const cls = ["pr-feat"];
        if (!feature.included) cls.push("pr-feat--out");
        else if (bold) cls.push("pr-feat--bold");
        else if (highlight) cls.push("pr-feat--highlight");

        return (
          <li key={idx} className={cls.join(" ")}>
            {feature.included ? (
              <Check size={16} className="pr-feat__icon" aria-hidden="true" />
            ) : (
              <X size={16} className="pr-feat__icon" aria-hidden="true" />
            )}
            <span>{feature.text}</span>
          </li>
        );
      })}
    </ul>
  );
}

function Yes() {
  return <Check size={20} className="is-yes" aria-hidden="true" />;
}

function No() {
  return <X size={20} className="is-no" aria-hidden="true" />;
}
