export function parseTsvGrid(text: string): string[][] {
  const raw = text.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (!raw.trim()) return [];
  return raw
    .split("\n")
    .filter((line, i, arr) => line.length > 0 || i < arr.length - 1)
    .map((line) => (line.includes("\t") ? line.split("\t") : splitCsv(line)))
    .map((row) => row.map((c) => c.replace(/^["']|["']$/g, "").trim()))
    .filter((row) => row.some((c) => c !== ""));
}

function splitCsv(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') q = !q;
    else if ((ch === "," || ch === "\t") && !q) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

type IdentKey = "regno" | "classcode" | "classno" | "enname" | "chname";

const HEADER: Record<string, IdentKey | "skip"> = {
  regno: "regno",
  學號: "regno",
  註冊編號: "regno",
  classcode: "classcode",
  班別: "classcode",
  classno: "classno",
  班號: "classno",
  enname: "enname",
  英文姓名: "enname",
  英文名: "enname",
  englishname: "enname",
  chname: "chname",
  中文姓名: "chname",
  中文名: "chname",
  學生姓名: "chname",
  姓名: "chname",
  sex: "skip",
  性別: "skip",
  gender: "skip",
};

function normHeader(h: string) {
  return h.replace(/\s+/g, "").toLowerCase();
}

export type RosterRow = {
  regno?: string;
  classcode?: string;
  classno?: string;
  enname?: string;
  chname?: string;
};

export function parseRoster(text: string): RosterRow[] {
  const grid = parseTsvGrid(text);
  if (!grid.length) return [];

  const first = grid[0].map(normHeader);
  const mapped = first.map((h) => HEADER[h] ?? null);
  const hasHeader = mapped.filter((m) => m && m !== "skip").length >= 2;

  const keys: (IdentKey | null)[] = hasHeader
    ? mapped.map((m) => (m === "skip" ? null : m))
    : inferIdentityKeys(grid[0].length);

  const body = hasHeader ? grid.slice(1) : grid;
  const rows: RosterRow[] = [];
  for (const cols of body) {
    const row: RosterRow = {};
    keys.forEach((k, i) => {
      if (!k) return;
      const v = cols[i] ?? "";
      row[k] = v;
    });
    if (row.regno || row.chname || row.classno) rows.push(row);
  }
  return rows;
}

function inferIdentityKeys(n: number): (IdentKey | null)[] {
  if (n >= 6) return ["regno", "classcode", "classno", "enname", "chname"];
  if (n === 5) return ["regno", "classno", "enname", "chname"];
  if (n === 4) return ["classno", "enname", "chname"];
  if (n === 3) return ["classno", "chname"];
  if (n === 2) return ["classno", "chname"];
  return ["chname"];
}
