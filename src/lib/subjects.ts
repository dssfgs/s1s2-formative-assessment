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
  { id: "ces", name: "公民、經濟與社會", short: "公民", group: "noncore" },
  { id: "chist", name: "中國歷史", short: "中史", group: "noncore" },
  { id: "hist", name: "歷史", short: "歷史", group: "noncore" },
  { id: "budd", name: "佛化教育", short: "佛化", group: "noncore" },
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
