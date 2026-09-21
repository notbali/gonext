import { describe, expect, it } from "vitest";
import { appViewport } from "./viewport";

describe("appViewport", () => {
  it("sizes the layout viewport to the device width at 1x scale", () => {
    expect(appViewport.width).toBe("device-width");
    expect(appViewport.initialScale).toBe(1);
  });

  it("never disables pinch-zoom, which users with low vision rely on", () => {
    expect(appViewport.maximumScale).toBeUndefined();
    expect(appViewport.userScalable).not.toBe(false);
  });

  it("tints the mobile browser chrome to the app background (--raw-bg in globals.css)", () => {
    expect(appViewport.themeColor).toBe("#0f1923");
  });
});
