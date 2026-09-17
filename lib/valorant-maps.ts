/** Mirrors prisma/schema.prisma's ValorantMap enum — the maps a coach can assign to a week. */
export const VALORANT_MAPS = [
  "ASCENT",
  "BIND",
  "BREEZE",
  "FRACTURE",
  "HAVEN",
  "ICEBOX",
  "LOTUS",
  "PEARL",
  "SPLIT",
  "SUNSET",
  "ABYSS",
  "CORRODE",
] as const;

type ValorantMapName = (typeof VALORANT_MAPS)[number];

/** Filenames under /public/maps — mixed extensions since source art came in whatever format Riot/the wiki served. */
const MAP_IMAGE_FILENAMES: Record<ValorantMapName, string> = {
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

/** The static artwork for `map`, shown when hovering its week in the schedule calendar. Null for
 * anything that isn't a known map (there's no artwork to fall back to). */
export function mapImageSrc(map: string): string | null {
  const filename = (MAP_IMAGE_FILENAMES as Record<string, string>)[map];
  return filename ? `/maps/${filename}` : null;
}
