"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { claimVacantCoachRole, promoteToCoach } from "@/lib/coach";

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

export async function promoteTeammate(teammateId: string) {
  await requireCoach();
  await promoteToCoach(teammateId, db);
  revalidatePath("/roster");
}

/** Recovery path for a team with zero active coaches: any active teammate can claim the role. */
export async function claimCoachRole() {
  const session = await auth();
  if (!session?.teammateId) throw new Error("You must be a teammate to do this.");

  const result = await claimVacantCoachRole(session.teammateId, db);
  if (result.status === "coach-exists") throw new Error("This team already has an active coach.");

  revalidatePath("/roster");
}
