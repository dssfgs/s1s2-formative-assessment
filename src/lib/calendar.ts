import type { FormLevel } from "./classes";
import type { SubjectId } from "./subjects";
import { todayIso } from "./format";

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

export type AssessmentDef = {
  id: string;
  form: FormLevel;
  subject: SubjectId;
  stage: StageId;
  date: string;
  weekday: string;
  group: "language" | "noncore";
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

/** 2026-2027 語文科評估日期（指引 3.1） */
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
  { date: "2027-02-01", weekday: "一", stage: 3 },
  { date: "2027-02-22", weekday: "一", stage: 3 },
  { date: "2027-03-01", weekday: "一", stage: 3 },
  { date: "2027-04-19", weekday: "一", stage: 4 },
  { date: "2027-04-26", weekday: "一", stage: 4 },
  { date: "2027-05-03", weekday: "一", stage: 4 },
  { date: "2027-05-10", weekday: "一", stage: 4 },
  { date: "2027-05-17", weekday: "一", stage: 4 },
];

/** 非核心科目評估日期（每階段每科一次，指引 3.2） */
export const NONCORE_DATES: { date: string; weekday: string; stage: StageId }[] = [
  { date: "2026-10-12", weekday: "一", stage: 1 },
  { date: "2026-10-14", weekday: "三", stage: 1 },
  { date: "2026-10-21", weekday: "三", stage: 1 },
  { date: "2026-10-22", weekday: "四", stage: 1 },
  { date: "2026-10-23", weekday: "五", stage: 1 },
  { date: "2026-10-26", weekday: "一", stage: 1 },
  { date: "2026-12-16", weekday: "三", stage: 2 },
  { date: "2027-01-04", weekday: "一", stage: 2 },
  { date: "2027-01-05", weekday: "二", stage: 2 },
  { date: "2027-01-07", weekday: "四", stage: 2 },
  { date: "2027-01-08", weekday: "五", stage: 2 },
  { date: "2027-01-11", weekday: "一", stage: 2 },
  { date: "2027-03-10", weekday: "三", stage: 3 },
  { date: "2027-03-12", weekday: "五", stage: 3 },
  { date: "2027-03-15", weekday: "一", stage: 3 },
  { date: "2027-03-16", weekday: "二", stage: 3 },
  { date: "2027-03-17", weekday: "三", stage: 3 },
  { date: "2027-03-18", weekday: "四", stage: 3 },
  { date: "2027-05-24", weekday: "一", stage: 4 },
  { date: "2027-05-26", weekday: "三", stage: 4 },
  { date: "2027-05-31", weekday: "一", stage: 4 },
  { date: "2027-06-01", weekday: "二", stage: 4 },
  { date: "2027-06-02", weekday: "三", stage: 4 },
  { date: "2027-06-03", weekday: "四", stage: 4 },
];

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

export function noncoreAssessments(
  orderByStage: Record<StageId, SubjectId[]> = {
    1: DEFAULT_NONCORE_ORDER,
    2: DEFAULT_NONCORE_ORDER,
    3: DEFAULT_NONCORE_ORDER,
    4: DEFAULT_NONCORE_ORDER,
  },
): AssessmentDef[] {
  const out: AssessmentDef[] = [];
  const byStage: Record<StageId, typeof NONCORE_DATES> = { 1: [], 2: [], 3: [], 4: [] };
  for (const d of NONCORE_DATES) byStage[d.stage].push(d);

  for (const form of [1, 2] as FormLevel[]) {
    for (const stage of [1, 2, 3, 4] as StageId[]) {
      const dates = byStage[stage];
      const order = orderByStage[stage] ?? DEFAULT_NONCORE_ORDER;
      dates.forEach((d, i) => {
        const subject = order[i] ?? DEFAULT_NONCORE_ORDER[i]!;
        out.push({
          id: `f${form}-${subject}-${d.date}`,
          form,
          subject,
          stage,
          date: d.date,
          weekday: d.weekday,
          group: "noncore",
        });
      });
    }
  }
  return out;
}

export function allAssessments(
  orderByStage?: Record<StageId, SubjectId[]>,
): AssessmentDef[] {
  return [...languageAssessments(), ...noncoreAssessments(orderByStage)];
}

export function assessmentsFor(
  list: AssessmentDef[],
  opts: {
    form?: FormLevel;
    subject?: SubjectId;
    stage?: StageId;
    group?: "language" | "noncore";
  },
) {
  return list.filter((a) => {
    if (opts.form && a.form !== opts.form) return false;
    if (opts.subject && a.subject !== opts.subject) return false;
    if (opts.stage && a.stage !== opts.stage) return false;
    if (opts.group && a.group !== opts.group) return false;
    return true;
  });
}

export function upcomingAssessments(list: AssessmentDef[], from = todayIso(), n = 6) {
  return list
    .filter((a) => a.date >= from)
    .sort((a, b) => a.date.localeCompare(b.date) || a.form - b.form)
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
