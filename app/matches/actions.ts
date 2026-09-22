"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { easternPartsToUtc, getWeekStart } from "@/lib/dates";
import type { MatchResult, ValorantMap } from "@/lib/generated/prisma/client";

const MAX_MATCHES_PER_WEEK = 2;

async function requireCoach() {
  const session = await auth();
  if (!session?.isCoach) throw new Error("Only a coach can manage matches.");
}

function parseMatchFields(formData: FormData) {
  const dateStr = String(formData.get("date") ?? "");
  const timeStr = String(formData.get("time") ?? "");
  const isPlayoffs = Boolean(formData.get("isPlayoffs"));
  if (!dateStr || !timeStr) {
    throw new Error("Date and time are required.");
  }
  // The date/time inputs are seeded (MatchEditor) and always intended (coaches
  // schedule matches in the team's own local time) as Eastern time — see lib/dates.ts.
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  return { isPlayoffs, date: easternPartsToUtc({ year, month: month - 1, day, hours, minutes }) };
}

/** Riot allows at most 2 matches on a week's assigned Map; Playoffs runs outside that cap. */
async function assertWithinWeeklyCap(teamId: string, date: Date, isPlayoffs: boolean, excludeMatchId?: string) {
  if (isPlayoffs) return;

  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const count = await db.match.count({
    where: {
      teamId,
      isPlayoffs: false,
      date: { gte: weekStart, lt: weekEnd },
      ...(excludeMatchId ? { id: { not: excludeMatchId } } : {}),
    },
  });

  if (count >= MAX_MATCHES_PER_WEEK) {
    throw new Error("Only 2 matches can be scheduled per week.");
  }
}

export async function createMatch(formData: FormData) {
  await requireCoach();
  const fields = parseMatchFields(formData);

  const team = await db.team.findFirst();
  if (!team) throw new Error("No team found.");

  await assertWithinWeeklyCap(team.id, fields.date, fields.isPlayoffs);

  await db.match.create({ data: { ...fields, teamId: team.id } });

  revalidatePath("/matches");
  revalidatePath("/");
}

export async function updateMatch(matchId: string, formData: FormData) {
  await requireCoach();
  const fields = parseMatchFields(formData);

  const existing = await db.match.findUniqueOrThrow({ where: { id: matchId } });
  await assertWithinWeeklyCap(existing.teamId, fields.date, fields.isPlayoffs, matchId);

  await db.match.update({ where: { id: matchId }, data: fields });

  revalidatePath("/matches");
  revalidatePath("/");
}

export async function deleteMatch(matchId: string) {
  await requireCoach();
  await db.match.delete({ where: { id: matchId } });
  revalidatePath("/matches");
  revalidatePath("/");
}

/** Sets (or replaces) the Map Riot assigned to the week starting `weekStartISO`. */
export async function setWeekMap(weekStartISO: string, map: ValorantMap) {
  await requireCoach();
  const weekStart = new Date(weekStartISO);

  const team = await db.team.findFirst();
  if (!team) throw new Error("No team found.");

  await db.weekMap.upsert({
    where: { teamId_weekStart: { teamId: team.id, weekStart } },
    create: { teamId: team.id, weekStart, map },
    update: { map },
  });

  revalidatePath("/matches");
  revalidatePath("/");
}

/** Records how a played match went; `null` clears it. */
export async function setMatchResult(matchId: string, result: MatchResult | null) {
  await requireCoach();
  if (result !== null && result !== "WIN" && result !== "LOSS") {
    throw new Error("A match result must be a win or a loss.");
  }

  const match = await db.match.findUniqueOrThrow({ where: { id: matchId } });
  if (result && match.date > new Date()) {
    throw new Error("That match hasn't been played yet.");
  }

  await db.match.update({ where: { id: matchId }, data: { result } });
  revalidatePath("/matches");
}
