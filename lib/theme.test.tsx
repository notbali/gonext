/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { THEME_INIT_SCRIPT, THEME_KEY, applyTheme, readSavedTheme, useTheme } from "./theme";

afterEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
  vi.restoreAllMocks();
});

describe("theme", () => {
  it("has no saved theme until the viewer picks one", () => {
    expect(readSavedTheme()).toBeNull();
  });

  it("ignores a garbled saved value", () => {
    localStorage.setItem(THEME_KEY, "purple");
    expect(readSavedTheme()).toBeNull();
  });

  it("applies light mode to the page root and remembers it", () => {
    applyTheme("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem(THEME_KEY)).toBe("light");
    expect(readSavedTheme()).toBe("light");
  });

  it("drops the root attribute for dark, the default", () => {
    applyTheme("light");
    applyTheme("dark");
    expect(document.documentElement.dataset.theme).toBeUndefined();
    expect(localStorage.getItem(THEME_KEY)).toBe("dark");
  });

  it("still switches when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(() => applyTheme("light")).not.toThrow();
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("restores a saved light theme before the page paints, via the inline script", () => {
    localStorage.setItem(THEME_KEY, "light");
    new Function(THEME_INIT_SCRIPT)();
    expect(document.documentElement.dataset.theme).toBe("light");
  });

  it("leaves the page dark when nothing (or garbage) is saved", () => {
    new Function(THEME_INIT_SCRIPT)();
    expect(document.documentElement.dataset.theme).toBeUndefined();
    localStorage.setItem(THEME_KEY, "purple");
    new Function(THEME_INIT_SCRIPT)();
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });

  it("useTheme follows the root and updates when the theme changes", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current).toBe("dark");
    act(() => applyTheme("light"));
    expect(result.current).toBe("light");
  });
});
