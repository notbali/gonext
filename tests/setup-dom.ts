import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// This setup file loads for every test file (including plain node-environment
// DB tests), so guard the DOM-only cleanup to jsdom test files.
if (typeof document !== "undefined") {
  afterEach(() => cleanup());
}
