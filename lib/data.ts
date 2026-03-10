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

// ---------------------------------------------------------------------------
// CSV Parsing
// ---------------------------------------------------------------------------

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
