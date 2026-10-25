import { render, act, cleanup } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { RotatingPhrase } from "./rotating-phrase";

const PHRASES_A = [{ label: "Alpha" }, { label: "Beta" }, { label: "Gamma" }];
const PHRASES_B = [{ label: "One" }, { label: "Two" }];

const active = (container: HTMLElement) =>
  container.querySelector("[aria-hidden='false']")?.textContent ?? "";

const stubMatchMedia = (reduced: boolean) => {
  window.matchMedia = ((query: string) => ({
    matches: reduced && query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
};

describe("RotatingPhrase rotation schedule", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    stubMatchMedia(false);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("renders items[0] before any timer fires (deterministic first paint)", () => {
    const { container } = render(<RotatingPhrase items={PHRASES_A} />);
    expect(active(container)).toBe("Alpha");
    act(() => vi.advanceTimersByTime(2399));
    expect(active(container)).toBe("Alpha");
  });

  it("waits a randomized 2.4–3.4s before the first change", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1); // 2400 + 100 = 2500
    const { container } = render(<RotatingPhrase items={PHRASES_A} />);
    act(() => vi.advanceTimersByTime(2499));
    expect(active(container)).toBe("Alpha");
    act(() => vi.advanceTimersByTime(1));
    expect(active(container)).toBe("Beta");
  });

  it("re-randomizes every cycle instead of using a fixed interval", () => {
    const rand = vi.spyOn(Math, "random");
    rand.mockReturnValueOnce(0.0).mockReturnValue(1.0); // 2400ms then 3400ms
    const { container } = render(<RotatingPhrase items={PHRASES_A} />);
    act(() => vi.advanceTimersByTime(2400));
    expect(active(container)).toBe("Beta");
    act(() => vi.advanceTimersByTime(3399));
    expect(active(container)).toBe("Beta");
    act(() => vi.advanceTimersByTime(1));
    expect(active(container)).toBe("Gamma");
  });

  it("keeps sibling instances on independent schedules and indices", () => {
    vi.spyOn(Math, "random").mockReturnValueOnce(0.1).mockReturnValue(0.9);
    const first = render(<RotatingPhrase items={PHRASES_A} />);
    const second = render(<RotatingPhrase items={PHRASES_B} />);

    act(() => vi.advanceTimersByTime(2500)); // first fires, second still waiting
    expect(active(first.container)).toBe("Beta");
    expect(active(second.container)).toBe("One");

    act(() => vi.advanceTimersByTime(800)); // second fires at 3300ms
    expect(active(second.container)).toBe("Two");
    expect(active(first.container)).toBe("Beta");
  });

  it("clears its timers on unmount", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const { unmount } = render(<RotatingPhrase items={PHRASES_A} />);
    expect(vi.getTimerCount()).toBeGreaterThan(0);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    act(() => vi.advanceTimersByTime(30000));
    expect(vi.getTimerCount()).toBe(0);
  });

  it("never schedules when the user prefers reduced motion", () => {
    stubMatchMedia(true);
    const { container } = render(<RotatingPhrase items={PHRASES_A} />);
    act(() => vi.advanceTimersByTime(30000));
    expect(vi.getTimerCount()).toBe(0);
    expect(active(container)).toBe("Alpha");
  });
});
