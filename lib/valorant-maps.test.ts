import { describe, expect, it } from "vitest";
import { mapImageSrc, VALORANT_MAPS } from "./valorant-maps";

describe("mapImageSrc", () => {
  it("returns a /maps path for every map in VALORANT_MAPS", () => {
    for (const map of VALORANT_MAPS) {
      expect(mapImageSrc(map)).toMatch(/^\/maps\/.+\.(webp|png)$/);
    }
  });

  it("returns a distinct image for each map", () => {
    const srcs = VALORANT_MAPS.map((map) => mapImageSrc(map));
    expect(new Set(srcs).size).toBe(VALORANT_MAPS.length);
  });

  it("returns null for a value that isn't a known map", () => {
    expect(mapImageSrc("NOT_A_MAP")).toBeNull();
  });
});
