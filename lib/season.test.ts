import { describe, expect, it } from "vitest";
import { easternPartsToUtc } from "./dates";
import { getSeason, isHalloweenNight } from "./season";

const et = (month: number, day: number, hours = 12) => easternPartsToUtc({ year: 2026, month, day, hours, minutes: 0 });

describe("getSeason", () => {
  it("is halloween for all of October in Eastern time", () => {
    expect(getSeason(et(9, 1, 0))).toBe("halloween");
    expect(getSeason(et(9, 31, 23))).toBe("halloween");
  });

  it("is off outside October, by the Eastern calendar rather than UTC", () => {
    expect(getSeason(et(8, 30, 23))).toBeNull(); // already Oct 1 in UTC
    expect(getSeason(et(10, 1, 0))).toBeNull();
    expect(getSeason(et(5, 15))).toBeNull();
  });

  it("can be forced on or off with an override, for previewing", () => {
    expect(getSeason(et(5, 15), "halloween")).toBe("halloween");
    expect(getSeason(et(9, 15), "off")).toBeNull();
  });

  it("ignores an unknown override", () => {
    expect(getSeason(et(9, 15), "xmas")).toBe("halloween");
    expect(getSeason(et(5, 15), "")).toBeNull();
  });
});

describe("isHalloweenNight", () => {
  it("is true only for instants on Oct 31 in Eastern time", () => {
    expect(isHalloweenNight(et(9, 31, 20))).toBe(true);
    expect(isHalloweenNight(et(9, 31, 0))).toBe(true);
    expect(isHalloweenNight(et(9, 30, 23))).toBe(false);
    expect(isHalloweenNight(et(10, 1, 0))).toBe(false);
  });
});
