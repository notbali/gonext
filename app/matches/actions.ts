"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

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
  return { group, date: new Date(`${dateStr}T${timeStr}:00`) };
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
