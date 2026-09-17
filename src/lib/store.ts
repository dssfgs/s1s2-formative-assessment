import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ALL_CLASSES, ROWS_PER_CLASS, type ClassCode } from "./classes";
import {
  DEFAULT_NONCORE_ORDER,
  allAssessments,
  type StageId,
} from "./calendar";
import { emptyStudent, type ProgressMethod, type ScoreEntry, type Student } from "./progress";
import type { RosterRow } from "./paste";
import { makeDemoRoster, makeEmptyRoster, makeOfficialRoster } from "./sample";
import type { SubjectId } from "./subjects";
import type { ImportRow } from "./csv";
import { OFFICIAL_COUNT } from "./roster-2627";

export type AppSettings = {
  passPercent: number;
  defaultMax: number;
  examMax: number;
  paperMax: Record<string, number>;
  noncoreOrder: Record<StageId, SubjectId[]>;
  progressMethod: ProgressMethod;
};

export type StudentPatch = {
  index: number;
  student?: Partial<Pick<Student, "classno" | "chname" | "enname" | "regno">>;
  scores?: Record<string, Partial<ScoreEntry>>;
};

const defaultSettings = (): AppSettings => ({
  passPercent: 50,
  defaultMax: 20,
  examMax: 100,
  paperMax: {},
  noncoreOrder: {
    1: [...DEFAULT_NONCORE_ORDER],
    2: [...DEFAULT_NONCORE_ORDER],
    3: [...DEFAULT_NONCORE_ORDER],
    4: [...DEFAULT_NONCORE_ORDER],
  },
  progressMethod: "z",
});

type State = {
  roster: Record<ClassCode, Student[]>;
  settings: AppSettings;
  hydrated: boolean;
  setStudent: (code: ClassCode, index: number, patch: Partial<Student>) => void;
  setScore: (code: ClassCode, studentId: string, assessmentId: string, patch: Partial<ScoreEntry>) => void;
  setPaperMax: (assessmentId: string, max: number, classCode: ClassCode | ClassCode[]) => void;
  setSettings: (patch: Partial<AppSettings>) => void;
  setNoncoreOrder: (stage: StageId, order: SubjectId[]) => void;
  applyRoster: (code: ClassCode, rows: RosterRow[]) => number;
  applyStudentPatches: (code: ClassCode, patches: StudentPatch[]) => void;
  applyScoresByStudent: (
    items: { studentId: string; scores: Record<string, Partial<ScoreEntry>> }[],
  ) => void;
  addRows: (code: ClassCode, n?: number) => void;
  loadDemo: () => void;
  loadOfficialRoster: () => number;
  resetAll: () => void;
  importRows: (rows: ImportRow[]) => { students: number; scores: number };
  replaceRoster: (roster: Record<ClassCode, Student[]>) => void;
};

function ensureRow(list: Student[], index: number, code: ClassCode) {
  const next = list.slice();
  while (next.length <= index) next.push(emptyStudent(code, next.length));
  return next;
}

function cloneList(list: Student[]) {
  return list.map((s) => ({ ...s, scores: { ...s.scores } }));
}

function padClassno(v: string) {
  const t = v.replace(/\s/g, "");
  if (!t) return t;
  return /^\d+$/.test(t) ? t.padStart(2, "0") : t;
}

export const useAppStore = create<State>()(
  persist(
    (set) => ({
      roster: makeOfficialRoster(),
      settings: defaultSettings(),
      hydrated: false,
      setStudent: (code, index, patch) =>
        set((st) => {
          const list = ensureRow(st.roster[code] ?? [], index, code);
          const cur = list[index] ?? emptyStudent(code, index);
          list[index] = { ...cur, ...patch, scores: patch.scores ?? cur.scores };
          return { roster: { ...st.roster, [code]: list } };
        }),
      setScore: (code, studentId, assessmentId, patch) =>
        set((st) => {
          const list = (st.roster[code] ?? []).map((s) => {
            if (s.id !== studentId) return s;
            const prev = s.scores[assessmentId] ?? { raw: "", retake: "" };
            return {
              ...s,
              scores: { ...s.scores, [assessmentId]: { ...prev, ...patch } },
            };
          });
          return { roster: { ...st.roster, [code]: list } };
        }),
      setPaperMax: (assessmentId, max, classCode) =>
        set((st) => {
          const paperMax = { ...st.settings.paperMax };
          const codes = Array.isArray(classCode) ? classCode : [classCode];
          for (const c of codes) paperMax[paperMaxKey(c, assessmentId)] = max;
          return { settings: { ...st.settings, paperMax } };
        }),
      setSettings: (patch) =>
        set((st) => ({ settings: { ...st.settings, ...patch } })),
      setNoncoreOrder: (stage, order) =>
        set((st) => ({
          settings: {
            ...st.settings,
            noncoreOrder: { ...st.settings.noncoreOrder, [stage]: order },
          },
        })),
      applyRoster: (code, rows) => {
        let applied = 0;
        set((st) => {
          const list = cloneList(st.roster[code] ?? []);
          const used = new Set<number>();
          for (const row of rows) {
            const no = (row.classno ?? "").replace(/^0+/, "");
            let idx = -1;
            if (no) {
              idx = list.findIndex(
                (s, i) => !used.has(i) && s.classno.replace(/^0+/, "") === no,
              );
            }
            if (idx < 0) {
              idx = list.findIndex((s, i) => !used.has(i) && !s.chname && !s.classno);
            }
            if (idx < 0) {
              idx = list.length;
              list.push(emptyStudent(code, idx));
            }
            used.add(idx);
            const cur = list[idx]!;
            if (row.regno) cur.regno = row.regno;
            if (row.chname) cur.chname = row.chname;
            if (row.enname) cur.enname = row.enname;
            if (row.classno) cur.classno = padClassno(row.classno);
            list[idx] = cur;
            applied++;
          }
          return { roster: { ...st.roster, [code]: list } };
        });
        return applied;
      },
      applyStudentPatches: (code, patches) =>
        set((st) => {
          let list = cloneList(st.roster[code] ?? []);
          for (const p of patches) {
            while (list.length <= p.index) list.push(emptyStudent(code, list.length));
            const cur = list[p.index]!;
            const nextScores = { ...cur.scores };
            if (p.scores) {
              for (const [id, entry] of Object.entries(p.scores)) {
                nextScores[id] = {
                  ...(nextScores[id] ?? { raw: "", retake: "" }),
                  ...entry,
                };
              }
            }
            const studentPatch = { ...(p.student ?? {}) };
            if (studentPatch.classno) studentPatch.classno = padClassno(studentPatch.classno);
            list[p.index] = { ...cur, ...studentPatch, scores: nextScores };
          }
          return { roster: { ...st.roster, [code]: list } };
        }),
      applyScoresByStudent: (items) =>
        set((st) => {
          if (!items.length) return st;
          const loc = new Map<string, { code: ClassCode; idx: number }>();
          for (const code of ALL_CLASSES) {
            (st.roster[code] ?? []).forEach((s, i) => loc.set(s.id, { code, idx: i }));
          }
          const lists = {} as Partial<Record<ClassCode, Student[]>>;
          for (const item of items) {
            const at = loc.get(item.studentId);
            if (!at) continue;
            if (!lists[at.code]) lists[at.code] = cloneList(st.roster[at.code] ?? []);
            const list = lists[at.code]!;
            const cur = list[at.idx];
            if (!cur) continue;
            const nextScores = { ...cur.scores };
            for (const [id, entry] of Object.entries(item.scores)) {
              nextScores[id] = {
                ...(nextScores[id] ?? { raw: "", retake: "" }),
                ...entry,
              };
            }
            list[at.idx] = { ...cur, scores: nextScores };
          }
          if (!Object.keys(lists).length) return st;
          return { roster: { ...st.roster, ...lists } };
        }),
      addRows: (code, n = 10) =>
        set((st) => {
          const list = (st.roster[code] ?? []).slice();
          for (let i = 0; i < n; i++) list.push(emptyStudent(code, list.length));
          return { roster: { ...st.roster, [code]: list } };
        }),
      loadDemo: () => set({ roster: makeDemoRoster() }),
      loadOfficialRoster: () => {
        set((st) => ({ roster: makeOfficialRoster(st.roster) }));
        return OFFICIAL_COUNT;
      },
      resetAll: () => set({ roster: makeEmptyRoster(), settings: defaultSettings() }),
      importRows: (rows) => {
        let students = 0;
        let scores = 0;
        set((st) => {
          const roster = { ...st.roster };
          for (const row of rows) {
            const list = (roster[row.classcode] ?? []).map((s) => ({ ...s, scores: { ...s.scores } }));
            let idx = list.findIndex(
              (s) =>
                s.classno.replace(/^0+/, "") === row.classno.replace(/^0+/, "") &&
                (row.classno ? true : false),
            );
            if (idx < 0) {
              idx = list.findIndex((s) => !s.chname && !s.classno);
              if (idx < 0) {
                idx = list.length;
                list.push(emptyStudent(row.classcode, idx));
              }
              students++;
            }
            const cur = list[idx]!;
            if (row.chname) cur.chname = row.chname;
            if (row.regno) cur.regno = row.regno;
            cur.classno = padClassno(row.classno);
            if (row.assessmentId && (row.raw !== undefined || row.retake !== undefined)) {
              const prev = cur.scores[row.assessmentId] ?? { raw: "", retake: "" };
              cur.scores[row.assessmentId] = {
                raw: row.raw ?? prev.raw,
                retake: row.retake ?? prev.retake,
              };
              scores++;
            }
            list[idx] = cur;
            roster[row.classcode] = list;
          }
          return { roster };
        });
        return { students, scores };
      },
      replaceRoster: (roster) => set({ roster }),
    }),
    {
      name: "s1s2-formative-2026-27",
      partialize: (s) => ({ roster: s.roster, settings: s.settings }),
      skipHydration: true,
    },
  ),
);

export function paperMaxKey(classCode: string, assessmentId: string) {
  return `${classCode}::${assessmentId}`;
}

export type MaxFn = (id: string, classCode?: string) => number;

export function useAssessments() {
  return allAssessments();
}

/** 班別專用滿分；沒有則退回舊的全級共用值，再退回預設。 */
export function useMaxOf(): MaxFn {
  const settings = useAppStore((s) => s.settings);
  return (id, classCode) => {
    const map = settings.paperMax;
    if (classCode && map[paperMaxKey(classCode, id)] != null) {
      return map[paperMaxKey(classCode, id)]!;
    }
    if (map[id] != null) return map[id]!;
    if (/-T[12]A[12]$/.test(id)) return settings.examMax ?? 100;
    return settings.defaultMax;
  };
}

export function padClass(code: ClassCode): Student[] {
  const list = useAppStore.getState().roster[code] ?? [];
  if (list.length >= ROWS_PER_CLASS) return list;
  const extra = Array.from({ length: ROWS_PER_CLASS - list.length }, (_, i) =>
    emptyStudent(code, list.length + i),
  );
  return [...list, ...extra];
}

export function studentsInForm(form: 1 | 2) {
  const roster = useAppStore.getState().roster;
  return ALL_CLASSES.filter((c) => (form === 2 ? c.startsWith("2") : c.startsWith("1"))).flatMap(
    (c) => roster[c] ?? [],
  );
}
