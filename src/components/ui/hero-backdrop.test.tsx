import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { HeroBackdrop } from "./hero-backdrop";

/**
 * The backdrop is decorative, so the contract worth locking down is the
 * accessibility/interaction boundary and the per-signal timing that keeps the
 * drift ambient (independent durations, negative delays, no JS timers).
 */
describe("HeroBackdrop", () => {
  const renderBackdrop = () => {
    const { container } = render(<HeroBackdrop />);
    const root = container.firstElementChild as HTMLElement;
    const signals = [...root.querySelectorAll(":scope > span")] as HTMLElement[];
    return { container, root, signals };
  };

  it("stays decorative: hidden from AT and inert to the pointer", () => {
    const { root } = renderBackdrop();

    expect(root.getAttribute("aria-hidden")).toBe("true");
    expect(root.className).toContain("pointer-events-none");
    expect(root.querySelector("svg")?.getAttribute("aria-hidden")).toBe("true");
  });

  it("draws every facade as its own path with per-building window grids", () => {
    const { container } = renderBackdrop();
    const svg = container.querySelector("svg");
    const paths = [...(svg?.querySelectorAll("path") ?? [])];
    const cls = (p: Element) => p.getAttribute("class") ?? "";

    const facades = paths.filter((p) =>
      /^fill-(blue-900|blue-800|slate-900|indigo-900)/.test(cls(p)),
    );
    const windows = paths.filter((p) =>
      /^fill-(blue-500|blue-300|blue-700)/.test(cls(p)),
    );

    expect(svg?.getAttribute("class")).toContain("hero-skyline");
    expect(facades.length).toBe(24);
    expect(windows.length).toBeGreaterThanOrEqual(25);
  });

  it("gives every signal an independent, negatively delayed CSS cycle", () => {
    const { signals } = renderBackdrop();

    expect(signals.length).toBe(11);
    expect(signals.filter((s) => s.className.includes("hidden")).length).toBe(6);

    const cycles = signals.map((s) => s.style.animation);
    for (const cycle of cycles) {
      expect(cycle).toMatch(/^heroSignal [\d.]+s linear -[\d.]+s infinite$/);
    }
    expect(new Set(cycles.map((c) => c.split(" ")[1])).size).toBe(signals.length);
    expect(signals.every((s) => s.style.animation.includes(" linear -"))).toBe(
      true,
    );
  });
});
