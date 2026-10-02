"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Season } from "@/lib/season";

const SeasonContext = createContext<Season>(null);

/** The current seasonal skin (see lib/season.ts), resolved once on the server by the root layout. */
export function SeasonProvider({ season, children }: { season: Season; children: ReactNode }) {
  return <SeasonContext.Provider value={season}>{children}</SeasonContext.Provider>;
}

export function useSeason(): Season {
  return useContext(SeasonContext);
}
