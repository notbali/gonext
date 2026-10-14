/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { LATEST_PATCH_DATE } from "./patch-notes";
import { PATCH_NOTES_SEEN_KEY, markPatchNotesSeen, readPatchNotesSeen, useHasUnseenPatchNotes } from "./patch-notes-seen";

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe("patch notes seen-tracking", () => {
  it("reads nothing for a viewer who has never opened the page", () => {
    expect(readPatchNotesSeen()).toBeNull();
  });

  it("remembers the latest date the viewer has seen", () => {
    markPatchNotesSeen("2026-10-14");
    expect(localStorage.getItem(PATCH_NOTES_SEEN_KEY)).toBe("2026-10-14");
    expect(readPatchNotesSeen()).toBe("2026-10-14");
  });

  it("survives storage that throws (private mode, blocked site data)", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readPatchNotesSeen()).toBeNull();
    expect(() => markPatchNotesSeen("2026-10-14")).not.toThrow();
  });
});

describe("useHasUnseenPatchNotes", () => {
  it("is true until the viewer opens the page, then flips without a reload", () => {
    const { result } = renderHook(() => useHasUnseenPatchNotes());
    expect(result.current).toBe(true);

    act(() => markPatchNotesSeen(LATEST_PATCH_DATE));
    expect(result.current).toBe(false);
  });

  it("is false when the viewer already saw the latest entry", () => {
    localStorage.setItem(PATCH_NOTES_SEEN_KEY, LATEST_PATCH_DATE);
    const { result } = renderHook(() => useHasUnseenPatchNotes());
    expect(result.current).toBe(false);
  });
});
