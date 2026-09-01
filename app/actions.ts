"use server";

import { revalidatePath } from "next/cache";
import { auth, signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import type { AvailabilityStatus } from "@/lib/types";

export async function updateAvailability(
  teammateId: string,
  dateISO: string,
  status: AvailabilityStatus,
  timeRange: string | null,
) {
  const session = await auth();
  if (!session?.teammateId || session.teammateId !== teammateId) {
    throw new Error("You can only edit your own availability.");
  }

  const date = new Date(dateISO);
  const resolvedRange = status === "available" ? timeRange : null;

  await db.availability.upsert({
    where: { teammateId_date: { teammateId, date } },
    update: { status, timeRange: resolvedRange },
    create: { teammateId, date, status, timeRange: resolvedRange },
  });

  revalidatePath("/");
}

export async function signInWithDiscord(redirectTo?: string) {
  await signIn("discord", redirectTo ? { redirectTo } : undefined);
}

export async function signOutAction() {
  await signOut();
}
