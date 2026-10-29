// jsdom polyfills required by Radix UI primitives used in components under test.
if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;
}

if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.setPointerCapture) {
  Element.prototype.setPointerCapture = () => {};
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}

// Tests exercise the production-like first-party config (both suffixes).
// proxyHelper reads NON_CUSTOM_HOST_SUFFIXES at module load — set it before
// any test file imports. Dedicated default-by-NODE_ENV tests delete this,
// vi.resetModules(), and re-import to see the real default.
process.env.NON_CUSTOM_HOST_SUFFIXES =
  process.env.NON_CUSTOM_HOST_SUFFIXES || 'faddy.site,localhost';

// This jsdom build exposes localStorage as a plain object without Storage
// methods; components call localStorage.setItem on mount. Provide an
// in-memory Storage so page-level tests can render them.
if (typeof globalThis.localStorage?.setItem !== 'function') {
  const store = new Map<string, string>();
  const storage = {
    getItem: (k: string) => (store.has(k) ? (store.get(k) as string) : null),
    setItem: (k: string, v: string) => { store.set(k, String(v)); },
    removeItem: (k: string) => { store.delete(k); },
    clear: () => { store.clear(); },
    key: (i: number) => [...store.keys()][i] ?? null,
    get length() { return store.size; },
  };
  Object.defineProperty(globalThis, 'localStorage', { value: storage, configurable: true });
  try {
    Object.defineProperty(window, 'localStorage', { value: storage, configurable: true });
  } catch {
    // window.localStorage not redefinable — bare global covers component code
  }
}
