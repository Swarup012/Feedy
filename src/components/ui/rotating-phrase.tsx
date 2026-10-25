"use client";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export type RotatingPhraseItem = {
  label: string;
  icon?: React.ReactNode;
};

const MIN_DELAY_MS = 2400;
const MAX_DELAY_MS = 3400;

const randomDelay = () =>
  MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);

/**
 * Inline headline phrase that automatically rotates through its items with a
 * subtle fade + vertical slide. No interaction required.
 *
 * Each instance owns its own self-rescheduling timeout: the first tick and
 * every following one are drawn independently from [MIN_DELAY_MS, MAX_DELAY_MS],
 * so sibling phrases drift apart instead of changing in lockstep. Randomness
 * happens only inside the effect (after mount) — the first rendered phrase is
 * always items[0], so server and client agree.
 *
 * Every item stays mounted (only the active one sits in flow, the rest are
 * absolutely positioned) so the container width can be measured and animated
 * to hug the active phrase — no layout jumps.
 */
export function RotatingPhrase({
  items,
  className,
}: {
  items: RotatingPhraseItem[];
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState<number | undefined>(undefined);
  const itemRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    if (items.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let timeoutId: number | undefined;
    const schedule = () => {
      timeoutId = window.setTimeout(() => {
        setIndex((prev) => (prev + 1) % items.length);
        schedule();
      }, randomDelay());
    };
    schedule();

    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [items.length]);

  useLayoutEffect(() => {
    const measure = () => {
      const el = itemRefs.current[index];
      if (el) setWidth(el.offsetWidth);
    };

    measure();
    document.fonts?.ready.then(measure).catch(() => {});
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [index]);

  return (
    <span
      className={cn(
        "relative inline-block whitespace-nowrap align-baseline",
        "transition-[width] duration-500 delay-150 ease-out motion-reduce:transition-none",
        className,
      )}
      style={width ? { width } : undefined}
    >
      {items.map((item, i) => (
        <span
          key={item.label}
          ref={(el) => {
            itemRefs.current[i] = el;
          }}
          aria-hidden={i !== index}
          className={cn(
            "inline-flex items-center gap-1.5 whitespace-nowrap",
            "text-blue-600 dark:text-blue-400",
            "transition-[opacity,transform] ease-out motion-reduce:transition-none",
            i === index
              ? "opacity-100 translate-y-0 duration-500 delay-150"
              : "absolute left-0 top-0 opacity-0 -translate-y-1.5 duration-200",
          )}
        >
          {item.icon}
          <span>{item.label}</span>
        </span>
      ))}
    </span>
  );
}
