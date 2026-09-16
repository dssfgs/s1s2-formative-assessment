import { formOf, type ClassCode } from "./classes";
import {
  FORMAL_BY_STAGE,
  FORMALS,
  type AssessmentDef,
  type FormalKind,
  type StageId,
} from "./calendar";
import { parseNum, round2 } from "./format";
import type { SubjectId } from "./subjects";

export type ScoreEntry = {
  raw: string;
  retake: string;
};

export type Student = {
  id: string;
  classcode: ClassCode;
  classno: string;
  regno: string;
  chname: string;
  enname: string;
  sex?: string;
  chiGroup?: string;
  engGroup?: string;
  mathGroup?: string;
  scores: Record<string, ScoreEntry>;
};

export type ProgressMethod = "z" | "pct" | "rank";

export type QuizResult = {
  assessmentId: string;
  pct: number | null;
  passed: boolean | null;
  usedRetake: boolean;
  needsRetake: boolean;
  raw: number | null;
  retake: number | null;
  max: number;
};

export type StageResult = {
  stage: StageId;
  subject: SubjectId;
  pct: number | null;
  z: number | null;
  rank: number | null;
  n: number;
  quizzes: number;
  passedAll: boolean | null;
  anyRetake: boolean;
};

export type StudentProgress = {
  student: Student;
  stages: Record<string, StageResult>;
  /** 中文／英文：該科所有已作答連續小測百分率差的平均 */
  langProgress: Record<"chi" | "eng", number | null>;
  /** 中文／英文：該科該階段連續小測百分率差的平均 */
  langStageProgress: Record<string, number | null>;
  /** 非核心：測驗／考試% − 對應階段課後評估%。鍵為 subject-T1A1 等 */
  formalDelta: Record<string, number | null>;
  /** 顯示用：語文取 langProgress；非核心取該科最新已有的 formalDelta */
  subjectDelta: Record<SubjectId, number | null>;
  overall: number | null;
  contributing: number;
};

function mean(xs: number[]) {
  if (!xs.length) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function stdev(xs: number[]) {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  const v = xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(v);
}

export function isActive(s: Student) {
  return Boolean(s.regno.trim() || s.chname.trim() || s.classno.trim());
}

export function emptyStudent(classcode: ClassCode, index: number): Student {
  return {
    id: `${classcode}-${index + 1}`,
    classcode,
    classno: "",
    regno: "",
    chname: "",
    enname: "",
    scores: {},
  };
}

export function effectiveScore(entry: ScoreEntry | undefined): {
  value: number | null;
  usedRetake: boolean;
  raw: number | null;
  retake: number | null;
} {
  const raw = parseNum(entry?.raw);
  return { value: raw, usedRetake: false, raw, retake: null };
}

export function quizResult(
  student: Student,
  a: AssessmentDef,
  max: number,
  passPercent: number,
): QuizResult {
  const eff = effectiveScore(student.scores[a.id]);
  const pct =
    eff.value !== null && max > 0 ? round2((eff.value / max) * 100) : null;
  const passed = pct === null ? null : pct + 1e-9 >= passPercent;
  return {
    assessmentId: a.id,
    pct,
    passed,
    usedRetake: eff.usedRetake,
    needsRetake: a.group !== "formal" && passed === false && !eff.usedRetake,
    raw: eff.raw,
    retake: eff.retake,
    max,
  };
}

export function stagePct(
  student: Student,
  assessments: AssessmentDef[],
  maxOf: (id: string) => number,
  passPercent: number,
): { pct: number | null; quizzes: number; passedAll: boolean | null; anyRetake: boolean } {
  const results = assessments.map((a) => quizResult(student, a, maxOf(a.id), passPercent));
  const pcts = results.map((r) => r.pct).filter((n): n is number => n !== null);
  const judged = results.filter((r) => r.passed !== null);
  return {
    pct: pcts.length ? round2(mean(pcts)) : null,
    quizzes: pcts.length,
    passedAll: judged.length ? judged.every((r) => r.passed) : null,
    anyRetake: results.some((r) => r.usedRetake),
  };
}

/** 按日期排列的連續小測：平均（後一次% − 前一次%）。需至少兩次有分。 */
export function meanConsecutiveImprovement(pcts: (number | null)[]): number | null {
  const deltas: number[] = [];
  for (let i = 1; i < pcts.length; i++) {
    const prev = pcts[i - 1];
    const cur = pcts[i];
    if (prev !== null && cur !== null) deltas.push(cur - prev);
  }
  return deltas.length ? round2(mean(deltas)) : null;
}

function zOf(values: (number | null)[]): (number | null)[] {
  const present = values.filter((x): x is number => x !== null);
  if (present.length < 2) return values.map((x) => (x === null ? null : 0));
  const m = mean(present);
  const s = stdev(present);
  if (s < 1e-9) return values.map((x) => (x === null ? null : 0));
  return values.map((x) => (x === null ? null : round2((x - m) / s)));
}

function ranks(values: (number | null)[]): (number | null)[] {
  const indexed = values
    .map((v, i) => ({ v, i }))
    .filter((x): x is { v: number; i: number } => x.v !== null)
    .sort((a, b) => b.v - a.v);
  const out: (number | null)[] = values.map(() => null);
  let i = 0;
  while (i < indexed.length) {
    let j = i;
    while (j < indexed.length && indexed[j]!.v === indexed[i]!.v) j++;
    const rank = i + 1;
    for (let k = i; k < j; k++) out[indexed[k]!.i] = rank;
    i = j;
  }
  return out;
}

export type ClassCompute = {
  byStudent: Map<string, StudentProgress>;
  stageMeta: Record<string, { mean: number | null; sd: number | null; n: number }>;
};

function keyOf(subject: SubjectId, stage: StageId) {
  return `${subject}-${stage}`;
}

export function formalDeltaKey(subject: SubjectId, kind: FormalKind) {
  return `${subject}-${kind}`;
}

export function computeClass(
  students: Student[],
  assessments: AssessmentDef[],
  maxOf: (id: string) => number,
  passPercent: number,
  _method: ProgressMethod = "pct",
): ClassCompute {
  const active = students.filter(isActive);
  const quizzes = assessments.filter((a) => a.group !== "formal");
  const formals = assessments.filter((a) => a.group === "formal");
  const subjects = [...new Set(quizzes.map((a) => a.subject))];
  const stages = [...new Set(quizzes.map((a) => a.stage))].sort((a, b) => a - b);

  const stagePctMap: Record<string, (number | null)[]> = {};
  const stageQuiz: Record<string, { quizzes: number; passedAll: boolean | null; anyRetake: boolean }[]> =
    {};

  for (const sub of subjects) {
    for (const st of stages) {
      const papers = quizzes.filter((a) => a.subject === sub && a.stage === st);
      if (!papers.length) continue;
      const k = keyOf(sub, st);
      stagePctMap[k] = active.map(
        (s) => stagePct(s, papers, maxOf, passPercent).pct,
      );
      stageQuiz[k] = active.map((s) => {
        const r = stagePct(s, papers, maxOf, passPercent);
        return { quizzes: r.quizzes, passedAll: r.passedAll, anyRetake: r.anyRetake };
      });
    }
  }

  const zMap: Record<string, (number | null)[]> = {};
  const rankMap: Record<string, (number | null)[]> = {};
  const stageMeta: ClassCompute["stageMeta"] = {};

  for (const [k, vals] of Object.entries(stagePctMap)) {
    const present = vals.filter((x): x is number => x !== null);
    stageMeta[k] = {
      mean: present.length ? round2(mean(present)) : null,
      sd: present.length >= 2 ? round2(stdev(present)) : present.length ? 0 : null,
      n: present.length,
    };
    zMap[k] = zOf(vals);
    rankMap[k] = ranks(vals);
  }

  const byStudent = new Map<string, StudentProgress>();

  active.forEach((student, idx) => {
    const stagesOut: Record<string, StageResult> = {};
    const subjectDelta: Record<string, number | null> = {};
    const langProgress: Record<"chi" | "eng", number | null> = { chi: null, eng: null };
    const langStageProgress: Record<string, number | null> = {};
    const formalDelta: Record<string, number | null> = {};

    for (const sub of subjects) {
      for (const st of stages) {
        const k = keyOf(sub, st);
        if (!(k in stagePctMap)) continue;
        const pct = stagePctMap[k]![idx] ?? null;
        const z = zMap[k]?.[idx] ?? null;
        const rank = rankMap[k]?.[idx] ?? null;
        const q = stageQuiz[k]?.[idx];
        stagesOut[k] = {
          stage: st,
          subject: sub,
          pct,
          z,
          rank,
          n: stageMeta[k]?.n ?? 0,
          quizzes: q?.quizzes ?? 0,
          passedAll: q?.passedAll ?? null,
          anyRetake: q?.anyRetake ?? false,
        };
      }
    }

    for (const lang of ["chi", "eng"] as const) {
      const series = quizzes
        .filter((a) => a.subject === lang)
        .sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));
      if (!series.length) continue;
      const allPcts = series.map((a) => quizResult(student, a, maxOf(a.id), passPercent).pct);
      langProgress[lang] = meanConsecutiveImprovement(allPcts);
      subjectDelta[lang] = langProgress[lang];
      for (const st of stages) {
        const stageSeries = series.filter((a) => a.stage === st);
        const pcts = stageSeries.map((a) => quizResult(student, a, maxOf(a.id), passPercent).pct);
        langStageProgress[keyOf(lang, st)] = meanConsecutiveImprovement(pcts);
      }
    }

    for (const a of formals) {
      if (!a.formalKind) continue;
      const exam = quizResult(student, a, maxOf(a.id), passPercent).pct;
      const sk = keyOf(a.subject, a.stage);
      const stage = stagePctMap[sk]?.[idx] ?? null;
      let d: number | null = null;
      if (exam !== null && stage !== null) d = round2(exam - stage);
      formalDelta[formalDeltaKey(a.subject, a.formalKind)] = d;
      if (d !== null) subjectDelta[a.subject] = d;
    }

    if (!("chi" in subjectDelta)) subjectDelta.chi = langProgress.chi;
    if (!("eng" in subjectDelta)) subjectDelta.eng = langProgress.eng;

    const nums = Object.values(langProgress).filter((v): v is number => v !== null);
    byStudent.set(student.id, {
      student,
      stages: stagesOut,
      langProgress,
      langStageProgress,
      formalDelta,
      subjectDelta: subjectDelta as Record<SubjectId, number | null>,
      overall: nums.length ? round2(mean(nums)) : null,
      contributing: nums.length,
    });
  });

  return { byStudent, stageMeta };
}

/** 畫面用：語文＝連續小測平均升幅；非核心＝測考相對對應階段。 */
export function progressOf(
  p: StudentProgress | undefined,
  subject: SubjectId | "all",
  stage?: StageId | "all",
): number | null {
  if (!p) return null;
  if (subject === "all") return p.overall;
  if (subject === "chi" || subject === "eng") {
    if (!stage || stage === "all") return p.langProgress[subject];
    return p.langStageProgress[keyOf(subject, stage)] ?? null;
  }
  if (!stage || stage === "all") {
    const vals = FORMALS.map((f) => p.formalDelta[formalDeltaKey(subject, f.kind)]).filter(
      (v): v is number => v !== null && v !== undefined,
    );
    return vals.length ? round2(mean(vals)) : null;
  }
  return p.formalDelta[formalDeltaKey(subject, FORMAL_BY_STAGE[stage].kind)] ?? null;
}

function rankByDelta(
  computed: ClassCompute,
  deltaOf: (p: StudentProgress) => number | null,
  top = 3,
): StudentProgress[] {
  return [...computed.byStudent.values()]
    .filter((p) => deltaOf(p) !== null)
    .sort((a, b) => {
      const d = (deltaOf(b) ?? -999) - (deltaOf(a) ?? -999);
      if (d !== 0) return d;
      return a.student.classno.localeCompare(b.student.classno, "zh-Hant", { numeric: true });
    })
    .slice(0, top);
}

/** 語文：該班該科進步指數（連續小測平均升幅）首三名。可限某一階段。 */
export function awardsLanguage(
  computed: ClassCompute,
  subject: "chi" | "eng",
  stage?: StageId,
  top = 3,
): StudentProgress[] {
  return rankByDelta(
    computed,
    (p) =>
      stage
        ? (p.langStageProgress[keyOf(subject, stage)] ?? null)
        : p.langProgress[subject],
    top,
  );
}

/** 非核心：測驗／考試相對對應階段課後評估的進步首三名。 */
export function awardsFormal(
  computed: ClassCompute,
  subject: SubjectId,
  kind: FormalKind,
  top = 3,
): StudentProgress[] {
  const k = formalDeltaKey(subject, kind);
  return rankByDelta(computed, (p) => p.formalDelta[k] ?? null, top);
}

export function awardsForClass(
  computed: ClassCompute,
  top = 3,
): StudentProgress[] {
  return rankByDelta(computed, (p) => p.overall, top);
}

export function classStats(
  students: Student[],
  assessments: AssessmentDef[],
  maxOf: (id: string) => number,
  passPercent: number,
) {
  const active = students.filter(isActive);
  let papers = 0;
  let sat = 0;
  let passed = 0;
  let retake = 0;
  let need = 0;
  for (const s of active) {
    for (const a of assessments) {
      if (a.group === "formal") continue;
      if (formOf(s.classcode) !== a.form) continue;
      papers++;
      const r = quizResult(s, a, maxOf(a.id), passPercent);
      if (r.pct === null) continue;
      sat++;
      if (r.passed) passed++;
      if (r.usedRetake) retake++;
      if (r.needsRetake) need++;
    }
  }
  return { students: active.length, papers, sat, passed, retake, need, passRate: sat ? passed / sat : null };
}
