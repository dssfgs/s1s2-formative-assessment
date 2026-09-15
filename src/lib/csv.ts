import type { AssessmentDef, FormalKind } from "./calendar";
import { paperHeading } from "./calendar";
import { ALL_CLASSES, isClassCode, type ClassCode } from "./classes";
import type { Student } from "./progress";
import { subjectShort } from "./subjects";

function splitLine(line: string) {
  if (line.includes("\t")) return line.split("\t").map((s) => s.trim());
  const out: string[] = [];
  let cur = "";
  let q = false;
  for (const ch of line) {
    if (ch === '"') q = !q;
    else if (ch === "," && !q) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

export type ImportRow = {
  classcode: ClassCode;
  classno: string;
  chname: string;
  regno: string;
  assessmentId?: string;
  subject?: string;
  date?: string;
  raw?: string;
  retake?: string;
};

export function parseScoreCsv(text: string, assessments: AssessmentDef[]): ImportRow[] {
  const raw = text.replace(/^\uFEFF/, "").trim();
  if (!raw) return [];
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  const header = splitLine(lines[0] ?? "").map((h) => h.replace(/\s+/g, ""));
  const find = (...names: string[]) =>
    header.findIndex((h) => names.some((n) => h.toLowerCase().includes(n.toLowerCase())));

  const iClass = find("班別", "classcode", "class");
  const iNo = find("班號", "classno");
  const iName = find("姓名", "chname", "學生");
  const iReg = find("學號", "regno", "reg");
  const iSub = find("科目", "學科", "subject");
  const iDate = find("日期", "date", "測考", "T1A", "T2A");
  const iRaw = find("分數", "得分", "raw", "成績");
  const iRetake = find("重測", "retake");
  const looksHeader = iClass >= 0 && iNo >= 0;
  const start = looksHeader ? 1 : 0;

  const rows: ImportRow[] = [];
  for (const line of lines.slice(start)) {
    const cols = splitLine(line);
    const classcode = (cols[looksHeader ? iClass : 0] ?? "").trim().toUpperCase();
    const classno = (cols[looksHeader ? iNo : 1] ?? "").trim();
    if (!isClassCode(classcode) || !classno) continue;
    const chname = cols[looksHeader && iName >= 0 ? iName : 2] ?? "";
    const regno = looksHeader && iReg >= 0 ? (cols[iReg] ?? "") : "";
    const subject = looksHeader && iSub >= 0 ? cols[iSub] : undefined;
    const date = looksHeader && iDate >= 0 ? cols[iDate] : undefined;
    const score = looksHeader && iRaw >= 0 ? cols[iRaw] : cols[4];
    const retake = looksHeader && iRetake >= 0 ? cols[iRetake] : "";

    let assessmentId: string | undefined;
    if (date) {
      const form = classcode.startsWith("2") ? 2 : 1;
      const kindHit = date.toUpperCase().match(/T[12]A[12]/);
      if (kindHit) {
        const kind = kindHit[0] as FormalKind;
        const hit = assessments.find(
          (a) =>
            a.form === form &&
            a.group === "formal" &&
            a.formalKind === kind &&
            (!subject ||
              a.subject === subject ||
              subject.includes(subjectShort(a.subject))),
        );
        assessmentId = hit?.id;
      } else {
        const norm = normalizeDate(date);
        const hit = assessments.find(
          (a) =>
            a.form === form &&
            a.date === norm &&
            (!subject ||
              a.subject === subject ||
              subject.includes(subjectShort(a.subject))),
        );
        assessmentId = hit?.id;
      }
    }

    rows.push({
      classcode,
      classno,
      chname,
      regno,
      assessmentId,
      subject,
      date,
      raw: score,
      retake,
    });
  }
  return rows;
}

function normalizeDate(s: string) {
  const t = s.trim();
  const iso = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (iso) {
    return `${iso[1]}-${iso[2]!.padStart(2, "0")}-${iso[3]!.padStart(2, "0")}`;
  }
  const dmy = t.match(/^(\d{1,2})[\/.\-](\d{1,2})(?:[\/.\-](\d{2,4}))?$/);
  if (dmy) {
    const year = dmy[3]
      ? dmy[3].length === 2
        ? Number(dmy[3]) > 50
          ? `19${dmy[3]}`
          : `20${dmy[3]}`
        : dmy[3]
      : Number(dmy[2]) >= 9
        ? "2026"
        : "2027";
    return `${year}-${dmy[2]!.padStart(2, "0")}-${dmy[1]!.padStart(2, "0")}`;
  }
  return t;
}

export function exportClassCsv(
  students: Student[],
  assessments: AssessmentDef[],
  _maxOf: (id: string) => number,
) {
  const papers = assessments;
  const head = [
    "班別",
    "班號",
    "學號",
    "姓名",
    ...papers.flatMap((a) => {
      const label = `${subjectShort(a.subject)} ${paperHeading(a)}`;
      if (a.group === "formal") return [label];
      return [label, `${label}重測`];
    }),
  ];
  const lines = [head.join(",")];
  for (const s of students) {
    if (!s.chname && !s.classno) continue;
    const cells = [s.classcode, s.classno, s.regno, csvCell(s.chname)];
    for (const a of papers) {
      const e = s.scores[a.id];
      cells.push(e?.raw ?? "");
      if (a.group !== "formal") cells.push(e?.retake ?? "");
    }
    lines.push(cells.join(","));
  }
  return "\uFEFF" + lines.join("\n");
}

function csvCell(s: string) {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function downloadText(filename: string, text: string, mime = "text/csv;charset=utf-8") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function rosterBackup(roster: Record<ClassCode, Student[]>) {
  return JSON.stringify({ version: 1, year: "2026-2027", roster }, null, 2);
}

export function parseRosterBackup(text: string): Record<ClassCode, Student[]> | null {
  try {
    const data = JSON.parse(text) as { roster?: Record<string, Student[]> };
    if (!data.roster) return null;
    const out = {} as Record<ClassCode, Student[]>;
    for (const code of ALL_CLASSES) {
      out[code] = data.roster[code] ?? [];
    }
    return out;
  } catch {
    return null;
  }
}
