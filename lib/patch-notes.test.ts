import { describe, expect, it } from "vitest";
import { LATEST_PATCH_DATE, PATCH_NOTES, hasUnseenPatchNotes, patchDateLabel } from "./patch-notes";

describe("PATCH_NOTES", () => {
  it("has at least one entry", () => {
    expect(PATCH_NOTES.length).toBeGreaterThan(0);
  });

  it("dates every entry as a real YYYY-MM-DD calendar day", () => {
    for (const note of PATCH_NOTES) {
      expect(note.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(new Date(`${note.date}T00:00:00Z`).toISOString().slice(0, 10)).toBe(note.date);
    }
  });

  it("lists the newest entry first", () => {
    for (let i = 1; i < PATCH_NOTES.length; i++) {
      expect(PATCH_NOTES[i - 1].date >= PATCH_NOTES[i].date).toBe(true);
    }
  });

  it("gives every entry a title and at least one change", () => {
    for (const note of PATCH_NOTES) {
      expect(note.title.trim()).not.toBe("");
      expect(note.changes.length).toBeGreaterThan(0);
      for (const change of note.changes) expect(change.trim()).not.toBe("");
    }
  });

  it("gives every entry a unique title", () => {
    const titles = PATCH_NOTES.map((n) => n.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("exposes the first entry's date as the latest", () => {
    expect(LATEST_PATCH_DATE).toBe(PATCH_NOTES[0].date);
  });
});

describe("hasUnseenPatchNotes", () => {
  it("is true for a viewer who has never opened the page", () => {
    expect(hasUnseenPatchNotes(null, "2026-10-14")).toBe(true);
  });

  it("is true when the viewer last opened it before the latest entry", () => {
    expect(hasUnseenPatchNotes("2026-10-02", "2026-10-14")).toBe(true);
  });

  it("is false once the viewer has seen the latest entry", () => {
    expect(hasUnseenPatchNotes("2026-10-14", "2026-10-14")).toBe(false);
  });

  it("defaults to the latest entry in the list", () => {
    expect(hasUnseenPatchNotes(LATEST_PATCH_DATE)).toBe(false);
  });

  it("treats a garbled stored value as unseen", () => {
    expect(hasUnseenPatchNotes("not a date", "2026-10-14")).toBe(true);
  });
});

describe("patchDateLabel", () => {
  it("formats the date for players without shifting the day", () => {
    expect(patchDateLabel("2026-10-02")).toBe("Oct 2, 2026");
    expect(patchDateLabel("2026-01-01")).toBe("Jan 1, 2026");
  });
});
