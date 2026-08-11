"use client";

import { useState, useId } from "react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { Slider } from "@/components/ui/slider";
import { ChevronDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLANS } from "@/config/plans";

// ─── Derived values from shared config ───────────────────────────────────────
const TRACKED_USERS = PLANS.starter.features.tracked_users;   // 125
const OVERAGE_GRACE = PLANS.starter.overage!.grace_buffer;    // 25
const OVERAGE_EFFECTIVE = PLANS.starter.overage!.effective_limit; // 150
const OVERAGE_BLOCK = PLANS.starter.overage!.block_size;      // 50
const OVERAGE_PRICE = PLANS.starter.overage!.price_per_block; // $6

// Stepped snap points that map to slider index 0-7
const SNAP_POINTS = [20, 100, 250, 500, 1000, 2000, 5000, 10000] as const;

function formatUsers(n: number): string {
  return n >= 1000 ? `${+(n / 1000).toFixed(1)}k` : `${n}`;
}

/**
 * Overage formula (matches backend plans.config.js):
 *   - 125 tracked users included in both Starter & Pro
 *   - 25-user grace buffer → charges begin after 150 total
 *   - $6 per block of 50 additional users, rounded UP
 *
 * Example: 200 users → ceil((200-150)/50)*6 = ceil(1.0)*6 = $6/mo
 * Example: 201 users → ceil((201-150)/50)*6 = ceil(1.02)*6 = 2*6 = $12/mo
 */
function calcOverage(users: number): { extraCost: number; extraBlocks: number } {
  const extraBlocks = Math.ceil(Math.max(0, users - OVERAGE_EFFECTIVE) / OVERAGE_BLOCK);
  const extraCost = extraBlocks * OVERAGE_PRICE;
  return { extraCost, extraBlocks };
}

// ─── Component ────────────────────────────────────────────────────────────────
interface TrackedUsersExplainerProps {
  /** Pass the billingCycle state down from the parent pricing page
   *  to keep the monthly/yearly toggle in sync. If not passed, the
   *  component manages its own local state.
   */
  billingCycle?: "monthly" | "yearly";
  onBillingCycleChange?: (cycle: "monthly" | "yearly") => void;
}

export function TrackedUsersExplainer({
  billingCycle: externalCycle,
  onBillingCycleChange,
}: TrackedUsersExplainerProps) {
  const sliderId = useId();
  const [sliderValue, setSliderValue] = useState(2); // default: 250 users
  const [howManyOpen, setHowManyOpen] = useState(false);

  // If parent passes billingCycle, use it; otherwise manage locally
  const [localCycle, setLocalCycle] = useState<"monthly" | "yearly">("monthly");
  const billingCycle = externalCycle ?? localCycle;
  const setBillingCycle = (c: "monthly" | "yearly") => {
    setLocalCycle(c);
    onBillingCycleChange?.(c);
  };

  const lowerIndex = Math.floor(sliderValue);
  const upperIndex = Math.min(Math.ceil(sliderValue), SNAP_POINTS.length - 1);
  const fraction = sliderValue - lowerIndex;

  const lowerVal = SNAP_POINTS[lowerIndex];
  const upperVal = SNAP_POINTS[upperIndex];

  let rawUsers = lowerVal + (upperVal - lowerVal) * fraction;
  if (rawUsers >= 1000) {
    rawUsers = Math.round(rawUsers / 100) * 100;
  } else if (rawUsers >= 100) {
    rawUsers = Math.round(rawUsers / 10) * 10;
  } else {
    rawUsers = Math.round(rawUsers);
  }
  const selectedUsers = rawUsers;

  const { extraCost, extraBlocks } = calcOverage(selectedUsers);
  const isIncluded = selectedUsers <= TRACKED_USERS; // <= 125

  return (
    <div className="max-w-6xl mx-auto mb-16 px-0">
      {/* Two-column layout */}
      <div
        className={cn(
          "grid grid-cols-1 lg:grid-cols-2 gap-0",
          "rounded-2xl border border-gray-200 dark:border-gray-800",
          "bg-white dark:bg-card shadow-sm overflow-hidden",
        )}
      >
        {/* ── LEFT: Explainer ─────────────────────────────────────────── */}
        <div className="p-7 lg:p-8 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-800 flex flex-col gap-5">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-primary flex-shrink-0" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                What is a tracked user?
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              A tracked user is any user associated with feedback — someone who
              submitted feedback, voted, or commented.
            </p>
          </div>

          {/* Expandable "How many do I need?" */}
          <Collapsible.Root open={howManyOpen} onOpenChange={setHowManyOpen}>
            <Collapsible.Trigger asChild>
              <button
                className={cn(
                  "flex items-center gap-1.5 text-sm font-medium",
                  "text-primary hover:text-primary/80 transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm",
                )}
                aria-expanded={howManyOpen}
              >
                How many do I need?
                <ChevronDown
                  className={cn(
                    "w-3.5 h-3.5 transition-transform duration-200",
                    howManyOpen && "rotate-180",
                  )}
                />
              </button>
            </Collapsible.Trigger>

            <Collapsible.Content
              className={cn(
                "overflow-hidden",
                "data-[state=open]:animate-accordion-down",
                "data-[state=closed]:animate-accordion-up",
              )}
            >
              <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed bg-muted/50 rounded-lg p-4 border border-border">
                Most teams start small. If you're just launching, Free's{" "}
                <strong className="text-gray-900 dark:text-white">20 tracked users</strong> is
                usually enough for your first few weeks. As feedback volume grows,
                upgrade when you're consistently near your plan's limit.
              </p>
            </Collapsible.Content>
          </Collapsible.Root>

          {/* Overage info pill */}
          <div className="mt-auto">
            <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 p-4">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-300 mb-1">
                Overage billing (Starter &amp; Pro)
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                First{" "}
                <strong>{OVERAGE_GRACE} users over the limit</strong> are
                free. After that, it's{" "}
                <strong>
                  ${OVERAGE_PRICE} per {OVERAGE_BLOCK}{" "}
                  additional users/mo
                </strong>
                , billed monthly.
              </p>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Slider + Recommendation ──────────────────────────── */}
        <div className="p-7 lg:p-8 flex flex-col gap-6">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              How many users will you track feedback from?
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Drag to estimate your monthly overage cost.
            </p>
          </div>

          {/* User count display */}
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold text-gray-900 dark:text-white tabular-nums transition-all duration-150">
              {formatUsers(selectedUsers)}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              tracked users
            </span>
          </div>

          {/* Slider */}
          <div className="space-y-2">
            <Slider
              id={sliderId}
              aria-label="Number of tracked users"
              min={0}
              max={SNAP_POINTS.length - 1}
              step={0.01}
              value={[sliderValue]}
              onValueChange={([v]) => setSliderValue(v)}
              className="w-full"
            />
            {/* Tick labels */}
            <div className="flex justify-between">
              {SNAP_POINTS.map((val, i) => (
                <button
                  key={val}
                  onClick={() => setSliderValue(i)}
                  className={cn(
                    "text-[10px] font-medium transition-colors duration-150 hover:text-primary focus-visible:outline-none",
                    Math.round(sliderValue) === i
                      ? "text-primary"
                      : "text-gray-400 dark:text-gray-600",
                    // Hide intermediate labels on very small screens
                    i !== 0 && i !== SNAP_POINTS.length - 1 && "hidden sm:block",
                  )}
                  aria-label={`Set to ${val} users`}
                >
                  {formatUsers(val)}
                </button>
              ))}
            </div>
          </div>

          {/* Billing toggle (synced with parent if prop passed) */}
          {!externalCycle && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">Billing:</span>
              <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-full p-0.5 shadow-inner text-xs">
                <button
                  onClick={() => setBillingCycle("monthly")}
                  className={cn(
                    "px-3 py-1 rounded-full font-medium transition-all duration-200",
                    billingCycle === "monthly"
                      ? "bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-1 ring-inset ring-blue-500 shadow-sm"
                      : "text-gray-500 hover:text-gray-900 dark:hover:text-white",
                  )}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle("yearly")}
                  className={cn(
                    "px-3 py-1 rounded-full font-medium transition-all duration-200",
                    billingCycle === "yearly"
                      ? "bg-blue-50/50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 ring-1 ring-inset ring-blue-500 shadow-sm"
                      : "text-gray-500 hover:text-gray-900 dark:hover:text-white",
                  )}
                >
                  Yearly
                </button>
              </div>
            </div>
          )}

          {/* Overage summary + side-by-side plan cards */}
          <OverageSummary
            users={selectedUsers}
            extraCost={extraCost}
            extraBlocks={extraBlocks}
            isIncluded={isIncluded}
            billingCycle={billingCycle}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Overage summary + side-by-side plan cards ───────────────────────────────
interface OverageSummaryProps {
  users: number;
  extraCost: number;
  extraBlocks: number;
  isIncluded: boolean;
  billingCycle: "monthly" | "yearly";
}

function OverageSummary({
  users,
  extraCost,
  extraBlocks,
  isIncluded,
  billingCycle,
}: OverageSummaryProps) {
  // Animate the status line when the included/overage boundary is crossed
  const [animKey, setAnimKey] = useState(0);
  const [prevIncluded, setPrevIncluded] = useState(isIncluded);
  if (isIncluded !== prevIncluded) {
    setPrevIncluded(isIncluded);
    setAnimKey((k) => k + 1);
  }

  // Base prices per billing cycle (from shared config)
  const starterBase = billingCycle === "monthly" ? PLANS.starter.monthlyPrice : PLANS.starter.yearlyPrice;
  const proBase = billingCycle === "monthly" ? PLANS.pro.monthlyPrice : PLANS.pro.yearlyPrice;

  const starterTotal = starterBase + extraCost;
  const proTotal = proBase + extraCost;

  // aria-live announcement text
  const statusText = isIncluded
    ? `Included in your plan — no extra cost for ${users} tracked users.`
    : `${extraBlocks} overage block${extraBlocks !== 1 ? "s" : ""} over the included 125 — $${extraCost}/mo added to your base plan price.`;

  return (
    <div className="space-y-3">
      {/* Status line — aria-live for screen readers */}
      <div
        key={animKey}
        role="status"
        aria-live="polite"
        aria-label={statusText}
        className="animate-in fade-in slide-in-from-bottom-1 duration-250"
      >
        {isIncluded ? (
          <p className="text-sm font-medium text-green-600 dark:text-green-400">
            ✓ Included in your plan — no extra cost.
          </p>
        ) : (
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            {extraBlocks} block{extraBlocks !== 1 ? "s" : ""} over the included 125
            {" → "}
            <span className="font-bold">+${extraCost}/mo</span> overage
          </p>
        )}
      </div>

      {/* Side-by-side plan cards — equally weighted, no bias */}
      <div className="grid grid-cols-2 gap-3">
        <PlanSplitCard
          name="Starter"
          base={starterBase}
          extraCost={extraCost}
          total={starterTotal}
          billingCycle={billingCycle}
        />
        <PlanSplitCard
          name="Pro"
          base={proBase}
          extraCost={extraCost}
          total={proTotal}
          billingCycle={billingCycle}
        />
      </div>

      <p className="text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
        Both plans include 125 users. Overage charges after the 25-user grace
        buffer (at 150 total), billed monthly.
      </p>
    </div>
  );
}

// ─── Single plan price breakdown card ────────────────────────────────────────
interface PlanSplitCardProps {
  name: string;
  base: number;
  extraCost: number;
  total: number;
  billingCycle: "monthly" | "yearly";
}

function PlanSplitCard({
  name,
  base,
  extraCost,
  total,
  billingCycle,
}: PlanSplitCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 dark:border-gray-700",
        "bg-gray-50 dark:bg-gray-900/40 p-4",
        "transition-all duration-200",
      )}
    >
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 uppercase tracking-wide">
        {name}
      </p>

      <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex justify-between">
          <span>Base</span>
          <span className="tabular-nums">${base}/mo</span>
        </div>
        {extraCost > 0 && (
          <div className="flex justify-between text-blue-600 dark:text-blue-400">
            <span>Overage</span>
            <span className="tabular-nums">+${extraCost}/mo</span>
          </div>
        )}
      </div>

      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex justify-between items-baseline">
        <span className="text-xs text-gray-500 dark:text-gray-400">Est. total</span>
        <span className="text-lg font-bold text-gray-900 dark:text-white tabular-nums">
          ${total}/mo
        </span>
      </div>

      {billingCycle === "yearly" && (
        <p className="text-[10px] text-green-600 dark:text-green-400 mt-1 font-medium">
          Save ${(base * 12 - (name === "Starter" ? PLANS.starter.yearlyTotal : PLANS.pro.yearlyTotal))}/yr on base
        </p>
      )}
    </div>
  );
}
