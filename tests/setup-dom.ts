import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// This setup file loads for every test file (including plain node-environment
// DB tests), so guard the DOM-only cleanup to jsdom test files.
if (typeof document !== "undefined") {
  afterEach(() => cleanup());

  // Node 25+ ships its own `localStorage` global, which is undefined without
  // --localstorage-file and shadows jsdom's. Put jsdom's back.
  const jsdomWindow = (globalThis as { jsdom?: { window: Window } }).jsdom?.window;
  if (typeof localStorage === "undefined" && jsdomWindow) {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: jsdomWindow.localStorage,
    });
  }
}
