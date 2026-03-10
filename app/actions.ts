"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Nomination, NomineeStats, CategoryLeaderboard } from "@/lib/data";
import {
  dbSaveNominations,
  dbLoadNominations,
  dbClearNominations,
  dbGetGeneralLeaderboard,
  dbGetCategoryLeaderboards,
  dbMergeNominees,
  dbGetNomineeByUUID,
} from "@/lib/db";
import { verifyCredentials, createSession, deleteSession } from "@/lib/auth";

export interface DashboardData {
  nominations: Nomination[];
  leaderboard: NomineeStats[];
  categoryBoards: CategoryLeaderboard[];
}

export async function loadDashboardData(): Promise<DashboardData | null> {
  const nominations = await dbLoadNominations();
  if (!nominations) return null;

  const [leaderboard, categoryBoards] = await Promise.all([
    dbGetGeneralLeaderboard(nominations),
    dbGetCategoryLeaderboards(nominations),
  ]);

  return { nominations, leaderboard, categoryBoards };
}

export async function uploadNominations(
  nominations: Nomination[]
): Promise<DashboardData> {
  await dbSaveNominations(nominations);
  const data = await loadDashboardData();
  return data!;
}

export async function resetNominations(): Promise<void> {
  await dbClearNominations();
}

export async function mergeNomineesAction(
  oldNames: string[],
  newName: string
): Promise<DashboardData> {
  await dbMergeNominees(oldNames, newName);
  const data = await loadDashboardData();
  return data!;
}

export async function fetchNomineeByUUID(uuid: string): Promise<{
  name: string;
  nominations: { category: string; reason: string; nominatorName: string }[];
} | null> {
  return dbGetNomineeByUUID(uuid);
}

const THIRTY_DAYS_S = 30 * 24 * 60 * 60;

export async function loginAction(
  email: string,
  password: string
): Promise<{ error: string } | undefined> {
  const user = await verifyCredentials(email, password);

  if (!user) {
    return { error: "Invalid email or password" };
  }

  const token = await createSession(user.id);

  const cookieStore = await cookies();
  cookieStore.set("session_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS_S,
  });

  redirect("/");
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  if (token) {
    await deleteSession(token);
  }

  cookieStore.delete("session_token");
  redirect("/login");
}
