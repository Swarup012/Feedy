/**
 * useIsNarrow — returns true when the viewport is narrower than the given
 * breakpoint (default: 1280px / "xl").
 *
 * Used to trigger the progressive collapse of the three-pane feedback layout
 * into a two-pane layout with a drawer for PostDetails.
 *
 * SSR-safe: returns false on the server and updates after first mount.
 */
"use client";

import { useState, useEffect } from "react";

export function useIsNarrow(breakpointPx = 1280): boolean {
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`);
    setIsNarrow(mq.matches);

    const handler = (e: MediaQueryListEvent) => setIsNarrow(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpointPx]);

  return isNarrow;
}
