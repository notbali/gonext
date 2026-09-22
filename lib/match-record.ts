export type MatchResultValue = "WIN" | "LOSS";

export interface MapRecord {
  map: string;
  wins: number;
  losses: number;
}

export interface SeasonRecord {
  wins: number;
  losses: number;
  /** Most-played map first, ties alphabetical. */
  byMap: MapRecord[];
}

/** The team's win/loss record overall and per map (Playoffs filed as "PLAYOFFS"). */
export function summarizeRecord(
  matches: { map: string | null; isPlayoffs: boolean; result: MatchResultValue | null }[],
): SeasonRecord {
  const byMap = new Map<string, MapRecord>();
  let wins = 0;
  let losses = 0;

  for (const m of matches) {
    if (!m.result) continue;
    const key = m.isPlayoffs ? "PLAYOFFS" : (m.map ?? "MAP TBD");
    const entry = byMap.get(key) ?? { map: key, wins: 0, losses: 0 };
    if (m.result === "WIN") {
      entry.wins++;
      wins++;
    } else {
      entry.losses++;
      losses++;
    }
    byMap.set(key, entry);
  }

  const played = (r: MapRecord) => r.wins + r.losses;
  return {
    wins,
    losses,
    byMap: [...byMap.values()].sort((a, b) => played(b) - played(a) || a.map.localeCompare(b.map)),
  };
}
