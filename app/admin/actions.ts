"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { addUserToTeam, setTeammateActive, setTeammateCoach, type UpdateTeammateResult } from "@/lib/admin";

async function requireAdmin() {
  const session = await auth();
  if (!session?.isAdmin) throw new Error("Only an admin can do this.");
}

function revalidateAll() {
  revalidatePath("/admin");
  revalidatePath("/roster");
  revalidatePath("/");
}

function assertFound(result: UpdateTeammateResult) {
  if (result.status === "not-found") throw new Error("That teammate no longer exists.");
}

export async function adminAddUserToTeam(userId: string) {
  await requireAdmin();
  const team = await db.team.findFirst({ select: { id: true } });
  if (!team) throw new Error("There is no team yet.");

  const result = await addUserToTeam(userId, team.id, db);
  if (result.status === "user-not-found") throw new Error("That user no longer exists.");
  if (result.status === "already-on-team") throw new Error("That user is already on the team.");
  revalidateAll();
}

export async function adminDeactivateTeammate(teammateId: string) {
  await requireAdmin();
  assertFound(await setTeammateActive(teammateId, false, db));
  revalidateAll();
}

export async function adminReactivateTeammate(teammateId: string) {
  await requireAdmin();
  assertFound(await setTeammateActive(teammateId, true, db));
  revalidateAll();
}

export async function adminPromoteTeammate(teammateId: string) {
  await requireAdmin();
  assertFound(await setTeammateCoach(teammateId, true, db));
  revalidateAll();
}

export async function adminDemoteTeammate(teammateId: string) {
  await requireAdmin();
  assertFound(await setTeammateCoach(teammateId, false, db));
  revalidateAll();
}

export async function adminRegenerateInvite(teamId: string) {
  await requireAdmin();
  await db.team.update({ where: { id: teamId }, data: { inviteToken: randomUUID() } });
  revalidateAll();
}
