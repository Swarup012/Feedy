import { useEffect, useRef } from "react";

/**
 * Scroll to `#<elementId>` exactly once, after `active` turns true and the
 * element has mounted (it may mount late — e.g. behind a plan gate).
 *
 * Polls every 100ms and gives up silently after `timeoutMs` when the element
 * never appears (Free plan: card never renders). A missing hash, an inactive
 * target, or a never-mounting element are all silent no-ops.
 */
export function useScrollToHash(
  elementId: string,
  active: boolean,
  timeoutMs = 5000,
): void {
  const done = useRef(false);

  useEffect(() => {
    if (done.current || !active) return;
    if (typeof window === "undefined" || window.location.hash !== `#${elementId}`) return;

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const el = document.getElementById(elementId);
      if (el) {
        done.current = true;
        window.clearInterval(timer);
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      } else if (Date.now() - startedAt > timeoutMs) {
        done.current = true; // never mounted — stop quietly
        window.clearInterval(timer);
      }
    }, 100);

    return () => window.clearInterval(timer);
  }, [elementId, active, timeoutMs]);
}
