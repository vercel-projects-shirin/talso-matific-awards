"use server";

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
