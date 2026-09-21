import type { ValorantMap } from "@/lib/generated/prisma/client";

/**
 * Every map a coach can assign to a week, and the artwork shown for it when hovering that week in the
 * schedule calendar. Each entry's name is also the text that decrypts over the artwork.
 *
 * To add a map:
 *   1. Add it to the `ValorantMap` enum in prisma/schema.prisma and create a migration.
 *   2. Drop its artwork into /public/maps (any extension — source art came in whatever format Riot/the wiki served).
 *   3. Add one line here. It's typed against the Prisma enum, so `tsc` flags it if step 1 was done and this wasn't.
 * The dropdown, hover preview, and decrypting label all pick it up from here.
 */
const MAP_IMAGE_FILENAMES: Record<ValorantMap, string> = {
  ASCENT: "ascent.webp",
  BIND: "bind.webp",
  BREEZE: "breeze.png",
  FRACTURE: "fracture.webp",
  HAVEN: "haven.png",
  ICEBOX: "icebox.png",
  LOTUS: "lotus.webp",
  PEARL: "pearl.png",
  SPLIT: "split.png",
  SUNSET: "sunset.webp",
  ABYSS: "abyss.webp",
  CORRODE: "corrode.png",
};

/** The maps a coach can assign to a week, in the order they're offered. */
export const VALORANT_MAPS = Object.keys(MAP_IMAGE_FILENAMES) as ValorantMap[];

/** The static artwork for `map`, shown when hovering its week in the schedule calendar. Null for
 * anything that isn't a known map (there's no artwork to fall back to). */
export function mapImageSrc(map: string): string | null {
  const filename = (MAP_IMAGE_FILENAMES as Record<string, string>)[map];
  return filename ? `/maps/${filename}` : null;
}
