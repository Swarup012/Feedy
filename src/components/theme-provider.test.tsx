import { render, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { ThemeProvider, useTheme } from "@/components/theme-provider";

let captured!: ReturnType<typeof useTheme>;

function Probe() {
  captured = useTheme();
  return null;
}

// The jsdom environment exposes a localStorage without Storage methods, so stub one.
function stubLocalStorage(): void {
  const data = new Map<string, string>();
  const store = {
    getItem: (key: string) => (data.has(key) ? (data.get(key) as string) : null),
    setItem: (key: string, value: string) => {
      data.set(key, String(value));
    },
    removeItem: (key: string) => {
      data.delete(key);
    },
    clear: () => data.clear(),
    key: (index: number) => [...data.keys()][index] ?? null,
    get length() {
      return data.size;
    },
  };
  Object.defineProperty(window, "localStorage", { configurable: true, writable: true, value: store });
  Object.defineProperty(globalThis, "localStorage", { configurable: true, writable: true, value: store });
}

describe("ThemeProvider", () => {
  beforeEach(() => {
    stubLocalStorage();
    window.matchMedia = ((query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      onchange: null,
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;
    document.documentElement.className = "";
  });

  it("applies the stored theme from storageKey on mount", () => {
    localStorage.setItem("vite-ui-theme", "dark");
    render(
      <ThemeProvider defaultTheme="light">
        <Probe />
      </ThemeProvider>,
    );
    expect(captured.theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("falls back to the legacy 'theme' key", () => {
    localStorage.setItem("theme", "dark");
    render(
      <ThemeProvider defaultTheme="light">
        <Probe />
      </ThemeProvider>,
    );
    expect(captured.theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("setTheme persists to storage and updates the html class", () => {
    render(
      <ThemeProvider defaultTheme="light">
        <Probe />
      </ThemeProvider>,
    );
    expect(document.documentElement.classList.contains("light")).toBe(true);
    act(() => captured.setTheme("dark"));
    expect(localStorage.getItem("vite-ui-theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
    expect(captured.resolvedTheme).toBe("dark");
  });
});
