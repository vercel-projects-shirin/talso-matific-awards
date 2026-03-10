import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Nomination, NomineeStats, CategoryLeaderboard } from "@/lib/data";

function t(base: string): string {
  const prefix = process.env.NEXT_PUBLIC_DB_SCHEMA || "local";
  return `${prefix}__${base}`;
}

async function loadNomineeUUIDMap(): Promise<Record<string, string>> {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase.from(t("nominees")).select("id, name");
  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    map[row.name] = row.id;
  }
  return map;
}

export async function dbSaveNominations(
  nominations: Nomination[]
): Promise<void> {
  const supabase = createServerSupabaseClient();

  await supabase.from(t("nominations")).delete().not("id", "is", null);

  const rows = nominations.map((n) => ({
    timestamp: n.timestamp,
    email: n.email,
    nominator_name: n.nominatorName,
    nominee_name: n.nomineeName,
    category: n.category,
    reason: n.reason,
  }));

  const CHUNK_SIZE = 500;
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    await supabase
      .from(t("nominations"))
      .insert(rows.slice(i, i + CHUNK_SIZE));
  }

  const uniqueNames = [...new Set(nominations.map((n) => n.nomineeName))];
  await supabase
    .from(t("nominees"))
    .upsert(
      uniqueNames.map((name) => ({ name })),
      { onConflict: "name", ignoreDuplicates: true }
    );
}

export async function dbLoadNominations(): Promise<Nomination[] | null> {
  const supabase = createServerSupabaseClient();
  const { data } = await supabase.from(t("nominations")).select("*");

  if (!data || data.length === 0) return null;

  return data.map((row) => ({
    timestamp: row.timestamp ?? "",
    email: row.email ?? "",
    nominatorName: row.nominator_name,
    nomineeName: row.nominee_name,
    category: row.category,
    reason: row.reason ?? "",
  }));
}

export async function dbClearNominations(): Promise<void> {
  const supabase = createServerSupabaseClient();
  await supabase.from(t("nominations")).delete().not("id", "is", null);
  await supabase.from(t("nominees")).delete().not("id", "is", null);
}

export async function dbGetGeneralLeaderboard(
  nominations: Nomination[]
): Promise<NomineeStats[]> {
  const uuidMap = await loadNomineeUUIDMap();
  const counts = new Map<string, number>();
  for (const n of nominations) {
    counts.set(n.nomineeName, (counts.get(n.nomineeName) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count, id: uuidMap[name] ?? "" }))
    .sort((a, b) => b.count - a.count);
}

export async function dbGetCategoryLeaderboards(
  nominations: Nomination[]
): Promise<CategoryLeaderboard[]> {
  const uuidMap = await loadNomineeUUIDMap();
  const categories = new Map<string, Map<string, number>>();
  for (const n of nominations) {
    if (!categories.has(n.category)) {
      categories.set(n.category, new Map());
    }
    const catMap = categories.get(n.category)!;
    catMap.set(n.nomineeName, (catMap.get(n.nomineeName) ?? 0) + 1);
  }
  return Array.from(categories.entries()).map(([category, nominees]) => ({
    category,
    nominees: Array.from(nominees.entries())
      .map(([name, count]) => ({ name, count, id: uuidMap[name] ?? "" }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3),
  }));
}

export async function dbMergeNominees(
  oldNames: string[],
  newName: string
): Promise<void> {
  const supabase = createServerSupabaseClient();

  const { data: firstNominee } = await supabase
    .from(t("nominees"))
    .select("id")
    .eq("name", oldNames[0])
    .single();

  const keepId = firstNominee?.id;

  await supabase
    .from(t("nominations"))
    .update({ nominee_name: newName })
    .in("nominee_name", oldNames);

  await supabase.from(t("nominees")).delete().in("name", oldNames);

  if (keepId) {
    await supabase.from(t("nominees")).insert({ id: keepId, name: newName });
  } else {
    await supabase.from(t("nominees")).insert({ name: newName });
  }
}

export async function dbGetNomineeByUUID(uuid: string): Promise<{
  name: string;
  nominations: { category: string; reason: string; nominatorName: string }[];
} | null> {
  const supabase = createServerSupabaseClient();

  const { data: nominee } = await supabase
    .from(t("nominees"))
    .select("name")
    .eq("id", uuid)
    .single();

  if (!nominee) return null;

  const { data: noms } = await supabase
    .from(t("nominations"))
    .select("category, reason, nominator_name")
    .eq("nominee_name", nominee.name);

  if (!noms || noms.length === 0) return null;

  return {
    name: nominee.name,
    nominations: noms.map((n) => ({
      category: n.category,
      reason: n.reason ?? "",
      nominatorName: n.nominator_name,
    })),
  };
}
