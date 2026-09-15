import { formOf, type ClassCode } from "./classes";
import type { AssessmentDef, StageId } from "./calendar";
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
  /** 與上一階段比較的各科進步指數（最新可用過渡） */
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
  const retake = parseNum(entry?.retake);
  if (retake !== null) return { value: retake, usedRetake: true, raw, retake };
  return { value: raw, usedRetake: false, raw, retake };
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
    needsRetake: passed === false && !eff.usedRetake,
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

export function computeClass(
  students: Student[],
  assessments: AssessmentDef[],
  maxOf: (id: string) => number,
  passPercent: number,
  method: ProgressMethod,
): ClassCompute {
  const active = students.filter(isActive);
  const subjects = [...new Set(assessments.map((a) => a.subject))];
  const stages = [...new Set(assessments.map((a) => a.stage))].sort((a, b) => a - b);

  const stagePctMap: Record<string, (number | null)[]> = {};
  const stageQuiz: Record<string, { quizzes: number; passedAll: boolean | null; anyRetake: boolean }[]> =
    {};

  for (const sub of subjects) {
    for (const st of stages) {
      const papers = assessments.filter((a) => a.subject === sub && a.stage === st);
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

    for (const sub of subjects) {
      const deltas: number[] = [];
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

        const prev = stages.filter((s) => s < st && keyOf(sub, s) in stagePctMap).at(-1);
        if (prev) {
          const pk = keyOf(sub, prev);
          let d: number | null = null;
          if (method === "z") {
            const cz = zMap[k]?.[idx];
            const pz = zMap[pk]?.[idx];
            if (cz !== null && cz !== undefined && pz !== null && pz !== undefined) {
              d = round2(cz - pz);
            }
          } else if (method === "pct") {
            const c = stagePctMap[k]?.[idx];
            const p = stagePctMap[pk]?.[idx];
            if (c !== null && c !== undefined && p !== null && p !== undefined) {
              d = round2(c - p);
            }
          } else {
            const c = rankMap[k]?.[idx];
            const p = rankMap[pk]?.[idx];
            if (c !== null && c !== undefined && p !== null && p !== undefined) {
              d = p - c;
            }
          }
          if (d !== null) deltas.push(d);
          subjectDelta[sub] = d;
        }
      }
      if (!(sub in subjectDelta)) subjectDelta[sub] = null;
    }

    const contributing = Object.values(subjectDelta).filter((v) => v !== null).length;
    const nums = Object.values(subjectDelta).filter((v): v is number => v !== null);
    byStudent.set(student.id, {
      student,
      stages: stagesOut,
      subjectDelta: subjectDelta as Record<SubjectId, number | null>,
      overall: nums.length ? round2(mean(nums)) : null,
      contributing,
    });
  });

  return { byStudent, stageMeta };
}

export function awardsForClass(
  computed: ClassCompute,
  top = 3,
): StudentProgress[] {
  return [...computed.byStudent.values()]
    .filter((p) => p.overall !== null)
    .sort((a, b) => {
      const d = (b.overall ?? -999) - (a.overall ?? -999);
      if (d !== 0) return d;
      if (b.contributing !== a.contributing) return b.contributing - a.contributing;
      return a.student.classno.localeCompare(b.student.classno, "zh-Hant", {
        numeric: true,
      });
    })
    .slice(0, top);
}

export function classStats(students: Student[], assessments: AssessmentDef[], maxOf: (id: string) => number, passPercent: number) {
  const active = students.filter(isActive);
  let papers = 0;
  let sat = 0;
  let passed = 0;
  let retake = 0;
  let need = 0;
  for (const s of active) {
    for (const a of assessments) {
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
