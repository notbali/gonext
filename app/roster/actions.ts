"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";

async function requireCoach() {
  const session = await auth();
  if (!session?.isCoach) throw new Error("Only a coach can manage the roster.");
}

export async function deactivateTeammate(teammateId: string) {
  await requireCoach();
  await db.teammate.update({ where: { id: teammateId }, data: { active: false } });
  revalidatePath("/roster");
  revalidatePath("/");
}

export async function reactivateTeammate(teammateId: string) {
  await requireCoach();
  await db.teammate.update({ where: { id: teammateId }, data: { active: true } });
  revalidatePath("/roster");
  revalidatePath("/");
}

export async function regenerateInvite(teamId: string) {
  await requireCoach();
  await db.team.update({ where: { id: teamId }, data: { inviteToken: randomUUID() } });
  revalidatePath("/roster");
}
