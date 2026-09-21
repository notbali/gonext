import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ValorantMap } from "@/lib/generated/prisma/enums";
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

describe("map registry", () => {
  it("lists exactly the maps in the Prisma ValorantMap enum, so a map can't be assignable without artwork (or vice versa)", () => {
    expect([...VALORANT_MAPS].sort()).toEqual(Object.values(ValorantMap).sort());
  });

  it("points every map at an image file that exists in /public/maps", () => {
    const publicDir = path.resolve(import.meta.dirname, "../public");
    for (const map of VALORANT_MAPS) {
      expect(existsSync(path.join(publicDir, mapImageSrc(map)!)), `${map} image`).toBe(true);
    }
  });
});
