import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ValorantMap } from "@/lib/generated/prisma/enums";
import { mapImageSrc, VALORANT_MAPS } from "./valorant-maps";

const MAPS_WITH_ARTWORK = VALORANT_MAPS.filter((map) => mapImageSrc(map) !== null);

describe("mapImageSrc", () => {
  it("returns a /maps path for every map that has artwork", () => {
    for (const map of MAPS_WITH_ARTWORK) {
      expect(mapImageSrc(map)).toMatch(/^\/maps\/.+\.(webp|png)$/);
    }
  });

  it("returns a distinct image for each map", () => {
    const srcs = MAPS_WITH_ARTWORK.map((map) => mapImageSrc(map));
    expect(new Set(srcs).size).toBe(MAPS_WITH_ARTWORK.length);
  });

  it("returns null for a map whose artwork hasn't been added yet", () => {
    expect(mapImageSrc("SUMMIT")).toBeNull();
  });

  it("returns null for a value that isn't a known map", () => {
    expect(mapImageSrc("NOT_A_MAP")).toBeNull();
  });
});

describe("map registry", () => {
  it("lists exactly the maps in the Prisma ValorantMap enum, so the registry and the database can't drift", () => {
    expect([...VALORANT_MAPS].sort()).toEqual(Object.values(ValorantMap).sort());
  });

  it("includes Summit", () => {
    expect(VALORANT_MAPS).toContain("SUMMIT");
  });

  it("points every map with artwork at an image file that exists in /public/maps", () => {
    const publicDir = path.resolve(import.meta.dirname, "../public");
    for (const map of MAPS_WITH_ARTWORK) {
      expect(existsSync(path.join(publicDir, mapImageSrc(map)!)), `${map} image`).toBe(true);
    }
  });
});
