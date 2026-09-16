"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { easternPartsToUtc } from "@/lib/dates";

async function requireCoach() {
  const session = await auth();
  if (!session?.isCoach) throw new Error("Only a coach can manage matches.");
}

function parseMatchFields(formData: FormData) {
  const group = String(formData.get("group") ?? "").trim();
  const dateStr = String(formData.get("date") ?? "");
  const timeStr = String(formData.get("time") ?? "");
  if (!group || !dateStr || !timeStr) {
    throw new Error("Group, date, and time are all required.");
  }
  // The date/time inputs are seeded (MatchEditor) and always intended (coaches
  // schedule matches in the team's own local time) as Eastern time — see lib/dates.ts.
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hours, minutes] = timeStr.split(":").map(Number);
  return { group, date: easternPartsToUtc({ year, month: month - 1, day, hours, minutes }) };
}

export async function createMatch(formData: FormData) {
  await requireCoach();
  const fields = parseMatchFields(formData);

  const team = await db.team.findFirst();
  if (!team) throw new Error("No team found.");

  await db.match.create({ data: { ...fields, teamId: team.id } });

  revalidatePath("/matches");
  revalidatePath("/");
}

export async function updateMatch(matchId: string, formData: FormData) {
  await requireCoach();
  const fields = parseMatchFields(formData);

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
