import { describe, expect, it } from "vitest";
import { formatTimeRange, normalizeTimeRange, parseTimeRange, rangeCoversMinute } from "./time-range";

const h = (hours: number, minutes = 0) => hours * 60 + minutes;

describe("parseTimeRange", () => {
  it.each([
    ["6PM–11PM", h(18), h(23)],
    ["6pm-11pm", h(18), h(23)],
    ["6 PM - 11 PM", h(18), h(23)],
    ["6:30pm to 11pm", h(18, 30), h(23)],
    ["6pm—9:45pm", h(18), h(21, 45)],
    ["10am-2pm", h(10), h(14)],
    ["18:00-23:00", h(18), h(23)],
  ])("parses %s", (text, start, end) => {
    expect(parseTimeRange(text)).toEqual({ start, end });
  });

  it("lets a start with no AM/PM borrow the end's, e.g. 6-11pm", () => {
    expect(parseTimeRange("6-11pm")).toEqual({ start: h(18), end: h(23) });
  });

  it("picks the shorter reading when borrowing would run backwards, e.g. 11-1am is 11PM–1AM", () => {
    expect(parseTimeRange("11-1am")).toEqual({ start: h(23), end: h(25) });
  });

  it("treats a range with no AM/PM at all as evening (the team plays nights)", () => {
    expect(parseTimeRange("7-11")).toEqual({ start: h(19), end: h(23) });
  });

  it("extends an end earlier than the start past midnight", () => {
    expect(parseTimeRange("8pm-1am")).toEqual({ start: h(20), end: h(25) });
  });

  it("handles 12AM and 12PM", () => {
    expect(parseTimeRange("12pm-12am")).toEqual({ start: h(12), end: h(24) });
  });

  it.each(["", "   ", "whenever", "after work", "6pm", "25:00-26:00", "6pm-6pm", "13pm-2pm"])(
    "rejects %j",
    (text) => {
      expect(parseTimeRange(text)).toBeNull();
    },
  );
});

describe("formatTimeRange", () => {
  it("formats whole hours without minutes, using an en dash", () => {
    expect(formatTimeRange({ start: h(18), end: h(23) })).toBe("6PM–11PM");
  });

  it("keeps minutes when present and wraps past midnight", () => {
    expect(formatTimeRange({ start: h(18, 30), end: h(25) })).toBe("6:30PM–1AM");
  });

  it("shows midnight and noon as 12AM / 12PM", () => {
    expect(formatTimeRange({ start: h(12), end: h(24) })).toBe("12PM–12AM");
  });
});

describe("normalizeTimeRange", () => {
  it("rewrites anything parseable into the canonical format", () => {
    expect(normalizeTimeRange("6pm - 11pm")).toBe("6PM–11PM");
  });

  it("returns null for an empty range (meaning all day)", () => {
    expect(normalizeTimeRange("")).toBeNull();
    expect(normalizeTimeRange("  ")).toBeNull();
    expect(normalizeTimeRange(null)).toBeNull();
  });

  it("throws a user-facing error for text it can't read", () => {
    expect(() => normalizeTimeRange("after work")).toThrow(/time range/i);
  });
});

describe("rangeCoversMinute", () => {
  const range = { start: h(18), end: h(23) };

  it("covers a time inside the range, including its start", () => {
    expect(rangeCoversMinute(range, h(18))).toBe(true);
    expect(rangeCoversMinute(range, h(21))).toBe(true);
  });

  it("does not cover a time at or after the end", () => {
    expect(rangeCoversMinute(range, h(23))).toBe(false);
    expect(rangeCoversMinute(range, h(23, 30))).toBe(false);
  });

  it("does not cover a time before the start", () => {
    expect(rangeCoversMinute(range, h(17, 59))).toBe(false);
  });
});
