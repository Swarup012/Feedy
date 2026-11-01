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
const OVERAGE_PRICE = PLANS.starter.overage!.price_per_block; // $12

// Stepped snap points that map to slider index 0-7
const SNAP_POINTS = [20, 100, 250, 500, 1000, 2000, 5000, 10000] as const;

function formatUsers(n: number): string {
  return n >= 1000 ? `${+(n / 1000).toFixed(1)}k` : `${n}`;
}

/**
 * Overage formula (matches backend plans.config.js):
 *   - 125 tracked users included in both Starter & Pro
 *   - 25-user grace buffer → charges begin after 150 total
 *   - $12 per block of 50 additional users, rounded UP
 *
 * Example: 200 users → ceil((200-150)/50)*12 = ceil(1.0)*12 = $12/mo
 * Example: 201 users → ceil((201-150)/50)*12 = ceil(1.02)*12 = 2*12 = $24/mo
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
    <div className="pr-est">
      <div className="pr-est__grid">
        {/* ── LEFT: Explainer ─────────────────────────────────────────── */}
        <div className="pr-est__cell">
          <div>
            <div className="pr-est__title">
              <Info size={16} aria-hidden="true" />
              <h3>What is a tracked user?</h3>
            </div>
            <p className="pr-est__p">
              A tracked user is any user associated with feedback: someone
              who submitted feedback, voted, or commented.
            </p>
          </div>

          {/* Expandable "How many do I need?" */}
          <Collapsible.Root open={howManyOpen} onOpenChange={setHowManyOpen}>
            <Collapsible.Trigger asChild>
              <button
                type="button"
                className="pr-est__toggle"
                data-open={howManyOpen}
                aria-expanded={howManyOpen}
              >
                How many do I need?
                <ChevronDown size={14} aria-hidden="true" />
              </button>
            </Collapsible.Trigger>

            <Collapsible.Content
              className={cn(
                "overflow-hidden",
                "data-[state=open]:animate-accordion-down",
                "data-[state=closed]:animate-accordion-up",
              )}
            >
              <p className="pr-est__note">
                Most teams start small. If you’re just launching, Free’s{" "}
                <strong>20 tracked users</strong> is usually enough for your
                first few weeks. As feedback volume grows, upgrade when you’re
                consistently near your plan’s limit.
              </p>
            </Collapsible.Content>
          </Collapsible.Root>

          {/* Overage info pill */}
          <div className="pr-est__pill">
            <p className="pr-est__pill-label">
              Overage billing (Starter &amp; Pro)
            </p>
            <p className="pr-est__pill-body">
              First <strong>{OVERAGE_GRACE} users over the limit</strong> are
              free. After that, it’s{" "}
              <strong>
                ${OVERAGE_PRICE} per {OVERAGE_BLOCK} additional users/mo
              </strong>
              , billed monthly.
            </p>
          </div>
        </div>

        {/* ── RIGHT: Slider + Recommendation ──────────────────────────── */}
        <div className="pr-est__cell">
          <div>
            <h3>How many users will you track feedback from?</h3>
            <p className="pr-est__p">Drag to estimate your monthly overage cost.</p>
          </div>

          {/* User count display */}
          <div className="pr-est__count">
            <span className="pr-est__num">{formatUsers(selectedUsers)}</span>
            <span className="pr-est__unit">tracked users</span>
          </div>

          {/* Slider */}
          <div>
            <div className="pr-est__slider">
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
            </div>
            {/* Tick labels */}
            <div className="pr-est__ticks">
              {SNAP_POINTS.map((val, i) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setSliderValue(i)}
                  className={cn(
                    "pr-est__tick",
                    i !== 0 && i !== SNAP_POINTS.length - 1 && "hidden sm:block",
                  )}
                  aria-label={`Set to ${val} users`}
                  aria-pressed={Math.round(sliderValue) === i}
                >
                  {formatUsers(val)}
                </button>
              ))}
            </div>
          </div>

          {/* Billing toggle (synced with parent if prop passed) */}
          {!externalCycle && (
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
    ? `Included in your plan: no extra cost for ${users} tracked users.`
    : `${extraBlocks} overage block${extraBlocks !== 1 ? "s" : ""} over the included 125: $${extraCost}/mo added to your base plan price.`;

  return (
    <div className="pr-est__summary">
      {/* Status line — aria-live for screen readers */}
      <div
        key={animKey}
        role="status"
        aria-live="polite"
        aria-label={statusText}
        className="animate-in fade-in slide-in-from-bottom-1 duration-250"
      >
        {isIncluded ? (
          <p className="pr-est__status pr-est__status--in">
            ✓ Included in your plan: no extra cost.
          </p>
        ) : (
          <p className="pr-est__status pr-est__status--over">
            {extraBlocks} block{extraBlocks !== 1 ? "s" : ""} over the included
            125
            {" → "}
            <strong>+${extraCost}/mo</strong> overage
          </p>
        )}
      </div>

      {/* Side-by-side plan cards — equally weighted, no bias */}
      <div className="pr-est__split">
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

      <p className="pr-est__fine">
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
    <div className="pr-est__splitcard">
      <p className="pr-est__splitname">{name}</p>

      <div className="pr-est__splitrows">
        <div className="pr-est__splitrow">
          <span>Base</span>
          <span>${base}/mo</span>
        </div>
        {extraCost > 0 && (
          <div className="pr-est__splitrow pr-est__splitrow--over">
            <span>Overage</span>
            <span>+${extraCost}/mo</span>
          </div>
        )}
      </div>

      <div className="pr-est__splittotal">
        <span>Est. total</span>
        <b>${total}/mo</b>
      </div>

      {billingCycle === "yearly" && (
        <p className="pr-est__splitsave">
          Save $
          {PLANS[name.toLowerCase() as keyof typeof PLANS].monthlyPrice * 12 -
            PLANS[name.toLowerCase() as keyof typeof PLANS].yearlyTotal}
          /yr on base
        </p>
      )}
    </div>
  );
}
