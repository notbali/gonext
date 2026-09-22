"use server";

import { revalidatePath } from "next/cache";
import { auth, signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import { AVAILABILITY_STATUS_OPTIONS, type AvailabilityStatus, type WeeklyDefaultEntry } from "@/lib/types";
import { normalizeTimeRange } from "@/lib/time-range";

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
  const resolvedRange = status === "available" ? normalizeTimeRange(timeRange) : null;

  await db.availability.upsert({
    where: { teammateId_date: { teammateId, date } },
    update: { status, timeRange: resolvedRange },
    create: { teammateId, date, status, timeRange: resolvedRange },
  });

  revalidatePath("/");
}

export async function setWeekAvailability(
  teammateId: string,
  dateISOs: string[],
  status: AvailabilityStatus,
  timeRange: string | null,
) {
  const session = await auth();
  if (!session?.teammateId || session.teammateId !== teammateId) {
    throw new Error("You can only edit your own availability.");
  }

  const resolvedRange = status === "available" ? normalizeTimeRange(timeRange) : null;

  await Promise.all(
    dateISOs.map((dateISO) => {
      const date = new Date(dateISO);
      return db.availability.upsert({
        where: { teammateId_date: { teammateId, date } },
        update: { status, timeRange: resolvedRange },
        create: { teammateId, date, status, timeRange: resolvedRange },
      });
    }),
  );

  revalidatePath("/");
}

const MAX_NOTE_LENGTH = 60;

/** Sets the short note on a day, without touching its status or time range. */
export async function updateAvailabilityNote(teammateId: string, dateISO: string, note: string) {
  const session = await auth();
  if (!session?.teammateId || session.teammateId !== teammateId) {
    throw new Error("You can only edit your own availability.");
  }

  const trimmed = note.trim();
  if (trimmed.length > MAX_NOTE_LENGTH) {
    throw new Error(`Notes are limited to ${MAX_NOTE_LENGTH} characters.`);
  }
  const date = new Date(dateISO);

  await db.availability.upsert({
    where: { teammateId_date: { teammateId, date } },
    update: { note: trimmed || null },
    create: { teammateId, date, status: "not-set", note: trimmed || null },
  });

  revalidatePath("/");
}

/**
 * Replaces the caller's weekly defaults. A "not-set" day has no default, so
 * it's dropped; every range is validated before anything is written.
 */
export async function setWeeklyDefaults(teammateId: string, entries: WeeklyDefaultEntry[]) {
  const session = await auth();
  if (!session?.teammateId || session.teammateId !== teammateId) {
    throw new Error("You can only edit your own availability.");
  }

  const statuses = AVAILABILITY_STATUS_OPTIONS.map((o) => o.value);
  const rows = entries
    .map((e) => {
      if (!Number.isInteger(e.dayOfWeek) || e.dayOfWeek < 0 || e.dayOfWeek > 6) {
        throw new Error("Invalid day of the week.");
      }
      if (!statuses.includes(e.status)) throw new Error("Invalid availability status.");
      return {
        teammateId,
        dayOfWeek: e.dayOfWeek,
        status: e.status,
        timeRange: e.status === "available" ? normalizeTimeRange(e.timeRange) : null,
      };
    })
    .filter((r) => r.status !== "not-set");

  await db.$transaction([
    db.weeklyDefault.deleteMany({ where: { teammateId } }),
    db.weeklyDefault.createMany({ data: rows }),
  ]);

  revalidatePath("/");
}

export async function signInWithDiscord(redirectTo?: string) {
  await signIn("discord", redirectTo ? { redirectTo } : undefined);
}

export async function signOutAction() {
  await signOut();
}
