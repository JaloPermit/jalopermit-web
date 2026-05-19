// React Testing Library uses act() which requires the development react-dom
// build. The vitest config forces NODE_ENV=development to satisfy that, and
// this flag is the canonical signal to react-dom that test wrapping is active.
(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;

// jsdom lacks matchMedia — pre-populate a minimal stub for components that
// reach for it through testing utilities.
if (typeof window !== "undefined" && !window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}
