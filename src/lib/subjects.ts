export type SubjectId =
  | "chi"
  | "eng"
  | "geo"
  | "ces"
  | "chist"
  | "hist"
  | "budd"
  | "sci";

export type SubjectGroup = "language" | "noncore";

export type Subject = {
  id: SubjectId;
  name: string;
  short: string;
  group: SubjectGroup;
};

export const SUBJECTS: Subject[] = [
  { id: "chi", name: "中國語文", short: "中文", group: "language" },
  { id: "eng", name: "English Language", short: "英文", group: "language" },
  { id: "geo", name: "地理", short: "地理", group: "noncore" },
  { id: "ces", name: "公民、經濟與社會", short: "公經社", group: "noncore" },
  { id: "chist", name: "中國歷史", short: "中史", group: "noncore" },
  { id: "hist", name: "歷史", short: "歷史", group: "noncore" },
  { id: "budd", name: "佛化教育", short: "佛化教育", group: "noncore" },
  { id: "sci", name: "科學", short: "科學", group: "noncore" },
];

export const LANGUAGE_SUBJECTS = SUBJECTS.filter((s) => s.group === "language");
export const NONCORE_SUBJECTS = SUBJECTS.filter((s) => s.group === "noncore");

export const SUBJECT_BY_ID = Object.fromEntries(
  SUBJECTS.map((s) => [s.id, s]),
) as Record<SubjectId, Subject>;

export function subjectName(id: SubjectId) {
  return SUBJECT_BY_ID[id]?.name ?? id;
}

export function subjectShort(id: SubjectId) {
  return SUBJECT_BY_ID[id]?.short ?? id;
}

const ALIASES: Partial<Record<SubjectId, readonly string[]>> = {
  ces: ["公民", "公經社", "公民、經濟與社會", "公民經濟與社會"],
  budd: ["佛化", "佛化教育"],
};

/** CSV／貼上科目欄：新舊簡稱都認。 */
export function subjectLabelMatch(id: SubjectId, label: string) {
  const t = label.trim();
  if (!t) return false;
  if (t === id) return true;
  const s = SUBJECT_BY_ID[id];
  if (!s) return false;
  if (t === s.short || t === s.name || t.includes(s.short) || s.name.includes(t)) return true;
  return (ALIASES[id] ?? []).some((a) => t === a || t.includes(a));
}
