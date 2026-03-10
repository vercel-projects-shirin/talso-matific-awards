export interface Nomination {
  timestamp: string;
  email: string;
  nominatorName: string;
  nomineeName: string;
  category: string;
  reason: string;
}

export interface NomineeStats {
  name: string;
  count: number;
  id: string;
}

export interface CategoryLeaderboard {
  category: string;
  nominees: NomineeStats[];
}

const STORAGE_KEY = "matific-awards-nominations";
const UUID_MAP_KEY = "matific-awards-nominee-uuids";

function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  fields.push(current.trim());
  return fields;
}

export function loadNomineeUUIDMap(): Record<string, string> {
  const raw = localStorage.getItem(UUID_MAP_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

export function saveNomineeUUIDMap(map: Record<string, string>) {
  localStorage.setItem(UUID_MAP_KEY, JSON.stringify(map));
}

export function getOrCreateNomineeUUID(name: string): string {
  const map = loadNomineeUUIDMap();
  if (map[name]) return map[name];
  const id = crypto.randomUUID();
  map[name] = id;
  saveNomineeUUIDMap(map);
  return id;
}

export function getNomineeNameByUUID(uuid: string): string | null {
  const map = loadNomineeUUIDMap();
  for (const [name, id] of Object.entries(map)) {
    if (id === uuid) return name;
  }
  return null;
}

export function parseCSV(content: string): Nomination[] {
  const lines = content.split("\n").filter((line) => line.trim());
  return lines.slice(1).map((line) => {
    const fields = parseCSVLine(line);
    return {
      timestamp: fields[0] ?? "",
      email: fields[1] ?? "",
      nominatorName: fields[2] ?? "",
      nomineeName: fields[3] ?? "",
      category: fields[4] ?? "",
      reason: fields[5] ?? "",
    };
  });
}

export function saveNominations(nominations: Nomination[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(nominations));
}

export function loadNominations(): Nomination[] | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Nomination[];
  } catch {
    return null;
  }
}

export function clearNominations() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(UUID_MAP_KEY);
}

export function getGeneralLeaderboard(
  nominations: Nomination[]
): NomineeStats[] {
  const counts = new Map<string, number>();
  for (const n of nominations) {
    counts.set(n.nomineeName, (counts.get(n.nomineeName) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([name, count]) => ({ name, count, id: getOrCreateNomineeUUID(name) }))
    .sort((a, b) => b.count - a.count);
}

export function getCategoryLeaderboards(
  nominations: Nomination[]
): CategoryLeaderboard[] {
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
      .map(([name, count]) => ({ name, count, id: getOrCreateNomineeUUID(name) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3),
  }));
}

export function mergeNominees(
  nominations: Nomination[],
  oldNames: string[],
  newName: string
): Nomination[] {
  const nameSet = new Set(oldNames);
  const updated = nominations.map((n) =>
    nameSet.has(n.nomineeName) ? { ...n, nomineeName: newName } : n
  );

  const uuidMap = loadNomineeUUIDMap();
  const keepUUID = uuidMap[oldNames[0]] ?? crypto.randomUUID();
  for (const name of oldNames) {
    delete uuidMap[name];
  }
  uuidMap[newName] = keepUUID;
  saveNomineeUUIDMap(uuidMap);

  saveNominations(updated);
  return updated;
}

export function getNomineeByUUID(nominations: Nomination[], uuid: string) {
  const name = getNomineeNameByUUID(uuid);
  if (!name) return null;
  const matched = nominations.filter((n) => n.nomineeName === name);
  if (matched.length === 0) return null;
  return {
    name: matched[0].nomineeName,
    nominations: matched.map((n) => ({
      category: n.category,
      reason: n.reason,
      nominatorName: n.nominatorName,
    })),
  };
}
