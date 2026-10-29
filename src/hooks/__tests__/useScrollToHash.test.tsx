/**
 * useScrollToHash — drives /admin/organization?tab=general#revenue-data:
 *  - scrolls the target into view once it exists after activation
 *  - silent no-op when it never mounts (Free plan) or the hash differs
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useScrollToHash } from "@/hooks/useScrollToHash";

beforeEach(() => {
  vi.useFakeTimers();
  window.history.replaceState(
    {},
    "",
    "/admin/organization?tab=general#revenue-data",
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.getElementById("revenue-data")?.remove();
  window.history.replaceState({}, "", "/");
});

describe("useScrollToHash", () => {
  it("scrolls into view once the element exists (and only once)", () => {
    const el = document.createElement("div");
    el.id = "revenue-data";
    document.body.appendChild(el);
    const scrollSpy = vi.spyOn(el, "scrollIntoView");

    const { rerender } = renderHook(
      ({ active }) => useScrollToHash("revenue-data", active),
      { initialProps: { active: false } },
    );

    vi.advanceTimersByTime(500);
    expect(scrollSpy).not.toHaveBeenCalled(); // inactive → no polling

    rerender({ active: true });
    vi.advanceTimersByTime(150); // first poll tick finds the card
    expect(scrollSpy).toHaveBeenCalledTimes(1);
    expect(scrollSpy).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });

    vi.advanceTimersByTime(1000);
    expect(scrollSpy).toHaveBeenCalledTimes(1); // never again
  });

  it("silent no-op when the element never mounts (Free plan)", () => {
    const protoSpy = vi.spyOn(Element.prototype, "scrollIntoView");

    renderHook(() => useScrollToHash("revenue-data", true));

    vi.advanceTimersByTime(60_000); // well past the give-up window
    expect(protoSpy).not.toHaveBeenCalled(); // no scroll, no throw

    vi.advanceTimersByTime(60_000); // poller stopped: still nothing
    expect(protoSpy).not.toHaveBeenCalled();
  });

  it("does nothing when the hash points somewhere else", () => {
    window.history.replaceState(
      {},
      "",
      "/admin/organization?tab=general#members",
    );
    const el = document.createElement("div");
    el.id = "revenue-data";
    document.body.appendChild(el);
    const scrollSpy = vi.spyOn(el, "scrollIntoView");

    renderHook(() => useScrollToHash("revenue-data", true));
    vi.advanceTimersByTime(2000);

    expect(scrollSpy).not.toHaveBeenCalled();
  });
});
