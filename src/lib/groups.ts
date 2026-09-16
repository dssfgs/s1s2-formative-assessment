import { ALL_CLASSES, formOf, type ClassCode, type FormLevel } from "./classes";
import type { Student } from "./progress";
import { OFFICIAL_ROSTER } from "./roster-2627";

export type StreamId = "chi" | "eng";

export const STREAM_GROUPS: Record<StreamId, Record<FormLevel, readonly string[]>> = {
  chi: {
    1: ["1A", "1B", "1C", "1D", "1ABCD1", "1ABCD2"],
    2: ["2A", "2B", "2CD1", "2CD2", "2CD3"],
  },
  eng: {
    1: ["1A", "1B", "1C", "1D", "1ABCD1", "1ABCD2"],
    2: ["2A", "2B", "2C", "2D", "2BCD"],
  },
};

const GROUP_LABEL: Record<string, string> = {
  "1ABCD1": "中一 ABCD① 抽離",
  "1ABCD2": "中一 ABCD② 抽離",
  "2CD1": "中二 CD①",
  "2CD2": "中二 CD②",
  "2CD3": "中二 CD③",
  "2BCD": "中二 BCD 抽離",
};

const GROUP_SHORT: Record<string, string> = {
  "1ABCD1": "ABCD①",
  "1ABCD2": "ABCD②",
  "2CD1": "CD①",
  "2CD2": "CD②",
  "2CD3": "CD③",
  "2BCD": "BCD",
};

export function isStreamId(v: string): v is StreamId {
  return v === "chi" || v === "eng";
}

export function isGroupId(subject: StreamId, id: string): boolean {
  return STREAM_GROUPS[subject][1].includes(id) || STREAM_GROUPS[subject][2].includes(id);
}

export function formOfGroup(id: string): FormLevel {
  return id.startsWith("2") ? 2 : 1;
}

export function groupLabel(id: string): string {
  if (GROUP_LABEL[id]) return GROUP_LABEL[id]!;
  if (/^[12][A-D]$/.test(id)) return `${id.startsWith("1") ? "中一" : "中二"}${id.slice(1)} 原班`;
  return id;
}

export function groupShort(id: string): string {
  return GROUP_SHORT[id] ?? id;
}

export function isPullout(id: string): boolean {
  return id.length > 2;
}

export function groupField(s: Pick<Student, "chiGroup" | "engGroup">, subject: StreamId): string {
  return (subject === "chi" ? s.chiGroup : s.engGroup) ?? "";
}

export function studentsInGroup(
  roster: Record<ClassCode, Student[]>,
  subject: StreamId,
  groupId: string,
): Student[] {
  const form = formOfGroup(groupId);
  return ALL_CLASSES.filter((c) => formOf(c) === form)
    .flatMap((c) => roster[c] ?? [])
    .filter((s) => groupField(s, subject) === groupId)
    .sort((a, b) => {
      if (a.classcode !== b.classcode) return a.classcode.localeCompare(b.classcode);
      return a.classno.padStart(2, "0").localeCompare(b.classno.padStart(2, "0"));
    });
}

export function officialCount(subject: StreamId, groupId: string): number {
  return OFFICIAL_ROSTER.filter((r) => (subject === "chi" ? r.chiGroup : r.engGroup) === groupId)
    .length;
}

export function classesInGroup(subject: StreamId, groupId: string): ClassCode[] {
  const set = new Set<ClassCode>();
  for (const r of OFFICIAL_ROSTER) {
    if ((subject === "chi" ? r.chiGroup : r.engGroup) === groupId) set.add(r.classcode);
  }
  return [...set];
}

export function groupsInClass(code: ClassCode, subject: StreamId): { id: string; n: number }[] {
  const counts = new Map<string, number>();
  for (const r of OFFICIAL_ROSTER) {
    if (r.classcode !== code) continue;
    const id = subject === "chi" ? r.chiGroup : r.engGroup;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const form = formOf(code);
  const order = STREAM_GROUPS[subject][form];
  return order.filter((id) => counts.has(id)).map((id) => ({ id, n: counts.get(id)! }));
}

export function rosterHasGroups(roster: Record<ClassCode, Student[]>): boolean {
  return ALL_CLASSES.some((c) => (roster[c] ?? []).some((s) => s.chiGroup || s.engGroup));
}
