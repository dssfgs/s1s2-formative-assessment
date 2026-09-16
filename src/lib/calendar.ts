import { S1_CLASSES, S2_CLASSES, formOf, type ClassCode, type FormLevel } from "./classes";
import type { SubjectId } from "./subjects";
import { isoToShort, todayIso } from "./format";

export type StageId = 1 | 2 | 3 | 4;

export const STAGES: {
  id: StageId;
  name: string;
  period: string;
}[] = [
  { id: 1, name: "第一階段", period: "上學期測驗前" },
  { id: 2, name: "第二階段", period: "上學期測驗至上學期考試" },
  { id: 3, name: "第三階段", period: "上學期考試至下學期測驗" },
  { id: 4, name: "第四階段", period: "下學期測驗至下學期考試" },
];

export type FormalKind = "T1A1" | "T1A2" | "T2A1" | "T2A2";

export const FORMALS: {
  kind: FormalKind;
  name: string;
  short: string;
  stage: StageId;
  term: 1 | 2;
}[] = [
  { kind: "T1A1", name: "上學期測驗", short: "T1A1", stage: 1, term: 1 },
  { kind: "T1A2", name: "上學期考試", short: "T1A2", stage: 2, term: 1 },
  { kind: "T2A1", name: "下學期測驗", short: "T2A1", stage: 3, term: 2 },
  { kind: "T2A2", name: "下學期考試", short: "T2A2", stage: 4, term: 2 },
];

export const FORMAL_BY_KIND = Object.fromEntries(FORMALS.map((f) => [f.kind, f])) as Record<
  FormalKind,
  (typeof FORMALS)[number]
>;

export const FORMAL_BY_STAGE = Object.fromEntries(FORMALS.map((f) => [f.stage, f])) as Record<
  StageId,
  (typeof FORMALS)[number]
>;

export type AssessmentGroup = "language" | "noncore" | "formal";

export type AssessmentDef = {
  id: string;
  form: FormLevel;
  subject: SubjectId;
  stage: StageId;
  date: string;
  weekday: string;
  group: AssessmentGroup;
  formalKind?: FormalKind;
  /** 非核心：該日期只這幾班考此科。語文／測考不設（全級）。 */
  classes?: ClassCode[];
};

type DateSpec = { date: string; weekday: string; stage: StageId };

function langDates(
  form: FormLevel,
  subject: "chi" | "eng",
  specs: DateSpec[],
): AssessmentDef[] {
  return specs.map((s) => ({
    id: `f${form}-${subject}-${s.date}`,
    form,
    subject,
    stage: s.stage,
    date: s.date,
    weekday: s.weekday,
    group: "language" as const,
  }));
}

/** 2026-2027 語文科評估日期（A.11 中一／A.12 中二時間表） */
const S1_CHI: DateSpec[] = [
  { date: "2026-09-14", weekday: "一", stage: 1 },
  { date: "2026-09-21", weekday: "一", stage: 1 },
  { date: "2026-09-28", weekday: "一", stage: 1 },
  { date: "2026-10-05", weekday: "一", stage: 1 },
  { date: "2026-11-16", weekday: "一", stage: 2 },
  { date: "2026-11-23", weekday: "一", stage: 2 },
  { date: "2026-12-07", weekday: "一", stage: 2 },
  { date: "2026-12-14", weekday: "一", stage: 2 },
  { date: "2027-02-01", weekday: "一", stage: 3 },
  { date: "2027-02-22", weekday: "一", stage: 3 },
  { date: "2027-03-01", weekday: "一", stage: 3 },
  { date: "2027-04-19", weekday: "一", stage: 4 },
  { date: "2027-04-26", weekday: "一", stage: 4 },
  { date: "2027-05-03", weekday: "一", stage: 4 },
  { date: "2027-05-10", weekday: "一", stage: 4 },
  { date: "2027-05-17", weekday: "一", stage: 4 },
];

const S1_ENG: DateSpec[] = [
  { date: "2026-09-16", weekday: "三", stage: 1 },
  { date: "2026-09-23", weekday: "三", stage: 1 },
  { date: "2026-09-30", weekday: "三", stage: 1 },
  { date: "2026-10-07", weekday: "三", stage: 1 },
  { date: "2026-11-18", weekday: "三", stage: 2 },
  { date: "2026-11-25", weekday: "三", stage: 2 },
  { date: "2026-12-02", weekday: "三", stage: 2 },
  { date: "2026-12-09", weekday: "三", stage: 2 },
  { date: "2027-02-17", weekday: "三", stage: 3 },
  { date: "2027-02-24", weekday: "三", stage: 3 },
  { date: "2027-03-03", weekday: "三", stage: 3 },
  { date: "2027-04-21", weekday: "三", stage: 4 },
  { date: "2027-05-05", weekday: "三", stage: 4 },
  { date: "2027-05-12", weekday: "三", stage: 4 },
  { date: "2027-05-19", weekday: "三", stage: 4 },
];

const S2_CHI: DateSpec[] = [
  { date: "2026-09-16", weekday: "三", stage: 1 },
  { date: "2026-09-23", weekday: "三", stage: 1 },
  { date: "2026-09-30", weekday: "三", stage: 1 },
  { date: "2026-10-07", weekday: "三", stage: 1 },
  { date: "2026-11-18", weekday: "三", stage: 2 },
  { date: "2026-11-25", weekday: "三", stage: 2 },
  { date: "2026-12-02", weekday: "三", stage: 2 },
  { date: "2026-12-09", weekday: "三", stage: 2 },
  { date: "2027-02-17", weekday: "三", stage: 3 },
  { date: "2027-02-24", weekday: "三", stage: 3 },
  { date: "2027-03-03", weekday: "三", stage: 3 },
  { date: "2027-04-21", weekday: "三", stage: 4 },
  { date: "2027-05-05", weekday: "三", stage: 4 },
  { date: "2027-05-12", weekday: "三", stage: 4 },
  { date: "2027-05-19", weekday: "三", stage: 4 },
];

const S2_ENG: DateSpec[] = [
  { date: "2026-09-14", weekday: "一", stage: 1 },
  { date: "2026-09-21", weekday: "一", stage: 1 },
  { date: "2026-09-28", weekday: "一", stage: 1 },
  { date: "2026-10-05", weekday: "一", stage: 1 },
  { date: "2026-11-16", weekday: "一", stage: 2 },
  { date: "2026-11-23", weekday: "一", stage: 2 },
  { date: "2026-12-07", weekday: "一", stage: 2 },
  { date: "2026-12-14", weekday: "一", stage: 2 },
  { date: "2027-02-01", weekday: "一", stage: 3 },
  { date: "2027-02-22", weekday: "一", stage: 3 },
  { date: "2027-03-01", weekday: "一", stage: 3 },
  { date: "2027-04-19", weekday: "一", stage: 4 },
  { date: "2027-04-26", weekday: "一", stage: 4 },
  { date: "2027-05-03", weekday: "一", stage: 4 },
  { date: "2027-05-10", weekday: "一", stage: 4 },
  { date: "2027-05-17", weekday: "一", stage: 4 },
];

/** A／B／C／D 四班當日科目（A.11／A.12）。同一日各班科目可以不同。 */
export type NoncoreSlot = {
  date: string;
  weekday: string;
  stage: StageId;
  subjects: [SubjectId, SubjectId, SubjectId, SubjectId];
};

/** 中一非核心（A.11） */
export const S1_NONCORE: NoncoreSlot[] = [
  { date: "2026-10-12", weekday: "一", stage: 1, subjects: ["budd", "budd", "budd", "budd"] },
  { date: "2026-10-14", weekday: "三", stage: 1, subjects: ["chist", "ces", "ces", "geo"] },
  { date: "2026-10-21", weekday: "三", stage: 1, subjects: ["hist", "hist", "hist", "hist"] },
  { date: "2026-10-22", weekday: "四", stage: 1, subjects: ["ces", "geo", "chist", "ces"] },
  { date: "2026-10-23", weekday: "五", stage: 1, subjects: ["sci", "sci", "sci", "chist"] },
  { date: "2026-10-26", weekday: "一", stage: 1, subjects: ["geo", "chist", "geo", "sci"] },
  { date: "2026-12-16", weekday: "三", stage: 2, subjects: ["sci", "ces", "sci", "sci"] },
  { date: "2027-01-04", weekday: "一", stage: 2, subjects: ["budd", "budd", "budd", "budd"] },
  { date: "2027-01-05", weekday: "二", stage: 2, subjects: ["hist", "hist", "hist", "hist"] },
  { date: "2027-01-07", weekday: "四", stage: 2, subjects: ["ces", "geo", "chist", "ces"] },
  { date: "2027-01-08", weekday: "五", stage: 2, subjects: ["geo", "chist", "ces", "chist"] },
  { date: "2027-01-11", weekday: "一", stage: 2, subjects: ["chist", "sci", "geo", "geo"] },
  { date: "2027-03-10", weekday: "三", stage: 3, subjects: ["sci", "ces", "sci", "sci"] },
  { date: "2027-03-12", weekday: "五", stage: 3, subjects: ["geo", "sci", "geo", "chist"] },
  { date: "2027-03-15", weekday: "一", stage: 3, subjects: ["budd", "budd", "budd", "budd"] },
  { date: "2027-03-16", weekday: "二", stage: 3, subjects: ["hist", "hist", "hist", "hist"] },
  { date: "2027-03-17", weekday: "三", stage: 3, subjects: ["chist", "chist", "ces", "geo"] },
  { date: "2027-03-18", weekday: "四", stage: 3, subjects: ["ces", "geo", "chist", "ces"] },
  { date: "2027-05-24", weekday: "一", stage: 4, subjects: ["geo", "sci", "geo", "sci"] },
  { date: "2027-05-26", weekday: "三", stage: 4, subjects: ["hist", "hist", "hist", "hist"] },
  { date: "2027-05-31", weekday: "一", stage: 4, subjects: ["budd", "budd", "budd", "budd"] },
  { date: "2027-06-01", weekday: "二", stage: 4, subjects: ["sci", "ces", "sci", "chist"] },
  { date: "2027-06-02", weekday: "三", stage: 4, subjects: ["chist", "chist", "ces", "geo"] },
  { date: "2027-06-03", weekday: "四", stage: 4, subjects: ["ces", "geo", "chist", "ces"] },
];

/** 中二非核心（A.12） */
export const S2_NONCORE: NoncoreSlot[] = [
  { date: "2026-10-12", weekday: "一", stage: 1, subjects: ["sci", "chist", "geo", "chist"] },
  { date: "2026-10-14", weekday: "三", stage: 1, subjects: ["chist", "sci", "sci", "geo"] },
  { date: "2026-10-21", weekday: "三", stage: 1, subjects: ["geo", "ces", "chist", "ces"] },
  { date: "2026-10-22", weekday: "四", stage: 1, subjects: ["budd", "budd", "ces", "budd"] },
  { date: "2026-10-23", weekday: "五", stage: 1, subjects: ["hist", "hist", "hist", "hist"] },
  { date: "2026-10-26", weekday: "一", stage: 1, subjects: ["ces", "geo", "budd", "sci"] },
  { date: "2026-12-16", weekday: "三", stage: 2, subjects: ["hist", "hist", "hist", "hist"] },
  { date: "2027-01-04", weekday: "一", stage: 2, subjects: ["sci", "chist", "geo", "chist"] },
  { date: "2027-01-05", weekday: "二", stage: 2, subjects: ["geo", "ces", "chist", "ces"] },
  { date: "2027-01-07", weekday: "四", stage: 2, subjects: ["budd", "budd", "ces", "budd"] },
  { date: "2027-01-08", weekday: "五", stage: 2, subjects: ["ces", "sci", "sci", "geo"] },
  { date: "2027-01-11", weekday: "一", stage: 2, subjects: ["chist", "geo", "budd", "sci"] },
  { date: "2027-03-10", weekday: "三", stage: 3, subjects: ["hist", "hist", "hist", "hist"] },
  { date: "2027-03-12", weekday: "五", stage: 3, subjects: ["chist", "budd", "budd", "budd"] },
  { date: "2027-03-15", weekday: "一", stage: 3, subjects: ["geo", "chist", "geo", "chist"] },
  { date: "2027-03-16", weekday: "二", stage: 3, subjects: ["sci", "geo", "chist", "ces"] },
  { date: "2027-03-17", weekday: "三", stage: 3, subjects: ["ces", "ces", "sci", "geo"] },
  { date: "2027-03-18", weekday: "四", stage: 3, subjects: ["budd", "sci", "ces", "sci"] },
  { date: "2027-05-24", weekday: "一", stage: 4, subjects: ["budd", "chist", "budd", "sci"] },
  { date: "2027-05-26", weekday: "三", stage: 4, subjects: ["geo", "sci", "chist", "ces"] },
  { date: "2027-05-31", weekday: "一", stage: 4, subjects: ["sci", "ces", "geo", "chist"] },
  { date: "2027-06-01", weekday: "二", stage: 4, subjects: ["hist", "hist", "hist", "hist"] },
  { date: "2027-06-02", weekday: "三", stage: 4, subjects: ["ces", "budd", "sci", "geo"] },
  { date: "2027-06-03", weekday: "四", stage: 4, subjects: ["chist", "geo", "ces", "budd"] },
];

/** 非核心日期（兩級同日；科目按班，見 S1_NONCORE／S2_NONCORE） */
export const NONCORE_DATES: { date: string; weekday: string; stage: StageId }[] = S1_NONCORE.map(
  ({ date, weekday, stage }) => ({ date, weekday, stage }),
);

export const DEFAULT_NONCORE_ORDER: SubjectId[] = [
  "geo",
  "ces",
  "chist",
  "hist",
  "budd",
  "sci",
];

export const SCHOOL_YEAR = "2026-2027";
export const SCHOOL_NAME = "香海正覺蓮社佛教梁植偉中學";

export function languageAssessments(): AssessmentDef[] {
  return [
    ...langDates(1, "chi", S1_CHI),
    ...langDates(1, "eng", S1_ENG),
    ...langDates(2, "chi", S2_CHI),
    ...langDates(2, "eng", S2_ENG),
  ];
}

export function noncoreSlots(form: FormLevel): NoncoreSlot[] {
  return form === 1 ? S1_NONCORE : S2_NONCORE;
}

function classesOfForm(form: FormLevel): readonly ClassCode[] {
  return form === 1 ? S1_CLASSES : S2_CLASSES;
}

export function noncoreAssessments(): AssessmentDef[] {
  const out: AssessmentDef[] = [];
  const seen = new Map<string, AssessmentDef>();
  for (const form of [1, 2] as FormLevel[]) {
    const slots = noncoreSlots(form);
    const classList = classesOfForm(form);
    for (const slot of slots) {
      for (let i = 0; i < 4; i++) {
        const subject = slot.subjects[i]!;
        const code = classList[i]!;
        const id = `f${form}-${subject}-${slot.date}`;
        const existing = seen.get(id);
        if (existing) {
          existing.classes!.push(code);
          continue;
        }
        const a: AssessmentDef = {
          id,
          form,
          subject,
          stage: slot.stage,
          date: slot.date,
          weekday: slot.weekday,
          group: "noncore",
          classes: [code],
        };
        seen.set(id, a);
        out.push(a);
      }
    }
  }
  return out;
}

export function formalId(form: FormLevel, subject: SubjectId, kind: FormalKind) {
  return `f${form}-${subject}-${kind}`;
}

/** 非核心科目的測驗／考試欄（T1A1 對第一階段，T1A2 對第二階段，以此類推）。 */
export function formalAssessments(): AssessmentDef[] {
  const out: AssessmentDef[] = [];
  for (const form of [1, 2] as FormLevel[]) {
    for (const subject of DEFAULT_NONCORE_ORDER) {
      for (const f of FORMALS) {
        out.push({
          id: formalId(form, subject, f.kind),
          form,
          subject,
          stage: f.stage,
          date: `formal-${f.kind}`,
          weekday: "",
          group: "formal",
          formalKind: f.kind,
        });
      }
    }
  }
  return out;
}

export function allAssessments(): AssessmentDef[] {
  return [...languageAssessments(), ...noncoreAssessments(), ...formalAssessments()];
}

export function paperAppliesTo(a: AssessmentDef, code: ClassCode) {
  if (formOf(code) !== a.form) return false;
  if (!a.classes || a.classes.length === 0) return true;
  return a.classes.includes(code);
}

export function assessmentsFor(
  list: AssessmentDef[],
  opts: {
    form?: FormLevel;
    subject?: SubjectId;
    stage?: StageId;
    group?: AssessmentGroup;
    classCode?: ClassCode;
  },
) {
  return list.filter((a) => {
    if (opts.form && a.form !== opts.form) return false;
    if (opts.subject && a.subject !== opts.subject) return false;
    if (opts.stage && a.stage !== opts.stage) return false;
    if (opts.group && a.group !== opts.group) return false;
    if (opts.classCode && !paperAppliesTo(a, opts.classCode)) return false;
    return true;
  });
}

export function sortPapers(list: AssessmentDef[]) {
  return [...list].sort((a, b) => {
    if (a.stage !== b.stage) return a.stage - b.stage;
    const rank = (g: AssessmentGroup) => (g === "formal" ? 2 : g === "noncore" ? 1 : 0);
    if (rank(a.group) !== rank(b.group)) return rank(a.group) - rank(b.group);
    return a.date.localeCompare(b.date) || a.id.localeCompare(b.id);
  });
}

export function upcomingAssessments(list: AssessmentDef[], from = todayIso(), n = 6) {
  return list
    .filter((a) => a.group !== "formal" && a.date >= from)
    .sort((a, b) => a.date.localeCompare(b.date) || a.form - b.form || a.subject.localeCompare(b.subject))
    .slice(0, n);
}

export function stageOfDate(iso: string): StageId | null {
  const all = languageAssessments();
  const hit = all.find((a) => a.date === iso);
  if (hit) return hit.stage;
  const nc = NONCORE_DATES.find((d) => d.date === iso);
  return nc?.stage ?? null;
}

export function weekdayLabel(w: string) {
  return `星期${w}`;
}

export function paperLabel(a: AssessmentDef) {
  if (a.group === "formal") {
    const f = a.formalKind ? FORMAL_BY_KIND[a.formalKind] : undefined;
    return f ? `${f.short} ${f.name}` : a.id;
  }
  return a.date;
}

/** 成績表表頭：語文／課後評估用日期，測考用 T1A1 等。 */
export function paperHeading(a: AssessmentDef) {
  if (a.group === "formal") {
    const f = a.formalKind ? FORMAL_BY_KIND[a.formalKind] : undefined;
    return f?.short ?? a.id;
  }
  return isoToShort(a.date);
}

export function paperSubheading(a: AssessmentDef) {
  if (a.group === "formal") {
    const f = a.formalKind ? FORMAL_BY_KIND[a.formalKind] : undefined;
    return f?.name ?? "";
  }
  return a.weekday ? weekdayLabel(a.weekday) : "";
}

/** 即將舉行／日程：全級考則不列班；分班考則列出班別。 */
export function paperClassHint(a: AssessmentDef) {
  if (!a.classes || a.classes.length === 0) return "";
  const all = classesOfForm(a.form);
  if (a.classes.length === all.length) return "";
  return a.classes.join(" ");
}
